import { NextRequest, NextResponse } from "next/server";
import { listBackups, restoreFromBackup } from "@/lib/catalog-storage";

// GET /api/dev/catalog/backups - List available backups
export async function GET() {
  try {
    const backups = await listBackups();
    return NextResponse.json({
      backups,
      count: backups.length,
    });
  } catch (error) {
    console.error("Failed to list backups:", error);
    return NextResponse.json(
      { error: "Failed to list backups" },
      { status: 500 }
    );
  }
}

// POST /api/dev/catalog/backups - Restore from backup
export async function POST(request: NextRequest) {
  try {
    const { filename } = await request.json();
    const updatedBy = request.headers.get("x-updated-by") || "restore";
    
    if (!filename) {
      return NextResponse.json(
        { error: "Backup filename is required" },
        { status: 400 }
      );
    }
    
    const restoredCatalog = await restoreFromBackup(filename, updatedBy);
    
    return NextResponse.json({
      success: true,
      message: `Catalog restored from backup ${filename}`,
      catalog: restoredCatalog,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to restore backup:", error);
    return NextResponse.json(
      { 
        error: "Failed to restore backup",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 400 }
    );
  }
}
