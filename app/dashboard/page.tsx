"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Copy, Star, Scan, Loader2, Circle, Zap, Crown, ChevronDown, ChevronUp } from "lucide-react";
import InstrumentGauge from "@/components/dashboard/InstrumentGauge";

// ─── Types ────────────────────────────────────────────────────

interface DashboardSignal {
  id: string;
  instrument: string;
  asset_class: string;
  timeframe: string;
  direction: "bullish" | "bearish" | "neutral";
  consensus_score: number;
  entry_price: number | null;
  stop_loss: number | null;
  target_1: number | null;
  target_2: number | null;
  rr_ratio: number | null;
  claude_direction: string | null;
  gpt_direction: string | null;
  grok_direction: string | null;
  catalyst_text: string | null;
  created_at: string;
}

type AssetFilter = "ALL" | "FOREX" | "INDICES" | "METALS" | "CRYPTO";
type ViewFilter = "ALL" | "WATCHLIST";
type TimeframeFilter = "ALL" | "15M" | "1H" | "4H" | "1D";
type BiasFilter = "ALL" | "bullish" | "bearish";


// ─── Helpers ─────────────────────────────────────────────────

function formatPrice(val: number | null, instrument: string): string {
  if (val === null) return "—";
  const isForex = ["EUR/USD","GBP/USD","USD/JPY","GBP/JPY","AUD/USD","USD/CAD"].some(f => instrument.includes(f.split("/")[0]) || instrument.includes(f.split("/")[1]));
  const isCrypto = instrument.includes("BTC") || instrument.includes("ETH") || instrument.includes("SOL");
  const dp = isCrypto ? 2 : isForex && val < 10 ? 5 : 2;
  return val.toLocaleString("en-GB", { minimumFractionDigits: dp, maximumFractionDigits: dp });
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return "Just now";
}

function dcsColour(score: number): string {
  if (score >= 80) return "var(--green)";
  if (score >= 60) return "var(--amber)";
  return "var(--burgundy)";
}

// ─── Market Session Strip ─────────────────────────────────────

function getSessionStatus() {
  const now = new Date();
  const utcH = now.getUTCHours();
  const utcM = now.getUTCMinutes();
  const t = utcH * 60 + utcM;
  return {
    tokyo:   t >= 0 && t < 540,     // 00:00–09:00 UTC
    london:  t >= 480 && t < 1020,  // 08:00–17:00 UTC
    newYork: t >= 780 && t < 1320,  // 13:00–22:00 UTC
  };
}

function SessionStrip() {
  const [sessions, setSessions] = useState(getSessionStatus());
  const [utcTime, setUtcTime] = useState("");

  useEffect(() => {
    const tick = () => {
      setSessions(getSessionStatus());
      const n = new Date();
      setUtcTime(
        n.toUTCString().slice(17, 25) + " UTC"
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const dot = (active: boolean) => (
    <span style={{
      display: "inline-block", width: 6, height: 6, borderRadius: "50%",
      backgroundColor: active ? "var(--green)" : "#555",
      marginRight: 5, verticalAlign: "middle",
    }} />
  );

  const SessionItem = ({ label, active }: { label: string; active: boolean }) => (
    <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.6875rem", fontFamily: "var(--font-mono)", color: active ? "#e0dfdb" : "#666", letterSpacing: "0.06em" }}>
      {dot(active)}{label}
    </span>
  );

  // Simple 24h timeline showing active sessions
  const timeline = () => {
    const segments = [
      { label: "TOK", start: 0, end: 9, colour: "#4ade80" },
      { label: "LON", start: 8, end: 17, colour: "#60a5fa" },
      { label: "NY",  start: 13, end: 22, colour: "#f97316" },
    ];
    const nowPct = ((new Date().getUTCHours() * 60 + new Date().getUTCMinutes()) / 1440) * 100;
    return (
      <div style={{ position: "relative", width: 180, height: 6, backgroundColor: "#222", overflow: "hidden" }}>
        {segments.map(s => (
          <div key={s.label} style={{
            position: "absolute", top: 0, bottom: 0,
            left: `${(s.start / 24) * 100}%`,
            width: `${((s.end - s.start) / 24) * 100}%`,
            backgroundColor: s.colour, opacity: 0.4,
          }} />
        ))}
        <div style={{ position: "absolute", top: 0, bottom: 0, left: `${nowPct}%`, width: 2, backgroundColor: "white", opacity: 0.9 }} />
      </div>
    );
  };

  return (
    <div style={{
      position: "fixed", bottom: 0, left: "var(--sidebar-width)", right: 0, zIndex: 40,
      height: 36, backgroundColor: "#0d0d0f", borderTop: "1px solid #222",
      display: "flex", alignItems: "center", paddingInline: "var(--space-8)", gap: "var(--space-8)",
    }}>
      <SessionItem label="TOKYO" active={sessions.tokyo} />
      <SessionItem label="LONDON" active={sessions.london} />
      <SessionItem label="NEW YORK" active={sessions.newYork} />
      <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>{timeline()}</div>
      <span style={{ fontSize: "0.6875rem", fontFamily: "var(--font-mono)", color: "#888", letterSpacing: "0.06em" }}>{utcTime}</span>
    </div>
  );
}

// ─── Status Bar ───────────────────────────────────────────────

function StatusBar({ onScan }: { onScan: (count: number) => void }) {
  const [scanning, setScanning] = useState(false);

  const handleScan = async () => {
    setScanning(true);
    try {
      const res = await fetch("/api/signal-scan", { method: "POST" });
      const data = await res.json();
      onScan(data.signals_found ?? 0);
    } catch {
      onScan(0);
    } finally {
      setScanning(false);
    }
  };

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "var(--space-3) var(--space-8)",
      borderBottom: "1px solid var(--border)",
      backgroundColor: "var(--bg-warm)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
        {/* Live scan pill */}
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "3px 10px", fontSize: "0.625rem", fontFamily: "var(--font-mono)",
          fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase",
          backgroundColor: "var(--text-primary)", color: "white",
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#4ade80", display: "inline-block", animation: "skeleton-pulse 2s ease-in-out infinite" }} />
          LIVE SCAN ACTIVE
        </span>
        {/* Tier pill */}
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "3px 10px", fontSize: "0.625rem", fontFamily: "var(--font-mono)",
          fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase",
          border: "1px solid var(--navy)", color: "var(--navy)",
        }}>
          <Crown size={9} />
          FLOOR ACCESS
        </span>
      </div>

      <button
        onClick={handleScan}
        disabled={scanning}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "6px 16px", fontSize: "0.75rem", fontFamily: "var(--font-mono)",
          fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
          backgroundColor: scanning ? "var(--text-secondary)" : "var(--navy)",
          color: "white", border: "none", cursor: scanning ? "not-allowed" : "pointer",
          transition: "background-color 150ms",
        }}
      >
        {scanning ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Scan size={12} />}
        {scanning ? "SCANNING..." : "SCAN MARKETS"}
      </button>

      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Market Sentiment Gauge ───────────────────────────────────

function MarketGauge() {
  // Simple SVG semi-circle gauge showing an aggregated sentiment
  const score = 72; // Out of 100
  const rotation = (score / 100) * 180 - 90; // -90 to +90
  
  return (
    <div style={{
      padding: "var(--space-6)",
      borderTop: "1px solid var(--border)",
      display: "flex", alignItems: "center", gap: "var(--space-10)",
    }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <h3 style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-primary)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
          Global Market Sentiment
        </h3>
        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0, maxWidth: 300 }}>
          Aggregated directional bias across all tracked instruments based on the Signal Centre AI consensus model.
        </p>
      </div>

      <div style={{ position: "relative", width: 160, height: 80, overflow: "hidden", display: "flex", justifyContent: "center" }}>
        {/* Background track */}
        <div style={{
          width: 160, height: 160, borderRadius: "50%",
          border: "12px solid var(--bg-stone)",
          position: "absolute", top: 0,
        }} />
        {/* Filled track (gradient/colour based on score) */}
        <div style={{
          width: 160, height: 160, borderRadius: "50%",
          border: "12px solid var(--green)",
          borderBottomColor: "transparent",
          borderRightColor: "transparent",
          position: "absolute", top: 0,
          transform: "rotate(45deg)", // Base fill
          clipPath: "polygon(0 0, 100% 0, 100% 50%, 0 50%)",
        }} />
        {/* Needle */}
        <div style={{
          position: "absolute", bottom: -4, left: "50%",
          width: 4, height: 60, backgroundColor: "var(--navy)",
          transformOrigin: "bottom center",
          transform: `translateX(-50%) rotate(${rotation}deg)`,
          borderRadius: 2,
        }} />
        {/* Centre dot */}
        <div style={{
          position: "absolute", bottom: -6, left: "50%", transform: "translateX(-50%)",
          width: 12, height: 12, borderRadius: "50%", backgroundColor: "var(--navy)",
        }} />
        {/* Score text */}
        <div style={{
          position: "absolute", bottom: 4, left: "50%", transform: "translateX(-50%)",
          fontSize: "1.25rem", fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--navy)",
          backgroundColor: "var(--bg-base)", padding: "0 8px",
        }}>
          {score}
        </div>
      </div>
      
      <div style={{ display: "flex", gap: "var(--space-6)" }}>
        <div>
          <div style={{ fontSize: "0.625rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Bullish Bias</div>
          <div style={{ fontSize: "1.125rem", fontFamily: "var(--font-mono)", color: "var(--green)", fontWeight: 600 }}>64%</div>
        </div>
        <div>
          <div style={{ fontSize: "0.625rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Bearish Bias</div>
          <div style={{ fontSize: "1.125rem", fontFamily: "var(--font-mono)", color: "var(--burgundy)", fontWeight: 600 }}>36%</div>
        </div>
      </div>
    </div>
  );
}

// ─── Signal Card ─────────────────────────────────────────────

function SignalCard({ signal, watchlisted, onWatchlist }: {
  signal: DashboardSignal;
  watchlisted: boolean;
  onWatchlist: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [copied, setCopied] = useState(false);
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const isBullish = signal.direction === "bullish";

  useEffect(() => {
    const fetchLivePrice = async () => {
      try {
        const cleanSymbol = signal.instrument.replace("/", "");
        const res = await fetch(`/api/market-data?symbol=${cleanSymbol}&type=quote`);
        const data = await res.json();
        if (data?.data?.price) {
          setLivePrice(data.data.price);
        }
      } catch (e) {
        console.error("Live price error", e);
      }
    };
    fetchLivePrice();
    const id = setInterval(fetchLivePrice, 30000); // Poll every 30s
    return () => clearInterval(id);
  }, [signal.instrument]);

  const borderColour = isBullish ? "var(--green)" : "var(--burgundy)";
  const headerBg = isBullish ? "rgba(47, 93, 80, 0.03)" : "rgba(91, 44, 44, 0.03)";

  const models = [
    { name: "CLAUDE", dir: signal.claude_direction, colour: "#d97706", bg: "#fef3c7" },
    { name: "GPT-4",  dir: signal.gpt_direction,   colour: "#0891b2", bg: "#e0f2fe" },
    { name: "GROK",   dir: signal.grok_direction,   colour: "#4f46e5", bg: "#ede9fe" },
  ];

  const handleCopy = async () => {
    const text = [
      `Signal Centre — ${signal.instrument} ${signal.direction.toUpperCase()}`,
      `Timeframe: ${signal.timeframe} | DCS: ${signal.consensus_score}`,
      `Entry: ${formatPrice(signal.entry_price, signal.instrument)}`,
      `Stop Loss: ${formatPrice(signal.stop_loss, signal.instrument)}`,
      `Target: ${formatPrice(signal.target_2, signal.instrument)}`,
      `R:R: 1 : ${signal.rr_ratio ?? "—"}`,
      signal.catalyst_text ? `\nCatalyst: ${signal.catalyst_text}` : "",
    ].join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      border: "1px solid var(--border)",
      borderLeft: `2px solid ${borderColour}`,
      backgroundColor: "var(--bg-base)",
      display: "flex", flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{ padding: "var(--space-4)", backgroundColor: headerBg, borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <span style={{ fontSize: "1.0625rem", fontWeight: 600, fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
              {signal.instrument}
            </span>
            <span style={{
              fontSize: "0.5625rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
              padding: "2px 6px", border: "1px solid var(--border)", color: "var(--text-muted)",
              fontFamily: "var(--font-mono)",
            }}>
              {signal.timeframe}
            </span>
          </div>
          <span style={{
            fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
            padding: "3px 8px",
            backgroundColor: isBullish ? "var(--green)" : "var(--burgundy)",
            color: "white",
          }}>
            {signal.direction.toUpperCase()}
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>{relativeTime(signal.created_at)}</span>
          <span style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", fontWeight: 600, color: dcsColour(signal.consensus_score) }}>
            DCS {signal.consensus_score}%
          </span>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-2)", borderBottom: "1px solid var(--border)" }}>
        {[
          { label: "Live Price", val: livePrice !== null ? formatPrice(livePrice, signal.instrument) : "Loading...", colour: "var(--text-primary)" },
          { label: "Entry Price", val: formatPrice(signal.entry_price, signal.instrument), colour: "var(--text-muted)" },
          { label: "Stop Loss",   val: formatPrice(signal.stop_loss, signal.instrument),   colour: "var(--burgundy)" },
          { label: "Target (TP)", val: formatPrice(signal.target_2, signal.instrument),    colour: "var(--green)" },
        ].map(row => (
          <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{row.label}</span>
            <span style={{ fontSize: "0.8125rem", fontFamily: "var(--font-mono)", color: row.colour }}>{row.val}</span>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "var(--space-1)", borderTop: "1px solid var(--border)" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>R:R Ratio</span>
          <span style={{ fontSize: "0.8125rem", fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--text-primary)" }}>
            1 : {signal.rr_ratio ?? "—"}
          </span>
        </div>
      </div>

      {/* AI Alignment */}
      <div style={{ padding: "var(--space-3) var(--space-4)", borderBottom: "1px solid var(--border)" }}>
        <button
          onClick={() => setExpanded(e => !e)}
          style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: expanded ? "var(--space-2)" : 0 }}
        >
          <span style={{ fontSize: "0.5625rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>AI ALIGNMENT</span>
          {expanded ? <ChevronUp size={12} color="var(--text-muted)" /> : <ChevronDown size={12} color="var(--text-muted)" />}
        </button>
        {expanded && (
          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            {models.map(m => {
              const agrees = m.dir === signal.direction;
              return (
                <span key={m.name} style={{
                  fontSize: "0.5625rem", fontFamily: "var(--font-mono)", fontWeight: 700,
                  padding: "2px 7px",
                  backgroundColor: agrees ? m.bg : "var(--burgundy-bg)",
                  color: agrees ? m.colour : "var(--burgundy)",
                  letterSpacing: "0.06em", textDecoration: agrees ? "none" : "line-through",
                  opacity: agrees ? 1 : 0.7,
                }}>
                  {m.name} {agrees ? "✓" : "✗"}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Catalyst */}
      {signal.catalyst_text && (
        <div style={{ padding: "var(--space-3) var(--space-4)", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-1)" }}>
            <span style={{ fontSize: "0.5625rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>CATALYST</span>
          </div>
          <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>
            {signal.catalyst_text}
          </p>
        </div>
      )}

      {/* Footer */}
      <div style={{ padding: "var(--space-3) var(--space-4)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
          <button onClick={handleCopy} title="Copy signal" style={{ background: "none", border: "none", cursor: "pointer", color: copied ? "var(--green)" : "var(--text-muted)", padding: 0 }}>
            <Copy size={14} />
          </button>
          <button onClick={() => onWatchlist(signal.id)} title="Add to watchlist" style={{ background: "none", border: "none", cursor: "pointer", color: watchlisted ? "var(--amber)" : "var(--text-muted)", padding: 0 }}>
            <Star size={14} fill={watchlisted ? "var(--amber)" : "none"} />
          </button>
        </div>
        <Link href={`/dashboard/signals/${signal.id}`} style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--navy)", textDecoration: "none", letterSpacing: "0.02em" }}>
          FULL ANALYSIS →
        </Link>
      </div>
    </div>
  );
}

// ─── Skeleton Card ────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div style={{ border: "1px solid var(--border)", borderLeft: "2px solid var(--border)" }}>
      {[80, 40, 120].map((h, i) => (
        <div key={i} style={{ padding: "var(--space-4)", borderBottom: "1px solid var(--border)" }}>
          <div style={{ height: h, backgroundColor: "var(--bg-stone)", animation: "skeleton-pulse 1.5s ease-in-out infinite" }} />
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────

export default function DashboardPage() {
  const [signals, setSignals] = useState<DashboardSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  // Filters
  const [assetFilter, setAssetFilter] = useState<AssetFilter>("ALL");
  const [viewFilter, setViewFilter] = useState<ViewFilter>("ALL");
  const [tfFilter, setTfFilter] = useState<TimeframeFilter>("ALL");
  const [biasFilter, setBiasFilter] = useState<BiasFilter>("ALL");

  // Watchlist (client-side state, persisted to Supabase on toggle)
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // Load signals
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Fetch from the real signals API
        const res = await fetch("/api/signals").catch(() => null);
        if (res?.ok) {
          const data = await res.json();
          setSignals(data.signals || []);
        } else {
          setSignals([]);
        }
      } catch {
        setSignals([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Watchlist toggle
  const toggleWatchlist = useCallback((id: string) => {
    setWatchlist(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Scan handler
  const handleScanComplete = async (count: number) => {
    showToast(`Scan complete — ${count} new signal${count !== 1 ? "s" : ""} found`);
    // Refresh signals from real API
    try {
      const res = await fetch("/api/signals").catch(() => null);
      if (res?.ok) {
        const data = await res.json();
        setSignals(data.signals || []);
      }
    } catch {}
  };

  // Client-side filtering
  const filtered = signals.filter(s => {
    if (assetFilter !== "ALL") {
      const map: Record<AssetFilter, string[]> = {
        ALL: [], FOREX: ["forex"], INDICES: ["indices"],
        METALS: ["commodities", "metals"], CRYPTO: ["crypto"],
      };
      if (!map[assetFilter].includes(s.asset_class)) return false;
    }
    if (viewFilter === "WATCHLIST" && !watchlist.has(s.id)) return false;
    if (tfFilter !== "ALL" && s.timeframe !== tfFilter) return false;
    if (biasFilter !== "ALL" && s.direction !== biasFilter) return false;
    return true;
  });

  const PillFilter = <T extends string>({
    value, options, onChange, size = "normal",
  }: { value: T; options: { label: string; value: T }[]; onChange: (v: T) => void; size?: "normal" | "small" }) =>
    options.map(opt => (
      <button
        key={opt.value}
        onClick={() => onChange(opt.value)}
        style={{
          padding: size === "small" ? "3px 10px" : "5px 14px",
          fontSize: size === "small" ? "0.625rem" : "0.6875rem",
          fontFamily: "var(--font-mono)", fontWeight: 600, letterSpacing: "0.08em",
          textTransform: "uppercase", cursor: "pointer", border: "1px solid",
          borderColor: value === opt.value ? "var(--navy)" : "var(--border)",
          backgroundColor: value === opt.value ? "var(--navy)" : "transparent",
          color: value === opt.value ? "white" : "var(--text-muted)",
          transition: "all 100ms",
        }}
      >
        {opt.label}
      </button>
    ));

  return (
    <>
      <div style={{ paddingBottom: 36 /* session strip */ }}>

        {/* Section 1: Status Bar */}
        <StatusBar onScan={handleScanComplete} />

        <div style={{ padding: "var(--space-6) var(--space-8)", display: "flex", flexDirection: "column", gap: "var(--space-8)" }}>

          {/* Section 2: Instrument Gauge */}
          <InstrumentGauge />

          {/* Section 3: Filter Bar */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            {/* Row 1 */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", gap: "var(--space-2)" }}>
                {PillFilter({
                  value: assetFilter,
                  options: [
                    { label: "All Setups", value: "ALL" },
                    { label: "Forex", value: "FOREX" },
                    { label: "Indices", value: "INDICES" },
                    { label: "Metals", value: "METALS" },
                    { label: "Crypto", value: "CRYPTO" },
                  ],
                  onChange: setAssetFilter,
                })}
              </div>
              <div style={{ display: "flex", gap: "var(--space-2)" }}>
                {PillFilter({
                  value: viewFilter,
                  options: [
                    { label: "All Signals", value: "ALL" },
                    { label: `☆ Watchlist (${watchlist.size})`, value: "WATCHLIST" },
                  ],
                  onChange: setViewFilter,
                })}
              </div>
            </div>
            {/* Row 2 */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                <span style={{ fontSize: "0.625rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)", letterSpacing: "0.08em", textTransform: "uppercase", marginRight: 4 }}>Timeframe:</span>
                {PillFilter({ value: tfFilter, options: [
                  { label: "ALL", value: "ALL" }, { label: "15M", value: "15M" },
                  { label: "1H", value: "1H" }, { label: "4H", value: "4H" }, { label: "1D", value: "1D" },
                ], onChange: setTfFilter, size: "small" })}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                <span style={{ fontSize: "0.625rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)", letterSpacing: "0.08em", textTransform: "uppercase", marginRight: 4 }}>Bias:</span>
                {PillFilter({ value: biasFilter, options: [
                  { label: "ALL", value: "ALL" }, { label: "Bullish", value: "bullish" }, { label: "Bearish", value: "bearish" },
                ], onChange: setBiasFilter, size: "small" })}
              </div>
            </div>
          </div>

          {/* Section 4: Signal Cards Grid */}
          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--space-4)" }}>
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "var(--space-20) 0", gap: "var(--space-4)" }}>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9375rem", textAlign: "center", maxWidth: 380 }}>
                No active signals match your current filter. Try adjusting the timeframe or asset class.
              </p>
              <button
                onClick={() => { setAssetFilter("ALL"); setTfFilter("ALL"); setBiasFilter("ALL"); setViewFilter("ALL"); }}
                style={{ padding: "8px 20px", fontSize: "0.8125rem", backgroundColor: "var(--navy)", color: "white", border: "none", cursor: "pointer" }}
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "var(--space-4)",
            }}>
              {filtered.map(s => (
                <SignalCard
                  key={s.id}
                  signal={s}
                  watchlisted={watchlist.has(s.id)}
                  onWatchlist={toggleWatchlist}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Section 5: Session Strip */}
      <SessionStrip />

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 52, right: "var(--space-8)", zIndex: 100,
          padding: "10px 18px", backgroundColor: "var(--text-primary)", color: "white",
          fontSize: "0.8125rem", fontFamily: "var(--font-sans)",
          animation: "fade-in 200ms ease both",
          boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
        }}>
          {toast}
        </div>
      )}

      {/* Responsive grid */}
      <style>{`
        @media (max-width: 1024px) {
          .signal-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 640px) {
          .signal-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
}
