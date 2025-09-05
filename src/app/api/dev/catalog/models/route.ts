import { NextRequest, NextResponse } from "next/server";
import { readProductCatalog, writeProductCatalog } from "@/lib/catalog-storage";
import { modelUpdateSchema, validateSkuUniqueness } from "@/lib/product-catalog";
import type { TxeModel } from "@/lib/txe";

// GET /api/dev/catalog/models - Get all models
export async function GET() {
  try {
    const catalog = await readProductCatalog();
    return NextResponse.json(catalog.models);
  } catch (error) {
    console.error("Failed to read models:", error);
    return NextResponse.json(
      { error: "Failed to read models" },
      { status: 500 }
    );
  }
}

// POST /api/dev/catalog/models - Add new model
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const updatedBy = request.headers.get("x-updated-by") || "api";
    
    // Validate the model data
    const modelData = modelUpdateSchema.parse(body);
    
    const catalog = await readProductCatalog();
    
    // Check for duplicate ID
    if (catalog.models.find(m => m.id === modelData.id)) {
      return NextResponse.json(
        { error: `Model with ID ${modelData.id} already exists` },
        { status: 400 }
      );
    }
    
    // Check for duplicate SKU
    if (modelData.sku && !validateSkuUniqueness(catalog, modelData.sku)) {
      return NextResponse.json(
        { error: `SKU ${modelData.sku} already exists` },
        { status: 400 }
      );
    }
    
    // Add the new model
    const newModel: TxeModel = {
      ...modelData,
      family: "ds-tippingpoint-txe-series",
      slots: 2,
    };
    
    catalog.models.push(newModel);
    await writeProductCatalog(catalog, updatedBy);
    
    return NextResponse.json({
      success: true,
      message: "Model added successfully",
      model: newModel,
    });
  } catch (error) {
    console.error("Failed to add model:", error);
    return NextResponse.json(
      { 
        error: "Failed to add model",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 400 }
    );
  }
}

// PUT /api/dev/catalog/models - Update existing model
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const updatedBy = request.headers.get("x-updated-by") || "api";
    
    // Validate the model data
    const modelData = modelUpdateSchema.parse(body);
    
    const catalog = await readProductCatalog();
    
    // Find existing model
    const modelIndex = catalog.models.findIndex(m => m.id === modelData.id);
    if (modelIndex === -1) {
      return NextResponse.json(
        { error: `Model with ID ${modelData.id} not found` },
        { status: 404 }
      );
    }
    
    const existingModel = catalog.models[modelIndex];
    
    // Check for duplicate SKU (excluding current model)
    if (modelData.sku && !validateSkuUniqueness(catalog, modelData.sku, existingModel.sku)) {
      return NextResponse.json(
        { error: `SKU ${modelData.sku} already exists` },
        { status: 400 }
      );
    }
    
    // Update the model
    const updatedModel: TxeModel = {
      ...modelData,
      family: "ds-tippingpoint-txe-series",
      slots: 2,
    };
    
    catalog.models[modelIndex] = updatedModel;
    await writeProductCatalog(catalog, updatedBy);
    
    return NextResponse.json({
      success: true,
      message: "Model updated successfully",
      model: updatedModel,
    });
  } catch (error) {
    console.error("Failed to update model:", error);
    return NextResponse.json(
      { 
        error: "Failed to update model",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 400 }
    );
  }
}

// DELETE /api/dev/catalog/models?id=modelId - Delete model
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const modelId = url.searchParams.get("id");
    const updatedBy = request.headers.get("x-updated-by") || "api";
    
    if (!modelId) {
      return NextResponse.json(
        { error: "Model ID is required" },
        { status: 400 }
      );
    }
    
    const catalog = await readProductCatalog();
    
    // Find model to delete
    const modelIndex = catalog.models.findIndex(m => m.id === modelId);
    if (modelIndex === -1) {
      return NextResponse.json(
        { error: `Model with ID ${modelId} not found` },
        { status: 404 }
      );
    }
    
    // Check if model is referenced by licenses
    const referencingLicenses = catalog.licenses.filter(l => l.modelId === modelId);
    if (referencingLicenses.length > 0) {
      return NextResponse.json(
        { 
          error: `Cannot delete model ${modelId}. It is referenced by ${referencingLicenses.length} license(s)`,
          referencingLicenses: referencingLicenses.map(l => l.sku)
        },
        { status: 400 }
      );
    }
    
    // Remove the model
    const deletedModel = catalog.models.splice(modelIndex, 1)[0];
    await writeProductCatalog(catalog, updatedBy);
    
    return NextResponse.json({
      success: true,
      message: "Model deleted successfully",
      deletedModel,
    });
  } catch (error) {
    console.error("Failed to delete model:", error);
    return NextResponse.json(
      { 
        error: "Failed to delete model",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
