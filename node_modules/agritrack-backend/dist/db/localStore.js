import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const storePath = path.resolve(__dirname, "../../agritrack-demo-store.json");
async function ensureFile() {
    try {
        await fs.access(storePath);
    }
    catch {
        await fs.writeFile(storePath, JSON.stringify({}, null, 2), "utf-8");
    }
}
async function readStore() {
    await ensureFile();
    const content = await fs.readFile(storePath, "utf-8");
    return JSON.parse(content);
}
async function writeStore(store) {
    await fs.writeFile(storePath, JSON.stringify(store, null, 2), "utf-8");
}
function getPathValue(store, targetPath) {
    return targetPath.split("/").reduce((current, segment) => {
        if (!segment) {
            return current;
        }
        if (typeof current !== "object" || current === null) {
            return undefined;
        }
        return current[segment];
    }, store);
}
function setPathValue(store, targetPath, value) {
    const segments = targetPath.split("/").filter(Boolean);
    if (segments.length === 0) {
        return value;
    }
    const next = { ...store };
    let cursor = next;
    for (let index = 0; index < segments.length - 1; index += 1) {
        const segment = segments[index];
        const currentValue = cursor[segment];
        cursor[segment] =
            typeof currentValue === "object" && currentValue !== null ? { ...currentValue } : {};
        cursor = cursor[segment];
    }
    cursor[segments.at(-1)] = value;
    return next;
}
function removePathValue(store, targetPath) {
    const segments = targetPath.split("/").filter(Boolean);
    if (segments.length === 0) {
        return {};
    }
    const next = { ...store };
    let cursor = next;
    for (let index = 0; index < segments.length - 1; index += 1) {
        const segment = segments[index];
        const currentValue = cursor[segment];
        if (typeof currentValue !== "object" || currentValue === null) {
            return next;
        }
        cursor[segment] = { ...currentValue };
        cursor = cursor[segment];
    }
    delete cursor[segments.at(-1)];
    return next;
}
export async function readLocalNode(targetPath) {
    const store = await readStore();
    const value = getPathValue(store, targetPath);
    return value === undefined ? null : value;
}
export async function writeLocalNode(targetPath, value) {
    const store = await readStore();
    const next = setPathValue(store, targetPath, value);
    await writeStore(next);
}
export async function updateLocalNode(targetPath, value) {
    const current = (await readLocalNode(targetPath)) ?? {};
    await writeLocalNode(targetPath, { ...current, ...value });
}
export async function removeLocalNode(targetPath) {
    const store = await readStore();
    const next = removePathValue(store, targetPath);
    await writeStore(next);
}
