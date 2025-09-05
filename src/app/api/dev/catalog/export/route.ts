import { NextResponse } from "next/server";
import { exportCatalog } from "@/lib/catalog-storage";

// GET /api/dev/catalog/export - Export catalog as JSON
export async function GET() {
  try {
    const jsonData = await exportCatalog();
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `tippingpoint-catalog-${timestamp}.json`;
    
    return new NextResponse(jsonData, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Failed to export catalog:", error);
    return NextResponse.json(
      { error: "Failed to export catalog" },
      { status: 500 }
    );
  }
}
