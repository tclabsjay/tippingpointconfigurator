import { promises as fs } from "fs";
import { join } from "path";
import { ProductCatalog, productCatalogSchema, createEmptyCatalog } from "./product-catalog";

const DATA_DIR = join(process.cwd(), "data");
const CATALOG_FILE = join(DATA_DIR, "product-catalog.json");
const BACKUPS_DIR = join(DATA_DIR, "catalog-backups");

// Ensure directories exist
async function ensureDirectories(): Promise<void> {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
  
  try {
    await fs.access(BACKUPS_DIR);
  } catch {
    await fs.mkdir(BACKUPS_DIR, { recursive: true });
  }
}

// Create backup before any write operation
async function createBackup(catalog: ProductCatalog): Promise<string> {
  await ensureDirectories();
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFile = join(BACKUPS_DIR, `catalog-${timestamp}.json`);
  
  await fs.writeFile(backupFile, JSON.stringify(catalog, null, 2), "utf-8");
  
  // Keep only last 10 backups
  const backups = await fs.readdir(BACKUPS_DIR);
  const catalogBackups = backups
    .filter(f => f.startsWith("catalog-") && f.endsWith(".json"))
    .sort()
    .reverse();
    
  if (catalogBackups.length > 10) {
    const toDelete = catalogBackups.slice(10);
    await Promise.all(
      toDelete.map(f => fs.unlink(join(BACKUPS_DIR, f)).catch(() => {}))
    );
  }
  
  return backupFile;
}

// Read catalog from file
export async function readProductCatalog(): Promise<ProductCatalog> {
  await ensureDirectories();
  
  try {
    const data = await fs.readFile(CATALOG_FILE, "utf-8");
    const parsed = JSON.parse(data);
    return productCatalogSchema.parse(parsed);
  } catch (error) {
    // If file doesn't exist or is invalid, return empty catalog
    console.warn("Product catalog file not found or invalid, creating empty catalog");
    return createEmptyCatalog();
  }
}

// Write catalog to file (with backup)
export async function writeProductCatalog(catalog: ProductCatalog, updatedBy?: string): Promise<void> {
  await ensureDirectories();
  
  // Update metadata
  const updatedCatalog: ProductCatalog = {
    ...catalog,
    metadata: {
      ...catalog.metadata,
      lastUpdated: new Date().toISOString(),
      updatedBy: updatedBy || "system",
    },
  };
  
  // Validate before writing
  productCatalogSchema.parse(updatedCatalog);
  
  // Create backup of current catalog if it exists
  try {
    const currentCatalog = await readProductCatalog();
    await createBackup(currentCatalog);
  } catch {
    // No existing catalog to backup
  }
  
  // Write new catalog atomically
  const tempFile = CATALOG_FILE + ".tmp";
  await fs.writeFile(tempFile, JSON.stringify(updatedCatalog, null, 2), "utf-8");
  await fs.rename(tempFile, CATALOG_FILE);
}

// Get list of available backups
export async function listBackups(): Promise<Array<{ filename: string; timestamp: string; size: number }>> {
  await ensureDirectories();
  
  try {
    const files = await fs.readdir(BACKUPS_DIR);
    const backups = files
      .filter(f => f.startsWith("catalog-") && f.endsWith(".json"))
      .sort()
      .reverse();
      
    const backupInfo = await Promise.all(
      backups.map(async (filename) => {
        const filePath = join(BACKUPS_DIR, filename);
        const stats = await fs.stat(filePath);
        const timestamp = filename.replace("catalog-", "").replace(".json", "");
        return {
          filename,
          timestamp: timestamp.replace(/-/g, ":").replace("T", " "),
          size: stats.size,
        };
      })
    );
    
    return backupInfo;
  } catch {
    return [];
  }
}

// Restore from backup
export async function restoreFromBackup(backupFilename: string, updatedBy?: string): Promise<ProductCatalog> {
  const backupPath = join(BACKUPS_DIR, backupFilename);
  
  try {
    const data = await fs.readFile(backupPath, "utf-8");
    const catalog = productCatalogSchema.parse(JSON.parse(data));
    
    await writeProductCatalog(catalog, updatedBy);
    return catalog;
  } catch (error) {
    throw new Error(`Failed to restore from backup ${backupFilename}: ${error}`);
  }
}

// Export catalog as JSON string
export async function exportCatalog(): Promise<string> {
  const catalog = await readProductCatalog();
  return JSON.stringify(catalog, null, 2);
}

// Import catalog from JSON string
export async function importCatalog(jsonData: string, updatedBy?: string): Promise<ProductCatalog> {
  try {
    const parsed = JSON.parse(jsonData);
    const catalog = productCatalogSchema.parse(parsed);
    
    await writeProductCatalog(catalog, updatedBy);
    return catalog;
  } catch (error) {
    throw new Error(`Failed to import catalog: ${error}`);
  }
}
