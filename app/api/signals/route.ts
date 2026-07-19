// ============================================================
// app/api/signals/route.ts
//
// GET /api/signals
//   ?assetClass=forex|indices|commodities|crypto
//   ?minConviction=70
//   ?direction=bullish|bearish|neutral
//   ?limit=20
//
// Returns live signals joined with instrument data.
// Falls back to mock data if Supabase is not configured.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured, createServerClient } from "@/lib/supabase/client";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const assetClass   = searchParams.get("assetClass")?.toLowerCase();
  const minConviction = parseInt(searchParams.get("minConviction") ?? "0", 10);
  const direction    = searchParams.get("direction")?.toLowerCase();
  const limit        = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 100);

  // ── Supabase path ─────────────────────────────────────────
  if (isSupabaseConfigured()) {
    try {
      const db = createServerClient();

      let query = db
        .from("signals")
        .select(`
          *,
          instruments (
            symbol,
            name,
            asset_class
          )
        `)
        .gte("conviction", minConviction)
        .order("conviction", { ascending: false })
        .limit(limit);

      if (assetClass) {
        // Filter via joined table — need to join filter
        query = query.eq("instruments.asset_class", assetClass);
      }

      if (direction) {
        query = query.eq("direction", direction);
      }

      const { data, error } = await query;

      if (error) throw error;

      return NextResponse.json({
        signals: data ?? [],
        count: data?.length ?? 0,
        source: "supabase",
        timestamp: new Date().toISOString(),
      });

    } catch (err) {
      console.error("[/api/signals] Supabase error:", err);
      return NextResponse.json(
        { error: "Internal Server Error", details: err instanceof Error ? err.message : "Unknown error" },
        { status: 500 }
      );
    }
  } else {
    return NextResponse.json(
      { error: "Database not configured. Please connect Supabase." },
      { status: 500 }
    );
  }
}
