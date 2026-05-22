import { get, push, ref, remove, set, update } from "firebase/database";
import { firebaseConnection } from "../db/firebase.js";
import type { Alert, AppSettings, Device, Geofence, PlannedRoute, Position, Property } from "../types/index.js";

type CollectionName =
  | "users"
  | "properties"
  | "devices"
  | "geofences"
  | "positions"
  | "alerts"
  | "plannedRoutes"
  | "meta"
  | "settings";

type User = {
  id: number;
  email: string;
  password?: string;
  passwordHash?: string;
  passwordSalt?: string;
  name: string;
  role?: "admin" | "operator";
  createdAt?: string;
};

type Counters = {
  users: number;
  properties: number;
  devices: number;
  geofences: number;
  positions: number;
  alerts: number;
  plannedRoutes: number;
};

type Meta = {
  counters?: Partial<Counters>;
};

type CollectionMap = {
  users: User;
  properties: Property;
  devices: Device;
  geofences: Geofence;
  positions: Position;
  alerts: Alert;
  plannedRoutes: PlannedRoute;
  meta: Meta;
  settings: AppSettings;
};

type IncrementalCollectionName = "users" | "properties" | "devices" | "geofences" | "positions" | "alerts" | "plannedRoutes";

const counterDefaults: Counters = {
  users: 0,
  properties: 0,
  devices: 0,
  geofences: 0,
  positions: 0,
  alerts: 0,
  plannedRoutes: 0
};

type StorageMode = "firebase-admin" | "firebase-client";

const storageMode: StorageMode = firebaseConnection.mode === "admin" ? "firebase-admin" : "firebase-client";

function isPermissionDenied(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return /permission_denied|permission denied|insufficient permission/i.test(error.message);
}

function firebaseError(error: unknown) {
  if (error instanceof Error && isPermissionDenied(error)) {
    return new Error(
      "Firebase Realtime Database negou permissao. Coloque a service account em backend/service-account.json, configure FIREBASE_SERVICE_ACCOUNT_PATH/FIREBASE_SERVICE_ACCOUNT_JSON, ou ajuste as regras do banco."
    );
  }

  return error;
}

async function runFirebaseOperation<T>(operation: () => Promise<T>) {
  try {
    return await operation();
  } catch (error) {
    throw firebaseError(error);
  }
}

function createKey(name: CollectionName) {
  if (firebaseConnection.mode === "admin") {
    return firebaseConnection.db.ref(name).push().key;
  }

  return push(ref(firebaseConnection.db, name)).key;
}

async function readNode<T>(path: string): Promise<T | null> {
  return runFirebaseOperation(async () => {
    if (firebaseConnection.mode === "admin") {
      const snapshot = await firebaseConnection.db.ref(path).get();
      return snapshot.exists() ? (snapshot.val() as T) : null;
    }

    const snapshot = await get(ref(firebaseConnection.db, path));
    return snapshot.exists() ? (snapshot.val() as T) : null;
  });
}

async function writeNode(path: string, value: unknown) {
  await runFirebaseOperation(async () => {
    if (firebaseConnection.mode === "admin") {
      await firebaseConnection.db.ref(path).set(value);
      return;
    }

    await set(ref(firebaseConnection.db, path), value);
  });
}

async function updateNode(path: string, value: Record<string, unknown>) {
  await runFirebaseOperation(async () => {
    if (firebaseConnection.mode === "admin") {
      await firebaseConnection.db.ref(path).update(value);
      return;
    }

    await update(ref(firebaseConnection.db, path), value);
  });
}

async function removeNode(path: string) {
  await runFirebaseOperation(async () => {
    if (firebaseConnection.mode === "admin") {
      await firebaseConnection.db.ref(path).remove();
      return;
    }

    await remove(ref(firebaseConnection.db, path));
  });
}

async function ensureCounters() {
  const meta = (await readNode<Meta>("meta")) ?? {};
  const counters = { ...counterDefaults, ...(meta.counters ?? {}) };
  await writeNode("meta", { counters });
  return counters;
}

export async function listCollection<K extends CollectionName>(
  name: K
): Promise<K extends "meta" ? Meta[] : CollectionMap[K][]> {
  const node = await readNode<Record<string, CollectionMap[K]>>(name);
  const values = node ? Object.values(node) : [];
  return values as K extends "meta" ? Meta[] : CollectionMap[K][];
}

export async function getById<K extends IncrementalCollectionName>(
  name: K,
  id: number
): Promise<CollectionMap[K] | null> {
  const items = await listCollection(name);
  const found = (items as CollectionMap[K][]).find((item) => item.id === id) ?? null;
  return found;
}

export async function insertWithIncrement<K extends IncrementalCollectionName>(
  name: K,
  item: Omit<CollectionMap[K], "id">
): Promise<CollectionMap[K]> {
  const counters = await ensureCounters();
  const id = counters[name] + 1;
  const record = { id, ...item } as CollectionMap[K];
  const nodeRef = createKey(name);
  if (!nodeRef) {
    throw new Error("Não foi possível gerar chave no Firebase");
  }
  await writeNode(`${name}/${nodeRef}`, record);
  await updateNode("meta/counters", { [name]: id });

  return record;
}

export async function updateWhereId<K extends IncrementalCollectionName>(
  name: K,
  id: number,
  updater: (item: CollectionMap[K]) => CollectionMap[K]
) {
  const node = await readNode<Record<string, CollectionMap[K]>>(name);
  if (!node) {
    return null;
  }

  const entry = Object.entries(node).find(([, value]) => value.id === id);
  if (!entry) {
    return null;
  }

  const [key, current] = entry;
  const next = updater(current);
  await writeNode(`${name}/${key}`, next);
  return next;
}

export async function patchWhereId<K extends IncrementalCollectionName>(
  name: K,
  id: number,
  patch: Partial<CollectionMap[K]>
) {
  return updateWhereId(name, id, (current) => ({ ...current, ...patch }));
}

export async function deleteWhereId<K extends IncrementalCollectionName>(name: K, id: number) {
  const node = await readNode<Record<string, CollectionMap[K]>>(name);
  if (!node) {
    return false;
  }

  const entry = Object.entries(node).find(([, value]) => value.id === id);
  if (!entry) {
    return false;
  }

  const [key] = entry;
  await removeNode(`${name}/${key}`);
  return true;
}

export async function overwriteCollection<K extends CollectionName>(name: K, value: Record<string, CollectionMap[K]>) {
  await removeNode(name);
  await writeNode(name, value);
}

export async function readSingleton<K extends CollectionName>(name: K): Promise<CollectionMap[K] | null> {
  return readNode<CollectionMap[K]>(name);
}

export async function writeSingleton<K extends CollectionName>(name: K, value: CollectionMap[K]) {
  await writeNode(name, value);
}

export function getStorageStatus() {
  return {
    mode: storageMode,
    firebaseConnection: firebaseConnection.mode
  };
}

export type { User };
