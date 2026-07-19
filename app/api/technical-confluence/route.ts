// ============================================================
// app/api/technical-confluence/route.ts
//
// GET /api/technical-confluence?symbol=EURUSD
//
// Returns Technical Confluence multi-timeframe dashboard data.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { fetchTechnicalConfluence } from "@/lib/taapi-client";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const symbol = searchParams.get("symbol")?.toUpperCase() ?? "";

  if (!symbol) {
    return NextResponse.json(
      { error: "Missing required parameter: symbol" },
      { status: 400 }
    );
  }

  try {
    const result = await fetchTechnicalConfluence(symbol);

    const headers = new Headers({
      "Content-Type": "application/json",
      "Cache-Control": result.cached
        ? "public, max-age=60"
        : "public, max-age=60, stale-while-revalidate=60",
      "X-Data-Source": result.source,
      "X-Cached": String(result.cached),
    });

    const status = result.source === "error-fallback" ? 206 : 200;

    return NextResponse.json(result, { status, headers });

  } catch (err) {
    console.error("[/api/technical-confluence] Unhandled error:", err);
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
