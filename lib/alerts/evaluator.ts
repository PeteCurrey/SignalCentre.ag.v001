import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { dispatchAlert } from "./dispatcher";
import { fetchCurrentPrice } from "@/lib/performance-client";
import type { Alert, SignalWithInstrument } from "@/lib/supabase/types";

export async function evaluateAlerts() {
  if (!isSupabaseConfigured()) return { message: "Supabase not configured" };

  const db = createServiceClient();

  // 1. Fetch active alerts
  const { data: alerts, error: alertErr } = await db
    .from("alerts")
    .select("*")
    .eq("active", true) as { data: Alert[] | null, error: unknown };

  if (alertErr || !alerts || alerts.length === 0) return { evaluated: 0, triggered: 0 };

  // 2. Fetch latest active signals to check DCS and Direction
  const { data: signals, error: sigErr } = await db
    .from("signals")
    .select("*, instruments(symbol)")
    .eq("outcome", "pending") as { data: SignalWithInstrument[] | null, error: unknown };

  if (sigErr || !signals) return { evaluated: 0, triggered: 0 };

  let triggeredCount = 0;
  const now = Date.now();

  for (const alert of alerts) {
    // Rate limit: Max 1 alert per 15 minutes per user/instrument
    if (alert.last_triggered_at) {
      const lastTrigger = new Date(alert.last_triggered_at).getTime();
      if (now - lastTrigger < 15 * 60 * 1000) {
        continue; // Skip, too recent
      }
    }

    let shouldTrigger = false;
    let triggerDcs = 0;
    let triggerDirection = "";
    let triggerSignalId = "";

    const relatedSignals = signals.filter(s => s.instruments.symbol === alert.instrument);
    if (relatedSignals.length === 0 && alert.condition_type !== "price_level") continue;

    // Pick the most recent signal for the instrument
    const latestSignal = relatedSignals.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];

    switch (alert.condition_type) {
      case "dcs_above":
        if (latestSignal && latestSignal.consensus_score >= (alert.threshold || 0)) {
          shouldTrigger = true;
          triggerDcs = latestSignal.consensus_score;
          triggerDirection = latestSignal.direction;
          triggerSignalId = latestSignal.id;
        }
        break;
      
      case "direction_change":
        // For direction change, we'd normally check if the NEW signal direction differs from the previous one.
        // For simplicity in this evaluator without complex history joins, we assume if a new signal just appeared 
        // within the last 5 mins, it's worth checking. We will simulate this by checking if signal was created recently.
        if (latestSignal && (now - new Date(latestSignal.created_at).getTime() < 5 * 60 * 1000)) {
          shouldTrigger = true;
          triggerDcs = latestSignal.consensus_score;
          triggerDirection = latestSignal.direction;
          triggerSignalId = latestSignal.id;
        }
        break;

      case "new_pattern":
        // Simulated: if we had an autochartist patterns table, we'd query it.
        // For now, if there is a signal created very recently, consider it triggering.
        if (latestSignal && (now - new Date(latestSignal.created_at).getTime() < 2 * 60 * 1000)) {
            shouldTrigger = true;
            triggerDcs = latestSignal.consensus_score;
            triggerDirection = latestSignal.direction;
            triggerSignalId = latestSignal.id;
        }
        break;

      case "price_level":
        if (alert.threshold) {
            const currentPrice = await fetchCurrentPrice(alert.instrument);
            if (currentPrice !== null) {
                // If it crossed the threshold (we don't know direction it crossed from, so just if it's close or crossed)
                // For a robust system, we need "crosses above" or "crosses below".
                // We will trigger if within 0.1% of threshold.
                const diffPct = Math.abs(currentPrice - alert.threshold) / alert.threshold;
                if (diffPct < 0.001) {
                    shouldTrigger = true;
                    triggerDcs = latestSignal ? latestSignal.consensus_score : 0;
                    triggerDirection = latestSignal ? latestSignal.direction : "neutral";
                    triggerSignalId = latestSignal ? latestSignal.id : "";
                }
            }
        }
        break;
    }

    if (shouldTrigger) {
      // Dispatch
      await dispatchAlert(
        alert.user_id,
        alert.id,
        alert.notification_channels,
        alert.instrument,
        triggerDirection,
        triggerDcs,
        triggerSignalId
      );

      // Update last triggered
      await (db.from("alerts") as any).update({ last_triggered_at: new Date().toISOString() }).eq("id", alert.id);
      
      triggeredCount++;
    }
  }

  return { evaluated: alerts.length, triggered: triggeredCount };
}
