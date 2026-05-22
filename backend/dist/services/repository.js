import { get, push, ref, remove, set, update } from "firebase/database";
import { firebaseConnection } from "../db/firebase.js";
const counterDefaults = {
    users: 0,
    properties: 0,
    devices: 0,
    geofences: 0,
    positions: 0,
    alerts: 0,
    plannedRoutes: 0
};
const storageMode = firebaseConnection.mode === "admin" ? "firebase-admin" : "firebase-client";
function isPermissionDenied(error) {
    if (!(error instanceof Error)) {
        return false;
    }
    return /permission_denied|permission denied|insufficient permission/i.test(error.message);
}
function firebaseError(error) {
    if (error instanceof Error && isPermissionDenied(error)) {
        return new Error("Firebase Realtime Database negou permissao. Coloque a service account em backend/service-account.json, configure FIREBASE_SERVICE_ACCOUNT_PATH/FIREBASE_SERVICE_ACCOUNT_JSON, ou ajuste as regras do banco.");
    }
    return error;
}
async function runFirebaseOperation(operation) {
    try {
        return await operation();
    }
    catch (error) {
        throw firebaseError(error);
    }
}
function createKey(name) {
    if (firebaseConnection.mode === "admin") {
        return firebaseConnection.db.ref(name).push().key;
    }
    return push(ref(firebaseConnection.db, name)).key;
}
async function readNode(path) {
    return runFirebaseOperation(async () => {
        if (firebaseConnection.mode === "admin") {
            const snapshot = await firebaseConnection.db.ref(path).get();
            return snapshot.exists() ? snapshot.val() : null;
        }
        const snapshot = await get(ref(firebaseConnection.db, path));
        return snapshot.exists() ? snapshot.val() : null;
    });
}
async function writeNode(path, value) {
    await runFirebaseOperation(async () => {
        if (firebaseConnection.mode === "admin") {
            await firebaseConnection.db.ref(path).set(value);
            return;
        }
        await set(ref(firebaseConnection.db, path), value);
    });
}
async function updateNode(path, value) {
    await runFirebaseOperation(async () => {
        if (firebaseConnection.mode === "admin") {
            await firebaseConnection.db.ref(path).update(value);
            return;
        }
        await update(ref(firebaseConnection.db, path), value);
    });
}
async function removeNode(path) {
    await runFirebaseOperation(async () => {
        if (firebaseConnection.mode === "admin") {
            await firebaseConnection.db.ref(path).remove();
            return;
        }
        await remove(ref(firebaseConnection.db, path));
    });
}
async function ensureCounters() {
    const meta = (await readNode("meta")) ?? {};
    const counters = { ...counterDefaults, ...(meta.counters ?? {}) };
    await writeNode("meta", { counters });
    return counters;
}
export async function listCollection(name) {
    const node = await readNode(name);
    const values = node ? Object.values(node) : [];
    return values;
}
export async function getById(name, id) {
    const items = await listCollection(name);
    const found = items.find((item) => item.id === id) ?? null;
    return found;
}
export async function insertWithIncrement(name, item) {
    const counters = await ensureCounters();
    const id = counters[name] + 1;
    const record = { id, ...item };
    const nodeRef = createKey(name);
    if (!nodeRef) {
        throw new Error("Não foi possível gerar chave no Firebase");
    }
    await writeNode(`${name}/${nodeRef}`, record);
    await updateNode("meta/counters", { [name]: id });
    return record;
}
export async function updateWhereId(name, id, updater) {
    const node = await readNode(name);
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
export async function patchWhereId(name, id, patch) {
    return updateWhereId(name, id, (current) => ({ ...current, ...patch }));
}
export async function deleteWhereId(name, id) {
    const node = await readNode(name);
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
export async function overwriteCollection(name, value) {
    await removeNode(name);
    await writeNode(name, value);
}
export async function readSingleton(name) {
    return readNode(name);
}
export async function writeSingleton(name, value) {
    await writeNode(name, value);
}
export function getStorageStatus() {
    return {
        mode: storageMode,
        firebaseConnection: firebaseConnection.mode
    };
}
