import { NextRequest, NextResponse } from "next/server";
import { skuUpsertSchema } from "@/lib/schema";
import { deleteSku, getSku, upsertSku } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: { sku: string } };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const sku = ctx.params.sku;
  const item = await getSku(sku);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ sku: item });
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  try {
    const sku = ctx.params.sku;
    const payload = await req.json();
    const parsed = skuUpsertSchema.parse({ ...payload, sku });
    const updated = await upsertSku({ sku, name: parsed.name ?? "", category: parsed.category ?? "Uncategorized", attributes: parsed.attributes, price: 0 });
    return NextResponse.json({ skus: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Invalid payload" }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const sku = ctx.params.sku;
  const updated = await deleteSku(sku);
  return NextResponse.json({ skus: updated });
}


