import { z } from "zod";

// Core SKU schema and types used across server and client.

export const skuAttributesPowerSchema = z.object({
  requiredMinUnits: z.number().int().nonnegative().optional(),
  allowedSkus: z.array(z.string()).optional(),
}).passthrough();

export const skuAttributesSlotsSchema = z.object({
  module: z.number().int().nonnegative().optional(),
}).passthrough();

export const skuAttributesSchema = z.object({
  chassis: z.boolean().optional(),
  slots: skuAttributesSlotsSchema.optional(),
  power: skuAttributesPowerSchema.optional(),
  requiresLicense: z.boolean().optional(),

  // Module properties
  slotType: z.string().optional(),
  slotCount: z.number().int().nonnegative().optional(),
  family: z.string().optional(),

  // Support plan grouping
  supportPlanGroup: z.string().optional(),

  // License helper attributes (for TP Configurator filtering)
  licenseGroup: z.string().optional(), // e.g., "INSPECT" or "THREATDV"
  appliesToGbpsMax: z.number().nonnegative().optional(),
}).passthrough();

export const skuSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  price: z.number().nonnegative().optional(),
  description: z.string().optional(),
  attributes: skuAttributesSchema.optional(),
});

export type Sku = z.infer<typeof skuSchema>;

export const skuArraySchema = z.array(skuSchema);

// Used for upsert endpoints; ensure partial except sku which identifies record.
export const skuUpsertSchema = skuSchema.partial({ name: true, category: true, price: true, attributes: true, description: true }).extend({
  sku: z.string().min(1),
});

export type SkuUpsert = z.infer<typeof skuUpsertSchema>;


