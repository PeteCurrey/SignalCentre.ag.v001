import { createServiceClient } from "@/lib/supabase/client";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, ShieldCheck } from "lucide-react";
import TradingViewChart from "./TradingViewChart";
import ConsensusRing from "./ConsensusRing";
import ClientActions from "./ClientActions";

export default async function SignalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const db = createServiceClient();
  
  const { data: signalData, error } = await db
    .from("signals")
    .select("*")
    .eq("id", resolvedParams.id)
    .single();

  if (error || !signalData) {
    redirect("/dashboard");
  }

  const signal = signalData as any;

  // --- MOCK DATA ---
  let userTier = "EDGE"; // "FOUNDATION", "EDGE", "FLOOR"
  
  const macroData = { fed_funds: "5.25", boe: "5.25", us10y: "4.42" };
  const spread = 1.2;
  const tcScore = signal.tc_consensus_score || 89;
  const tcAlert = signal.tc_alert_text || "TC Alert: Long positions above support with targets at R1 and R2.";
  const acuityRationale = signal.acuity_rationale || "Machines spotted the breakout, and human analysts confirm structural alignment. Order block retest is holding strong under low selling volume, offering high-R:R entry criteria.";
  const acuityConfidence = signal.acuity_confidence || 82;
  const atr = signal.atr_value || 0.005;

  // Format Helpers
  const isJpy = signal.instrument.includes("JPY");
  const isCrypto = signal.asset_class === "crypto";
  const dp = isJpy ? 3 : isCrypto ? 2 : 5;
  const formatPrice = (p: number | null) => p ? p.toFixed(dp) : "---";

  const isBullish = signal.direction === "bullish";

  return (
    <div style={{ padding: "var(--space-8)", maxWidth: 1400, margin: "0 auto", display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      {/* TOP NAVIGATION ROW */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.1em", color: "var(--text-muted)", textDecoration: "none" }}>
          <ArrowLeft size={14} /> BACK TO SIGNAL CENTRE
        </Link>
        <ClientActions />
      </div>

      {/* HERO — SIGNAL HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", border: "1px solid var(--border)", backgroundColor: "var(--bg-base)", padding: "var(--space-6)" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>{signal.instrument}</h1>
            <span style={{ fontSize: "0.625rem", padding: "4px 8px", backgroundColor: "var(--bg-stone)", border: "1px solid var(--border)", fontWeight: 700, letterSpacing: "0.05em" }}>
              {signal.timeframe} INTERV
            </span>
            <span style={{ fontSize: "0.625rem", padding: "4px 8px", backgroundColor: isBullish ? "var(--green-light)" : "var(--burgundy-light)", color: isBullish ? "var(--green)" : "var(--burgundy)", fontWeight: 700, letterSpacing: "0.05em" }}>
              {isBullish ? "BULLISH" : "BEARISH"}
            </span>
          </div>
          <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            SCAN: {new Date(signal.created_at).toLocaleString("en-GB")} · EXPIRES: {new Date(signal.expires_at).toLocaleString("en-GB")}
          </div>
        </div>
        
        <div style={{ display: "flex", gap: "var(--space-8)" }}>
          {/* TC Panel */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "center" }}>
            <div style={{ fontSize: "0.625rem", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.1em" }}>TRADING CENTRAL</div>
            <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--navy)", fontFamily: "var(--font-mono)", lineHeight: 1 }}>{tcScore}%</div>
            <div style={{ fontSize: "0.6875rem", color: isBullish ? "var(--green)" : "var(--burgundy)", fontWeight: 600 }}>{isBullish ? "BULLISH VIEW" : "BEARISH VIEW"}</div>
          </div>
          
          <div style={{ width: 1, backgroundColor: "var(--border)" }} />
          
          {/* Consensus Panel */}
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
              <div style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--text-primary)" }}>{tcScore > 80 ? "HIGH-CONV." : "STANDARD"} {isBullish ? "BUY" : "SELL"}</div>
              <div style={{ fontSize: "0.625rem", color: "var(--text-muted)" }}>Weighted multi-model</div>
            </div>
            <ConsensusRing score={83} />
          </div>
        </div>
      </div>

      {/* TWO COLUMN LAYOUT */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "var(--space-6)", alignItems: "start" }}>
        {/* Force desktop to 65% / 35% with a media query via standard classes if we had them, using grid directly here (hack for inline styles without media query support: we assume desktop primarily for this test) */}
        <div style={{ display: "grid", gridTemplateColumns: "65fr 35fr", gap: "var(--space-6)" }}>
          
          {/* LEFT COLUMN */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
            
            {/* Chart */}
            <div style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-base)" }}>
              <div style={{ padding: "var(--space-4)", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between" }}>
                <h2 style={{ fontSize: "0.8125rem", fontWeight: 700, margin: 0, letterSpacing: "0.05em" }}>↗ TRADINGVIEW LIVE CHART</h2>
                <span style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>FX:{signal.instrument.replace("/", "")}</span>
              </div>
              <TradingViewChart symbol={signal.instrument} interval={signal.timeframe.replace("m", "").replace("H", "60")} />
              <div style={{ padding: "var(--space-3) var(--space-4)", borderTop: "1px solid var(--border)", fontSize: "0.75rem", fontFamily: "var(--font-mono)", display: "flex", gap: "var(--space-4)", color: "var(--text-muted)" }}>
                <span>O: <span style={{ color: "var(--text-primary)" }}>{formatPrice(signal.entry_price)}</span></span>
                <span>H: <span style={{ color: "var(--text-primary)" }}>{formatPrice((signal.entry_price || 0) + 0.002)}</span></span>
                <span>L: <span style={{ color: "var(--text-primary)" }}>{formatPrice((signal.entry_price || 0) - 0.001)}</span></span>
                <span>C: <span style={{ color: isBullish ? "var(--green)" : "var(--burgundy)", fontWeight: 700 }}>{formatPrice((signal.entry_price || 0) + 0.001)}</span></span>
                <span style={{ marginLeft: "auto" }}>Vol: 12.4K</span>
              </div>
            </div>

            {/* Autochartist Patterns */}
            <div style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-base)" }}>
              <div style={{ padding: "var(--space-4)", borderBottom: "1px solid var(--border)" }}>
                <h2 style={{ fontSize: "0.8125rem", fontWeight: 700, margin: 0, letterSpacing: "0.05em" }}>👁 AUTOCHARTIST PATTERNS</h2>
              </div>
              <div style={{ padding: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                {/* Mock Pattern 1 */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: "0.875rem", fontWeight: 700 }}>{isBullish ? "Bullish Flag Pattern" : "Bearish Pennant Pattern"}</div>
                    <span style={{ fontSize: "0.5625rem", padding: "2px 6px", backgroundColor: isBullish ? "var(--green-light)" : "var(--burgundy-light)", color: isBullish ? "var(--green)" : "var(--burgundy)", fontWeight: 700 }}>{isBullish ? "BULLISH" : "BEARISH"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: "0.625rem", color: "var(--text-muted)", letterSpacing: "0.05em" }}>CHARTPATTERN · COMPLETED</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.6875rem", fontFamily: "var(--font-mono)" }}>
                      <span>85%</span>
                      <div style={{ width: 60, height: 4, backgroundColor: "var(--bg-stone)" }}><div style={{ width: "85%", height: "100%", backgroundColor: "var(--green)" }} /></div>
                    </div>
                  </div>
                </div>
                <div style={{ height: 1, backgroundColor: "var(--border)" }} />
                {/* Mock Pattern 2 */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: "0.875rem", fontWeight: 700 }}>Support Level Breakout</div>
                    <span style={{ fontSize: "0.5625rem", padding: "2px 6px", backgroundColor: isBullish ? "var(--green-light)" : "var(--burgundy-light)", color: isBullish ? "var(--green)" : "var(--burgundy)", fontWeight: 700 }}>{isBullish ? "BULLISH" : "BEARISH"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: "0.625rem", color: "var(--text-muted)", letterSpacing: "0.05em" }}>KEYLEVEL · EMERGING</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.6875rem", fontFamily: "var(--font-mono)" }}>
                      <span>72%</span>
                      <div style={{ width: 60, height: 4, backgroundColor: "var(--bg-stone)" }}><div style={{ width: "72%", height: "100%", backgroundColor: "var(--green)" }} /></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Expected Ranges */}
            <div style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-base)" }}>
              <div style={{ padding: "var(--space-4)", borderBottom: "1px solid var(--border)" }}>
                <h2 style={{ fontSize: "0.8125rem", fontWeight: 700, margin: 0, letterSpacing: "0.05em" }}>📊 EXPECTED RANGES</h2>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
                {/* Volatility Range */}
                <div style={{ padding: "var(--space-4)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                  <div style={{ fontSize: "0.625rem", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.1em" }}>AUTOCHARTIST VOLATILITY RANGE (DAILY)</div>
                  <div style={{ position: "relative", height: 24, marginTop: 12 }}>
                    <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 4, backgroundColor: "var(--bg-stone)", transform: "translateY(-50%)" }} />
                    <div style={{ position: "absolute", top: "50%", left: "30%", right: "30%", height: 4, backgroundColor: "var(--navy)", transform: "translateY(-50%)" }} />
                    <div style={{ position: "absolute", top: "50%", left: "60%", width: 8, height: 8, backgroundColor: "var(--navy)", borderRadius: "50%", transform: "translate(-50%, -50%)" }} />
                    <div style={{ position: "absolute", top: -16, left: 0, fontSize: "0.6875rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>{formatPrice((signal.entry_price || 0) - atr * 1.5)}</div>
                    <div style={{ position: "absolute", top: -16, right: 0, fontSize: "0.6875rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>{formatPrice((signal.entry_price || 0) + atr * 1.5)}</div>
                  </div>
                </div>
                {/* Fibonacci */}
                <div style={{ padding: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                  <div style={{ fontSize: "0.625rem", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.1em" }}>FIBONACCI SUPPORT & RESISTANCE</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-2)", fontSize: "0.6875rem", fontFamily: "var(--font-mono)" }}>
                    <div style={{ padding: 4, backgroundColor: "var(--burgundy-light)", color: "var(--burgundy)" }}>R2: {formatPrice((signal.entry_price || 0) + atr * 0.618)}</div>
                    <div style={{ padding: 4, backgroundColor: "var(--burgundy-light)", color: "var(--burgundy)" }}>R1: {formatPrice((signal.entry_price || 0) + atr * 0.382)}</div>
                    <div style={{ padding: 4, backgroundColor: "var(--green-light)", color: "var(--green)" }}>S1: {formatPrice((signal.entry_price || 0) - atr * 0.382)}</div>
                    <div style={{ padding: 4, backgroundColor: "var(--green-light)", color: "var(--green)" }}>S2: {formatPrice((signal.entry_price || 0) - atr * 0.618)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Consensus Panel */}
            <div style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-base)" }}>
              <div style={{ padding: "var(--space-4)", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between" }}>
                <h2 style={{ fontSize: "0.8125rem", fontWeight: 700, margin: 0, letterSpacing: "0.05em" }}>🤖 AI CONSENSUS PANEL</h2>
                <span style={{ fontSize: "0.625rem", color: "var(--text-muted)" }}>Parallel Frontier Models</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0 }}>
                {/* Claude */}
                <div style={{ padding: "var(--space-4)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.75rem", fontWeight: 600 }}>
                      <span style={{ color: "#d97757" }}>●</span> Claude Sonnet
                    </div>
                    <span style={{ fontSize: "0.5625rem", color: "var(--text-muted)", letterSpacing: "0.1em" }}>ANTHROPIC</span>
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", fontWeight: 700, marginBottom: 4 }}>
                      <span>BULLISH</span><span style={{ color: "var(--navy)" }}>82%</span>
                    </div>
                    <div style={{ height: 3, backgroundColor: "var(--green)", width: "100%" }} />
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 12, fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", flexDirection: "column", gap: 6 }}>
                    <li>Technicals show high confluence with a score of 8/10.</li>
                    <li>Price broke above the 50 EMA on the 4H chart.</li>
                  </ul>
                  <button style={{ marginTop: "auto", fontSize: "0.625rem", color: "var(--navy)", fontWeight: 600, background: "none", border: "none", textAlign: "left", cursor: "pointer", padding: 0 }}>HIDE REASONING ↑</button>
                </div>

                {/* GPT */}
                <div style={{ padding: "var(--space-4)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.75rem", fontWeight: 600 }}>
                      <span style={{ color: "#10a37f" }}>●</span> GPT-4o
                    </div>
                    <span style={{ fontSize: "0.5625rem", color: "var(--text-muted)", letterSpacing: "0.1em" }}>OPENAI</span>
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", fontWeight: 700, marginBottom: 4 }}>
                      <span>BULLISH</span><span style={{ color: "var(--navy)" }}>78%</span>
                    </div>
                    <div style={{ height: 3, backgroundColor: "var(--green)", width: "100%" }} />
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 12, fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", flexDirection: "column", gap: 6 }}>
                    <li>Momentum indicators support continued upside.</li>
                    <li>Strong volume profile at current support zone.</li>
                  </ul>
                  <button style={{ marginTop: "auto", fontSize: "0.625rem", color: "var(--navy)", fontWeight: 600, background: "none", border: "none", textAlign: "left", cursor: "pointer", padding: 0 }}>HIDE REASONING ↑</button>
                </div>

                {/* Grok */}
                <div style={{ padding: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.75rem", fontWeight: 600 }}>
                      <span style={{ color: "#000000" }}>●</span> Grok Beta
                    </div>
                    <span style={{ fontSize: "0.5625rem", color: "var(--text-muted)", letterSpacing: "0.1em" }}>XAI</span>
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", fontWeight: 700, marginBottom: 4 }}>
                      <span style={{ color: "var(--text-muted)" }}>NEUTRAL</span><span style={{ color: "var(--navy)" }}>55%</span>
                    </div>
                    <div style={{ height: 3, backgroundColor: "var(--text-disabled)", width: "100%" }} />
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 12, fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", flexDirection: "column", gap: 6 }}>
                    <li>Social sentiment is mixed for this pair.</li>
                    <li>Awaiting confirmation from upcoming macro events.</li>
                  </ul>
                  <button style={{ marginTop: "auto", fontSize: "0.625rem", color: "var(--navy)", fontWeight: 600, background: "none", border: "none", textAlign: "left", cursor: "pointer", padding: 0 }}>HIDE REASONING ↑</button>
                </div>
              </div>
            </div>
            
          </div>

          {/* RIGHT SIDEBAR */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
            
            {/* Setup Parameters */}
            <div style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-base)" }}>
              <div style={{ padding: "var(--space-4)", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ fontSize: "0.8125rem", fontWeight: 700, margin: 0, letterSpacing: "0.05em" }}>SETUP PARAMETERS</h2>
                <span style={{ fontSize: "0.5625rem", padding: "2px 6px", backgroundColor: isBullish ? "var(--green-light)" : "var(--burgundy-light)", color: isBullish ? "var(--green)" : "var(--burgundy)", fontWeight: 700 }}>{isBullish ? "BULLISH" : "BEARISH"}</span>
              </div>
              <div style={{ padding: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
                {/* Entry */}
                <div>
                  <div style={{ fontSize: "0.625rem", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.1em", marginBottom: 4 }}>ENTRY ZONE</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <div style={{ fontSize: "1.25rem", fontFamily: "var(--font-mono)", fontWeight: 700 }}>{formatPrice(signal.entry_price)}</div>
                    <div style={{ fontSize: "0.6875rem", color: "var(--green)", backgroundColor: "var(--green-light)", padding: "2px 6px", fontWeight: 600 }}>MARKET ENTRY</div>
                  </div>
                </div>
                {/* Stop Loss */}
                <div>
                  <div style={{ fontSize: "0.625rem", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.1em", marginBottom: 4 }}>STOP LOSS</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <div style={{ fontSize: "1.25rem", fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--burgundy)" }}>{formatPrice(signal.stop_loss)}</div>
                    <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>1.5× ATR Stop</div>
                  </div>
                </div>
                {/* R:R */}
                <div style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", padding: "12px 0" }}>
                  <div style={{ fontSize: "0.625rem", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.1em", marginBottom: 4 }}>RISK / REWARD</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <div style={{ fontSize: "1.125rem", fontFamily: "var(--font-mono)", fontWeight: 700 }}>1 : 2.0</div>
                    <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>Target 2 Confluence</div>
                  </div>
                </div>
                {/* Targets */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: "0.75rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)" }}>
                    <span>Target 1 (1.5× ATR)</span><span style={{ fontFamily: "var(--font-mono)" }}>{formatPrice((signal.entry_price || 0) + atr * 1.5)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "var(--green)", fontWeight: 700, backgroundColor: "var(--bg-stone)", padding: "4px 8px", margin: "0 -8px" }}>
                    <span>Target 2 (Primary)</span><span style={{ fontFamily: "var(--font-mono)" }}>{formatPrice(signal.take_profit)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)" }}>
                    <span>Target 3 (4.5× ATR)</span><span style={{ fontFamily: "var(--font-mono)" }}>{formatPrice((signal.entry_price || 0) + atr * 4.5)}</span>
                  </div>
                </div>
                {/* Catalyst */}
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.625rem", color: "var(--navy)", fontWeight: 700, letterSpacing: "0.1em", marginBottom: 4 }}>
                    <Calendar size={12} /> ECONOMIC CATALYST
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-primary)" }}>Technical confluence breakout setup ahead of NFP.</div>
                </div>
                {/* Disclaimer */}
                <div style={{ backgroundColor: "#fffbf0", border: "1px solid #f5e4bd", padding: "var(--space-3)", fontSize: "0.6875rem", color: "#8a6c22" }}>
                  ⚠ NOT FINANCIAL ADVICE. Technical structures represent statistical probabilities. Always trade with a stop loss and appropriate position sizing.
                </div>
              </div>
            </div>

            {/* Macro Intelligence */}
            <div style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-base)" }}>
              <div style={{ padding: "var(--space-4)", borderBottom: "1px solid var(--border)" }}>
                <h2 style={{ fontSize: "0.8125rem", fontWeight: 700, margin: 0, letterSpacing: "0.05em" }}>🌐 MACRO INTELLIGENCE</h2>
              </div>
              <div style={{ padding: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
                    <span style={{ color: "var(--text-muted)" }}>US Fed Funds Rate</span><span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{macroData.fed_funds}%</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
                    <span style={{ color: "var(--text-muted)" }}>UK Base Rate (BOE)</span><span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{macroData.boe}%</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
                    <span style={{ color: "var(--text-muted)" }}>US 10-Year Bond</span><span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{macroData.us10y}%</span>
                  </div>
                </div>
                
                <div style={{ height: 1, backgroundColor: "var(--border)" }} />
                
                <div>
                  <div style={{ fontSize: "0.625rem", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.1em", marginBottom: 8 }}>TRADING CENTRAL CONSENSUS</div>
                  <div style={{ backgroundColor: "var(--bg-stone)", padding: "var(--space-3)", fontSize: "0.75rem", color: "var(--text-secondary)", borderLeft: "2px solid var(--navy)" }}>
                    {tcAlert}
                  </div>
                </div>

                <div style={{ height: 1, backgroundColor: "var(--border)" }} />
                
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
                  <span style={{ color: "var(--text-muted)" }}>LIVE SPREAD</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--navy)" }}>{spread} pips</span>
                </div>
              </div>
            </div>

            {/* Acuity Expert View */}
            <div style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-base)", position: "relative" }}>
              <div style={{ padding: "var(--space-4)", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ fontSize: "0.8125rem", fontWeight: 700, margin: 0, letterSpacing: "0.05em" }}>🛡 ACUITY EXPERT VIEW</h2>
                <span style={{ fontSize: "0.5625rem", padding: "2px 6px", backgroundColor: "#f3e8ff", color: "#7e22ce", fontWeight: 700 }}>HUMAN LAYER</span>
              </div>
              
              <div style={{ padding: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-4)", filter: userTier === "FOUNDATION" ? "blur(4px)" : "none" }}>
                <div>
                  <div style={{ fontSize: "0.625rem", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.1em", marginBottom: 8 }}>EXPERT RATIONALE</div>
                  <div style={{ fontStyle: "italic", fontSize: "0.8125rem", color: "var(--text-secondary)", borderLeft: "2px solid var(--text-disabled)", paddingLeft: 12 }}>
                    "{acuityRationale}"
                  </div>
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
                  <div style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--green)", backgroundColor: "var(--green-light)", padding: "4px 8px", width: "fit-content" }}>
                    EXPERT CONFIDENCE: {acuityConfidence}% — HIGH
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.6875rem", fontWeight: 700, color: "#0f766e", backgroundColor: "#ccfbf1", padding: "4px 8px", width: "fit-content" }}>
                    <ShieldCheck size={12} /> FCA REGULATION: Registered
                  </div>
                </div>
                
                <div style={{ fontSize: "0.625rem", color: "var(--text-disabled)", marginTop: 8 }}>
                  Compliance disclosure: Trade content and analyst stream powered by Acuity Research Ltd, regulated under FCA FRN: 787261.
                </div>
              </div>

              {userTier === "FOUNDATION" && (
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.4)" }}>
                  <div style={{ backgroundColor: "var(--bg-base)", padding: "var(--space-4)", border: "1px solid var(--border)", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", textAlign: "center" }}>
                    <div style={{ fontSize: "0.8125rem", fontWeight: 700, marginBottom: 4 }}>Edge feature</div>
                    <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>Upgrade to unlock Acuity Expert View.</div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
