import { z } from "zod";
import { txeModelSchema, ioModuleSchema, licenseSchema, smsModelSchema } from "./txe";

// Consolidated product catalog schema
export const productCatalogSchema = z.object({
  models: z.array(txeModelSchema),
  ioModules: z.array(ioModuleSchema),
  licenses: z.array(licenseSchema),
  smsModels: z.array(smsModelSchema),
  metadata: z.object({
    lastUpdated: z.string(),
    version: z.string(),
    updatedBy: z.string().optional(),
  }),
});

export type ProductCatalog = z.infer<typeof productCatalogSchema>;

// Business rule validation schemas
export const modelUpdateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  family: z.literal("ds-tippingpoint-txe-series"),
  baseGbps: z.number().positive(),
  sku: z.string().regex(/^TPNN\d{4}$/, "SKU must follow TPNN#### format"),
  tiers: z.array(z.object({
    label: z.string().min(1),
    gbps: z.number().positive(),
  })).min(1),
  slots: z.literal(2),
  price: z.number().nonnegative().optional(),
});

export const moduleUpdateSchema = z.object({
  sku: z.string().regex(/^TPNN\d{4}$/, "SKU must follow TPNN#### format"),
  name: z.string().min(1),
  ports: z.string().min(1),
  portSpeed: z.string().min(1),
  category: z.literal("Network IO Module"),
  price: z.number().nonnegative().optional(),
  compatibleModelIds: z.array(z.string()).optional(),
});

export const licenseUpdateSchema = z.object({
  sku: z.string().regex(/^(TPN[NM]\d{4}|LIC-TPS-[A-Z]+-\d+Y-[A-Z0-9]+)$/, "SKU must follow TPNN#### or LIC-TPS-#### format"),
  name: z.string().min(1),
  appliesToGbpsMax: z.number().positive(),
  group: z.enum(["INSPECT", "THREATDV"]),
  modelId: z.string().optional(),
  price: z.number().nonnegative().optional(),
});

export const smsUpdateSchema = z.object({
  sku: z.string().regex(/^TPNN\d{4}$/, "SKU must follow TPNN#### format"),
  name: z.string().min(1),
});

// Validation functions
export function validateSkuUniqueness(catalog: ProductCatalog, newSku: string, excludeCurrentSku?: string): boolean {
  const allSkus = [
    ...catalog.models.map(m => m.sku).filter(Boolean),
    ...catalog.ioModules.map(m => m.sku),
    ...catalog.licenses.map(l => l.sku),
    ...catalog.smsModels.map(s => s.sku),
  ];
  
  const filteredSkus = excludeCurrentSku 
    ? allSkus.filter(sku => sku !== excludeCurrentSku)
    : allSkus;
    
  return !filteredSkus.includes(newSku);
}

// Define license-to-model compatibility rules
const LICENSE_MODEL_COMPATIBILITY: Record<string, string[]> = {
  "TPNN0276": ["txe-5600", "txe-8600"], // 5Gbps license works with both 5600 and 8600
  "TPNN0277": ["txe-5600", "txe-8600"], // 10Gbps license works with both 5600 and 8600
  "TPNN0280": ["txe-8600", "txe-9200"], // 40Gbps license works with both 8600 and 9200
  "TPNN0286": ["txe-5600", "txe-8600"], // 5Gbps ThreatDV works with both 5600 and 8600
  "TPNN0287": ["txe-5600", "txe-8600"], // 10Gbps ThreatDV works with both 5600 and 8600
  "TPNN0290": ["txe-8600", "txe-9200"], // 40Gbps ThreatDV works with both 8600 and 9200
};

export function getLicenseCompatibleModels(licenseSku: string): string[] {
  return LICENSE_MODEL_COMPATIBILITY[licenseSku] || [];
}

export function isLicenseCompatibleWithModel(licenseSku: string, modelId: string): boolean {
  const compatibleModels = LICENSE_MODEL_COMPATIBILITY[licenseSku];
  return !compatibleModels || compatibleModels.includes(modelId);
}

export function validateModelCompatibility(
  catalog: ProductCatalog, 
  modelId: string, 
  moduleSkus: string[], 
  licenseSkus: string[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  const model = catalog.models.find(m => m.id === modelId);
  if (!model) {
    errors.push(`Model ${modelId} not found`);
    return { valid: false, errors };
  }
  
  // Validate modules are compatible with model
  for (const moduleSku of moduleSkus) {
    const module = catalog.ioModules.find(m => m.sku === moduleSku);
    if (!module) {
      errors.push(`Module ${moduleSku} not found`);
      continue;
    }
    
    // Check if module is compatible with this model (based on current logic in tpc page)
    const base5600 = ["TPNN0410","TPNN0411","TPNN0412","TPNN0413","TPNN0414"];
    const base8600 = ["TPNN0374","TPNN0375","TPNN0408","TPNN0409", ...base5600];
    const base9200 = ["TPNN0408","TPNN0409","TPNN0372","TPNN0373"];
    
    const allowedModules = modelId === "txe-8600" ? base8600 
      : modelId === "txe-9200" ? base9200 
      : base5600;
      
    if (!allowedModules.includes(moduleSku)) {
      errors.push(`Module ${moduleSku} is not compatible with model ${modelId}`);
    }
  }
  
  // Validate licenses are compatible with model and throughput
  for (const licenseSku of licenseSkus) {
    const license = catalog.licenses.find(l => l.sku === licenseSku);
    if (!license) {
      errors.push(`License ${licenseSku} not found`);
      continue;
    }
    
    // Check specific license compatibility rules
    if (!isLicenseCompatibleWithModel(licenseSku, modelId)) {
      const compatibleModels = getLicenseCompatibleModels(licenseSku);
      const modelNames = compatibleModels.map(id => {
        const m = catalog.models.find(model => model.id === id);
        return m ? m.name : id;
      }).join(", ");
      errors.push(`License ${licenseSku} is only compatible with: ${modelNames}`);
    }
    
    // Also check the existing modelId field for backward compatibility
    if (license.modelId && license.modelId !== modelId) {
      errors.push(`License ${licenseSku} is not compatible with model ${modelId}`);
    }
  }
  
  return { valid: errors.length === 0, errors };
}

export function createEmptyCatalog(): ProductCatalog {
  return {
    models: [],
    ioModules: [],
    licenses: [],
    smsModels: [],
    metadata: {
      lastUpdated: new Date().toISOString(),
      version: "1.0.0",
      updatedBy: "system",
    },
  };
}
