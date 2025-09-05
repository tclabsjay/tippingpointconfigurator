import { TXE_DATA } from "./txe";
import { ProductCatalog } from "./product-catalog";
import { writeProductCatalog } from "./catalog-storage";

/**
 * Migration script to convert static TXE_DATA to dynamic product catalog
 * This preserves all existing data while making it manageable through APIs
 */
export async function migrateTxeDataToCatalog(): Promise<ProductCatalog> {
  const catalog: ProductCatalog = {
    models: TXE_DATA.models,
    ioModules: TXE_DATA.ioModules,
    licenses: TXE_DATA.licenses,
    smsModels: TXE_DATA.smsModels || [],
    metadata: {
      lastUpdated: new Date().toISOString(),
      version: "1.0.0",
      updatedBy: "migration-script",
    },
  };

  // Write to file storage
  await writeProductCatalog(catalog, "migration-script");
  
  console.log("✅ Successfully migrated TXE_DATA to product-catalog.json");
  console.log(`📊 Migrated: ${catalog.models.length} models, ${catalog.ioModules.length} modules, ${catalog.licenses.length} licenses, ${catalog.smsModels.length} SMS models`);
  
  return catalog;
}

/**
 * Validation function to ensure migrated data matches original
 */
export function validateMigration(catalog: ProductCatalog): boolean {
  const errors: string[] = [];
  
  // Check models count
  if (catalog.models.length !== TXE_DATA.models.length) {
    errors.push(`Models count mismatch: expected ${TXE_DATA.models.length}, got ${catalog.models.length}`);
  }
  
  // Check modules count  
  if (catalog.ioModules.length !== TXE_DATA.ioModules.length) {
    errors.push(`IO modules count mismatch: expected ${TXE_DATA.ioModules.length}, got ${catalog.ioModules.length}`);
  }
  
  // Check licenses count
  if (catalog.licenses.length !== TXE_DATA.licenses.length) {
    errors.push(`Licenses count mismatch: expected ${TXE_DATA.licenses.length}, got ${catalog.licenses.length}`);
  }
  
  // Check SMS models count
  const expectedSmsCount = TXE_DATA.smsModels?.length || 0;
  if (catalog.smsModels.length !== expectedSmsCount) {
    errors.push(`SMS models count mismatch: expected ${expectedSmsCount}, got ${catalog.smsModels.length}`);
  }
  
  // Check specific critical SKUs exist
  const criticalSkus = [
    "TPNN0424", // 5600 TXE
    "TPNN0425", // 8600 TXE  
    "TPNN0368", // 9200 TXE
    "TPNN0304", // vSMS
    "TPNN0410", // Common bypass module
    "TPNM0129", // 250Mbps license
  ];
  
  const allSkus = [
    ...catalog.models.map(m => m.sku).filter(Boolean),
    ...catalog.ioModules.map(m => m.sku),
    ...catalog.licenses.map(l => l.sku),
    ...catalog.smsModels.map(s => s.sku),
  ];
  
  for (const sku of criticalSkus) {
    if (!allSkus.includes(sku)) {
      errors.push(`Critical SKU missing: ${sku}`);
    }
  }
  
  if (errors.length > 0) {
    console.error("❌ Migration validation failed:");
    errors.forEach(error => console.error(`  - ${error}`));
    return false;
  }
  
  console.log("✅ Migration validation passed");
  return true;
}

// CLI script runner
if (require.main === module) {
  migrateTxeDataToCatalog()
    .then(catalog => {
      const isValid = validateMigration(catalog);
      process.exit(isValid ? 0 : 1);
    })
    .catch(error => {
      console.error("❌ Migration failed:", error);
      process.exit(1);
    });
}
