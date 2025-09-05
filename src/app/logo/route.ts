import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LOGO_URL = "https://spng.pngfind.com/pngs/s/294-2947805_trend-micro-logo-trend-micro-inc-logo-hd.png";

export async function GET() {
  try {
    const upstream = await fetch(LOGO_URL, { cache: "no-store" });
    if (!upstream.ok) {
      return NextResponse.json({ error: "Failed to fetch logo" }, { status: 502 });
    }
    const arrayBuffer = await upstream.arrayBuffer();
    return new Response(arrayBuffer, {
      headers: {
        "content-type": upstream.headers.get("content-type") || "image/png",
        // Cache at the edge/browser; refresh daily
        "cache-control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unexpected error" }, { status: 500 });
  }
}


