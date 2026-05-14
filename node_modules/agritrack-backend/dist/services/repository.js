import { get, push, ref, remove, set, update } from "firebase/database";
import { realtimeDb } from "../db/firebase.js";
const counterDefaults = {
    users: 0,
    properties: 0,
    devices: 0,
    geofences: 0,
    positions: 0,
    alerts: 0
};
function collectionRef(name) {
    return ref(realtimeDb, name);
}
async function readNode(path) {
    const snapshot = await get(ref(realtimeDb, path));
    return snapshot.exists() ? snapshot.val() : null;
}
async function writeNode(path, value) {
    await set(ref(realtimeDb, path), value);
}
async function updateNode(path, value) {
    await update(ref(realtimeDb, path), value);
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
    const nodeRef = push(collectionRef(name));
    await set(nodeRef, record);
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
export async function overwriteCollection(name, value) {
    await remove(collectionRef(name));
    await writeNode(name, value);
}
