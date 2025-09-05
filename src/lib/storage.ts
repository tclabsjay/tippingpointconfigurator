// Server-side file-backed storage for SKUs.
// This module must only be imported from server code (e.g., route handlers).

import { promises as fs } from "fs";
import path from "path";
import { skuArraySchema, skuSchema, type Sku } from "@/lib/schema";

const DATA_DIR = path.join(process.cwd(), "data");
const SKUS_PATH = path.join(DATA_DIR, "skus.json");

async function ensureDataDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export async function readAllSkus(): Promise<Sku[]> {
  await ensureDataDir();
  try {
    const raw = await fs.readFile(SKUS_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return skuArraySchema.parse(parsed);
  } catch (err: any) {
    if (err && (err.code === "ENOENT" || err.code === "ENOTDIR")) {
      return [];
    }
    throw err;
  }
}

export async function writeAllSkus(skus: Sku[]): Promise<void> {
  await ensureDataDir();
  const validated = skuArraySchema.parse(skus);
  const tmpPath = SKUS_PATH + ".tmp";
  await fs.writeFile(tmpPath, JSON.stringify(validated, null, 2), "utf8");
  await fs.rename(tmpPath, SKUS_PATH);
}

export async function upsertSku(input: Sku): Promise<Sku[]> {
  const all = await readAllSkus();
  const next: Sku[] = [];
  let replaced = false;
  for (const s of all) {
    if (s.sku === input.sku) {
      next.push(skuSchema.parse({ ...s, ...input }));
      replaced = true;
    } else {
      next.push(s);
    }
  }
  if (!replaced) next.push(skuSchema.parse(input));
  await writeAllSkus(next);
  return next;
}

export async function deleteSku(sku: string): Promise<Sku[]> {
  const all = await readAllSkus();
  const next = all.filter((s) => s.sku !== sku);
  await writeAllSkus(next);
  return next;
}

export async function getSku(sku: string): Promise<Sku | null> {
  const all = await readAllSkus();
  return all.find((s) => s.sku === sku) ?? null;
}


