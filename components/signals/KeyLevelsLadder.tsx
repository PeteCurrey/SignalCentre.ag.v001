"use client";

// ============================================================
// components/signals/KeyLevelsLadder.tsx
// Price ladder visualization for Autochartist Key Levels
// ============================================================

import type { AutochartistKeyLevel } from "@/lib/autochartist-client";

interface KeyLevelsLadderProps {
  levels: AutochartistKeyLevel[];
  currentPrice: number;
  loading?: boolean;
}

export function KeyLevelsLadder({ levels, currentPrice, loading = false }: KeyLevelsLadderProps) {
  if (loading) {
    return (
      <div style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-base)", height: "100%" }}>
        <div style={{ padding: "var(--space-4)", borderBottom: "1px solid var(--border)", backgroundColor: "var(--bg-warm)" }}>
          <h3 style={{ fontSize: "0.875rem", fontFamily: "var(--font-sans)", margin: 0 }}>Key Levels</h3>
        </div>
        <div style={{ padding: "var(--space-6)" }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 24, width: "100%", marginBottom: "var(--space-4)" }} />
          ))}
        </div>
      </div>
    );
  }

  // Sort levels descending by price
  const sortedLevels = [...levels].sort((a, b) => b.price - a.price);

  // We want to insert the current price marker in the correct sorted position
  // But for the ladder UI, we'll map over a combined array
  const ladderItems: Array<{
    type: "resistance" | "support" | "current";
    price: number;
    label: string;
    strength?: number;
    distance?: number;
  }> = sortedLevels.map(l => ({
    type: l.level_type,
    price: l.price,
    label: l.level_type === "resistance" ? "Resistance" : "Support",
    strength: l.strength,
    distance: Math.abs(l.price - currentPrice)
  }));

  // Insert current price
  ladderItems.push({
    type: "current",
    price: currentPrice,
    label: "Current Price",
    distance: 0,
  });

  ladderItems.sort((a, b) => b.price - a.price);

  return (
    <div style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-base)", height: "100%" }}>
      <div style={{ padding: "var(--space-4)", borderBottom: "1px solid var(--border)", backgroundColor: "var(--bg-warm)" }}>
        <h3 style={{ fontSize: "0.875rem", fontFamily: "var(--font-sans)", margin: 0 }}>Key Levels</h3>
      </div>

      <div style={{ padding: "var(--space-4)" }}>
        {ladderItems.length === 1 ? (
          <div style={{ textAlign: "center", padding: "var(--space-8)", color: "var(--text-disabled)" }}>
            No key levels detected.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {ladderItems.map((item, idx) => {
              const isCurrent = item.type === "current";
              const isRes = item.type === "resistance";
              const isSup = item.type === "support";
              
              const color = isCurrent ? "var(--navy)" : isRes ? "var(--burgundy)" : "var(--green)";
              const bg = isCurrent ? "var(--navy-muted)" : "transparent";

              return (
                <div key={`${item.type}-${item.price}-${idx}`} style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "var(--space-3) var(--space-4)",
                  backgroundColor: bg,
                  borderLeft: isCurrent ? "3px solid var(--navy)" : "3px solid transparent",
                  borderBottom: idx !== ladderItems.length - 1 ? "1px solid var(--bg-stone)" : "none",
                }}>
                  {/* Label & Strength */}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: isCurrent ? "var(--text-primary)" : "var(--text-secondary)",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      fontFamily: "var(--font-mono)",
                    }}>
                      {item.label}
                    </div>
                    {!isCurrent && item.strength !== undefined && (
                      <div style={{ display: "flex", gap: 2, marginTop: 4 }}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} style={{
                            width: 8,
                            height: 3,
                            backgroundColor: i < item.strength! ? color : "var(--bg-stone)",
                          }} />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Distance */}
                  <div style={{
                    flex: 1,
                    textAlign: "center",
                    fontSize: "0.6875rem",
                    fontFamily: "var(--font-mono)",
                    color: "var(--text-muted)",
                  }}>
                    {!isCurrent && item.distance !== undefined && (
                      <>
                        {item.distance < 0.1 
                          ? `${(item.distance * 10000).toFixed(0)} pips` 
                          : `${item.distance.toFixed(2)} pts`}
                      </>
                    )}
                  </div>

                  {/* Price */}
                  <div style={{
                    flex: 1,
                    textAlign: "right",
                    fontSize: isCurrent ? "1rem" : "0.875rem",
                    fontWeight: isCurrent ? 600 : 500,
                    fontFamily: "var(--font-mono)",
                    color: color,
                  }}>
                    {item.price.toFixed(5).replace(/\.?0+$/, '')}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
