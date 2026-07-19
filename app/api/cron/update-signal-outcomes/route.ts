// ============================================================
// app/api/cron/update-signal-outcomes/route.ts
// Hourly cron job to resolve pending signals
// Protected by CRON_SECRET header
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { fetchCurrentPrice, resolveOutcome, parsePrice } from "@/lib/performance-client";
import type { SignalWithInstrument } from "@/lib/supabase/types";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  // 1. Verify authorization
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ message: "Supabase not configured. Cron skipped." });
  }

  const db = createServiceClient();
  let resolvedCount = 0;
  let errorCount = 0;

  try {
    // 2. Fetch pending signals
    const { data: pendingSignals, error: fetchError } = await db
      .from("signals")
      .select("*, instruments(symbol)")
      .eq("outcome", "pending") as { data: SignalWithInstrument[] | null, error: unknown };

    if (fetchError || !pendingSignals) {
      throw new Error("Failed to fetch pending signals");
    }

    // 3. Process each signal
    for (const signal of pendingSignals) {
      try {
        const currentPrice = await fetchCurrentPrice(signal.instruments.symbol);
        
        // If we can't get the price, we can still check if it's expired
        const effectivePrice = currentPrice ?? 0;
        
        const outcome = resolveOutcome({
          currentPrice: effectivePrice,
          tp: signal.tp,
          sl: signal.sl,
          direction: signal.direction,
          expiresAt: signal.expires_at,
        });

        // Only process if we have a definitive outcome, OR if it's expired
        // (if currentPrice is 0 due to fetch failure, and it's not expired, outcome will likely be null or inaccurate win/loss.
        // Wait, if currentPrice is 0, it might accidentally trigger SL/TP.
        // We should skip win/loss evaluation if currentPrice is null!
        
        const finalOutcome = (currentPrice === null && signal.expires_at && new Date(signal.expires_at) < new Date()) 
            ? "expired" 
            : currentPrice !== null ? resolveOutcome({
                currentPrice,
                tp: signal.tp,
                sl: signal.sl,
                direction: signal.direction,
                expiresAt: signal.expires_at,
              }) : null;


        if (finalOutcome) {
          // 4. Move to archive
          const { error: archiveError } = await (db.from("signal_archive") as any).insert({
            original_id: signal.id,
            instrument_id: signal.instrument_id,
            direction: signal.direction,
            conviction: signal.conviction,
            consensus_score: signal.consensus_score,
            risk_grade: signal.risk_grade,
            timeframe: signal.timeframe,
            session: signal.session,
            source: signal.source,
            entry_zone: signal.entry_zone,
            sl: signal.sl,
            tp: signal.tp,
            created_at: signal.created_at,
            expires_at: signal.expires_at,
            outcome: finalOutcome,
            entry_price: parsePrice(signal.entry_zone),
            outcome_price: currentPrice, // Price at resolution
            metadata: signal.metadata,
          });

          if (archiveError) throw archiveError;

          // 5. Delete from live signals
          const { error: deleteError } = await db
            .from("signals")
            .delete()
            .eq("id", signal.id);

          if (deleteError) throw deleteError;
          
          resolvedCount++;
        }
      } catch (err) {
        console.error(`Error processing signal ${signal.id}:`, err);
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      processed: pendingSignals.length,
      resolved: resolvedCount,
      errors: errorCount,
    });

  } catch (err) {
    console.error("[cron/update-signal-outcomes] Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
