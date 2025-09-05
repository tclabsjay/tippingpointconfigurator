import { NextRequest, NextResponse } from "next/server";
import { readProductCatalog, writeProductCatalog } from "@/lib/catalog-storage";
import { moduleUpdateSchema, validateSkuUniqueness } from "@/lib/product-catalog";
import type { IoModule } from "@/lib/txe";

// GET /api/dev/catalog/modules - Get all IO modules
export async function GET() {
  try {
    const catalog = await readProductCatalog();
    return NextResponse.json(catalog.ioModules);
  } catch (error) {
    console.error("Failed to read modules:", error);
    return NextResponse.json(
      { error: "Failed to read modules" },
      { status: 500 }
    );
  }
}

// POST /api/dev/catalog/modules - Add new IO module
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const updatedBy = request.headers.get("x-updated-by") || "api";
    
    // Validate the module data
    const moduleData = moduleUpdateSchema.parse(body);
    
    const catalog = await readProductCatalog();
    
    // Check for duplicate SKU
    if (!validateSkuUniqueness(catalog, moduleData.sku)) {
      return NextResponse.json(
        { error: `SKU ${moduleData.sku} already exists` },
        { status: 400 }
      );
    }
    
    // Add the new module
    const newModule: IoModule = {
      sku: moduleData.sku,
      name: moduleData.name,
      ports: moduleData.ports,
      portSpeed: moduleData.portSpeed,
      category: "Network IO Module",
      price: moduleData.price,
    };
    
    catalog.ioModules.push(newModule);
    await writeProductCatalog(catalog, updatedBy);
    
    return NextResponse.json({
      success: true,
      message: "IO module added successfully",
      module: newModule,
    });
  } catch (error) {
    console.error("Failed to add module:", error);
    return NextResponse.json(
      { 
        error: "Failed to add module",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 400 }
    );
  }
}

// PUT /api/dev/catalog/modules - Update existing IO module
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const updatedBy = request.headers.get("x-updated-by") || "api";
    
    // Validate the module data
    const moduleData = moduleUpdateSchema.parse(body);
    
    const catalog = await readProductCatalog();
    
    // Find existing module
    const moduleIndex = catalog.ioModules.findIndex(m => m.sku === moduleData.sku);
    if (moduleIndex === -1) {
      return NextResponse.json(
        { error: `Module with SKU ${moduleData.sku} not found` },
        { status: 404 }
      );
    }
    
    // Update the module
    const updatedModule: IoModule = {
      sku: moduleData.sku,
      name: moduleData.name,
      ports: moduleData.ports,
      portSpeed: moduleData.portSpeed,
      category: "Network IO Module",
      price: moduleData.price,
    };
    
    catalog.ioModules[moduleIndex] = updatedModule;
    await writeProductCatalog(catalog, updatedBy);
    
    return NextResponse.json({
      success: true,
      message: "IO module updated successfully",
      module: updatedModule,
    });
  } catch (error) {
    console.error("Failed to update module:", error);
    return NextResponse.json(
      { 
        error: "Failed to update module",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 400 }
    );
  }
}

// DELETE /api/dev/catalog/modules?sku=moduleSku - Delete IO module
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const moduleSku = url.searchParams.get("sku");
    const updatedBy = request.headers.get("x-updated-by") || "api";
    
    if (!moduleSku) {
      return NextResponse.json(
        { error: "Module SKU is required" },
        { status: 400 }
      );
    }
    
    const catalog = await readProductCatalog();
    
    // Find module to delete
    const moduleIndex = catalog.ioModules.findIndex(m => m.sku === moduleSku);
    if (moduleIndex === -1) {
      return NextResponse.json(
        { error: `Module with SKU ${moduleSku} not found` },
        { status: 404 }
      );
    }
    
    // Remove the module
    const deletedModule = catalog.ioModules.splice(moduleIndex, 1)[0];
    await writeProductCatalog(catalog, updatedBy);
    
    return NextResponse.json({
      success: true,
      message: "IO module deleted successfully",
      deletedModule,
    });
  } catch (error) {
    console.error("Failed to delete module:", error);
    return NextResponse.json(
      { 
        error: "Failed to delete module",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
