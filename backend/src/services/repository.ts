import { get, push, ref, remove, set, update } from "firebase/database";
import { readLocalNode, removeLocalNode, updateLocalNode, writeLocalNode } from "../db/localStore.js";
import { realtimeDb } from "../db/firebase.js";
import type { Alert, Device, Geofence, Position, Property, SimulatorState } from "../types/index.js";

type CollectionName = "users" | "properties" | "devices" | "geofences" | "positions" | "alerts" | "meta" | "simulator";

type User = {
  id: number;
  email: string;
  password: string;
  name: string;
};

type Counters = {
  users: number;
  properties: number;
  devices: number;
  geofences: number;
  positions: number;
  alerts: number;
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
  meta: Meta;
  simulator: SimulatorState;
};

type IncrementalCollectionName = "users" | "properties" | "devices" | "geofences" | "positions" | "alerts";

const counterDefaults: Counters = {
  users: 0,
  properties: 0,
  devices: 0,
  geofences: 0,
  positions: 0,
  alerts: 0
};

let storageMode: "firebase" | "local-fallback" = "firebase";

function collectionRef(name: CollectionName) {
  return ref(realtimeDb, name);
}

async function readNode<T>(path: string): Promise<T | null> {
  if (storageMode === "local-fallback") {
    return readLocalNode<T>(path);
  }

  try {
    const snapshot = await get(ref(realtimeDb, path));
    return snapshot.exists() ? (snapshot.val() as T) : null;
  } catch (error) {
    if (error instanceof Error && error.message.includes("Permission denied")) {
      storageMode = "local-fallback";
      return readLocalNode<T>(path);
    }
    throw error;
  }
}

async function writeNode(path: string, value: unknown) {
  if (storageMode === "local-fallback") {
    await writeLocalNode(path, value);
    return;
  }

  try {
    await set(ref(realtimeDb, path), value);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Permission denied")) {
      storageMode = "local-fallback";
      await writeLocalNode(path, value);
      return;
    }
    throw error;
  }
}

async function updateNode(path: string, value: Record<string, unknown>) {
  if (storageMode === "local-fallback") {
    await updateLocalNode(path, value);
    return;
  }

  try {
    await update(ref(realtimeDb, path), value);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Permission denied")) {
      storageMode = "local-fallback";
      await updateLocalNode(path, value);
      return;
    }
    throw error;
  }
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
  const nodeRef = storageMode === "firebase" ? push(collectionRef(name)).key : `local-${id}`;
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
  if (storageMode === "local-fallback") {
    await removeLocalNode(`${name}/${key}`);
  } else {
    try {
      await remove(ref(realtimeDb, `${name}/${key}`));
    } catch (error) {
      if (error instanceof Error && error.message.includes("Permission denied")) {
        storageMode = "local-fallback";
        await removeLocalNode(`${name}/${key}`);
      } else {
        throw error;
      }
    }
  }
  return true;
}

export async function readSingleton<K extends CollectionName>(name: K): Promise<CollectionMap[K] | null> {
  return readNode<CollectionMap[K]>(name);
}

export async function writeSingleton<K extends CollectionName>(name: K, value: CollectionMap[K]) {
  await writeNode(name, value);
}

export async function overwriteCollection<K extends CollectionName>(name: K, value: Record<string, CollectionMap[K]>) {
  await remove(collectionRef(name));
  await writeNode(name, value);
}

export type { User };
