import { NextRequest, NextResponse } from "next/server";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase/client";

export const runtime = "nodejs";

// Mock signal generator for stub mode
function generateMockSignal(instrument: string, assetClass: string, direction: "bullish" | "bearish") {
  const basePrice: Record<string, number> = {
    "GBP/JPY": 196.50, "EUR/USD": 1.0812, "XAU/USD": 2341.5,
    "BTC/USD": 67800, "US30": 39200, "GBP/USD": 1.2740,
  };
  const price = basePrice[instrument] ?? 1.2500;
  const sl = direction === "bullish" ? price * 0.995 : price * 1.005;
  const tp = direction === "bullish" ? price * 1.015 : price * 0.985;
  const dcs = Math.floor(Math.random() * 30) + 70;
  const timeframes = ["15M", "1H", "4H", "1D"];
  const tf = timeframes[Math.floor(Math.random() * timeframes.length)];

  return {
    instrument,
    asset_class: assetClass,
    timeframe: tf,
    direction,
    consensus_score: dcs,
    conviction: dcs,
    risk_grade: dcs >= 80 ? "A" : "B",
    entry_price: price,
    stop_loss: parseFloat(sl.toFixed(4)),
    target_1: parseFloat((direction === "bullish" ? price * 1.008 : price * 0.992).toFixed(4)),
    target_2: parseFloat(tp.toFixed(4)),
    target_3: parseFloat((direction === "bullish" ? price * 1.025 : price * 0.975).toFixed(4)),
    rr_ratio: parseFloat((Math.abs(tp - price) / Math.abs(price - sl)).toFixed(1)),
    claude_direction: direction,
    gpt_direction: direction,
    grok_direction: Math.random() > 0.2 ? direction : (direction === "bullish" ? "bearish" : "bullish"),
    catalyst_text: "Technical confluence breakout — EMA alignment confirmed across timeframes.",
    outcome: "pending" as const,
    source: "signal-scan",
    instrument_id: "mock-id",
  };
}

export async function POST(request: NextRequest) {
  const start = Date.now();

  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // Allow if no secret set (dev mode)
  }

  const mockSignals = [
    generateMockSignal("GBP/JPY", "forex", "bullish"),
    generateMockSignal("XAU/USD", "commodities", "bullish"),
    generateMockSignal("BTC/USD", "crypto", "bearish"),
  ];

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      signals_found: mockSignals.length,
      scan_duration_ms: Date.now() - start,
      mode: "mock",
    });
  }

  const db = createServerClient();

  // In stub mode: just insert 3 mock signals
  const inserted: string[] = [];
  for (const signal of mockSignals) {
    const { data, error } = await db
      .from("signals")
      .insert(signal as any)
      .select("id")
      .single();

    if (!error && data) inserted.push((data as any).id);
  }

  return NextResponse.json({
    signals_found: inserted.length,
    scan_duration_ms: Date.now() - start,
    mode: "live",
  });
}
