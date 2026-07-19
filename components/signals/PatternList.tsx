"use client";

// ============================================================
// components/signals/PatternList.tsx
// Active patterns table for Autochartist data
// ============================================================

import type { AutochartistPattern } from "@/lib/autochartist-client";

interface PatternListProps {
  patterns: AutochartistPattern[];
  loading?: boolean;
}

export function PatternList({ patterns, loading = false }: PatternListProps) {
  if (loading) {
    return (
      <div style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-base)" }}>
        <div style={{ padding: "var(--space-4)", borderBottom: "1px solid var(--border)", backgroundColor: "var(--bg-warm)" }}>
          <h3 style={{ fontSize: "0.875rem", fontFamily: "var(--font-sans)", margin: 0 }}>Active Patterns</h3>
        </div>
        <div style={{ padding: "var(--space-4)" }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 40, width: "100%", marginBottom: "var(--space-2)" }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-base)" }}>
      <div style={{ padding: "var(--space-4)", borderBottom: "1px solid var(--border)", backgroundColor: "var(--bg-warm)" }}>
        <h3 style={{ fontSize: "0.875rem", fontFamily: "var(--font-sans)", margin: 0 }}>Active Patterns</h3>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Pattern</th>
            <th>Direction</th>
            <th>Quality</th>
            <th style={{ textAlign: "right" }}>Forecast</th>
            <th style={{ textAlign: "right" }}>Time Remaining</th>
          </tr>
        </thead>
        <tbody>
          {patterns.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ textAlign: "center", padding: "var(--space-8)", color: "var(--text-disabled)" }}>
                No active patterns detected.
              </td>
            </tr>
          ) : (
            patterns.map((p) => {
              const isBullish = p.direction === "bullish";
              const dirColor = isBullish ? "var(--green)" : "var(--burgundy)";
              const dirBg = isBullish ? "var(--green-bg)" : "var(--burgundy-bg)";

              return (
                <tr key={p.id}>
                  {/* Pattern Name */}
                  <td style={{ fontWeight: 500, fontFamily: "var(--font-sans)", color: "var(--text-primary)" }}>
                    {p.pattern_type}
                  </td>

                  {/* Direction Badge */}
                  <td>
                    <span style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "2px 8px",
                      backgroundColor: dirBg,
                      border: `1px solid ${dirColor}33`,
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.6875rem",
                      fontWeight: 600,
                      color: dirColor,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                    }}>
                      {isBullish ? "↑ BULLISH" : "↓ BEARISH"}
                    </span>
                  </td>

                  {/* Quality Rating (Stars) */}
                  <td>
                    <div style={{ display: "flex", gap: 2 }}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} style={{
                          color: i < p.quality_score ? "var(--navy)" : "var(--bg-stone)",
                          fontSize: "1.1rem",
                          lineHeight: 1
                        }}>
                          ★
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Forecast Price */}
                  <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--text-primary)" }}>
                    {p.forecast_price.toFixed(5)}
                  </td>

                  {/* Time Remaining */}
                  <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                    {p.time_remaining}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
