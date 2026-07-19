"use client";

// ============================================================
// app/signals/[instrument]/page.tsx
// Instrument Detail Page with Autochartist Integration
// ============================================================

import { use, useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { TradingViewChart } from "@/components/signals/TradingViewChart";
import { PatternList } from "@/components/signals/PatternList";
import { KeyLevelsLadder } from "@/components/signals/KeyLevelsLadder";
import type { AutochartistPattern, AutochartistKeyLevel } from "@/lib/autochartist-client";

interface PageProps {
  params: Promise<{ instrument: string }>;
}

export default function InstrumentDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const instrument = resolvedParams.instrument.toUpperCase();

  const [price, setPrice] = useState<number | null>(null);
  const [change, setChange] = useState<number | null>(null);
  const [isMarketOpen, setIsMarketOpen] = useState<boolean>(true);
  
  const [patterns, setPatterns] = useState<AutochartistPattern[]>([]);
  const [keyLevels, setKeyLevels] = useState<AutochartistKeyLevel[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    // Fetch live quote
    const fetchQuote = async () => {
      try {
        const res = await fetch(`/api/market-data?symbol=${instrument}&endpoint=quote`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.close) {
            setPrice(parseFloat(data.close));
            setChange(parseFloat(data.percent_change));
            setIsMarketOpen(data.is_market_open !== false);
          }
        }
      } catch (err) {
        console.error("Quote fetch error", err);
      }
    };

    fetchQuote();
    const quoteInterval = setInterval(fetchQuote, 10000); // 10s poll

    // Fetch Autochartist Data
    const fetchAutochartist = async () => {
      setLoadingData(true);
      try {
        const [pRes, kRes] = await Promise.all([
          fetch(`/api/autochartist?symbol=${instrument}&type=patterns`),
          fetch(`/api/autochartist?symbol=${instrument}&type=keylevels&price=${price || 100}`)
        ]);
        
        if (pRes.ok) setPatterns(await pRes.json());
        if (kRes.ok) setKeyLevels(await kRes.json());
      } catch (err) {
        console.error("Autochartist fetch error", err);
      } finally {
        setLoadingData(false);
      }
    };

    fetchAutochartist();

    return () => clearInterval(quoteInterval);
  }, [instrument, price]);

  return (
    <>
      <Header />
      <div style={{ backgroundColor: "var(--bg-base)", minHeight: "calc(100vh - var(--header-height))" }}>
        
        {/* ── Hero Section ──────────────────────────────────── */}
        <div style={{
          borderBottom: "1px solid var(--border)",
          padding: "var(--space-8) var(--space-10)",
          backgroundColor: "var(--bg-warm)",
        }}>
          <div style={{
            maxWidth: "var(--max-width)",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "var(--space-6)"
          }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)", marginBottom: "var(--space-2)" }}>
                <h1 style={{
                  fontSize: "2rem",
                  fontWeight: 500,
                  color: "var(--text-primary)",
                  letterSpacing: "-0.02em",
                  margin: 0,
                  fontFamily: "var(--font-mono)"
                }}>
                  {instrument}
                </h1>
                <div style={{
                  padding: "2px 8px",
                  border: `1px solid ${isMarketOpen ? "var(--green)" : "var(--border-strong)"}`,
                  backgroundColor: isMarketOpen ? "var(--green-bg)" : "var(--bg-base)",
                  color: isMarketOpen ? "var(--green)" : "var(--text-muted)",
                  fontSize: "0.625rem",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase"
                }}>
                  {isMarketOpen ? "SESSION OPEN" : "SESSION CLOSED"}
                </div>
              </div>
              <p style={{
                fontSize: "0.875rem",
                color: "var(--text-muted)",
                margin: 0,
              }}>
                Tier 1 Signal Intelligence · Autochartist Pattern Overlay
              </p>
            </div>

            {/* Live Price Block */}
            <div style={{ textAlign: "right" }}>
              <div style={{
                fontSize: "2rem",
                fontWeight: 500,
                color: "var(--text-primary)",
                fontFamily: "var(--font-mono)",
                lineHeight: 1.2
              }}>
                {price !== null ? price.toFixed(5).replace(/\.?0+$/, '') : "—"}
              </div>
              <div style={{
                fontSize: "0.875rem",
                fontFamily: "var(--font-mono)",
                fontWeight: 500,
                color: change !== null 
                  ? change >= 0 ? "var(--green)" : "var(--burgundy)" 
                  : "var(--text-muted)"
              }}>
                {change !== null ? `${change >= 0 ? "+" : ""}${change.toFixed(2)}% (24h)` : "Loading..."}
              </div>
            </div>
          </div>
        </div>

        {/* ── Main Content ─────────────────────────────────── */}
        <div style={{
          maxWidth: "var(--max-width)",
          margin: "0 auto",
          padding: "var(--space-8) var(--space-10) var(--space-16)",
        }}>
          
          {/* Chart Wrapper */}
          <div style={{ marginBottom: "var(--space-8)" }}>
            <TradingViewChart symbol={instrument} />
          </div>

          {/* Grid Layout for Lower Section */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: "var(--space-8)",
            alignItems: "start",
          }}>
            <PatternList patterns={patterns} loading={loadingData} />
            <KeyLevelsLadder 
              levels={keyLevels} 
              currentPrice={price || 0} 
              loading={loadingData || price === null} 
            />
          </div>

        </div>
      </div>
    </>
  );
}
