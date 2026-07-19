"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { LiveSignalFeed } from "@/components/signal-hub/LiveSignalFeed";
import { TechnicalConfluenceDashboard } from "@/components/signal-hub/TechnicalConfluenceDashboard";
import { CryptoIntelligenceHub } from "@/components/signal-hub/CryptoIntelligenceHub";
import { PerformanceSummaryWidget } from "@/components/performance/PerformanceSummaryWidget";

type Tab = "A" | "B" | "C" | "D" | "E";

export default function SignalHubPage() {
  const [liveCount, setLiveCount] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("A");

  return (
    <>
      <Header />
      <div style={{ backgroundColor: "var(--bg-base)", minHeight: "calc(100vh - var(--header-height))" }}>

        {/* ── Page header ───────────────────────────────────── */}
        <div style={{
          borderBottom: "1px solid var(--border)",
          padding: "var(--space-10) var(--space-10) var(--space-6)",
          backgroundColor: "var(--bg-warm)",
        }}>
          <div style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "var(--space-6)",
            maxWidth: "var(--max-width)",
            margin: "0 auto",
          }}>
            <div>
              {/* Live pill */}
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "var(--space-2)",
                padding: "3px 10px",
                border: "1px solid var(--border)",
                backgroundColor: "var(--bg-base)",
                marginBottom: "var(--space-4)",
              }}>
                <span style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor: "var(--green)",
                  flexShrink: 0,
                  animation: "livePulse 2s ease-in-out infinite",
                }} />
                <span style={{
                  fontSize: "0.625rem",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 700,
                  color: "var(--green)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}>
                  LIVE INTELLIGENCE FEED
                  {liveCount !== null && (
                    <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>
                      {" "}· {liveCount} INSTRUMENT{liveCount !== 1 ? "S" : ""} ACTIVE
                    </span>
                  )}
                </span>
              </div>

              <h1 style={{
                fontSize: "1.5rem",
                fontWeight: 500,
                color: "var(--text-primary)",
                letterSpacing: "-0.02em",
                marginBottom: "var(--space-2)",
              }}>
                Signal Hub
              </h1>
              <p style={{
                fontSize: "0.875rem",
                color: "var(--text-muted)",
                lineHeight: 1.65,
                maxWidth: 520,
              }}>
                Active signals ranked by conviction. AI consensus across Claude, GPT, Grok and Gemini.
                Realtime updates — refreshed every 60 seconds.
              </p>
            </div>

            {/* Section nav tabs */}
            <div style={{ display: "flex", borderBottom: "1px solid var(--border)", alignSelf: "flex-end", flexWrap: "wrap" }}>
              {[
                { id: "A", label: "A — Live Feed", disabled: false },
                { id: "B", label: "B — Signal Detail", disabled: true },
                { id: "C", label: "C — Technical Confluence", disabled: false },
                { id: "D", label: "D — Crypto Intelligence", disabled: false },
                { id: "E", label: "E — Performance", disabled: false },
              ].map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => !item.disabled && setActiveTab(item.id as Tab)}
                    disabled={item.disabled}
                    style={{
                      padding: "var(--space-3) var(--space-5)",
                      fontSize: "0.6875rem",
                      fontFamily: "var(--font-mono)",
                      fontWeight: 600,
                      letterSpacing: "0.06em",
                      color: isActive ? "var(--navy)" : "var(--text-muted)",
                      backgroundColor: "transparent",
                      border: "none",
                      borderBottom: isActive ? "2px solid var(--navy)" : "2px solid transparent",
                      marginBottom: -1,
                      cursor: item.disabled ? "not-allowed" : "pointer",
                      opacity: isActive ? 1 : item.disabled ? 0.4 : 0.7,
                      transition: "all var(--duration-fast)",
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Dynamic Content ────────────────────────────────── */}
        <div style={{
          maxWidth: "var(--max-width)",
          margin: "0 auto",
          padding: "var(--space-8) var(--space-10) var(--space-16)",
        }}>
          {activeTab === "A" && <LiveSignalFeed onCountChange={setLiveCount} />}
          {activeTab === "C" && <TechnicalConfluenceDashboard />}
          {activeTab === "D" && <CryptoIntelligenceHub />}
          {activeTab === "E" && (
            <div style={{ maxWidth: 800, margin: "0 auto" }}>
              <PerformanceSummaryWidget />
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes livePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(0.8); }
        }
      `}</style>
    </>
  );
}
