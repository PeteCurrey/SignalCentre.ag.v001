import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { LiveFeedTable } from "@/components/feed/LiveFeedTable";
import {
  MOCK_SIGNALS,
  PRICING_TIERS,
  ASSET_COVERAGE,
} from "@/lib/data/mock-signals";

export const metadata: Metadata = {
  title: "Signal Center — Institutional Market Intelligence",
  description:
    "Multi-source market intelligence and AI consensus analysis for professional traders, proprietary desks and sophisticated investors across Forex, Indices, Commodities and Crypto.",
};

const FAQS = [
  {
    q: "What makes Signal Center different from retail signal services?",
    a: "Signal Center does not issue buy/sell calls. We provide structured market intelligence: conviction scores, AI consensus analysis, confluence mapping, and risk context. The product is decision-support infrastructure — not instructions. Professional traders use this to validate their own analysis and identify opportunity zones.",
  },
  {
    q: "How is the Conviction Score calculated?",
    a: "The Conviction Score (0–100) aggregates signals from technical analysis layers (RSI, MACD, EMA alignment, ATR, volume), sentiment data, news flow, and macro context. Each factor is weighted and normalised. The full methodology is published on our Methodology page.",
  },
  {
    q: "How does the AI Consensus Engine work?",
    a: "We query four large language models (Claude, GPT-4, Grok, Gemini) with structured market data and assign each a specific analytical role — Risk Officer, Portfolio Strategist, Sentiment Analyst, Macro Analyst. We display each model's output independently, including disagreements. Transparency is a core principle.",
  },
  {
    q: "What data sources power the platform?",
    a: "Phase 1 integrates Twelve Data and Finnhub for price data and technical indicators. Future layers include Autochartist, Trading Central, TAAPI, Acuity, and for crypto: Glassnode, CryptoQuant, CoinGlass, LunarCrush and Santiment.",
  },
  {
    q: "Is Signal Center regulated?",
    a: "Signal Center is not regulated by the FCA and does not provide regulated financial advice. The platform provides market intelligence for informational purposes only. Users are responsible for their own trading decisions.",
  },
  {
    q: "What is the refund policy?",
    a: "Subscriptions may be cancelled at any time. We do not offer prorated refunds for partial months. If you cancel, access continues until the end of the billing period.",
  },
];

const CONSENSUS_MODELS = [
  {
    model: "Claude",
    role: "Risk Officer",
    focus: "Invalidations, counter-arguments, risk parameters, and scenarios where the thesis fails.",
    color: "var(--burgundy)",
  },
  {
    model: "GPT-4",
    role: "Portfolio Strategist",
    focus: "Confluence analysis, trade structure, multi-timeframe synthesis, and position context.",
    color: "var(--navy)",
  },
  {
    model: "Grok",
    role: "Sentiment Analyst",
    focus: "Narrative shifts, crowd positioning, contrarian signals, and retail sentiment data.",
    color: "var(--green)",
  },
  {
    model: "Gemini",
    role: "Macro Analyst",
    focus: "Central bank policy, bond market dynamics, economic releases, and intermarket relationships.",
    color: "var(--amber)",
  },
];

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        {/* ── Hero ────────────────────────────────────────────── */}
        <section
          id="hero"
          style={{
            padding: "var(--space-20) 0 var(--space-16)",
            borderBottom: "1px solid var(--border)",
            minHeight: "calc(100vh - var(--header-height))",
            display: "flex",
            alignItems: "center",
          }}
        >
          <div className="container">
            <div
              style={{
                maxWidth: "700px",
                animation: "fade-in-up 400ms cubic-bezier(0.16, 1, 0.3, 1) both",
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "var(--space-3)",
                  marginBottom: "var(--space-8)",
                  padding: "4px 12px",
                  border: "1px solid var(--border)",
                  backgroundColor: "var(--bg-warm)",
                }}
              >
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    backgroundColor: "var(--green)",
                    borderRadius: "50%",
                    display: "inline-block",
                    animation: "skeleton-pulse 2s ease-in-out infinite",
                  }}
                />
                <span
                  style={{
                    fontSize: "0.6875rem",
                    fontWeight: 500,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  Live Intelligence Feed · {MOCK_SIGNALS.length} instruments active
                </span>
              </div>

              <h1
                style={{
                  fontSize: "2.75rem",
                  fontWeight: 500,
                  lineHeight: 1.15,
                  letterSpacing: "-0.02em",
                  color: "var(--text-primary)",
                  marginBottom: "var(--space-6)",
                }}
              >
                Market intelligence for
                <br />
                institutional participants.
              </h1>

              <p
                style={{
                  fontSize: "1.0625rem",
                  color: "var(--text-secondary)",
                  lineHeight: 1.75,
                  maxWidth: "560px",
                  marginBottom: "var(--space-10)",
                }}
              >
                Multi-source signal scoring and AI consensus analysis across
                Forex, Indices, Commodities and Crypto. Built for professional
                traders, proprietary desks, and sophisticated investors who
                require precision over noise.
              </p>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-4)",
                }}
              >
                <Link
                  href="/sign-up"
                  id="hero-cta-primary"
                  style={{
                    display: "inline-block",
                    padding: "12px 28px",
                    backgroundColor: "var(--navy)",
                    color: "var(--bg-base)",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    letterSpacing: "0.03em",
                    textDecoration: "none",
                    transition: "background-color 150ms",
                  }}
                >
                  Request Access
                </Link>
                <Link
                  href="/methodology"
                  id="hero-cta-secondary"
                  style={{
                    display: "inline-block",
                    padding: "12px 28px",
                    border: "1px solid var(--border-strong)",
                    backgroundColor: "transparent",
                    color: "var(--text-secondary)",
                    fontSize: "0.875rem",
                    fontWeight: 400,
                    letterSpacing: "0.03em",
                    textDecoration: "none",
                    transition: "border-color 150ms",
                  }}
                >
                  View Methodology
                </Link>
              </div>
            </div>

            {/* Stat Row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "0",
                marginTop: "var(--space-16)",
                borderTop: "1px solid var(--border)",
                borderLeft: "1px solid var(--border)",
              }}
            >
              {[
                { value: "47", label: "Instruments Monitored" },
                { value: "4", label: "AI Models in Consensus" },
                { value: "0–100", label: "Conviction Score Range" },
                { value: "A+ – D", label: "Risk Grade Scale" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  style={{
                    padding: "var(--space-6) var(--space-6)",
                    borderRight: "1px solid var(--border)",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "1.5rem",
                      fontWeight: 500,
                      color: "var(--navy)",
                      marginBottom: "var(--space-1)",
                    }}
                  >
                    {stat.value}
                  </div>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--text-muted)",
                      letterSpacing: "0.01em",
                    }}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Live Intelligence Feed ───────────────────────── */}
        <section id="platform" className="section">
          <div className="container">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                marginBottom: "var(--space-6)",
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: "0.6875rem",
                    fontWeight: 600,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                    marginBottom: "var(--space-2)",
                  }}
                >
                  Live Intelligence Feed
                </h2>
                <p
                  style={{
                    fontSize: "1.125rem",
                    fontWeight: 500,
                    color: "var(--text-primary)",
                  }}
                >
                  Active signals across all asset classes
                </p>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-2)",
                }}
              >
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    backgroundColor: "var(--green)",
                    borderRadius: "50%",
                    animation: "skeleton-pulse 2s ease-in-out infinite",
                  }}
                />
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-muted)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  Refreshed every 60s
                </span>
              </div>
            </div>

            <LiveFeedTable signals={MOCK_SIGNALS} isPublic showFilters />
          </div>
        </section>

        {/* ── Consensus Engine ─────────────────────────────── */}
        <section
          id="consensus"
          className="section"
          style={{ backgroundColor: "var(--bg-warm)" }}
        >
          <div className="container">
            <div style={{ marginBottom: "var(--space-12)" }}>
              <h2
                style={{
                  fontSize: "0.6875rem",
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                  marginBottom: "var(--space-2)",
                }}
              >
                Consensus Engine
              </h2>
              <p
                style={{
                  fontSize: "1.125rem",
                  fontWeight: 500,
                  color: "var(--text-primary)",
                  maxWidth: "520px",
                }}
              >
                Four AI models. Four distinct analytical roles. One structured
                view of agreement and disagreement.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "0",
                borderLeft: "1px solid var(--border)",
                borderTop: "1px solid var(--border)",
              }}
            >
              {CONSENSUS_MODELS.map((m) => (
                <div
                  key={m.model}
                  style={{
                    padding: "var(--space-8)",
                    borderRight: "1px solid var(--border)",
                    borderBottom: "1px solid var(--border)",
                    borderTop: `3px solid ${m.color}`,
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      color: m.color,
                      marginBottom: "var(--space-1)",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {m.model}
                  </div>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "var(--text-secondary)",
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      marginBottom: "var(--space-4)",
                    }}
                  >
                    {m.role}
                  </div>
                  <p
                    style={{
                      fontSize: "0.8125rem",
                      color: "var(--text-muted)",
                      lineHeight: 1.65,
                    }}
                  >
                    {m.focus}
                  </p>
                </div>
              ))}
            </div>

            <p
              style={{
                marginTop: "var(--space-6)",
                fontSize: "0.8125rem",
                color: "var(--text-muted)",
                maxWidth: "560px",
              }}
            >
              Agreement scores are displayed prominently. Disagreement is never
              suppressed — where models diverge, that information is equally
              visible and valuable.
            </p>
          </div>
        </section>

        {/* ── Asset Coverage ───────────────────────────────── */}
        <section id="coverage" className="section">
          <div className="container">
            <div style={{ marginBottom: "var(--space-10)" }}>
              <h2
                style={{
                  fontSize: "0.6875rem",
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                  marginBottom: "var(--space-2)",
                }}
              >
                Asset Coverage
              </h2>
              <p
                style={{
                  fontSize: "1.125rem",
                  fontWeight: 500,
                  color: "var(--text-primary)",
                }}
              >
                {ASSET_COVERAGE.reduce((a, c) => a + c.count, 0)} instruments
                monitored across four asset classes
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "0",
                borderLeft: "1px solid var(--border)",
                borderTop: "1px solid var(--border)",
              }}
            >
              {ASSET_COVERAGE.map((cat) => (
                <div
                  key={cat.class}
                  style={{
                    padding: "var(--space-8)",
                    borderRight: "1px solid var(--border)",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "var(--space-4)",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        color: "var(--text-primary)",
                      }}
                    >
                      {cat.class}
                    </h3>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "1.25rem",
                        fontWeight: 500,
                        color: "var(--navy)",
                      }}
                    >
                      {cat.count}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: "0.8125rem",
                      color: "var(--text-muted)",
                      lineHeight: 1.6,
                      marginBottom: "var(--space-5)",
                    }}
                  >
                    {cat.description}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "var(--space-1)",
                    }}
                  >
                    {cat.instruments.slice(0, 6).map((inst) => (
                      <span
                        key={inst}
                        style={{
                          padding: "2px 6px",
                          backgroundColor: "var(--bg-stone)",
                          fontSize: "0.6875rem",
                          fontFamily: "var(--font-mono)",
                          color: "var(--text-secondary)",
                          letterSpacing: "0.02em",
                        }}
                      >
                        {inst}
                      </span>
                    ))}
                    {cat.instruments.length > 6 && (
                      <span
                        style={{
                          padding: "2px 6px",
                          fontSize: "0.6875rem",
                          fontFamily: "var(--font-mono)",
                          color: "var(--text-muted)",
                        }}
                      >
                        +{cat.instruments.length - 6} more
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Methodology ──────────────────────────────────── */}
        <section
          id="methodology"
          className="section"
          style={{ backgroundColor: "var(--bg-warm)" }}
        >
          <div className="container">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "var(--space-16)",
                alignItems: "center",
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: "0.6875rem",
                    fontWeight: 600,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                    marginBottom: "var(--space-2)",
                  }}
                >
                  Methodology
                </h2>
                <p
                  style={{
                    fontSize: "1.125rem",
                    fontWeight: 500,
                    color: "var(--text-primary)",
                    marginBottom: "var(--space-5)",
                    lineHeight: 1.4,
                  }}
                >
                  Transparent scoring. Documented methodology. No black boxes.
                </p>
                <p
                  style={{
                    fontSize: "0.9375rem",
                    color: "var(--text-secondary)",
                    lineHeight: 1.75,
                    marginBottom: "var(--space-8)",
                  }}
                >
                  Every signal is produced by a deterministic scoring pipeline.
                  The weighting of each factor is published and versioned. When
                  the methodology changes, we document it. Trust is built through
                  transparency, not marketing claims.
                </p>
                <Link
                  href="/methodology"
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    color: "var(--navy)",
                    textDecoration: "none",
                    letterSpacing: "0.02em",
                  }}
                >
                  Read Full Methodology →
                </Link>
              </div>

              <div
                style={{
                  borderLeft: "1px solid var(--border)",
                  paddingLeft: "var(--space-16)",
                }}
              >
                {[
                  { label: "Technical Indicators", weight: "40%" },
                  { label: "AI Consensus Signals", weight: "25%" },
                  { label: "Sentiment & Positioning", weight: "20%" },
                  { label: "Macro & News Context", weight: "15%" },
                ].map((factor) => (
                  <div
                    key={factor.label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "var(--space-4) 0",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.875rem",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {factor.label}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.875rem",
                        fontWeight: 500,
                        color: "var(--navy)",
                      }}
                    >
                      {factor.weight}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Pricing ──────────────────────────────────────── */}
        <section id="pricing" className="section">
          <div className="container">
            <div style={{ marginBottom: "var(--space-12)" }}>
              <h2
                style={{
                  fontSize: "0.6875rem",
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                  marginBottom: "var(--space-2)",
                }}
              >
                Pricing
              </h2>
              <p
                style={{
                  fontSize: "1.125rem",
                  fontWeight: 500,
                  color: "var(--text-primary)",
                }}
              >
                Straightforward subscription tiers. No annual commitment pressure.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "0",
                borderLeft: "1px solid var(--border)",
                borderTop: "1px solid var(--border)",
              }}
            >
              {PRICING_TIERS.map((tier) => (
                <div
                  key={tier.id}
                  style={{
                    padding: "var(--space-10)",
                    borderRight: "1px solid var(--border)",
                    borderBottom: "1px solid var(--border)",
                    backgroundColor: tier.highlighted
                      ? "var(--navy)"
                      : "var(--bg-base)",
                    position: "relative",
                  }}
                >
                  {tier.highlighted && (
                    <div
                      style={{
                        position: "absolute",
                        top: "var(--space-4)",
                        right: "var(--space-4)",
                        fontSize: "0.625rem",
                        fontWeight: 600,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "var(--bg-base)",
                        backgroundColor: "var(--green)",
                        padding: "2px 8px",
                      }}
                    >
                      Most Selected
                    </div>
                  )}

                  <h3
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      color: tier.highlighted
                        ? "rgba(255,255,255,0.7)"
                        : "var(--text-muted)",
                      marginBottom: "var(--space-3)",
                    }}
                  >
                    {tier.name}
                  </h3>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: "var(--space-1)",
                      marginBottom: "var(--space-2)",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "2rem",
                        fontWeight: 500,
                        color: tier.highlighted ? "var(--bg-base)" : "var(--text-primary)",
                      }}
                    >
                      £{tier.price}
                    </span>
                    <span
                      style={{
                        fontSize: "0.875rem",
                        color: tier.highlighted
                          ? "rgba(255,255,255,0.5)"
                          : "var(--text-muted)",
                      }}
                    >
                      /month
                    </span>
                  </div>

                  <p
                    style={{
                      fontSize: "0.8125rem",
                      color: tier.highlighted
                        ? "rgba(255,255,255,0.6)"
                        : "var(--text-muted)",
                      lineHeight: 1.6,
                      marginBottom: "var(--space-8)",
                      minHeight: "48px",
                    }}
                  >
                    {tier.description}
                  </p>

                  <Link
                    href="/sign-up"
                    style={{
                      display: "block",
                      padding: "10px 20px",
                      textAlign: "center",
                      border: tier.highlighted
                        ? "1px solid rgba(255,255,255,0.3)"
                        : "1px solid var(--border-strong)",
                      color: tier.highlighted ? "var(--bg-base)" : "var(--text-primary)",
                      backgroundColor: "transparent",
                      fontSize: "0.8125rem",
                      fontWeight: 500,
                      letterSpacing: "0.02em",
                      textDecoration: "none",
                      marginBottom: "var(--space-8)",
                      transition: "all 150ms",
                    }}
                  >
                    Get Started
                  </Link>

                  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {tier.features.map((feat) => (
                      <li
                        key={feat}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "var(--space-3)",
                          padding: "var(--space-2) 0",
                          borderTop: `1px solid ${
                            tier.highlighted
                              ? "rgba(255,255,255,0.08)"
                              : "var(--border)"
                          }`,
                        }}
                      >
                        <span
                          style={{
                            color: tier.highlighted
                              ? "rgba(255,255,255,0.4)"
                              : "var(--green)",
                            fontSize: "0.75rem",
                            marginTop: "2px",
                            flexShrink: 0,
                          }}
                        >
                          ✓
                        </span>
                        <span
                          style={{
                            fontSize: "0.8125rem",
                            color: tier.highlighted
                              ? "rgba(255,255,255,0.7)"
                              : "var(--text-secondary)",
                            lineHeight: 1.5,
                          }}
                        >
                          {feat}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────── */}
        <section
          id="faq"
          className="section"
          style={{ backgroundColor: "var(--bg-warm)" }}
        >
          <div className="container-narrow">
            <div style={{ marginBottom: "var(--space-10)" }}>
              <h2
                style={{
                  fontSize: "0.6875rem",
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                  marginBottom: "var(--space-2)",
                }}
              >
                Frequently Asked Questions
              </h2>
            </div>

            <div>
              {FAQS.map((faq, i) => (
                <div
                  key={i}
                  style={{
                    padding: "var(--space-6) 0",
                    borderTop: "1px solid var(--border)",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "0.9375rem",
                      fontWeight: 500,
                      color: "var(--text-primary)",
                      marginBottom: "var(--space-3)",
                    }}
                  >
                    {faq.q}
                  </h3>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--text-muted)",
                      lineHeight: 1.75,
                    }}
                  >
                    {faq.a}
                  </p>
                </div>
              ))}
              <div style={{ borderTop: "1px solid var(--border)" }} />
            </div>
          </div>
        </section>

        {/* ── CTA Band ─────────────────────────────────────── */}
        <section
          style={{
            padding: "var(--space-16) 0",
            borderTop: "1px solid var(--border)",
            backgroundColor: "var(--bg-stone)",
          }}
        >
          <div className="container">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: "1rem",
                    fontWeight: 500,
                    color: "var(--text-primary)",
                    marginBottom: "var(--space-1)",
                  }}
                >
                  Access the full intelligence platform.
                </p>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--text-muted)",
                  }}
                >
                  Start with Professional at £99/month. Cancel at any time.
                </p>
              </div>
              <Link
                href="/sign-up"
                style={{
                  display: "inline-block",
                  padding: "12px 32px",
                  backgroundColor: "var(--navy)",
                  color: "var(--bg-base)",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  letterSpacing: "0.03em",
                  textDecoration: "none",
                  flexShrink: 0,
                }}
              >
                Request Access
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
