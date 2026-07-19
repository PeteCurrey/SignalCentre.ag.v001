"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BarChart2 } from "lucide-react";
import type { PerformanceStats } from "@/lib/performance-client";

export function PerformanceSummaryWidget() {
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/signal-performance")
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "var(--space-4)", color: "var(--text-muted)", fontSize: "0.875rem" }}>
        Loading performance data...
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-2)" }}>
        <div style={{ backgroundColor: "var(--bg-stone)", padding: "var(--space-3)", display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>30D Win Rate</span>
          <span style={{ fontSize: "1.5rem", fontWeight: 600, fontFamily: "var(--font-mono)", color: "var(--green)" }}>
            {stats.recent_30_days.win_rate}%
          </span>
          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
            {stats.recent_30_days.total} signals
          </span>
        </div>
        <div style={{ backgroundColor: "var(--bg-stone)", padding: "var(--space-3)", display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>High DCS Win</span>
          <span style={{ fontSize: "1.5rem", fontWeight: 600, fontFamily: "var(--font-mono)", color: "var(--accent)" }}>
            {stats.dcs_accuracy.high_dcs_win_rate}%
          </span>
          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
            Score ≥ 75
          </span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
        <h4 style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted)", margin: 0 }}>By Asset Class</h4>
        {Object.entries(stats.by_asset_class).map(([ac, data]) => {
          if (data.count === 0) return null;
          return (
            <div key={ac} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.875rem" }}>
              <span style={{ textTransform: "capitalize", color: "var(--text-secondary)" }}>{ac}</span>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                <div style={{ width: 60, height: 4, backgroundColor: "var(--bg-stone)" }}>
                  <div style={{ height: "100%", width: `${data.win_rate}%`, backgroundColor: "var(--green)" }} />
                </div>
                <span style={{ fontFamily: "var(--font-mono)", width: 45, textAlign: "right" }}>{data.win_rate}%</span>
              </div>
            </div>
          );
        })}
      </div>

      <Link
        href="/performance"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "var(--space-2)",
          padding: "var(--space-3)",
          backgroundColor: "var(--navy)",
          color: "white",
          textDecoration: "none",
          fontSize: "0.875rem",
          fontWeight: 500,
          marginTop: "var(--space-2)"
        }}
      >
        <BarChart2 size={16} />
        View Full Performance Hub
        <ArrowRight size={16} />
      </Link>
    </div>
  );
}
