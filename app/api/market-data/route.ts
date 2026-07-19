// ============================================================
// app/api/market-data/route.ts
//
// GET /api/market-data?symbol=EURUSD&type=ohlcv|indicators|quote
//
// Returns standardised payload:
// { symbol, timestamp, data, source, cached, error? }
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { fetchOHLCV, fetchIndicators, fetchQuote, rateLimiter } from "@/lib/api-client";

const VALID_TYPES = ["ohlcv", "indicators", "quote"] as const;
type DataType = (typeof VALID_TYPES)[number];

const VALID_INTERVALS = ["1min","5min","15min","30min","1h","4h","1day","1week"] as const;
type Interval = (typeof VALID_INTERVALS)[number];

// Allowed symbols (matches instruments table)
const ALLOWED_SYMBOLS = new Set([
  "EURUSD","GBPUSD","USDJPY","USDCHF","AUDUSD","GBPJPY",
  "XAUUSD","XAGUSD","USOIL",
  "US30","NAS100","SPX500","UK100","GER40",
  "BTCUSD","ETHUSD","SOLUSD","BNBUSD",
]);

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const symbol   = searchParams.get("symbol")?.toUpperCase() ?? "";
  const type     = searchParams.get("type") as DataType | null;
  const interval = (searchParams.get("interval") ?? "4h") as Interval;
  const outputSize = Math.min(parseInt(searchParams.get("outputSize") ?? "50", 10), 200);

  // ── Validation ────────────────────────────────────────────
  if (!symbol) {
    return NextResponse.json(
      { error: "Missing required parameter: symbol" },
      { status: 400 }
    );
  }

  if (!ALLOWED_SYMBOLS.has(symbol)) {
    return NextResponse.json(
      { error: `Symbol '${symbol}' is not in the supported instrument list.` },
      { status: 400 }
    );
  }

  if (!type || !VALID_TYPES.includes(type)) {
    return NextResponse.json(
      { error: `Invalid or missing 'type'. Must be one of: ${VALID_TYPES.join(", ")}` },
      { status: 400 }
    );
  }

  if (type === "ohlcv" && !VALID_INTERVALS.includes(interval)) {
    return NextResponse.json(
      { error: `Invalid interval '${interval}'. Must be one of: ${VALID_INTERVALS.join(", ")}` },
      { status: 400 }
    );
  }

  // ── Rate limit check (skip for cached requests — checked inside client) ──
  const rateCheck = rateLimiter.check();

  // ── Dispatch ──────────────────────────────────────────────
  try {
    let result;

    switch (type) {
      case "ohlcv":
        result = await fetchOHLCV(symbol, interval, outputSize);
        break;

      case "indicators":
        // For indicators, map outputSize interval to indicator interval
        const indInterval = (["1h","4h","1day"].includes(interval) ? interval : "4h") as "1h" | "4h" | "1day";
        result = await fetchIndicators(symbol, indInterval);

        // If rate limited and not from cache, return 429
        if (!result.cached && !rateCheck.allowed) {
          return NextResponse.json(
            { error: rateCheck.reason, rateLimitStatus: rateLimiter.getStatus() },
            { status: 429 }
          );
        }
        break;

      case "quote":
        result = await fetchQuote(symbol);
        break;
    }

    // ── Response headers ─────────────────────────────────────
    const headers = new Headers({
      "Content-Type": "application/json",
      "Cache-Control": result!.cached
        ? "public, max-age=30"
        : "public, max-age=30, stale-while-revalidate=30",
      "X-Data-Source": result!.source,
      "X-Cached": String(result!.cached),
      "X-Rate-Limit-Day-Used": String(rateLimiter.getStatus().dayUsed),
      "X-Rate-Limit-Day-Limit": String(rateLimiter.getStatus().dayLimit),
    });

    const status = result!.source === "fallback" && !result!.error ? 200
      : result!.error && !result!.cached ? 206 // Partial content — fallback used
      : 200;

    return NextResponse.json(result, { status, headers });

  } catch (err) {
    console.error("[/api/market-data] Unhandled error:", err);
    return NextResponse.json(
      {
        error: "Internal server error",
        detail: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// ── OPTIONS for CORS ─────────────────────────────────────────
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
