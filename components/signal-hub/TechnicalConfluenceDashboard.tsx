"use client";

// ============================================================
// components/signal-hub/TechnicalConfluenceDashboard.tsx
// Section C — Technical Confluence Dashboard
// ============================================================

import { useState, useEffect, useCallback } from "react";
import type { ConfluenceResponse, TimeframeConfluence } from "@/lib/taapi-client";
import { getDirectionLabel } from "@/lib/utils";

// Instrument List for Dropdown
const INSTRUMENTS = [
  "EURUSD", "GBPUSD", "USDJPY", "USDCHF", "AUDUSD", "GBPJPY",
  "XAUUSD", "XAGUSD", "USOIL",
  "US30", "NAS100", "SPX500", "UK100", "GER40",
  "BTCUSD", "ETHUSD", "SOLUSD", "BNBUSD",
];

export function TechnicalConfluenceDashboard() {
  const [symbol, setSymbol] = useState(INSTRUMENTS[0]);
  const [data, setData] = useState<ConfluenceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(60);
  const [copySuccess, setCopySuccess] = useState(false);

  const fetchData = useCallback(async (targetSymbol: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/technical-confluence?symbol=${targetSymbol}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setCountdown(60);
    }
  }, []);

  useEffect(() => {
    fetchData(symbol);
  }, [symbol, fetchData]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          fetchData(symbol);
          return 60;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [symbol, fetchData]);

  const handleCopy = () => {
    if (!data) return;
    
    let text = `Technical Confluence: ${symbol}\n\n`;
    data.timeframes.forEach(tf => {
      text += `[${tf.timeframe.toUpperCase()}] ${tf.scorePct}% ${getDirectionLabel(tf.overallSignal).toUpperCase()}\n`;
      tf.indicators.forEach(i => {
        const sigIcon = i.signal === "bullish" ? "🟢" : i.signal === "bearish" ? "🔴" : "🟡";
        text += `  • ${i.name}: ${i.value} ${sigIcon}\n`;
      });
      text += "\n";
    });
    text += `Alignment: ${data.overallAlignment.aligned ? "STRONG" : "MIXED"} (${data.overallAlignment.bullish} Bullish, ${data.overallAlignment.bearish} Bearish)\n`;
    
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  const getSignalColor = (sig: string) => {
    if (sig === "bullish") return "var(--green)";
    if (sig === "bearish") return "var(--burgundy)";
    return "var(--amber)";
  };

  const getSignalBg = (sig: string) => {
    if (sig === "bullish") return "var(--green-bg)";
    if (sig === "bearish") return "var(--burgundy-bg)";
    return "var(--amber-bg)";
  };

  const getSignalIcon = (sig: string) => {
    if (sig === "bullish") return "↑";
    if (sig === "bearish") return "↓";
    return "→";
  };

  return (
    <div style={{
      maxWidth: "var(--max-width)",
      margin: "0 auto",
    }}>
      {/* ── Toolbar ────────────────────────────────────────── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid var(--border)",
        paddingBottom: "var(--space-4)",
        marginBottom: "var(--space-8)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            style={{
              padding: "8px 16px",
              fontSize: "0.875rem",
              fontFamily: "var(--font-mono)",
              fontWeight: 600,
              color: "var(--text-primary)",
              backgroundColor: "var(--bg-warm)",
              border: "1px solid var(--border-strong)",
              borderRadius: 2,
              cursor: "pointer",
              outline: "none",
            }}
          >
            {INSTRUMENTS.map((inst) => (
              <option key={inst} value={inst}>{inst}</option>
            ))}
          </select>

          <div style={{
            fontSize: "0.6875rem",
            fontFamily: "var(--font-mono)",
            color: "var(--text-muted)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}>
            Auto-refresh in {countdown}s
          </div>
        </div>

        <button
          onClick={handleCopy}
          disabled={!data || loading}
          style={{
            padding: "8px 16px",
            fontSize: "0.75rem",
            fontFamily: "var(--font-mono)",
            fontWeight: 600,
            color: copySuccess ? "var(--green)" : "var(--navy)",
            backgroundColor: "transparent",
            border: `1px solid ${copySuccess ? "var(--green)" : "var(--border-strong)"}`,
            borderRadius: 2,
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all var(--duration-fast)",
            opacity: loading ? 0.5 : 1,
          }}
        >
          {copySuccess ? "COPIED ✓" : "COPY TO CLIPBOARD"}
        </button>
      </div>

      {/* ── Main Grid ──────────────────────────────────────── */}
      {loading || !data ? (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "var(--space-6)",
        }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ border: "1px solid var(--border)", padding: "var(--space-6)" }}>
              <div className="skeleton" style={{ height: 20, width: "60%", marginBottom: "var(--space-4)" }} />
              <div className="skeleton" style={{ height: 6, width: "100%", marginBottom: "var(--space-8)" }} />
              {Array.from({ length: 7 }).map((_, j) => (
                <div key={j} className="skeleton" style={{ height: 16, width: "100%", marginBottom: "var(--space-3)" }} />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "var(--space-6)",
          marginBottom: "var(--space-8)",
        }}>
          {data.timeframes.map((tf) => (
            <div key={tf.timeframe} style={{
              border: "1px solid var(--border)",
              backgroundColor: "var(--bg-base)",
            }}>
              {/* TF Header */}
              <div style={{
                padding: "var(--space-5)",
                borderBottom: "1px solid var(--border)",
                backgroundColor: "var(--bg-warm)",
              }}>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "var(--space-3)",
                }}>
                  <div style={{
                    fontSize: "1.125rem",
                    fontWeight: 600,
                    fontFamily: "var(--font-mono)",
                    color: "var(--text-primary)",
                    textTransform: "uppercase",
                  }}>
                    {tf.timeframe}
                  </div>
                  <div style={{
                    fontSize: "0.6875rem",
                    fontWeight: 700,
                    fontFamily: "var(--font-mono)",
                    color: getSignalColor(tf.overallSignal),
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    padding: "2px 8px",
                    backgroundColor: getSignalBg(tf.overallSignal),
                    border: `1px solid ${getSignalColor(tf.overallSignal)}33`,
                  }}>
                    {tf.scorePct}% {getDirectionLabel(tf.overallSignal)}
                  </div>
                </div>

                {/* Score Bar */}
                <div style={{
                  height: 4,
                  backgroundColor: "var(--bg-stone)",
                  width: "100%",
                  overflow: "hidden",
                }}>
                  <div style={{
                    height: "100%",
                    width: `${tf.scorePct}%`,
                    backgroundColor: getSignalColor(tf.overallSignal),
                    transition: "width 1s var(--ease)",
                  }} />
                </div>
              </div>

              {/* Indicators */}
              <div style={{ padding: "var(--space-2) 0" }}>
                {tf.indicators.map((ind, idx) => (
                  <div key={idx} style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "var(--space-3) var(--space-5)",
                    borderBottom: idx !== tf.indicators.length - 1 ? "1px solid var(--bg-stone)" : "none",
                  }}>
                    <div style={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      fontFamily: "var(--font-mono)",
                      color: "var(--text-secondary)",
                    }}>
                      {ind.name}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
                      <div style={{
                        fontSize: "0.8125rem",
                        fontFamily: "var(--font-mono)",
                        color: "var(--text-primary)",
                      }}>
                        {ind.value}
                      </div>
                      <div style={{
                        width: 24,
                        textAlign: "center",
                        fontSize: "0.875rem",
                        fontWeight: 700,
                        color: getSignalColor(ind.signal),
                      }}>
                        {getSignalIcon(ind.signal)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Footer Alignment Badge ─────────────────────────── */}
      {!loading && data && (
        <div style={{
          display: "flex",
          justifyContent: "center",
        }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--space-3)",
            padding: "12px 24px",
            border: `1px solid ${data.overallAlignment.aligned ? "var(--green)" : "var(--border-strong)"}`,
            backgroundColor: data.overallAlignment.aligned ? "var(--green-bg)" : "var(--bg-warm)",
          }}>
            <span style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: data.overallAlignment.aligned ? "var(--green)" : "var(--amber)",
            }} />
            <span style={{
              fontSize: "0.8125rem",
              fontFamily: "var(--font-mono)",
              fontWeight: 600,
              color: data.overallAlignment.aligned ? "var(--green)" : "var(--text-primary)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}>
              {data.overallAlignment.aligned ? (
                `STRONG CONFLUENCE — ${data.overallAlignment.bullish === 4 ? "4/4 BULLISH" : "4/4 BEARISH"}`
              ) : (
                `MIXED ALIGNMENT — ${data.overallAlignment.bullish} BULLISH, ${data.overallAlignment.bearish} BEARISH`
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
