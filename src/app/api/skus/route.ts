import { NextRequest, NextResponse } from "next/server";
import { skuUpsertSchema } from "@/lib/schema";
import { readAllSkus, upsertSku } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const skus = await readAllSkus();
  return NextResponse.json({ skus });
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const parsed = skuUpsertSchema.parse(payload);
    const updated = await upsertSku({ sku: parsed.sku, name: parsed.name ?? "", category: parsed.category ?? "Uncategorized", attributes: parsed.attributes, price: 0 });
    return NextResponse.json({ skus: updated }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Invalid payload" }, { status: 400 });
  }
}


