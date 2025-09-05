import { NextRequest, NextResponse } from "next/server";
import { readProductCatalog, writeProductCatalog, exportCatalog, importCatalog } from "@/lib/catalog-storage";
import { productCatalogSchema } from "@/lib/product-catalog";

// GET /api/dev/catalog - Get full catalog
export async function GET() {
  try {
    const catalog = await readProductCatalog();
    return NextResponse.json(catalog);
  } catch (error) {
    console.error("Failed to read catalog:", error);
    return NextResponse.json(
      { error: "Failed to read catalog" },
      { status: 500 }
    );
  }
}

// POST /api/dev/catalog - Bulk update entire catalog
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const updatedBy = request.headers.get("x-updated-by") || "api";
    
    // Validate the catalog structure
    const catalog = productCatalogSchema.parse(body);
    
    await writeProductCatalog(catalog, updatedBy);
    
    return NextResponse.json({
      success: true,
      message: "Catalog updated successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to update catalog:", error);
    return NextResponse.json(
      { 
        error: "Failed to update catalog",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 400 }
    );
  }
}

// PUT /api/dev/catalog - Import catalog from JSON
export async function PUT(request: NextRequest) {
  try {
    const { jsonData } = await request.json();
    const updatedBy = request.headers.get("x-updated-by") || "import";
    
    if (!jsonData || typeof jsonData !== "string") {
      return NextResponse.json(
        { error: "Invalid JSON data provided" },
        { status: 400 }
      );
    }
    
    const catalog = await importCatalog(jsonData, updatedBy);
    
    return NextResponse.json({
      success: true,
      message: "Catalog imported successfully",
      catalog,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to import catalog:", error);
    return NextResponse.json(
      { 
        error: "Failed to import catalog",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 400 }
    );
  }
}
