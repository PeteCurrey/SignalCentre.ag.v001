// ============================================================
// app/api/consensus-engine/route.ts
// AI Consensus Engine Orchestration
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { callClaude, callGpt, callGrok, MarketDataBundle, SignalObject } from "@/lib/ai-clients";
import { computeConsensus } from "@/lib/consensus";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const symbol: string = body.symbol;
    const data: MarketDataBundle = body.data;

    if (!symbol || !data) {
      return NextResponse.json({ error: "Missing symbol or data bundle" }, { status: 400 });
    }

    // 1. Parallel Dispatch (allSettled ensures partial failures don't crash everything)
    const [claudeRes, gptRes, grokRes] = await Promise.allSettled([
      callClaude(symbol, data),
      callGpt(symbol, data),
      callGrok(symbol, data)
    ]);

    // 2. Extract results
    const modelsOutput: Record<string, SignalObject | null> = {
      claude: claudeRes.status === "fulfilled" ? claudeRes.value : null,
      gpt: gptRes.status === "fulfilled" ? gptRes.value : null,
      grok: grokRes.status === "fulfilled" ? grokRes.value : null,
    };

    // Log failures
    if (claudeRes.status === "rejected") console.error("[Consensus] Claude failed:", claudeRes.reason);
    if (gptRes.status === "rejected") console.error("[Consensus] GPT failed:", gptRes.reason);
    if (grokRes.status === "rejected") console.error("[Consensus] Grok failed:", grokRes.reason);

    // 3. Compute DCS
    const consensus = computeConsensus(modelsOutput);

    // 4. Supabase Storage
    let dbSuccess = false;
    let instrumentId: string | null = null;

    if (isSupabaseConfigured()) {
      try {
        const db = createServiceClient();
        
        // Lookup instrument_id
        const { data: inst } = await db
          .from("instruments")
          .select("id")
          .eq("symbol", symbol)
          .single() as { data: { id: string } | null };

        if (inst) {
          instrumentId = inst.id;
          
          // Expiry set to 4 hours from computation
          const expiresAt = new Date();
          expiresAt.setHours(expiresAt.getHours() + 4);

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error } = await (db.from("signals") as any).insert({
            instrument_id: instrumentId,
            direction: consensus.direction,
            conviction: consensus.dcs,       // Map DCS to conviction scale 0-100
            consensus_score: consensus.dcs,
            risk_grade: consensus.risk_grade,
            timeframe: "Multi",
            source: "ai_consensus",
            outcome: "pending",
            expires_at: expiresAt.toISOString(),
            metadata: modelsOutput // The JSONB payload with detailed model breakdown
          });

          if (error) {
            console.error("[Consensus] Supabase insert error:", error);
          } else {
            dbSuccess = true;
          }
        }
      } catch (dbErr) {
        console.error("[Consensus] DB ops failed:", dbErr);
      }
    }

    // 5. Build Response
    const responsePayload = {
      dcs: consensus.dcs,
      direction: consensus.direction,
      risk_grade: consensus.risk_grade,
      models: modelsOutput,
      consensus: {
        agreement_level: consensus.agreement_level,
        weights_applied: consensus.weights_applied,
      },
      computed_at: new Date().toISOString(),
      _meta: {
        degraded: consensus.degraded,
        db_stored: dbSuccess
      }
    };

    return NextResponse.json(responsePayload, { status: 200 });

  } catch (err) {
    console.error("[/api/consensus-engine] Fatal error:", err);
    return NextResponse.json(
      { error: "Consensus Engine Failed", detail: err instanceof Error ? err.message : "Unknown" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
