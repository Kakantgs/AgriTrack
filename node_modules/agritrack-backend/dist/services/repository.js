import { get, push, ref, remove, set, update } from "firebase/database";
import { readLocalNode, removeLocalNode, updateLocalNode, writeLocalNode } from "../db/localStore.js";
import { realtimeDb } from "../db/firebase.js";
const counterDefaults = {
    users: 0,
    properties: 0,
    devices: 0,
    geofences: 0,
    positions: 0,
    alerts: 0
};
let storageMode = "firebase";
function collectionRef(name) {
    return ref(realtimeDb, name);
}
async function readNode(path) {
    if (storageMode === "local-fallback") {
        return readLocalNode(path);
    }
    try {
        const snapshot = await get(ref(realtimeDb, path));
        return snapshot.exists() ? snapshot.val() : null;
    }
    catch (error) {
        if (error instanceof Error && error.message.includes("Permission denied")) {
            storageMode = "local-fallback";
            return readLocalNode(path);
        }
        throw error;
    }
}
async function writeNode(path, value) {
    if (storageMode === "local-fallback") {
        await writeLocalNode(path, value);
        return;
    }
    try {
        await set(ref(realtimeDb, path), value);
    }
    catch (error) {
        if (error instanceof Error && error.message.includes("Permission denied")) {
            storageMode = "local-fallback";
            await writeLocalNode(path, value);
            return;
        }
        throw error;
    }
}
async function updateNode(path, value) {
    if (storageMode === "local-fallback") {
        await updateLocalNode(path, value);
        return;
    }
    try {
        await update(ref(realtimeDb, path), value);
    }
    catch (error) {
        if (error instanceof Error && error.message.includes("Permission denied")) {
            storageMode = "local-fallback";
            await updateLocalNode(path, value);
            return;
        }
        throw error;
    }
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
    const nodeRef = storageMode === "firebase" ? push(collectionRef(name)).key : `local-${id}`;
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
    if (storageMode === "local-fallback") {
        await removeLocalNode(`${name}/${key}`);
    }
    else {
        try {
            await remove(ref(realtimeDb, `${name}/${key}`));
        }
        catch (error) {
            if (error instanceof Error && error.message.includes("Permission denied")) {
                storageMode = "local-fallback";
                await removeLocalNode(`${name}/${key}`);
            }
            else {
                throw error;
            }
        }
    }
    return true;
}
export async function readSingleton(name) {
    return readNode(name);
}
export async function writeSingleton(name, value) {
    await writeNode(name, value);
}
export async function overwriteCollection(name, value) {
    await remove(collectionRef(name));
    await writeNode(name, value);
}
