"use client";

import { useState } from "react";
import Link from "next/link";
import type { Signal, AssetClass, Direction, RiskGrade } from "@/lib/types";
import {
  getRelativeTime,
  getRiskGradeLabel,
  getDirectionLabel,
  getScoreCategory,
} from "@/lib/utils";

interface LiveFeedTableProps {
  signals: Signal[];
  maxRows?: number;
  showFilters?: boolean;
  isPublic?: boolean;
}

const ASSET_FILTERS: { label: string; value: AssetClass | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "Forex", value: "FOREX" },
  { label: "Indices", value: "INDICES" },
  { label: "Commodities", value: "COMMODITIES" },
  { label: "Crypto", value: "CRYPTO" },
];

function DirectionBadge({ direction }: { direction: Direction }) {
  const colors: Record<Direction, { bg: string; color: string; label: string }> = {
    BULLISH: { bg: "var(--green-bg)", color: "var(--green)", label: "↑ Bullish" },
    BEARISH: { bg: "var(--burgundy-bg)", color: "var(--burgundy)", label: "↓ Bearish" },
    NEUTRAL: { bg: "var(--bg-stone)", color: "var(--text-muted)", label: "→ Neutral" },
  };
  const c = colors[direction];
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        backgroundColor: c.bg,
        color: c.color,
        fontSize: "0.75rem",
        fontWeight: 500,
        fontFamily: "var(--font-mono)",
        letterSpacing: "0.02em",
      }}
    >
      {c.label}
    </span>
  );
}

function RiskGradeBadge({ grade }: { grade: RiskGrade }) {
  const label = getRiskGradeLabel(grade);
  const colorMap: Record<RiskGrade, string> = {
    A_PLUS: "var(--green)",
    A: "var(--green-light)",
    B: "var(--amber)",
    C: "var(--burgundy-light)",
    D: "var(--burgundy)",
  };
  return (
    <span
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: "0.8125rem",
        fontWeight: 600,
        color: colorMap[grade],
      }}
    >
      {label}
    </span>
  );
}

function ScoreBar({ score }: { score: number }) {
  const category = getScoreCategory(score);
  const barColor =
    category === "high"
      ? "var(--green)"
      : category === "medium"
      ? "var(--amber)"
      : "var(--burgundy)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.875rem",
          fontWeight: 500,
          color:
            category === "high"
              ? "var(--green)"
              : category === "medium"
              ? "var(--amber)"
              : "var(--burgundy)",
          minWidth: "28px",
        }}
      >
        {score}
      </span>
      <div
        style={{
          width: "64px",
          height: "2px",
          backgroundColor: "var(--bg-stone)",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: `${score}%`,
            height: "100%",
            backgroundColor: barColor,
            transition: "width var(--duration-slow)",
          }}
        />
      </div>
    </div>
  );
}

export function LiveFeedTable({
  signals,
  maxRows,
  showFilters = true,
  isPublic = false,
}: LiveFeedTableProps) {
  const [assetFilter, setAssetFilter] = useState<AssetClass | "ALL">("ALL");
  const [convictionFilter, setConvictionFilter] = useState<
    "ALL" | "HIGH" | "MEDIUM" | "LOW"
  >("ALL");

  const filtered = signals
    .filter((s) => assetFilter === "ALL" || s.assetClass === assetFilter)
    .filter((s) => {
      if (convictionFilter === "ALL") return true;
      if (convictionFilter === "HIGH") return s.convictionScore >= 70;
      if (convictionFilter === "MEDIUM")
        return s.convictionScore >= 45 && s.convictionScore < 70;
      return s.convictionScore < 45;
    })
    .slice(0, maxRows);

  return (
    <div>
      {/* Filters */}
      {showFilters && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-6)",
            marginBottom: "var(--space-4)",
            padding: "var(--space-3) 0",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div style={{ display: "flex", gap: "var(--space-1)" }}>
            {ASSET_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setAssetFilter(f.value)}
                style={{
                  padding: "4px 12px",
                  fontSize: "0.75rem",
                  fontWeight: assetFilter === f.value ? 600 : 400,
                  letterSpacing: "0.03em",
                  color:
                    assetFilter === f.value
                      ? "var(--bg-base)"
                      : "var(--text-muted)",
                  backgroundColor:
                    assetFilter === f.value ? "var(--navy)" : "transparent",
                  border: "none",
                  cursor: "pointer",
                  transition: "all var(--duration-base)",
                  fontFamily: "var(--font-sans)",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div
            style={{
              width: "1px",
              height: "16px",
              backgroundColor: "var(--border)",
            }}
          />
          <div style={{ display: "flex", gap: "var(--space-1)" }}>
            {(["ALL", "HIGH", "MEDIUM", "LOW"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setConvictionFilter(f)}
                style={{
                  padding: "4px 12px",
                  fontSize: "0.75rem",
                  fontWeight: convictionFilter === f ? 600 : 400,
                  letterSpacing: "0.03em",
                  color:
                    convictionFilter === f
                      ? "var(--bg-base)"
                      : "var(--text-muted)",
                  backgroundColor:
                    convictionFilter === f ? "var(--navy)" : "transparent",
                  border: "none",
                  cursor: "pointer",
                  transition: "all var(--duration-base)",
                  fontFamily: "var(--font-sans)",
                }}
              >
                {f === "ALL" ? "All Conviction" : `${f.charAt(0) + f.slice(1).toLowerCase()}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Instrument</th>
              <th>Direction</th>
              <th>Conviction</th>
              <th>Consensus</th>
              <th>Risk Grade</th>
              <th>Timeframe</th>
              <th>Session</th>
              <th>Updated</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((signal, i) => (
              <tr
                key={signal.id}
                className="animate-fade-in"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                {/* Instrument */}
                <td>
                  <div>
                    <div
                      style={{
                        fontWeight: 500,
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.875rem",
                        letterSpacing: "0.02em",
                      }}
                    >
                      {signal.instrument}
                    </div>
                    {signal.price !== undefined && (
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--text-muted)",
                          fontFamily: "var(--font-mono)",
                          marginTop: "2px",
                        }}
                      >
                        {signal.price.toLocaleString("en-GB", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 5,
                        })}
                        {signal.priceChangePct !== undefined && (
                          <span
                            style={{
                              marginLeft: "6px",
                              color:
                                signal.priceChangePct >= 0
                                  ? "var(--green)"
                                  : "var(--burgundy)",
                            }}
                          >
                            {signal.priceChangePct >= 0 ? "+" : ""}
                            {signal.priceChangePct.toFixed(2)}%
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </td>

                {/* Direction */}
                <td>
                  <DirectionBadge direction={signal.direction} />
                </td>

                {/* Conviction */}
                <td>
                  {isPublic && i >= 3 ? (
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.8125rem",
                        color: "var(--text-disabled)",
                        letterSpacing: "0.04em",
                      }}
                    >
                      ••
                    </span>
                  ) : (
                    <ScoreBar score={signal.convictionScore} />
                  )}
                </td>

                {/* Consensus */}
                <td>
                  {isPublic && i >= 3 ? (
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.8125rem",
                        color: "var(--text-disabled)",
                        letterSpacing: "0.04em",
                      }}
                    >
                      ••
                    </span>
                  ) : (
                    <ScoreBar score={signal.consensusScore} />
                  )}
                </td>

                {/* Risk Grade */}
                <td>
                  <RiskGradeBadge grade={signal.riskGrade} />
                </td>

                {/* Timeframe */}
                <td>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.8125rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {signal.timeframe}
                  </span>
                </td>

                {/* Session */}
                <td>
                  <span
                    style={{
                      fontSize: "0.8125rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    {signal.sessionContext}
                  </span>
                </td>

                {/* Timestamp */}
                <td>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.75rem",
                      color: "var(--text-disabled)",
                    }}
                  >
                    {getRelativeTime(signal.timestamp)}
                  </span>
                </td>

                {/* Action */}
                <td>
                  {isPublic ? (
                    <Link
                      href="/sign-up"
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--navy)",
                        fontWeight: 500,
                        textDecoration: "none",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {i >= 3 ? "Unlock →" : "View →"}
                    </Link>
                  ) : (
                    <Link
                      href={`/dashboard/${signal.instrument.toLowerCase().replace("/", "-")}`}
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--navy)",
                        fontWeight: 500,
                        textDecoration: "none",
                      }}
                    >
                      View →
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Public gate notice */}
      {isPublic && (
        <div
          style={{
            borderTop: "1px solid var(--border)",
            padding: "var(--space-4) var(--space-4)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "var(--bg-warm)",
          }}
        >
          <span
            style={{
              fontSize: "0.8125rem",
              color: "var(--text-muted)",
            }}
          >
            Showing 3 of {signals.length} active signals. Full access requires an account.
          </span>
          <Link
            href="/sign-up"
            style={{
              fontSize: "0.8125rem",
              fontWeight: 500,
              color: "var(--navy)",
              textDecoration: "none",
              letterSpacing: "0.02em",
            }}
          >
            Access Full Feed →
          </Link>
        </div>
      )}
    </div>
  );
}
