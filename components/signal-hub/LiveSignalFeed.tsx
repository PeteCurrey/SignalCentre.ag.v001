"use client";

// ============================================================
// components/signal-hub/LiveSignalFeed.tsx
// Institutional signal table — aligned to platform design system.
// White background, navy/green/burgundy palette, IBM Plex typography.
// ============================================================

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { isSupabaseConfigured, createBrowserClient } from "@/lib/supabase/client";
import { MOCK_SIGNALS } from "@/lib/data/mock-signals";
import { getRelativeTime, getRiskGradeLabel } from "@/lib/utils";
import type { Signal } from "@/lib/types";

// ── Types ────────────────────────────────────────────────────

type AssetFilter      = "ALL" | "FOREX" | "INDICES" | "COMMODITIES" | "CRYPTO";
type ConvictionFilter = "ALL" | "HIGH" | "MEDIUM" | "LOW";

// ── Helpers ──────────────────────────────────────────────────

function slugify(instrument: string) {
  return instrument.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function matchesConviction(score: number, filter: ConvictionFilter): boolean {
  if (filter === "ALL")    return true;
  if (filter === "HIGH")   return score >= 80;
  if (filter === "MEDIUM") return score >= 60 && score < 80;
  return score < 60;
}

function convictionColor(score: number): string {
  if (score >= 80) return "var(--green)";
  if (score >= 60) return "var(--amber)";
  return "var(--burgundy)";
}

function consensusColor(score: number): string {
  if (score >= 70) return "var(--navy)";
  if (score >= 50) return "var(--amber)";
  return "var(--burgundy)";
}

// ── Direction badge ──────────────────────────────────────────

function DirectionBadge({ direction }: { direction: Signal["direction"] }) {
  const map = {
    BULLISH: { label: "↑ BULLISH", color: "var(--green)",    bg: "var(--green-bg)",    border: "var(--green)"    },
    BEARISH: { label: "↓ BEARISH", color: "var(--burgundy)", bg: "var(--burgundy-bg)", border: "var(--burgundy)" },
    NEUTRAL: { label: "→ NEUTRAL", color: "var(--amber)",    bg: "var(--amber-bg)",    border: "var(--amber)"    },
  };
  const s = map[direction];
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      padding: "2px 8px",
      backgroundColor: s.bg,
      border: `1px solid ${s.border}33`,
      fontFamily: "var(--font-mono)",
      fontSize: "0.6875rem",
      fontWeight: 600,
      color: s.color,
      letterSpacing: "0.04em",
      whiteSpace: "nowrap",
    }}>
      {s.label}
    </span>
  );
}

// ── Score bar ────────────────────────────────────────────────

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", minWidth: 100 }}>
      <div style={{
        flex: 1,
        height: 2,
        backgroundColor: "var(--bg-stone)",
        overflow: "hidden",
        maxWidth: 64,
      }}>
        <div style={{
          width: `${value}%`,
          height: "100%",
          backgroundColor: color,
          transition: "width 400ms var(--ease)",
        }} />
      </div>
      <span style={{
        fontFamily: "var(--font-mono)",
        fontSize: "0.8125rem",
        fontWeight: 500,
        color: "var(--text-primary)",
        minWidth: 24,
        textAlign: "right",
      }}>
        {value}
      </span>
    </div>
  );
}

// ── Risk grade badge ─────────────────────────────────────────

function RiskBadge({ grade }: { grade: Signal["riskGrade"] }) {
  const label = getRiskGradeLabel(grade);
  const map: Record<string, { color: string; bg: string; border: string }> = {
    "A+": { color: "var(--green)",          bg: "var(--green-bg)",    border: "var(--green)"    },
    "A":  { color: "var(--green-light)",    bg: "var(--green-bg)",    border: "var(--green)"    },
    "B":  { color: "var(--amber)",          bg: "var(--amber-bg)",    border: "var(--amber)"    },
    "C":  { color: "var(--burgundy-light)", bg: "var(--burgundy-bg)", border: "var(--burgundy)" },
    "D":  { color: "var(--burgundy)",       bg: "var(--burgundy-bg)", border: "var(--burgundy)" },
  };
  const s = map[label] ?? map["C"];
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 30,
      height: 20,
      backgroundColor: s.bg,
      border: `1px solid ${s.border}33`,
      fontFamily: "var(--font-mono)",
      fontSize: "0.75rem",
      fontWeight: 700,
      color: s.color,
    }}>
      {label}
    </span>
  );
}

// ── Skeleton ─────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr>
      {[90, 72, 100, 100, 32, 40, 80, 56, 40].map((w, i) => (
        <td key={i} style={{ padding: "var(--space-3) var(--space-4)", borderBottom: "1px solid var(--border)" }}>
          <div className="skeleton" style={{ height: 10, width: w, borderRadius: 1 }} />
        </td>
      ))}
    </tr>
  );
}

function MobileSkeletonCard() {
  return (
    <div style={{
      padding: "var(--space-4) var(--space-5)",
      borderBottom: "1px solid var(--border)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "var(--space-4)",
    }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
        <div className="skeleton" style={{ height: 12, width: 80, borderRadius: 1 }} />
        <div className="skeleton" style={{ height: 10, width: 56, borderRadius: 1 }} />
      </div>
      <div className="skeleton" style={{ height: 20, width: 52, borderRadius: 1 }} />
    </div>
  );
}

// ── Mobile signal card ───────────────────────────────────────

function MobileSignalCard({ signal, isNew }: { signal: Signal; isNew: boolean }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{
      borderBottom: "1px solid var(--border)",
      animation: isNew ? "newRowFadeIn 300ms var(--ease) both" : undefined,
    }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "var(--space-4) var(--space-5)",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          backgroundColor: expanded ? "var(--bg-warm)" : "transparent",
          transition: "background-color var(--duration-fast)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            <span style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.9rem",
              fontWeight: 600,
              color: "var(--text-primary)",
              letterSpacing: "0.04em",
            }}>
              {signal.instrument}
            </span>
            <DirectionBadge direction={signal.direction} />
          </div>
          <span style={{
            fontSize: "0.75rem",
            color: "var(--text-muted)",
            fontFamily: "var(--font-mono)",
          }}>
            {getRelativeTime(signal.timestamp)} · {signal.timeframe}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{
              fontFamily: "var(--font-mono)",
              fontSize: "1rem",
              fontWeight: 600,
              color: convictionColor(signal.convictionScore),
            }}>
              {signal.convictionScore}
            </div>
            <div style={{ fontSize: "0.5625rem", color: "var(--text-disabled)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              cvct
            </div>
          </div>
          <span style={{
            fontSize: "0.625rem",
            color: "var(--text-muted)",
            transform: expanded ? "rotate(90deg)" : "none",
            transition: "transform 150ms",
            display: "block",
          }}>▶</span>
        </div>
      </button>

      {expanded && (
        <div style={{
          padding: "0 var(--space-5) var(--space-4)",
          backgroundColor: "var(--bg-warm)",
          borderTop: "1px solid var(--border)",
        }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "var(--space-4) var(--space-6)",
            paddingTop: "var(--space-4)",
            marginBottom: "var(--space-4)",
          }}>
            {[
              { label: "Consensus", value: `${signal.consensusScore}` },
              { label: "Risk Grade", value: getRiskGradeLabel(signal.riskGrade) },
              { label: "Session", value: signal.sessionContext },
              { label: "Timeframe", value: signal.timeframe },
            ].map((item) => (
              <div key={item.label}>
                <div style={{
                  fontSize: "0.5625rem",
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                  marginBottom: 3,
                }}>
                  {item.label}
                </div>
                <div style={{
                  fontSize: "0.875rem",
                  fontFamily: "var(--font-mono)",
                  color: "var(--text-primary)",
                  fontWeight: 500,
                }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>
          <Link
            href={`/signals/${slugify(signal.instrument)}`}
            style={{
              display: "block",
              padding: "var(--space-3) 0",
              textAlign: "center",
              border: "1px solid var(--border-strong)",
              color: "var(--text-secondary)",
              textDecoration: "none",
              fontSize: "0.8125rem",
              fontWeight: 500,
              letterSpacing: "0.02em",
              transition: "all var(--duration-fast)",
            }}
          >
            View Full Analysis →
          </Link>
        </div>
      )}
    </div>
  );
}

// ── Filter tab ───────────────────────────────────────────────

function FilterTab({
  label, active, onClick,
}: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "var(--space-2) var(--space-4)",
        fontSize: "0.75rem",
        fontWeight: active ? 600 : 400,
        fontFamily: "var(--font-mono)",
        letterSpacing: "0.06em",
        color: active ? "var(--navy)" : "var(--text-muted)",
        backgroundColor: active ? "var(--bg-base)" : "transparent",
        border: "1px solid " + (active ? "var(--border-strong)" : "transparent"),
        borderBottom: active ? "1px solid var(--bg-base)" : "1px solid transparent",
        cursor: "pointer",
        marginBottom: -1,
        transition: "all var(--duration-fast)",
        position: "relative",
        zIndex: active ? 1 : 0,
      }}
    >
      {label}
    </button>
  );
}

// ── Props ─────────────────────────────────────────────────────

interface LiveSignalFeedProps {
  onCountChange?: (count: number) => void;
}

// ── Main component ───────────────────────────────────────────

export function LiveSignalFeed({ onCountChange }: LiveSignalFeedProps) {
  const [signals, setSignals]           = useState<Signal[]>([]);
  const [loading, setLoading]           = useState(true);
  const [assetFilter, setAssetFilter]   = useState<AssetFilter>("ALL");
  const [convFilter, setConvFilter]     = useState<ConvictionFilter>("ALL");
  const [tick, setTick]                 = useState(0);
  const [lastRefresh, setLastRefresh]   = useState<Date>(new Date());
  const [newSignalIds, setNewSignalIds] = useState<Set<string>>(new Set());

  // ── Fetch ────────────────────────────────────────────────

  const fetchSignals = useCallback(async () => {
    if (isSupabaseConfigured()) {
      try {
        const db = createBrowserClient();
        const { data, error } = await db
          .from("signals")
          .select(`id, direction, conviction, consensus_score, risk_grade, timeframe, session, created_at, expires_at, outcome, instruments ( symbol, name, asset_class )`)
          .gt("expires_at", new Date().toISOString())
          .eq("outcome", "pending")
          .order("created_at", { ascending: false })
          .limit(50);

        if (!error && data) {
          const mapped: Signal[] = (data as Array<Record<string, unknown>>).map((row) => {
            const instr = row.instruments as Record<string, string> | null;
            return {
              id: row.id as string,
              instrument: instr?.symbol ?? "—",
              assetClass: ((instr?.asset_class ?? "forex") as string).toUpperCase() as Signal["assetClass"],
              direction: ((row.direction as string).toUpperCase()) as Signal["direction"],
              convictionScore: row.conviction as number,
              consensusScore: row.consensus_score as number,
              riskGrade: (row.risk_grade as string).replace("+", "_PLUS") as Signal["riskGrade"],
              timeframe: row.timeframe as string,
              sessionContext: (row.session as string | null) ?? "—",
              isActive: true,
              timestamp: row.created_at as string,
            };
          });
          setSignals(mapped);
          onCountChange?.(mapped.length);
          setLastRefresh(new Date());
          return;
        }
      } catch { /* fall through */ }
    }

    const mock = MOCK_SIGNALS.filter((s) => s.isActive);
    setSignals(mock);
    onCountChange?.(mock.length);
    setLastRefresh(new Date());
  }, [onCountChange]);

  // ── Initial load ─────────────────────────────────────────

  useEffect(() => {
    fetchSignals().finally(() => setLoading(false));
  }, [fetchSignals]);

  // ── Supabase realtime ────────────────────────────────────

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const db = createBrowserClient();
    const channel = db
      .channel("signals-feed")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "signals" }, (payload) => {
        const id = (payload.new as Record<string, unknown>).id as string;
        setNewSignalIds((prev) => new Set([...prev, id]));
        setTimeout(() => setNewSignalIds((prev) => { const n = new Set(prev); n.delete(id); return n; }), 1200);
        fetchSignals();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "signals" }, () => fetchSignals())
      .subscribe();
    return () => { db.removeChannel(channel); };
  }, [fetchSignals]);

  // ── Time tick (30s) ──────────────────────────────────────

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  // ── Auto-refresh (60s) ───────────────────────────────────

  useEffect(() => {
    const id = setInterval(() => fetchSignals(), 60_000);
    return () => clearInterval(id);
  }, [fetchSignals]);

  // ── Filter ───────────────────────────────────────────────

  const filtered = signals.filter((s) => {
    if (assetFilter !== "ALL" && s.assetClass !== assetFilter) return false;
    if (!matchesConviction(s.convictionScore, convFilter)) return false;
    return true;
  });

  // ── Render ───────────────────────────────────────────────

  const ASSET_TABS: { key: AssetFilter; label: string }[] = [
    { key: "ALL",         label: "All" },
    { key: "FOREX",       label: "Forex" },
    { key: "INDICES",     label: "Indices" },
    { key: "COMMODITIES", label: "Commodities" },
    { key: "CRYPTO",      label: "Crypto" },
  ];

  return (
    <>
      <style>{`
        @keyframes newRowFadeIn {
          from { opacity: 0; background-color: var(--green-bg); }
          to   { opacity: 1; background-color: transparent; }
        }
        @keyframes liveDot {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
        .sig-row { transition: background-color var(--duration-fast) var(--ease); }
        .sig-row:hover { background-color: var(--bg-warm) !important; cursor: pointer; }
        .sig-row:hover .sig-view { color: var(--navy) !important; }
        @media (max-width: 860px) {
          .sig-table-wrap { display: none !important; }
          .sig-cards-wrap { display: block !important; }
        }
      `}</style>

      {/* ── Filter bar ─────────────────────────────────────── */}
      <div style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "var(--space-4)",
        marginBottom: 0,
        borderBottom: "1px solid var(--border)",
        paddingBottom: 0,
      }}>
        {/* Asset tabs */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 0 }}>
          {ASSET_TABS.map((tab) => (
            <FilterTab
              key={tab.key}
              label={tab.label}
              active={assetFilter === tab.key}
              onClick={() => setAssetFilter(tab.key)}
            />
          ))}
        </div>

        {/* Right controls */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-4)",
          paddingBottom: "var(--space-2)",
        }}>
          <select
            value={convFilter}
            onChange={(e) => setConvFilter(e.target.value as ConvictionFilter)}
            style={{
              backgroundColor: "var(--bg-base)",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
              padding: "5px 10px",
              fontSize: "0.75rem",
              fontFamily: "var(--font-mono)",
              cursor: "pointer",
              outline: "none",
            }}
          >
            <option value="ALL">All Conviction</option>
            <option value="HIGH">High 80+</option>
            <option value="MEDIUM">Medium 60–79</option>
            <option value="LOW">Low &lt;60</option>
          </select>

          {/* Live badge */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-2)",
            padding: "5px 10px",
            border: "1px solid var(--border)",
            backgroundColor: "var(--bg-warm)",
          }}>
            <span style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              backgroundColor: "var(--green)",
              flexShrink: 0,
              animation: "liveDot 2s ease-in-out infinite",
            }} />
            <span style={{
              fontSize: "0.625rem",
              fontFamily: "var(--font-mono)",
              fontWeight: 600,
              color: "var(--green)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}>
              {getRelativeTime(lastRefresh)}
            </span>
          </div>
        </div>
      </div>

      {/* ── Desktop table ─────────────────────────────────── */}
      <div className="sig-table-wrap" style={{ border: "1px solid var(--border)", borderTop: "none" }}>
        <table style={{
          width: "100%",
          borderCollapse: "collapse",
          tableLayout: "fixed",
          fontFamily: "var(--font-sans)",
        }}>
          <colgroup>
            <col style={{ width: "13%" }} />
            <col style={{ width: "11%" }} />
            <col style={{ width: "17%" }} />
            <col style={{ width: "17%" }} />
            <col style={{ width: "7%" }} />
            <col style={{ width: "6%" }} />
            <col style={{ width: "11%" }} />
            <col style={{ width: "9%" }} />
            <col style={{ width: "9%" }} />
          </colgroup>

          <thead>
            <tr style={{ backgroundColor: "var(--bg-warm)" }}>
              {[
                "INSTRUMENT","DIRECTION","CONVICTION","CONSENSUS",
                "RISK GRADE","TIMEFRAME","SESSION","UPDATED","",
              ].map((col) => (
                <th key={col} style={{
                  padding: "var(--space-3) var(--space-4)",
                  textAlign: "left",
                  fontSize: "0.5625rem",
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  color: "var(--text-muted)",
                  fontFamily: "var(--font-mono)",
                  whiteSpace: "nowrap",
                  borderBottom: "1px solid var(--border-strong)",
                }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={9}>
                  <div style={{
                    padding: "var(--space-16)",
                    textAlign: "center",
                  }}>
                    <div style={{ fontSize: "1.5rem", color: "var(--text-disabled)", marginBottom: "var(--space-3)" }}>◈</div>
                    <p style={{
                      fontSize: "0.875rem",
                      color: "var(--text-muted)",
                      fontFamily: "var(--font-mono)",
                      letterSpacing: "0.03em",
                    }}>
                      No active signals match your filter
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((signal) => {
                const isNew = newSignalIds.has(signal.id);
                return (
                  <tr
                    key={signal.id}
                    className="sig-row"
                    style={{
                      borderBottom: "1px solid var(--border)",
                      animation: isNew ? "newRowFadeIn 1.2s var(--ease) both" : undefined,
                      backgroundColor: "var(--bg-base)",
                    }}
                    onClick={() => window.location.href = `/signals/${slugify(signal.instrument)}`}
                  >
                    {/* Instrument */}
                    <td style={{ padding: "var(--space-3) var(--space-4)" }}>
                      <div style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        color: "var(--text-primary)",
                        letterSpacing: "0.04em",
                      }}>
                        {signal.instrument}
                      </div>
                      <div style={{
                        fontSize: "0.625rem",
                        color: "var(--text-disabled)",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        marginTop: 2,
                        fontFamily: "var(--font-mono)",
                      }}>
                        {signal.assetClass}
                      </div>
                    </td>

                    {/* Direction */}
                    <td style={{ padding: "var(--space-3) var(--space-4)" }}>
                      <DirectionBadge direction={signal.direction} />
                    </td>

                    {/* Conviction */}
                    <td style={{ padding: "var(--space-3) var(--space-4)" }}>
                      <ScoreBar value={signal.convictionScore} color={convictionColor(signal.convictionScore)} />
                    </td>

                    {/* Consensus */}
                    <td style={{ padding: "var(--space-3) var(--space-4)" }}>
                      <ScoreBar value={signal.consensusScore} color={consensusColor(signal.consensusScore)} />
                    </td>

                    {/* Risk grade */}
                    <td style={{ padding: "var(--space-3) var(--space-4)" }}>
                      <RiskBadge grade={signal.riskGrade} />
                    </td>

                    {/* Timeframe */}
                    <td style={{ padding: "var(--space-3) var(--space-4)" }}>
                      <span style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.8125rem",
                        color: "var(--text-secondary)",
                        fontWeight: 500,
                      }}>
                        {signal.timeframe}
                      </span>
                    </td>

                    {/* Session */}
                    <td style={{ padding: "var(--space-3) var(--space-4)" }}>
                      <span style={{
                        fontSize: "0.75rem",
                        color: "var(--text-muted)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "block",
                      }}>
                        {signal.sessionContext}
                      </span>
                    </td>

                    {/* Updated — re-renders on tick */}
                    <td style={{ padding: "var(--space-3) var(--space-4)" }}>
                      <span
                        key={tick}
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.75rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        {getRelativeTime(signal.timestamp)}
                      </span>
                    </td>

                    {/* View link */}
                    <td style={{ padding: "var(--space-3) var(--space-4)" }}>
                      <Link
                        href={`/signals/${slugify(signal.instrument)}`}
                        className="sig-view"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.75rem",
                          color: "var(--text-disabled)",
                          textDecoration: "none",
                          letterSpacing: "0.04em",
                          whiteSpace: "nowrap",
                          transition: "color var(--duration-fast)",
                        }}
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Mobile cards ─────────────────────────────────────── */}
      <div className="sig-cards-wrap" style={{ display: "none", border: "1px solid var(--border)", borderTop: "none" }}>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <MobileSkeletonCard key={i} />)
        ) : filtered.length === 0 ? (
          <div style={{ padding: "var(--space-12)", textAlign: "center" }}>
            <div style={{ fontSize: "1.5rem", color: "var(--text-disabled)", marginBottom: "var(--space-3)" }}>◈</div>
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>No active signals match your filter</p>
          </div>
        ) : (
          filtered.map((signal) => (
            <MobileSignalCard key={signal.id} signal={signal} isNew={newSignalIds.has(signal.id)} />
          ))
        )}
      </div>

      {/* ── Footer ─────────────────────────────────────────── */}
      {!loading && (
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "var(--space-3) var(--space-4)",
          backgroundColor: "var(--bg-warm)",
          border: "1px solid var(--border)",
          borderTop: "none",
        }}>
          <span style={{
            fontSize: "0.625rem",
            fontFamily: "var(--font-mono)",
            color: "var(--text-disabled)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}>
            {filtered.length} signal{filtered.length !== 1 ? "s" : ""} · {isSupabaseConfigured() ? "live data" : "demo mode"}
          </span>
          <span style={{
            fontSize: "0.625rem",
            fontFamily: "var(--font-mono)",
            color: "var(--text-disabled)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}>
            auto-refresh 60s
          </span>
        </div>
      )}
    </>
  );
}
