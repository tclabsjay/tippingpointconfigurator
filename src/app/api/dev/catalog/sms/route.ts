import { NextRequest, NextResponse } from "next/server";
import { readProductCatalog, writeProductCatalog } from "@/lib/catalog-storage";
import { smsUpdateSchema, validateSkuUniqueness } from "@/lib/product-catalog";
import type { SmsModel } from "@/lib/txe";

// GET /api/dev/catalog/sms - Get all SMS models
export async function GET() {
  try {
    const catalog = await readProductCatalog();
    return NextResponse.json(catalog.smsModels);
  } catch (error) {
    console.error("Failed to read SMS models:", error);
    return NextResponse.json(
      { error: "Failed to read SMS models" },
      { status: 500 }
    );
  }
}

// POST /api/dev/catalog/sms - Add new SMS model
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const updatedBy = request.headers.get("x-updated-by") || "api";
    
    // Validate the SMS model data
    const smsData = smsUpdateSchema.parse(body);
    
    const catalog = await readProductCatalog();
    
    // Check for duplicate SKU
    if (!validateSkuUniqueness(catalog, smsData.sku)) {
      return NextResponse.json(
        { error: `SKU ${smsData.sku} already exists` },
        { status: 400 }
      );
    }
    
    // Add the new SMS model
    const newSmsModel: SmsModel = {
      sku: smsData.sku,
      name: smsData.name,
    };
    
    catalog.smsModels.push(newSmsModel);
    await writeProductCatalog(catalog, updatedBy);
    
    return NextResponse.json({
      success: true,
      message: "SMS model added successfully",
      smsModel: newSmsModel,
    });
  } catch (error) {
    console.error("Failed to add SMS model:", error);
    return NextResponse.json(
      { 
        error: "Failed to add SMS model",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 400 }
    );
  }
}

// PUT /api/dev/catalog/sms - Update existing SMS model
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const updatedBy = request.headers.get("x-updated-by") || "api";
    
    // Validate the SMS model data
    const smsData = smsUpdateSchema.parse(body);
    
    const catalog = await readProductCatalog();
    
    // Find existing SMS model
    const smsIndex = catalog.smsModels.findIndex(s => s.sku === smsData.sku);
    if (smsIndex === -1) {
      return NextResponse.json(
        { error: `SMS model with SKU ${smsData.sku} not found` },
        { status: 404 }
      );
    }
    
    // Update the SMS model
    const updatedSmsModel: SmsModel = {
      sku: smsData.sku,
      name: smsData.name,
    };
    
    catalog.smsModels[smsIndex] = updatedSmsModel;
    await writeProductCatalog(catalog, updatedBy);
    
    return NextResponse.json({
      success: true,
      message: "SMS model updated successfully",
      smsModel: updatedSmsModel,
    });
  } catch (error) {
    console.error("Failed to update SMS model:", error);
    return NextResponse.json(
      { 
        error: "Failed to update SMS model",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 400 }
    );
  }
}

// DELETE /api/dev/catalog/sms?sku=smsSku - Delete SMS model
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const smsSku = url.searchParams.get("sku");
    const updatedBy = request.headers.get("x-updated-by") || "api";
    
    if (!smsSku) {
      return NextResponse.json(
        { error: "SMS model SKU is required" },
        { status: 400 }
      );
    }
    
    const catalog = await readProductCatalog();
    
    // Find SMS model to delete
    const smsIndex = catalog.smsModels.findIndex(s => s.sku === smsSku);
    if (smsIndex === -1) {
      return NextResponse.json(
        { error: `SMS model with SKU ${smsSku} not found` },
        { status: 404 }
      );
    }
    
    // Remove the SMS model
    const deletedSmsModel = catalog.smsModels.splice(smsIndex, 1)[0];
    await writeProductCatalog(catalog, updatedBy);
    
    return NextResponse.json({
      success: true,
      message: "SMS model deleted successfully",
      deletedSmsModel,
    });
  } catch (error) {
    console.error("Failed to delete SMS model:", error);
    return NextResponse.json(
      { 
        error: "Failed to delete SMS model",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
