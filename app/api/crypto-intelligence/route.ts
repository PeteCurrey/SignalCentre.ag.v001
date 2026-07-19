// ============================================================
// app/api/crypto-intelligence/route.ts
// Section D — Crypto Intelligence Hub API
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import {
  fetchCryptoIntelligence,
  CRYPTO_SYMBOLS,
  type CryptoSymbol,
} from "@/lib/crypto-intelligence-client";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbolParam = searchParams.get("symbol")?.toUpperCase() as CryptoSymbol | null;

  if (!symbolParam || !CRYPTO_SYMBOLS.includes(symbolParam as CryptoSymbol)) {
    return NextResponse.json(
      { error: "Invalid symbol. Accepted: BTC, ETH, SOL" },
      { status: 400 }
    );
  }

  try {
    const data = await fetchCryptoIntelligence(symbolParam);
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    });
  } catch (err) {
    console.error("[crypto-intelligence] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch crypto intelligence data" },
      { status: 500 }
    );
  }
}
