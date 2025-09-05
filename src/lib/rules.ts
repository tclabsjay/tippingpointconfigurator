// Minimal rules engine scaffold for BOM validation.
// Extend this with your specific hardware constraints.

import type { Sku } from "@/lib/schema";

export type BomLine = {
  sku: Sku["sku"];
  qty: number;
};

export type ValidationResult = {
  errors: string[];
  warnings: string[];
};

export function validateBom(lines: BomLine[], catalog: Sku[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const bySku = new Map(catalog.map((s) => [s.sku, s] as const));
  const items = lines
    .map((l) => ({ ...l, item: bySku.get(l.sku) }))
    .filter((x): x is { sku: string; qty: number; item: Sku } => Boolean(x.item));

  const totalQty = items.reduce((n, l) => n + l.qty, 0);
  if (totalQty === 0) {
    warnings.push("Your BOM is empty.");
  }

  // Example: only one chassis
  const chassisCount = items
    .filter((l) => l.item.attributes?.chassis)
    .reduce((n, l) => n + l.qty, 0);
  if (chassisCount > 1) errors.push("Only one chassis can be selected.");

  return { errors, warnings };
}


