// ============================================================
// app/api/fundamentals/route.ts
//
// GET /api/fundamentals?symbol=EURUSD
//
// Returns combined Finnhub payload:
// { symbol, timestamp, data: { quote, news }, source, cached }
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { fetchFundamentals } from "@/lib/api-client";
import type { AssetClass } from "@/lib/supabase/types";

// Symbol → news category mapping
const SYMBOL_CATEGORY: Record<string, { newsCategory: "forex" | "crypto" | "general"; assetClass: AssetClass }> = {
  EURUSD:  { newsCategory: "forex",   assetClass: "forex" },
  GBPUSD:  { newsCategory: "forex",   assetClass: "forex" },
  USDJPY:  { newsCategory: "forex",   assetClass: "forex" },
  USDCHF:  { newsCategory: "forex",   assetClass: "forex" },
  AUDUSD:  { newsCategory: "forex",   assetClass: "forex" },
  GBPJPY:  { newsCategory: "forex",   assetClass: "forex" },
  XAUUSD:  { newsCategory: "general", assetClass: "commodities" },
  XAGUSD:  { newsCategory: "general", assetClass: "commodities" },
  USOIL:   { newsCategory: "general", assetClass: "commodities" },
  US30:    { newsCategory: "general", assetClass: "indices" },
  NAS100:  { newsCategory: "general", assetClass: "indices" },
  SPX500:  { newsCategory: "general", assetClass: "indices" },
  UK100:   { newsCategory: "general", assetClass: "indices" },
  GER40:   { newsCategory: "general", assetClass: "indices" },
  BTCUSD:  { newsCategory: "crypto",  assetClass: "crypto" },
  ETHUSD:  { newsCategory: "crypto",  assetClass: "crypto" },
  SOLUSD:  { newsCategory: "crypto",  assetClass: "crypto" },
  BNBUSD:  { newsCategory: "crypto",  assetClass: "crypto" },
};

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const symbol = searchParams.get("symbol")?.toUpperCase() ?? "";

  // ── Validation ────────────────────────────────────────────
  if (!symbol) {
    return NextResponse.json(
      { error: "Missing required parameter: symbol" },
      { status: 400 }
    );
  }

  if (!SYMBOL_CATEGORY[symbol]) {
    return NextResponse.json(
      { error: `Symbol '${symbol}' is not supported.` },
      { status: 400 }
    );
  }

  const { newsCategory, assetClass } = SYMBOL_CATEGORY[symbol];

  try {
    const result = await fetchFundamentals(symbol, newsCategory);

    const headers = new Headers({
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=60, stale-while-revalidate=60",
      "X-Data-Source": result.source,
      "X-Cached": String(result.cached),
      "X-Asset-Class": assetClass,
    });

    return NextResponse.json(
      {
        ...result,
        meta: {
          assetClass,
          newsCategory,
          newsCount: result.data.news.length,
        },
      },
      { status: 200, headers }
    );
  } catch (err) {
    console.error("[/api/fundamentals] Unhandled error:", err);
    return NextResponse.json(
      {
        error: "Internal server error",
        detail: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
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
