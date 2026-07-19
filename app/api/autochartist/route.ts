// ============================================================
// app/api/autochartist/route.ts
// Proxy endpoint for Autochartist patterns and key levels
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { fetchAutochartistPatterns, fetchAutochartistKeyLevels } from "@/lib/autochartist-client";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const symbol = searchParams.get("symbol")?.toUpperCase() ?? "";
  const type = searchParams.get("type") ?? "patterns";
  const currentPriceStr = searchParams.get("price");

  if (!symbol) {
    return NextResponse.json({ error: "Missing required parameter: symbol" }, { status: 400 });
  }

  try {
    if (type === "patterns") {
      const patterns = await fetchAutochartistPatterns(symbol);
      return NextResponse.json(patterns, {
        headers: { "Cache-Control": "public, max-age=300" }
      });
    } 
    
    if (type === "keylevels") {
      const currentPrice = currentPriceStr ? parseFloat(currentPriceStr) : 100; // fallback if missing
      const levels = await fetchAutochartistKeyLevels(symbol, currentPrice);
      return NextResponse.json(levels, {
        headers: { "Cache-Control": "public, max-age=300" }
      });
    }

    return NextResponse.json({ error: "Invalid type parameter" }, { status: 400 });

  } catch (err) {
    console.error("[/api/autochartist] Unhandled error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
