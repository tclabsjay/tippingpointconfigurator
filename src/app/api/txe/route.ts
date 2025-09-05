import { NextResponse } from "next/server";
import { TXE_DATA } from "@/lib/txe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(TXE_DATA);
}


