import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Methodology",
  description: "How Signal Centre calculates conviction scores, consensus scores, and risk grades. Full methodology documentation.",
};

const SCORING_FACTORS = [
  {
    category: "Technical Indicators",
    weight: 40,
    factors: [
      { name: "RSI (14)", description: "Relative Strength Index — momentum oscillator. Readings above 70 or below 30 flag potential reversals.", weight: 10 },
      { name: "MACD Signal", description: "Moving Average Convergence/Divergence — trend direction and momentum cross signals.", weight: 10 },
      { name: "EMA Alignment", description: "Exponential Moving Average stack (20/50/200) — trend direction confirmation across timeframes.", weight: 12 },
      { name: "ATR Normalisation", description: "Average True Range — used for volatility context and risk grade calibration.", weight: 8 },
    ],
  },
  {
    category: "AI Consensus Signals",
    weight: 25,
    factors: [
      { name: "Model Agreement Score", description: "Percentage of AI models in directional agreement. Three models: Claude, GPT-4, Grok.", weight: 15 },
      { name: "Confidence Weighted Average", description: "Each model's stated confidence level, weighted and averaged to produce the Consensus Score.", weight: 10 },
    ],
  },
  {
    category: "Sentiment & Positioning",
    weight: 20,
    factors: [
      { name: "Retail Positioning (COT proxy)", description: "Retail long/short ratio used as a contrarian indicator at extremes.", weight: 10 },
      { name: "Social Sentiment Score", description: "Processed social and news sentiment, normalised to 0–100.", weight: 10 },
    ],
  },
  {
    category: "Macro & News Context",
    weight: 15,
    factors: [
      { name: "News Flow Score", description: "Volume and directional alignment of recent news, scored by AI model analysis.", weight: 8 },
      { name: "Macro Context Score", description: "Central bank positioning, economic release calendar, intermarket relationships.", weight: 7 },
    ],
  },
];

export default function MethodologyPage() {
  return (
    <>
      <Header />
      <main>
        <section style={{ padding: "var(--space-20) 0 var(--space-16)", borderBottom: "1px solid var(--border)" }}>
          <div className="container-narrow">
            <h1 style={{ fontSize: "2rem", fontWeight: 500, color: "var(--text-primary)", letterSpacing: "-0.02em", marginBottom: "var(--space-4)" }}>
              Methodology
            </h1>
            <p style={{ fontSize: "1rem", color: "var(--text-secondary)", lineHeight: 1.8, marginBottom: "var(--space-12)", maxWidth: "580px" }}>
              The Signal Centre scoring system is deterministic, documented and versioned. This page explains every factor that contributes to a signal's Conviction Score, Consensus Score, and Risk Grade.
            </p>

            {/* Version note */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-5)",
                padding: "var(--space-4) var(--space-5)",
                border: "1px solid var(--border)",
                backgroundColor: "var(--bg-warm)",
                marginBottom: "var(--space-12)",
              }}
            >
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8125rem", color: "var(--navy)", fontWeight: 600 }}>v1.0.0</span>
              <span style={{ width: "1px", height: "16px", backgroundColor: "var(--border)" }} />
              <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Effective from: 20 July 2026</span>
              <span style={{ width: "1px", height: "16px", backgroundColor: "var(--border)" }} />
              <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Changes will be published with version increments.</span>
            </div>

            {/* Scoring overview */}
            <div id="scoring" style={{ marginBottom: "var(--space-12)" }}>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 500, color: "var(--text-primary)", marginBottom: "var(--space-2)" }}>Scoring Overview</h2>
              <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", lineHeight: 1.8, marginBottom: "var(--space-6)" }}>
                Each instrument generates two primary scores and one letter grade. All scores are recalculated on each data refresh cycle.
              </p>

              <div style={{ border: "1px solid var(--border)" }}>
                {[
                  { metric: "Conviction Score", range: "0–100", description: "Aggregated signal strength across all technical and contextual factors. A score of 70+ is classified as High Conviction." },
                  { metric: "Consensus Score", range: "0–100", description: "AI model agreement level. Reflects the degree to which Claude, GPT-4, and Grok agree on direction and strength." },
                  { metric: "Risk Grade", range: "A+ / A / B / C / D", description: "Normalised risk assessment based on ATR, volatility regime, macro context and AI risk flags. A+ represents cleanest risk/reward profile." },
                ].map((item) => (
                  <div
                    key={item.metric}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "160px 120px 1fr",
                      gap: "var(--space-6)",
                      alignItems: "start",
                      padding: "var(--space-5)",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)" }}>{item.metric}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.875rem", color: "var(--navy)" }}>{item.range}</span>
                    <span style={{ fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: 1.65 }}>{item.description}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Factor breakdown */}
            <div id="data" style={{ marginBottom: "var(--space-12)" }}>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 500, color: "var(--text-primary)", marginBottom: "var(--space-2)" }}>Factor Breakdown</h2>
              <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", lineHeight: 1.8, marginBottom: "var(--space-6)" }}>
                The Conviction Score is composed of four factor categories. Weights are fixed and will not change without a methodology version increment.
              </p>

              {SCORING_FACTORS.map((cat) => (
                <div key={cat.category} style={{ marginBottom: "var(--space-8)" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "var(--space-3) var(--space-5)",
                      backgroundColor: "var(--bg-stone)",
                      borderTop: "1px solid var(--border)",
                      borderLeft: "1px solid var(--border)",
                      borderRight: "1px solid var(--border)",
                    }}
                  >
                    <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)" }}>{cat.category}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.875rem", fontWeight: 600, color: "var(--navy)" }}>{cat.weight}%</span>
                  </div>
                  <div style={{ border: "1px solid var(--border)", borderTop: "none" }}>
                    {cat.factors.map((factor, i) => (
                      <div
                        key={i}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "180px 1fr 60px",
                          gap: "var(--space-5)",
                          alignItems: "start",
                          padding: "var(--space-4) var(--space-5)",
                          borderBottom: i < cat.factors.length - 1 ? "1px solid var(--border)" : "none",
                        }}
                      >
                        <span style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--text-primary)" }}>{factor.name}</span>
                        <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)", lineHeight: 1.65 }}>{factor.description}</span>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8125rem", color: "var(--navy)", textAlign: "right" }}>{factor.weight}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Consensus Engine section */}
            <div id="consensus" style={{ borderTop: "1px solid var(--border)", paddingTop: "var(--space-10)", marginBottom: "var(--space-12)" }}>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 500, color: "var(--text-primary)", marginBottom: "var(--space-2)" }}>AI Consensus Engine</h2>
              <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", lineHeight: 1.8, marginBottom: "var(--space-6)" }}>
                Three language models are queried independently with structured market data. Each model is assigned a specific analytical role to prevent echo-chamber responses.
              </p>
              <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", lineHeight: 1.8 }}>
                Models receive: instrument name, current price, timeframe, RSI, MACD, EMA stack, ATR, recent news headlines, and the outputs of the technical scoring pipeline. They do not receive each other's outputs before responding.
              </p>
            </div>

            {/* Risk section */}
            <div id="risk" style={{ borderTop: "1px solid var(--border)", paddingTop: "var(--space-10)" }}>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 500, color: "var(--text-primary)", marginBottom: "var(--space-2)" }}>Risk Grade Assignment</h2>
              <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", lineHeight: 1.8, marginBottom: "var(--space-6)" }}>
                The Risk Grade is not a quality ranking — it is a risk classification. An A+ signal is not necessarily a "better" opportunity. It indicates cleaner risk structure: well-defined invalidation, lower volatility regime, and higher AI confidence.
              </p>
              <div style={{ border: "1px solid var(--border)" }}>
                {[
                  { grade: "A+", description: "All factors aligned. Clean invalidation. Low ATR environment. Strong consensus. Highest risk/reward clarity." },
                  { grade: "A", description: "Strong alignment with minor ambiguity in one or two factors. Acceptable risk structure." },
                  { grade: "B", description: "Partial confluence. Some conflicting indicators. Risk is manageable but requires attention." },
                  { grade: "C", description: "Mixed signals. Elevated volatility or divergent AI models. Structural ambiguity present." },
                  { grade: "D", description: "Significant disagreement or extreme volatility. Intelligence provided for awareness only — not for low-risk participation." },
                ].map((item, i, arr) => (
                  <div
                    key={item.grade}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "60px 1fr",
                      gap: "var(--space-5)",
                      padding: "var(--space-4) var(--space-5)",
                      borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "1rem",
                        fontWeight: 600,
                        color:
                          item.grade === "A+" ? "var(--green)" :
                          item.grade === "A" ? "var(--green-light)" :
                          item.grade === "B" ? "var(--amber)" :
                          item.grade === "C" ? "var(--burgundy-light)" :
                          "var(--burgundy)",
                      }}
                    >
                      {item.grade}
                    </span>
                    <span style={{ fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: 1.65 }}>{item.description}</span>
                  </div>
                ))}
              </div>
            </div>
            <div id="data-sources" style={{ borderTop: "1px solid var(--border)", paddingTop: "var(--space-10)", marginBottom: "var(--space-12)", marginTop: "var(--space-12)" }}>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 500, color: "var(--text-primary)", marginBottom: "var(--space-2)" }}>Data Sources & Providers</h2>
              <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", lineHeight: 1.8, marginBottom: "var(--space-4)" }}>
                Signal Centre relies on institutional-grade data providers. Data integrity is foundational to the Conviction Score pipeline.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-8)" }}>
                <div>
                  <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "var(--space-3)" }}>Current Integration</h3>
                  <ul style={{ listStyle: "disc", paddingLeft: "var(--space-4)", fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.8 }}>
                    <li>Twelve Data (Price & Technicals)</li>
                    <li>Finnhub (News & Sentiment)</li>
                    <li>Anthropic (Claude)</li>
                    <li>OpenAI (GPT-4)</li>
                    <li>xAI (Grok)</li>
                  </ul>
                </div>
                <div>
                  <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "var(--space-3)" }}>Planned Layer 2 Integration</h3>
                  <ul style={{ listStyle: "disc", paddingLeft: "var(--space-4)", fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.8 }}>
                    <li>Autochartist</li>
                    <li>Trading Central</li>
                    <li>Glassnode & CryptoQuant</li>
                    <li>Acuity Trading</li>
                  </ul>
                </div>
              </div>
            </div>

            <div id="accuracy" style={{ borderTop: "1px solid var(--border)", paddingTop: "var(--space-10)" }}>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 500, color: "var(--text-primary)", marginBottom: "var(--space-2)" }}>Accuracy & Outcome Logging</h2>
              <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", lineHeight: 1.8, marginBottom: "var(--space-4)" }}>
                Every signal generated by the platform is permanently logged upon reaching its take-profit, stop-loss, or timeframe expiry. This creates an immutable track record of the model's predictive accuracy.
              </p>
              <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", lineHeight: 1.8 }}>
                To review historical hit rates and model-specific performance, access the <a href="/dashboard/performance" style={{ color: "var(--navy)", textDecoration: "underline" }}>Performance Dashboard</a> (requires active session).
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
