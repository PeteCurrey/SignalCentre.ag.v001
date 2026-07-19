"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

// Types
type FactorSignal = { value: string | number; signal: number; label: string };
type GaugeData = {
  symbol: string;
  price: string;
  change: string;
  change_pct: string;
  rsi: string;
  ema50: string;
  trend: string;
  session: string;
  bias_pct: number;
  direction: "BULLISH" | "BEARISH";
  factors: Record<string, FactorSignal>;
  news: Array<{ source: string; headline: string; url: string; time: string }>;
  computed_at: string;
};

// Factor dot positions (angle from 0=right to 180=left)
const FACTORS = [
  { name: "RSI", angle: 160 },
  { name: "EMA", angle: 135 },
  { name: "COT", angle: 110 },
  { name: "VOL", angle: 90 },
  { name: "NEWS", angle: 70 },
  { name: "ORDER FLOW", angle: 45 },
  { name: "MACRO", angle: 20 }
];

export default function InstrumentGauge() {
  const [data, setData] = useState<GaugeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [symbol, setSymbol] = useState("XAUUSD");
  const [animatedScore, setAnimatedScore] = useState(0);
  
  const [hoveredFactor, setHoveredFactor] = useState<{name: string, x: number, y: number} | null>(null);

  const fetchGaugeData = async (sym: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/instrument-gauge?symbol=${sym}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error("Failed to fetch gauge data", e);
    } finally {
      setLoading(false);
    }
  };

  // Mount & poll
  useEffect(() => {
    fetchGaugeData(symbol);
    const interval = setInterval(() => fetchGaugeData(symbol), 60000);
    return () => clearInterval(interval);
  }, [symbol]);

  // Animate score count
  useEffect(() => {
    if (!data) return;
    const target = data.bias_pct;
    const duration = 600;
    const startValue = animatedScore;
    const startTime = performance.now();

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutQuart
      const ease = 1 - Math.pow(1 - progress, 4);
      setAnimatedScore(Math.round(startValue + (target - startValue) * ease));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [data?.bias_pct]);

  if (!data && !loading) return null;

  const isBullish = data?.direction === "BULLISH";
  const brandColor = isBullish ? "#639922" : "#E24B4A";
  
  // Needle Angle
  const needleAngleDeg = data ? 180 - (data.bias_pct / 100) * 180 : 90;
  const needleRad = (needleAngleDeg * Math.PI) / 180;
  const needleX = 210 + 150 * Math.cos(needleRad);
  const needleY = 220 - 150 * Math.sin(needleRad);

  return (
    <div style={{
      backgroundColor: "#fff",
      border: "0.5px solid var(--border)",
      borderRadius: "12px",
      padding: "2rem 2.5rem",
      display: "flex",
      flexDirection: "row",
      gap: "2rem",
      width: "100%",
      fontFamily: "var(--font-sans)",
      color: "var(--text-primary)",
      marginBottom: "2rem",
      position: "relative"
    }}>
      {/* LEFT COLUMN: Instrument Data (~35%) */}
      <div style={{ flex: "0 0 35%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        
        <div>
          <select 
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "1rem",
              fontWeight: 700,
              border: "1px solid var(--border)",
              padding: "0.25rem 0.5rem",
              backgroundColor: "transparent",
              outline: "none",
              marginBottom: "1rem"
            }}
          >
            <option value="XAUUSD">XAU/USD</option>
            <option value="EURUSD">EUR/USD</option>
            <option value="GBPJPY">GBP/JPY</option>
            <option value="BTCUSD">BTC/USD</option>
          </select>

          {data ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <div style={{ fontSize: "2.5rem", fontFamily: "var(--font-mono)", fontWeight: 700, lineHeight: 1 }}>
                  {data.price}
                </div>
                <div style={{ 
                  fontSize: "1rem", 
                  fontFamily: "var(--font-mono)", 
                  color: parseFloat(data.change) >= 0 ? "#639922" : "#E24B4A",
                  marginTop: "0.5rem"
                }}>
                  {parseFloat(data.change) > 0 ? "+" : ""}{data.change} ({data.change_pct})
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "1rem" }}>
                <div>RSI (14): <span style={{ color: "var(--text-primary)" }}>{data.rsi}</span></div>
                <div>TREND: &nbsp;&nbsp;<span style={{ color: data.trend === "ABOVE" ? "#639922" : "#E24B4A" }}>{data.trend} EMA</span></div>
                <div>SESSION: <span style={{ color: "var(--text-primary)" }}>{data.session}</span></div>
              </div>
            </div>
          ) : (
            <div style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Loading market data...</div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.6875rem", color: "var(--text-muted)" }}>
          <div style={{
            width: 8, height: 8, borderRadius: "50%",
            backgroundColor: loading ? "#e5e5e5" : "#639922",
            animation: loading ? "none" : "pulse 2s infinite"
          }} />
          Terminal Connected
        </div>
      </div>

      {/* RIGHT COLUMN: Gauge & Live Feed (~65%) */}
      <div style={{ flex: "1", display: "flex", gap: "1.5rem" }}>
        
        {/* SVG Gauge */}
        <div style={{ position: "relative", width: 420, height: 240 }}>
          <svg width="420" height="240" viewBox="0 0 420 240" style={{ overflow: "visible" }}>
            <defs>
              <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Background Track */}
            <path 
              d="M 40 220 A 170 170 0 0 1 380 220" 
              fill="none" 
              stroke="var(--border)" 
              strokeWidth="2" 
            />

            {/* Filled Arc */}
            {data && (
              isBullish ? (
                <path 
                  d="M 40 220 A 170 170 0 0 1 380 220" 
                  fill="none" 
                  stroke={brandColor} 
                  strokeWidth="3" 
                  strokeLinecap="round"
                  pathLength="100"
                  strokeDasharray={`${data.bias_pct} 100`}
                  filter="url(#gaugeGlow)"
                  style={{ transition: "stroke-dasharray 0.6s ease-out" }}
                />
              ) : (
                <path 
                  d="M 380 220 A 170 170 0 0 0 40 220" 
                  fill="none" 
                  stroke={brandColor} 
                  strokeWidth="3" 
                  strokeLinecap="round"
                  pathLength="100"
                  strokeDasharray={`${100 - data.bias_pct} 100`}
                  filter="url(#gaugeGlow)"
                  style={{ transition: "stroke-dasharray 0.6s ease-out" }}
                />
              )
            )}

            {/* Needle */}
            {data && (
              <g style={{ transition: "transform 0.6s ease-out", transformOrigin: "210px 220px" }}>
                <line 
                  x1="210" y1="220" 
                  x2={needleX} y2={needleY} 
                  stroke="var(--text-primary)" 
                  strokeWidth="1.5" 
                />
                <circle cx="210" cy="220" r="5" fill="var(--text-primary)" />
              </g>
            )}

            {/* Centre Text */}
            {data && (
              <g>
                <text 
                  x="210" y="190" 
                  textAnchor="middle" 
                  fill={brandColor}
                  style={{ fontSize: "52px", fontWeight: 500, fontFamily: "var(--font-mono)" }}
                >
                  {animatedScore}%
                </text>
                <text 
                  x="210" y="210" 
                  textAnchor="middle" 
                  fill={brandColor}
                  style={{ fontSize: "11px", letterSpacing: "0.08em" }}
                >
                  {isBullish ? "BULLISH BIAS" : "BEARISH BIAS"}
                </text>
              </g>
            )}

            {/* Factor Dots */}
            {data && FACTORS.map((f, i) => {
              const rad = (f.angle * Math.PI) / 180;
              const cx = 210 + 170 * Math.cos(rad);
              const cy = 220 - 170 * Math.sin(rad);
              
              const lx = 210 + 192 * Math.cos(rad);
              const ly = 220 - 192 * Math.sin(rad);
              
              const factorData = data.factors[f.name.replace(" ", "_")];
              if (!factorData) return null;

              const isDotBullish = factorData.signal === 1;
              const isDotBearish = factorData.signal === -1;
              const dotFill = isDotBullish ? "#639922" : isDotBearish ? "#E24B4A" : "#888";
              const dotOpacity = isDotBullish || isDotBearish ? 0.9 : 0.5;

              // text anchor logic
              let anchor: "start" | "middle" | "end" = "start";
              if (f.angle > 100) anchor = "end";
              else if (f.angle >= 80 && f.angle <= 100) anchor = "middle";

              return (
                <g 
                  key={f.name} 
                  style={{ 
                    animation: `fadeIn 0.3s ease forwards ${i * 0.08}s`, 
                    opacity: 0,
                    cursor: "pointer"
                  }}
                  onMouseEnter={() => setHoveredFactor({ name: f.name, x: cx, y: cy })}
                  onMouseLeave={() => setHoveredFactor(null)}
                >
                  <circle cx={cx} cy={cy} r="6" fill={dotFill} opacity={dotOpacity} />
                  <text 
                    x={lx} y={ly} 
                    textAnchor={anchor} 
                    alignmentBaseline="middle"
                    fill="var(--text-muted)"
                    style={{ fontSize: "10px" }}
                  >
                    {f.name}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Factor Tooltip */}
          {hoveredFactor && data && (
            <div style={{
              position: "absolute",
              left: hoveredFactor.x + 10,
              top: hoveredFactor.y - 10,
              backgroundColor: "var(--bg-base)",
              border: "1px solid var(--border)",
              padding: "0.5rem",
              fontSize: "0.6875rem",
              color: "var(--text-primary)",
              pointerEvents: "none",
              zIndex: 10,
              minWidth: 150,
              boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
            }}>
              <div style={{ fontWeight: 700, marginBottom: "0.25rem" }}>{hoveredFactor.name}</div>
              <div style={{ color: "var(--text-secondary)" }}>
                {data.factors[hoveredFactor.name.replace(" ", "_")]?.label}
              </div>
            </div>
          )}
        </div>

        {/* Live Feed Panel */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", borderLeft: "1px solid var(--border)", paddingLeft: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <span style={{ fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.1em", color: "var(--text-muted)" }}>LIVE FEED</span>
            {data && (
              <span style={{ fontSize: "0.5625rem", padding: "2px 6px", backgroundColor: "var(--bg-stone)", borderRadius: 12, color: "var(--text-muted)" }}>
                {Math.max(1, Math.floor((new Date().getTime() - new Date(data.computed_at).getTime()) / 60000))}M
              </span>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", flex: 1 }}>
            {data?.news.map((item, i) => (
              <div key={i} style={{ borderBottom: i < data.news.length - 1 ? "1px solid var(--border)" : "none", paddingBottom: i < data.news.length - 1 ? "0.75rem" : 0 }}>
                <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                  <div style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.125rem" }}>{item.source}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.4 }}>
                    {item.headline}
                  </div>
                  <div style={{ fontSize: "0.625rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>{item.time}</div>
                </a>
              </div>
            ))}
          </div>

          <Link href={`/dashboard/signals/${data?.symbol}`} style={{
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
            fontSize: "0.6875rem",
            fontWeight: 700,
            letterSpacing: "0.05em",
            color: "var(--text-primary)",
            textDecoration: "none",
            marginTop: "auto",
            alignSelf: "flex-end"
          }}>
            FULL ANALYSIS <ArrowRight size={14} />
          </Link>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          to { opacity: 1; }
        }
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(99, 153, 34, 0.4); }
          70% { box-shadow: 0 0 0 6px rgba(99, 153, 34, 0); }
          100% { box-shadow: 0 0 0 0 rgba(99, 153, 34, 0); }
        }
      `}} />
    </div>
  );
}
