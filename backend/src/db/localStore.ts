import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

type StoreShape = Record<string, unknown>;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const storePath = path.resolve(__dirname, "../../agritrack-demo-store.json");

async function ensureFile() {
  try {
    await fs.access(storePath);
  } catch {
    await fs.writeFile(storePath, JSON.stringify({}, null, 2), "utf-8");
  }
}

async function readStore(): Promise<StoreShape> {
  await ensureFile();
  const content = await fs.readFile(storePath, "utf-8");
  return JSON.parse(content) as StoreShape;
}

async function writeStore(store: StoreShape) {
  await fs.writeFile(storePath, JSON.stringify(store, null, 2), "utf-8");
}

function getPathValue(store: StoreShape, targetPath: string) {
  return targetPath.split("/").reduce<unknown>((current, segment) => {
    if (!segment) {
      return current;
    }
    if (typeof current !== "object" || current === null) {
      return undefined;
    }
    return (current as Record<string, unknown>)[segment];
  }, store);
}

function setPathValue(store: StoreShape, targetPath: string, value: unknown) {
  const segments = targetPath.split("/").filter(Boolean);
  if (segments.length === 0) {
    return value as StoreShape;
  }

  const next = { ...store };
  let cursor: Record<string, unknown> = next;

  for (let index = 0; index < segments.length - 1; index += 1) {
    const segment = segments[index];
    const currentValue = cursor[segment];
    cursor[segment] =
      typeof currentValue === "object" && currentValue !== null ? { ...(currentValue as Record<string, unknown>) } : {};
    cursor = cursor[segment] as Record<string, unknown>;
  }

  cursor[segments.at(-1)!] = value;
  return next;
}

function removePathValue(store: StoreShape, targetPath: string) {
  const segments = targetPath.split("/").filter(Boolean);
  if (segments.length === 0) {
    return {};
  }

  const next = { ...store };
  let cursor: Record<string, unknown> = next;

  for (let index = 0; index < segments.length - 1; index += 1) {
    const segment = segments[index];
    const currentValue = cursor[segment];
    if (typeof currentValue !== "object" || currentValue === null) {
      return next;
    }
    cursor[segment] = { ...(currentValue as Record<string, unknown>) };
    cursor = cursor[segment] as Record<string, unknown>;
  }

  delete cursor[segments.at(-1)!];
  return next;
}

export async function readLocalNode<T>(targetPath: string): Promise<T | null> {
  const store = await readStore();
  const value = getPathValue(store, targetPath);
  return value === undefined ? null : (value as T);
}

export async function writeLocalNode(targetPath: string, value: unknown) {
  const store = await readStore();
  const next = setPathValue(store, targetPath, value);
  await writeStore(next);
}

export async function updateLocalNode(targetPath: string, value: Record<string, unknown>) {
  const current = (await readLocalNode<Record<string, unknown>>(targetPath)) ?? {};
  await writeLocalNode(targetPath, { ...current, ...value });
}

export async function removeLocalNode(targetPath: string) {
  const store = await readStore();
  const next = removePathValue(store, targetPath);
  await writeStore(next);
}
