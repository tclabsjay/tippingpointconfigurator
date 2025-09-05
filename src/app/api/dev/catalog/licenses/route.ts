import { NextRequest, NextResponse } from "next/server";
import { readProductCatalog, writeProductCatalog } from "@/lib/catalog-storage";
import { licenseUpdateSchema, validateSkuUniqueness, isLicenseCompatibleWithModel, getLicenseCompatibleModels } from "@/lib/product-catalog";
import type { License } from "@/lib/txe";

// GET /api/dev/catalog/licenses - Get all licenses
export async function GET() {
  try {
    const catalog = await readProductCatalog();
    return NextResponse.json(catalog.licenses);
  } catch (error) {
    console.error("Failed to read licenses:", error);
    return NextResponse.json(
      { error: "Failed to read licenses" },
      { status: 500 }
    );
  }
}

// POST /api/dev/catalog/licenses - Add new license
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const updatedBy = request.headers.get("x-updated-by") || "api";
    
    // Validate the license data
    const licenseData = licenseUpdateSchema.parse(body);
    
    const catalog = await readProductCatalog();
    
    // Check for duplicate SKU
    if (!validateSkuUniqueness(catalog, licenseData.sku)) {
      return NextResponse.json(
        { error: `SKU ${licenseData.sku} already exists` },
        { status: 400 }
      );
    }
    
    // Validate model exists if modelId is provided
    if (licenseData.modelId) {
      const modelExists = catalog.models.find(m => m.id === licenseData.modelId);
      if (!modelExists) {
        return NextResponse.json(
          { error: `Model ${licenseData.modelId} does not exist` },
          { status: 400 }
        );
      }
      
      // Check license-model compatibility
      if (!isLicenseCompatibleWithModel(licenseData.sku, licenseData.modelId)) {
        const compatibleModels = getLicenseCompatibleModels(licenseData.sku);
        if (compatibleModels.length > 0) {
          const modelNames = compatibleModels.map(id => {
            const m = catalog.models.find(model => model.id === id);
            return m ? m.name : id;
          }).join(", ");
          return NextResponse.json(
            { error: `License ${licenseData.sku} is only compatible with: ${modelNames}` },
            { status: 400 }
          );
        }
      }
    }
    
    // Add the new license
    const newLicense: License = {
      sku: licenseData.sku,
      name: licenseData.name,
      category: "License",
      appliesToGbpsMax: licenseData.appliesToGbpsMax,
      group: licenseData.group,
      modelId: licenseData.modelId,
      price: licenseData.price,
    };
    
    catalog.licenses.push(newLicense);
    await writeProductCatalog(catalog, updatedBy);
    
    return NextResponse.json({
      success: true,
      message: "License added successfully",
      license: newLicense,
    });
  } catch (error) {
    console.error("Failed to add license:", error);
    return NextResponse.json(
      { 
        error: "Failed to add license",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 400 }
    );
  }
}

// PUT /api/dev/catalog/licenses - Update existing license
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const updatedBy = request.headers.get("x-updated-by") || "api";
    
    // Validate the license data
    const licenseData = licenseUpdateSchema.parse(body);
    
    const catalog = await readProductCatalog();
    
    // Find existing license
    const licenseIndex = catalog.licenses.findIndex(l => l.sku === licenseData.sku);
    if (licenseIndex === -1) {
      return NextResponse.json(
        { error: `License with SKU ${licenseData.sku} not found` },
        { status: 404 }
      );
    }
    
    // Validate model exists if modelId is provided
    if (licenseData.modelId) {
      const modelExists = catalog.models.find(m => m.id === licenseData.modelId);
      if (!modelExists) {
        return NextResponse.json(
          { error: `Model ${licenseData.modelId} does not exist` },
          { status: 400 }
        );
      }
      
      // Check license-model compatibility
      if (!isLicenseCompatibleWithModel(licenseData.sku, licenseData.modelId)) {
        const compatibleModels = getLicenseCompatibleModels(licenseData.sku);
        if (compatibleModels.length > 0) {
          const modelNames = compatibleModels.map(id => {
            const m = catalog.models.find(model => model.id === id);
            return m ? m.name : id;
          }).join(", ");
          return NextResponse.json(
            { error: `License ${licenseData.sku} is only compatible with: ${modelNames}` },
            { status: 400 }
          );
        }
      }
    }
    
    // Update the license
    const updatedLicense: License = {
      sku: licenseData.sku,
      name: licenseData.name,
      category: "License",
      appliesToGbpsMax: licenseData.appliesToGbpsMax,
      group: licenseData.group,
      modelId: licenseData.modelId,
      price: licenseData.price,
    };
    
    catalog.licenses[licenseIndex] = updatedLicense;
    await writeProductCatalog(catalog, updatedBy);
    
    return NextResponse.json({
      success: true,
      message: "License updated successfully",
      license: updatedLicense,
    });
  } catch (error) {
    console.error("Failed to update license:", error);
    return NextResponse.json(
      { 
        error: "Failed to update license",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 400 }
    );
  }
}

// DELETE /api/dev/catalog/licenses?sku=licenseSku - Delete license
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const licenseSku = url.searchParams.get("sku");
    const updatedBy = request.headers.get("x-updated-by") || "api";
    
    if (!licenseSku) {
      return NextResponse.json(
        { error: "License SKU is required" },
        { status: 400 }
      );
    }
    
    const catalog = await readProductCatalog();
    
    // Find license to delete
    const licenseIndex = catalog.licenses.findIndex(l => l.sku === licenseSku);
    if (licenseIndex === -1) {
      return NextResponse.json(
        { error: `License with SKU ${licenseSku} not found` },
        { status: 404 }
      );
    }
    
    // Remove the license
    const deletedLicense = catalog.licenses.splice(licenseIndex, 1)[0];
    await writeProductCatalog(catalog, updatedBy);
    
    return NextResponse.json({
      success: true,
      message: "License deleted successfully",
      deletedLicense,
    });
  } catch (error) {
    console.error("Failed to delete license:", error);
    return NextResponse.json(
      { 
        error: "Failed to delete license",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
