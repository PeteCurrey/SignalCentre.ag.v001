import React from "react";
import { getPerformanceStats } from "@/lib/performance-client";
import { StatCard } from "@/components/performance/StatCard";
import { WinRateChart } from "@/components/performance/WinRateChart";
import { DCSScatterPlot } from "@/components/performance/DCSScatterPlot";
import { SignalTable } from "@/components/performance/SignalTable";

export const revalidate = 900; // Cache for 15 mins

export default async function PerformancePage() {
  const stats = await getPerformanceStats();

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "var(--bg-base)" }}>
      {/* Header */}
      <header
        style={{
          borderBottom: "1px solid var(--border)",
          backgroundColor: "var(--bg-stone)",
          padding: "var(--space-6) var(--space-8)",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 500, margin: 0, letterSpacing: "-0.02em" }}>
            Performance & Archive
          </h1>
          <p style={{ color: "var(--text-secondary)", margin: "var(--space-2) 0 0 0", maxWidth: 600, lineHeight: 1.5 }}>
            Transparent, public-facing track record of all resolved signals. We publish our wins, losses, and real risk:reward ratios to prove the edge of our AI Consensus Engine.
          </p>
        </div>
      </header>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "var(--space-8)", display: "flex", flexDirection: "column", gap: "var(--space-12)" }}>
        
        {/* KPI Row */}
        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--space-4)" }}>
          <StatCard
            title="30-Day Win Rate"
            value={`${stats.recent_30_days.win_rate}%`}
            subtitle={`Based on ${stats.recent_30_days.total} signals`}
            highlight
          />
          <StatCard
            title="Avg Win R:R"
            value={`1:${stats.avg_rr}`}
            subtitle="Average Reward to Risk"
          />
          <StatCard
            title="High DCS Win Rate"
            value={`${stats.dcs_accuracy.high_dcs_win_rate}%`}
            subtitle="For Consensus Score ≥ 75"
            trend="up"
            trendValue={`+${(stats.dcs_accuracy.high_dcs_win_rate - stats.recent_30_days.win_rate).toFixed(1)}% vs avg`}
          />
          <StatCard
            title="Top Asset Class"
            value={`${Math.max(...Object.values(stats.by_asset_class).map(ac => ac.win_rate))}%`}
            subtitle={Object.entries(stats.by_asset_class).reduce((a, b) => a[1].win_rate > b[1].win_rate ? a : b)[0].toUpperCase()}
          />
        </section>

        {/* Charts Row */}
        <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-6)" }}>
          {/* Win Rate Over Time */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <div>
              <h2 style={{ fontSize: "1.25rem", margin: "0 0 var(--space-1) 0" }}>30-Day Performance Trend</h2>
              <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: "0.875rem" }}>Rolling win rate over the last month.</p>
            </div>
            <div style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-base)" }}>
              <WinRateChart data={stats.recent_30_days.daily} />
            </div>
          </div>

          {/* DCS Scatter Plot */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <div>
              <h2 style={{ fontSize: "1.25rem", margin: "0 0 var(--space-1) 0" }}>Drawdown Consensus Score (DCS) Validity</h2>
              <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: "0.875rem" }}>Correlation between AI consensus and actual win probability.</p>
            </div>
            <div style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-base)", display: "flex", flexDirection: "column" }}>
              <DCSScatterPlot buckets={stats.dcs_accuracy.buckets} />
              <div style={{ padding: "var(--space-3)", backgroundColor: "var(--bg-stone)", borderTop: "1px solid var(--border)", fontSize: "0.875rem", color: "var(--text-secondary)", display: "flex", gap: "var(--space-4)" }}>
                 <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "var(--green)", opacity: 0.5 }} /> Wins
                 </span>
                 <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "var(--burgundy)", opacity: 0.5 }} /> Losses
                 </span>
                 <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                    <div style={{ width: 12, height: 2, backgroundColor: "var(--navy)" }} /> Win Probability Trend
                 </span>
              </div>
            </div>
          </div>
        </section>

        {/* Signal Log Table */}
        <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <div>
            <h2 style={{ fontSize: "1.5rem", margin: "0 0 var(--space-1) 0" }}>Signal Archive Log</h2>
            <p style={{ color: "var(--text-secondary)", margin: 0 }}>Unfiltered view of every historical signal generated by the platform.</p>
          </div>
          <SignalTable />
        </section>

      </div>
    </main>
  );
}
