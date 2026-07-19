"use client";

// ============================================================
// components/signal-hub/CryptoIntelligenceHub.tsx
// Section D — Crypto Intelligence Hub
// BTC | ETH | SOL — on-chain, derivatives, social data
// ============================================================

import { useState, useEffect, useCallback, useRef } from "react";
import type {
  CryptoIntelligenceResponse,
  CryptoSymbol,
  SparklinePoint,
  DCSFactor,
} from "@/lib/crypto-intelligence-client";

const SYMBOLS: CryptoSymbol[] = ["BTC", "ETH", "SOL"];

const SYMBOL_COLOURS: Record<CryptoSymbol, string> = {
  BTC: "#f7931a",
  ETH: "#627eea",
  SOL: "#9945ff",
};

// ── Utility helpers ───────────────────────────────────────────

function fmt(n: number, decimals = 2) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
}

function fmtPrice(n: number) {
  if (n >= 1_000) return new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
  if (n >= 1) return fmt(n, 2);
  return fmt(n, 4);
}

function fmtCap(n: number) {
  if (n >= 1e12) return `$${fmt(n / 1e12, 2)}T`;
  if (n >= 1e9)  return `$${fmt(n / 1e9, 2)}B`;
  if (n >= 1e6)  return `$${fmt(n / 1e6, 2)}M`;
  return `$${fmt(n, 0)}`;
}

function fmtOI(n: number) {
  if (n >= 1e9) return `$${fmt(n / 1e9, 2)}B`;
  if (n >= 1e6) return `$${fmt(n / 1e6, 2)}M`;
  return `$${fmt(n, 0)}`;
}

function fmtFunding(n: number) {
  const sign = n >= 0 ? "+" : "";
  return `${sign}${fmt(n, 4)}%`;
}

// ── Sparkline SVG ─────────────────────────────────────────────

function Sparkline({
  points,
  colour,
  width = 240,
  height = 48,
}: {
  points: SparklinePoint[];
  colour: string;
  width?: number;
  height?: number;
}) {
  if (!points || points.length < 2) {
    return <div style={{ width, height, backgroundColor: "var(--bg-stone)", borderRadius: 2 }} />;
  }

  const prices = points.map((p) => p.price);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);
  const range = maxP - minP || 1;
  const pad = 2;

  const pathD = points
    .map((p, i) => {
      const x = pad + ((i / (points.length - 1)) * (width - pad * 2));
      const y = pad + ((1 - (p.price - minP) / range) * (height - pad * 2));
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  const firstPrice = prices[0];
  const lastPrice = prices[prices.length - 1];
  const isPositive = lastPrice >= firstPrice;
  const lineColour = isPositive ? "var(--green)" : "var(--burgundy)";

  // Area fill
  const firstX = pad;
  const lastX = pad + (width - pad * 2);
  const areaD = `${pathD} L ${lastX.toFixed(1)} ${height - pad} L ${firstX.toFixed(1)} ${height - pad} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      style={{ display: "block", overflow: "visible" }}
    >
      <defs>
        <linearGradient id={`spark-grad-${colour.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lineColour} stopOpacity="0.15" />
          <stop offset="100%" stopColor={lineColour} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={areaD}
        fill={`url(#spark-grad-${colour.replace("#", "")})`}
      />
      <path
        d={pathD}
        fill="none"
        stroke={lineColour}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ── Fear & Greed Gauge ────────────────────────────────────────

function FearGreedGauge({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value));

  // Map 0-100 → 180° arc (from left to right, semicircle)
  // The gauge goes from -180deg to 0deg (left = 0, right = 100)
  const angle = -180 + (clamped / 100) * 180;
  const rad = (angle * Math.PI) / 180;
  const cx = 80;
  const cy = 72;
  const r = 56;
  const needleX = cx + r * Math.cos(rad);
  const needleY = cy + r * Math.sin(rad);

  const getSegmentColour = (v: number) => {
    if (v <= 20) return "var(--burgundy)";
    if (v <= 40) return "#c07b3a";
    if (v <= 60) return "var(--amber)";
    if (v <= 80) return "var(--green-light)";
    return "var(--green)";
  };

  const zoneColour = getSegmentColour(clamped);
  const labels = [
    { text: "Extreme\nFear", x: 6, y: 72 },
    { text: "Fear", x: 18, y: 28 },
    { text: "Neutral", x: 70, y: 10 },
    { text: "Greed", x: 122, y: 28 },
    { text: "Extreme\nGreed", x: 130, y: 72 },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-2)" }}>
      <svg viewBox="0 0 160 88" width="100%" style={{ maxWidth: 200, display: "block" }}>
        {/* Background arc segments */}
        {[
          { start: -180, end: -144, colour: "var(--burgundy)", opacity: 0.25 },
          { start: -144, end: -108, colour: "#c07b3a", opacity: 0.25 },
          { start: -108, end: -72, colour: "var(--amber)", opacity: 0.25 },
          { start: -72, end: -36, colour: "var(--green-light)", opacity: 0.25 },
          { start: -36, end: 0, colour: "var(--green)", opacity: 0.25 },
        ].map((seg, i) => {
          const startRad = (seg.start * Math.PI) / 180;
          const endRad = (seg.end * Math.PI) / 180;
          const x1 = cx + r * Math.cos(startRad);
          const y1 = cy + r * Math.sin(startRad);
          const x2 = cx + r * Math.cos(endRad);
          const y2 = cy + r * Math.sin(endRad);
          return (
            <path
              key={i}
              d={`M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`}
              fill={seg.colour}
              opacity={seg.opacity}
            />
          );
        })}

        {/* Arc track */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="var(--border)"
          strokeWidth="6"
          strokeLinecap="round"
        />

        {/* Filled arc up to value */}
        {(() => {
          const endRad = (angle * Math.PI) / 180;
          const ex = cx + r * Math.cos(endRad);
          const ey = cy + r * Math.sin(endRad);
          const largeArc = clamped > 50 ? 1 : 0;
          return (
            <path
              d={`M ${cx - r} ${cy} A ${r} ${r} 0 ${largeArc} 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`}
              fill="none"
              stroke={zoneColour}
              strokeWidth="6"
              strokeLinecap="round"
              opacity={0.9}
            />
          );
        })()}

        {/* Needle */}
        <line
          x1={cx}
          y1={cy}
          x2={needleX.toFixed(2)}
          y2={needleY.toFixed(2)}
          stroke={zoneColour}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r="4" fill={zoneColour} />
      </svg>

      {/* Value & label */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: -4 }}>
        <span style={{
          fontSize: "1.5rem",
          fontWeight: 600,
          fontFamily: "var(--font-mono)",
          color: zoneColour,
          lineHeight: 1,
        }}>
          {clamped}
        </span>
        <span style={{
          fontSize: "0.6875rem",
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: zoneColour,
          marginTop: 2,
        }}>
          {getFearGreedLabel(clamped)}
        </span>
      </div>
    </div>
  );
}

function getFearGreedLabel(v: number) {
  if (v <= 20) return "Extreme Fear";
  if (v <= 40) return "Fear";
  if (v <= 60) return "Neutral";
  if (v <= 80) return "Greed";
  return "Extreme Greed";
}

// ── DCS Score Ring ────────────────────────────────────────────

function DCSRing({ score, direction }: { score: number; direction: string }) {
  const circumference = 2 * Math.PI * 42;
  const fillOffset = circumference - (score / 100) * circumference;
  const colour =
    score >= 60 ? "var(--green)" : score <= 40 ? "var(--burgundy)" : "var(--amber)";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-3)" }}>
      <div style={{ position: "relative", width: 100, height: 100 }}>
        <svg viewBox="0 0 100 100" width="100" height="100">
          <circle
            cx="50" cy="50" r="42"
            fill="none"
            stroke="var(--bg-stone)"
            strokeWidth="8"
          />
          <circle
            cx="50" cy="50" r="42"
            fill="none"
            stroke={colour}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={fillOffset}
            transform="rotate(-90 50 50)"
            style={{ transition: "stroke-dashoffset 0.6s var(--ease)" }}
          />
        </svg>
        <div style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <span style={{
            fontSize: "1.5rem",
            fontWeight: 600,
            fontFamily: "var(--font-mono)",
            color: colour,
            lineHeight: 1,
          }}>
            {score}
          </span>
          <span style={{
            fontSize: "0.5rem",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
            marginTop: 2,
          }}>
            DCS
          </span>
        </div>
      </div>
      <div style={{
        fontSize: "0.625rem",
        fontWeight: 700,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: colour,
      }}>
        {direction}
      </div>
    </div>
  );
}

// ── Factor Bar Chart ──────────────────────────────────────────

function FactorBar({ factor }: { factor: DCSFactor }) {
  const isPositive = factor.contribution > 0;
  const isNeutral = factor.contribution === 0;
  const fillWidth = Math.abs(factor.contribution / factor.max) * 100;
  const colour = isPositive
    ? "var(--green)"
    : isNeutral
    ? "var(--text-muted)"
    : "var(--burgundy)";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "var(--space-2) 0" }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "var(--space-3)",
      }}>
        <span style={{
          fontSize: "0.6875rem",
          fontWeight: 600,
          color: "var(--text-muted)",
          letterSpacing: "0.04em",
          whiteSpace: "nowrap",
        }}>
          {factor.name}
        </span>
        <span style={{
          fontSize: "0.6875rem",
          fontFamily: "var(--font-mono)",
          fontWeight: 600,
          color: colour,
          flexShrink: 0,
        }}>
          {factor.contribution > 0 ? "+" : ""}{factor.contribution}
        </span>
      </div>

      {/* Bar track */}
      <div style={{
        position: "relative",
        height: 4,
        backgroundColor: "var(--bg-stone)",
        borderRadius: 2,
        overflow: "hidden",
      }}>
        {/* Center line */}
        <div style={{
          position: "absolute",
          left: "50%",
          top: 0,
          width: 1,
          height: "100%",
          backgroundColor: "var(--border-strong)",
          transform: "translateX(-50%)",
        }} />
        {/* Fill */}
        <div style={{
          position: "absolute",
          top: 0,
          height: "100%",
          width: `${fillWidth / 2}%`,
          backgroundColor: colour,
          borderRadius: 2,
          left: isPositive ? "50%" : undefined,
          right: !isPositive && !isNeutral ? "50%" : undefined,
          transition: "width 0.4s var(--ease)",
        }} />
      </div>

      <span style={{
        fontSize: "0.5625rem",
        color: "var(--text-muted)",
        lineHeight: 1.4,
      }}>
        {factor.label}
      </span>
    </div>
  );
}

// ── Long/Short Ratio Bar ──────────────────────────────────────

function LongShortBar({ longRatio, shortRatio }: { longRatio: number; shortRatio: number }) {
  const longPct = Math.round(longRatio * 100);
  const shortPct = Math.round(shortRatio * 100);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: "0.6875rem", color: "var(--green)", fontWeight: 600, fontFamily: "var(--font-mono)" }}>
          {longPct}% Long
        </span>
        <span style={{ fontSize: "0.6875rem", color: "var(--burgundy)", fontWeight: 600, fontFamily: "var(--font-mono)" }}>
          {shortPct}% Short
        </span>
      </div>
      <div style={{
        height: 8,
        borderRadius: 4,
        overflow: "hidden",
        display: "flex",
        backgroundColor: "var(--bg-stone)",
      }}>
        <div style={{
          width: `${longPct}%`,
          backgroundColor: "var(--green)",
          transition: "width 0.4s var(--ease)",
        }} />
        <div style={{
          width: `${shortPct}%`,
          backgroundColor: "var(--burgundy)",
          transition: "width 0.4s var(--ease)",
        }} />
      </div>
    </div>
  );
}

// ── Panel Card ────────────────────────────────────────────────

function Panel({
  title,
  label,
  children,
}: {
  title: string;
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{
      backgroundColor: "var(--bg-warm)",
      border: "1px solid var(--border)",
      padding: "var(--space-5)",
      display: "flex",
      flexDirection: "column",
      gap: "var(--space-4)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{
          fontSize: "0.625rem",
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--text-muted)",
        }}>
          {title}
        </span>
        {label && (
          <span style={{
            fontSize: "0.5625rem",
            fontFamily: "var(--font-mono)",
            color: "var(--text-disabled)",
            letterSpacing: "0.05em",
          }}>
            {label}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

// ── Divider ───────────────────────────────────────────────────

function Divider() {
  return <div style={{ height: 1, backgroundColor: "var(--border)", margin: "var(--space-1) 0" }} />;
}

// ── Skeleton ──────────────────────────────────────────────────

function SkeletonPanel() {
  return (
    <div style={{
      backgroundColor: "var(--bg-warm)",
      border: "1px solid var(--border)",
      padding: "var(--space-5)",
      display: "flex",
      flexDirection: "column",
      gap: "var(--space-4)",
    }}>
      {[80, 48, 96, 64].map((w, i) => (
        <div
          key={i}
          className="skeleton"
          style={{ height: i === 0 ? 12 : 24, width: `${w}%`, borderRadius: 2 }}
        />
      ))}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────

export function CryptoIntelligenceHub() {
  const [activeSymbol, setActiveSymbol] = useState<CryptoSymbol>("BTC");
  const [data, setData] = useState<CryptoIntelligenceResponse | null>(null);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const refreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async (symbol: CryptoSymbol) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/crypto-intelligence?symbol=${symbol}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: CryptoIntelligenceResponse = await res.json();
      setData(json);
      setLastUpdated(new Date());
      // Cache the price for the tab badge
      setPrices((prev) => ({ ...prev, [symbol]: json.market.price }));
    } catch (err) {
      setError("Unable to fetch crypto intelligence data. Please try again.");
      console.error("[CryptoIntelligenceHub]", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch for all symbols' prices (for tab badges)
  useEffect(() => {
    SYMBOLS.forEach((s) => {
      fetch(`/api/crypto-intelligence?symbol=${s}`)
        .then((r) => r.json())
        .then((d: CryptoIntelligenceResponse) =>
          setPrices((prev) => ({ ...prev, [s]: d.market.price }))
        )
        .catch(() => {});
    });
  }, []);

  useEffect(() => {
    fetchData(activeSymbol);
    if (refreshRef.current) clearInterval(refreshRef.current);
    refreshRef.current = setInterval(() => fetchData(activeSymbol), 5 * 60 * 1000);
    return () => {
      if (refreshRef.current) clearInterval(refreshRef.current);
    };
  }, [activeSymbol, fetchData]);

  const d = data;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>

      {/* ── Instrument Tabs ──────────────────────────────────── */}
      <div style={{
        display: "flex",
        gap: "var(--space-2)",
        flexWrap: "wrap",
      }}>
        {SYMBOLS.map((sym) => {
          const isActive = activeSymbol === sym;
          const price = prices[sym];
          const accentColour = SYMBOL_COLOURS[sym];
          return (
            <button
              key={sym}
              onClick={() => setActiveSymbol(sym)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-3)",
                padding: "var(--space-3) var(--space-5)",
                backgroundColor: isActive ? "var(--bg-warm)" : "transparent",
                border: isActive
                  ? `1px solid var(--border-strong)`
                  : "1px solid transparent",
                borderTop: isActive ? `2px solid ${accentColour}` : "2px solid transparent",
                cursor: "pointer",
                transition: "all var(--duration-fast)",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2 }}>
                <span style={{
                  fontSize: "0.75rem",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 700,
                  color: isActive ? "var(--text-primary)" : "var(--text-muted)",
                  letterSpacing: "0.08em",
                }}>
                  {sym}
                </span>
                {price && (
                  <span style={{
                    fontSize: "0.625rem",
                    fontFamily: "var(--font-mono)",
                    color: isActive ? accentColour : "var(--text-muted)",
                    fontWeight: 500,
                  }}>
                    ${fmtPrice(price)}
                  </span>
                )}
              </div>
              {/* Coloured dot */}
              <div style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: isActive ? accentColour : "var(--bg-stone)",
                transition: "background-color var(--duration-fast)",
              }} />
            </button>
          );
        })}

        {/* Refresh info */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
          {lastUpdated && (
            <span style={{
              fontSize: "0.5625rem",
              fontFamily: "var(--font-mono)",
              color: "var(--text-disabled)",
              letterSpacing: "0.05em",
            }}>
              Updated {lastUpdated.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button
            onClick={() => fetchData(activeSymbol)}
            disabled={loading}
            style={{
              fontSize: "0.5625rem",
              fontFamily: "var(--font-mono)",
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: loading ? "var(--text-disabled)" : "var(--navy)",
              backgroundColor: "transparent",
              border: "1px solid var(--border)",
              padding: "4px 10px",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "LOADING…" : "REFRESH"}
          </button>
        </div>
      </div>

      {/* ── Extreme Funding Alert ────────────────────────────── */}
      {d?.extremeFunding && (
        <div style={{
          backgroundColor: "var(--amber-bg)",
          border: "1px solid var(--amber)",
          padding: "var(--space-3) var(--space-5)",
          display: "flex",
          alignItems: "center",
          gap: "var(--space-3)",
        }}>
          <span style={{ fontSize: "0.75rem", color: "var(--amber)" }}>⚠</span>
          <span style={{
            fontSize: "0.6875rem",
            fontWeight: 600,
            color: "var(--amber)",
            letterSpacing: "0.04em",
          }}>
            EXTREME FUNDING DETECTED
          </span>
          <span style={{ fontSize: "0.6875rem", color: "var(--text-secondary)" }}>
            Funding rate {fmtFunding(d.derivatives.fundingRate)} is outside normal bounds. Exercise elevated caution.
          </span>
        </div>
      )}

      {/* ── Error State ──────────────────────────────────────── */}
      {error && (
        <div style={{
          backgroundColor: "var(--burgundy-bg)",
          border: "1px solid var(--burgundy)",
          padding: "var(--space-4) var(--space-5)",
          color: "var(--burgundy)",
          fontSize: "0.8125rem",
        }}>
          {error}
        </div>
      )}

      {/* ── Hero + Panels ────────────────────────────────────── */}
      {loading && !d ? (
        // Loading skeleton
        <div style={{
          display: "grid",
          gridTemplateColumns: "auto 1fr 1fr 1fr",
          gap: "var(--space-4)",
          alignItems: "start",
        }}>
          <div className="skeleton" style={{ width: 120, height: 120, borderRadius: 60 }} />
          <SkeletonPanel />
          <SkeletonPanel />
          <SkeletonPanel />
        </div>
      ) : d ? (
        <div
          className="animate-fade-in"
          style={{
            display: "grid",
            gridTemplateColumns: "auto 1fr 1fr 1fr",
            gap: "var(--space-4)",
            alignItems: "start",
          }}
        >
          {/* Hero DCS */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "var(--space-5)",
            backgroundColor: "var(--bg-warm)",
            border: "1px solid var(--border)",
            borderTop: `2px solid ${SYMBOL_COLOURS[activeSymbol]}`,
            gap: "var(--space-4)",
            minWidth: 140,
            alignSelf: "stretch",
          }}>
            <span style={{
              fontSize: "0.5rem",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--text-muted)",
            }}>
              {activeSymbol} Crypto DCS
            </span>
            <DCSRing score={d.dcsScore} direction={d.direction} />
            <div style={{ textAlign: "center" }}>
              <div style={{
                display: "inline-block",
                padding: "2px 8px",
                backgroundColor: "var(--bg-stone)",
                fontSize: "0.5625rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
              }}>
                Risk Grade
              </div>
              <div style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                fontFamily: "var(--font-mono)",
                color:
                  d.riskGrade === "A+" || d.riskGrade === "A"
                    ? "var(--green)"
                    : d.riskGrade === "B"
                    ? "var(--amber)"
                    : "var(--burgundy)",
                marginTop: 4,
              }}>
                {d.riskGrade}
              </div>
            </div>
            {d.cached && (
              <span style={{
                fontSize: "0.5rem",
                color: "var(--text-disabled)",
                letterSpacing: "0.06em",
              }}>
                CACHED
              </span>
            )}
          </div>

          {/* Panel 1 — Price & Market */}
          <Panel title="Price & Market" label="CoinGecko">
            {/* Sparkline at top on mobile via CSS order, shown here */}
            <div style={{ marginBottom: "var(--space-1)", overflow: "hidden" }}>
              <Sparkline
                points={d.market.sparkline}
                colour={SYMBOL_COLOURS[activeSymbol]}
                width={220}
                height={44}
              />
            </div>

            <Divider />

            {/* Current price */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{
                fontSize: "0.5625rem",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
              }}>
                Current Price
              </span>
              <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-3)" }}>
                <span style={{
                  fontSize: "1.375rem",
                  fontWeight: 600,
                  fontFamily: "var(--font-mono)",
                  color: "var(--text-primary)",
                  letterSpacing: "-0.01em",
                }}>
                  ${fmtPrice(d.market.price)}
                </span>
                <span style={{
                  fontSize: "0.75rem",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 600,
                  color: d.market.change24h >= 0 ? "var(--green)" : "var(--burgundy)",
                }}>
                  {d.market.change24h >= 0 ? "+" : ""}{fmt(d.market.change24h, 2)}%
                </span>
              </div>
            </div>

            {/* Market cap */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)", fontWeight: 500 }}>
                Market Cap
              </span>
              <span style={{
                fontSize: "0.8125rem",
                fontFamily: "var(--font-mono)",
                fontWeight: 600,
                color: "var(--text-primary)",
              }}>
                {fmtCap(d.market.marketCap)}
              </span>
            </div>

            {/* BTC Dominance — only for BTC */}
            {activeSymbol === "BTC" && d.market.btcDominance !== null && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)", fontWeight: 500 }}>
                  BTC Dominance
                </span>
                <span style={{
                  fontSize: "0.8125rem",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 600,
                  color: SYMBOL_COLOURS.BTC,
                }}>
                  {fmt(d.market.btcDominance, 1)}%
                </span>
              </div>
            )}

            <Divider />

            {/* Fear & Greed gauge */}
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              <span style={{
                fontSize: "0.5625rem",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
              }}>
                Fear & Greed Index
              </span>
              <FearGreedGauge value={d.market.fearGreed.value} />
            </div>
          </Panel>

          {/* Panel 2 — Derivatives Intelligence */}
          <Panel title="Derivatives Intelligence" label="CoinGlass">
            {/* Funding Rate */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{
                fontSize: "0.5625rem",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
              }}>
                Funding Rate
              </span>
              <span style={{
                fontSize: "1.5rem",
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
                color:
                  d.derivatives.fundingRate > 0.01
                    ? "var(--green)"
                    : d.derivatives.fundingRate < -0.01
                    ? "var(--burgundy)"
                    : "var(--text-muted)",
                letterSpacing: "-0.01em",
              }}>
                {fmtFunding(d.derivatives.fundingRate)}
              </span>
              <span style={{
                fontSize: "0.6875rem",
                color: "var(--text-secondary)",
                lineHeight: 1.5,
                fontStyle: "italic",
              }}>
                {d.derivatives.fundingRateLabel}
              </span>
            </div>

            <Divider />

            {/* Open Interest */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{
                fontSize: "0.5625rem",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
              }}>
                Open Interest
              </span>
              <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-3)" }}>
                <span style={{
                  fontSize: "1.125rem",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                }}>
                  {fmtOI(d.derivatives.openInterest)}
                </span>
                <span style={{
                  fontSize: "0.75rem",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 600,
                  color:
                    d.derivatives.openInterestChange24h >= 0 ? "var(--green)" : "var(--burgundy)",
                }}>
                  {d.derivatives.openInterestChange24h >= 0 ? "+" : ""}
                  {fmt(d.derivatives.openInterestChange24h, 2)}%
                </span>
              </div>
              <span style={{ fontSize: "0.5625rem", color: "var(--text-disabled)" }}>
                24h change
              </span>
            </div>

            <Divider />

            {/* Long/Short Ratio */}
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              <span style={{
                fontSize: "0.5625rem",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
              }}>
                Long / Short Ratio
              </span>
              <LongShortBar
                longRatio={d.derivatives.longRatio}
                shortRatio={d.derivatives.shortRatio}
              />
            </div>

            {/* Attribution */}
            <div style={{
              marginTop: "auto",
              paddingTop: "var(--space-3)",
              borderTop: "1px solid var(--border)",
            }}>
              <span style={{
                fontSize: "0.5rem",
                color: "var(--text-disabled)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}>
                Data: CoinGlass Derivatives API
              </span>
            </div>
          </Panel>

          {/* Panel 3 — Signal Composite */}
          <Panel title="Signal Composite" label="DCS Breakdown">
            {/* Direction + grade summary */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "var(--space-3) var(--space-4)",
              backgroundColor: "var(--bg-stone)",
              border: "1px solid var(--border)",
            }}>
              <div style={{ display: "flex", flex: "column", gap: 2 }}>
                <div style={{
                  fontSize: "0.5625rem",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                }}>
                  Direction
                </div>
                <div style={{
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  color:
                    d.direction === "BULLISH"
                      ? "var(--green)"
                      : d.direction === "BEARISH"
                      ? "var(--burgundy)"
                      : "var(--text-muted)",
                  fontFamily: "var(--font-mono)",
                  marginTop: 2,
                }}>
                  {d.direction}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{
                  fontSize: "0.5625rem",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                }}>
                  Risk Grade
                </div>
                <div style={{
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  fontFamily: "var(--font-mono)",
                  color:
                    d.riskGrade === "A+" || d.riskGrade === "A"
                      ? "var(--green)"
                      : d.riskGrade === "B"
                      ? "var(--amber)"
                      : "var(--burgundy)",
                }}>
                  {d.riskGrade}
                </div>
              </div>
            </div>

            <Divider />

            {/* Factor bars */}
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
              <span style={{
                fontSize: "0.5625rem",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
              }}>
                Factor Contributions
              </span>
              {d.dcsFactors.map((factor) => (
                <FactorBar key={factor.name} factor={factor} />
              ))}
            </div>

            <Divider />

            {/* Raw score */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)", fontWeight: 500 }}>
                Composite DCS
              </span>
              <span style={{
                fontSize: "1rem",
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
                color:
                  d.dcsScore >= 60
                    ? "var(--green)"
                    : d.dcsScore <= 40
                    ? "var(--burgundy)"
                    : "var(--amber)",
              }}>
                {d.dcsScore} / 100
              </span>
            </div>

            {/* Scoring explanation */}
            <div style={{
              backgroundColor: "var(--bg-stone)",
              padding: "var(--space-3)",
              fontSize: "0.5625rem",
              color: "var(--text-muted)",
              lineHeight: 1.6,
              borderLeft: "2px solid var(--border-strong)",
            }}>
              DCS = ((factor sum + 7) / 14) × 100. Normalised from raw signals across price trend,
              funding rate, open interest dynamics, and market sentiment.
            </div>
          </Panel>
        </div>
      ) : null}

      {/* ── Mobile Responsive Styles ─────────────────────────── */}
      <style>{`
        @media (max-width: 900px) {
          .crypto-grid {
            grid-template-columns: 1fr !important;
          }
          .crypto-hero {
            flex-direction: row !important;
            min-width: unset !important;
            align-self: auto !important;
          }
        }
      `}</style>
    </div>
  );
}
