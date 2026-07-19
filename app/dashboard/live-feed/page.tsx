import type { Metadata } from "next";
import { LiveFeedTable } from "@/components/feed/LiveFeedTable";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { getLiveQuotes } from "@/lib/market-data";
import { getRelativeTime } from "@/lib/utils";
import { Signal } from "@/lib/types";

export const metadata: Metadata = {
  title: "Live Intelligence Feed",
};

export const revalidate = 0;

export default async function LiveFeedPage() {
  let signals: any[] = [];
  
  if (isSupabaseConfigured()) {
    try {
      const db = createServerClient();
      const { data } = await db
        .from("signals")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) signals = data;
    } catch (e) {
      console.error("Failed to fetch signals", e);
    }
  }

  const activeSignals = signals.filter(s => s.outcome === "pending" || !s.outcome);
  const symbols = Array.from(new Set(activeSignals.map(s => s.instrument)));
  const quotes = await getLiveQuotes(symbols);

  const mappedSignals: Signal[] = activeSignals.map(s => {
    const q = quotes[s.instrument];
    return {
      id: s.id,
      instrument: s.instrument,
      assetClass: (s.asset_class?.toUpperCase() || "FOREX") as any,
      direction: (s.direction?.toUpperCase() || "NEUTRAL") as any,
      convictionScore: s.conviction || 0,
      consensusScore: s.consensus_score || 0,
      riskGrade: (s.risk_grade || "C") as any,
      timeframe: s.timeframe || "1H",
      sessionContext: s.session_context || "Active Session",
      isActive: true,
      timestamp: s.created_at || new Date().toISOString(),
      price: q?.price,
      priceChange: q?.change,
      priceChangePct: q?.changePct,
    };
  });

  const highConviction = mappedSignals.filter(s => s.convictionScore >= 70).length;
  const aligned = mappedSignals.filter(s => s.consensusScore >= 70).length;

  return (
    <div style={{ padding: "var(--space-8) var(--space-10)" }}>
      {/* Page Header */}
      <div
        style={{
          marginBottom: "var(--space-6)",
          paddingBottom: "var(--space-6)",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "1.25rem",
              fontWeight: 500,
              color: "var(--text-primary)",
              marginBottom: "var(--space-1)",
            }}
          >
            Live Intelligence Feed
          </h1>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
            {mappedSignals.length} instruments active · Last updated just now
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-6)",
          }}
        >
          <div
            style={{
              textAlign: "right",
            }}
          >
            <div
              style={{
                fontSize: "0.6875rem",
                color: "var(--text-muted)",
                marginBottom: "2px",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              High Conviction
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "1.25rem",
                fontWeight: 500,
                color: "var(--green)",
              }}
            >
              {highConviction}
            </div>
          </div>
          <div
            style={{
              textAlign: "right",
            }}
          >
            <div
              style={{
                fontSize: "0.6875rem",
                color: "var(--text-muted)",
                marginBottom: "2px",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              AI Aligned
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "1.25rem",
                fontWeight: 500,
                color: "var(--navy)",
              }}
            >
              {aligned}
            </div>
          </div>
          <div
            style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                backgroundColor: "var(--green)",
                borderRadius: "50%",
                display: "inline-block",
              }}
            />
            <span
              style={{
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                fontFamily: "var(--font-mono)",
              }}
            >
              Live
            </span>
          </div>
        </div>
      </div>

      {/* Full table with filters */}
      <div style={{ border: "1px solid var(--border)" }}>
        <LiveFeedTable signals={mappedSignals} showFilters isPublic={false} />
      </div>

      {/* Footer note */}
      <p
        style={{
          marginTop: "var(--space-4)",
          fontSize: "0.75rem",
          color: "var(--text-disabled)",
        }}
      >
        Signals refresh automatically every 60 seconds. Conviction scores are
        recalculated on each data pull. Historical archive available in Research.
      </p>
    </div>
  );
}
