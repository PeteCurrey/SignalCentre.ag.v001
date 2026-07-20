import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "About",
  description: "Signal Centre — market intelligence methodology, principles and approach.",
};

export default function AboutPage() {
  return (
    <>
      <Header />
      <main>
        {/* Header */}
        <section
          style={{
            padding: "var(--space-20) 0 var(--space-16)",
            borderBottom: "1px solid var(--border)",
            backgroundColor: "var(--bg-warm)",
          }}
        >
          <div className="container-narrow">
            <h1
              style={{
                fontSize: "2rem",
                fontWeight: 500,
                color: "var(--text-primary)",
                letterSpacing: "-0.02em",
                marginBottom: "var(--space-4)",
              }}
            >
              About Signal Centre
            </h1>
            <p
              style={{
                fontSize: "1.125rem",
                color: "var(--text-secondary)",
                lineHeight: 1.6,
                maxWidth: "600px",
              }}
            >
              We build institutional-grade decision support infrastructure for traders who demand transparency over marketing claims.
            </p>
          </div>
        </section>

        {/* Mission Section */}
        <section className="section">
          <div className="container-narrow">
            <div style={{ marginBottom: "var(--space-12)" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 500, color: "var(--text-primary)", marginBottom: "var(--space-4)" }}>The Mission</h2>
              <p style={{ fontSize: "1rem", color: "var(--text-secondary)", lineHeight: 1.8, marginBottom: "var(--space-6)" }}>
                Signal Centre is a market intelligence platform built for professional traders, proprietary desks, and sophisticated retail participants who require institutional-grade analysis infrastructure.
              </p>
              </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "var(--space-16)",
                marginBottom: "var(--space-16)",
              }}
            >
              <div>
                <h2 style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "var(--space-4)" }}>
                  What we are
                </h2>
                <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", lineHeight: 1.8, marginBottom: "var(--space-4)" }}>
                  Signal Centre is a market intelligence platform built for professional traders, proprietary desks, and sophisticated retail participants who require institutional-grade analysis infrastructure.
                </p>
                <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", lineHeight: 1.8 }}>
                  We do not issue trading signals. We do not tell you what to buy or sell. We provide structured intelligence — conviction scoring, AI consensus analysis, confluence mapping, and risk context — to support your own analytical process.
                </p>
              </div>

              <div>
                <h2 style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "var(--space-4)" }}>
                  What we are not
                </h2>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {[
                    "A Telegram signal group",
                    "A prop-firm dashboard",
                    "A retail copy-trading service",
                    "A regulated financial adviser",
                    "A black-box algorithm",
                    "A prediction service",
                  ].map((item) => (
                    <li
                      key={item}
                      style={{
                        fontSize: "0.9375rem",
                        color: "var(--text-muted)",
                        padding: "var(--space-2) 0",
                        borderBottom: "1px solid var(--border)",
                        display: "flex",
                        gap: "var(--space-3)",
                      }}
                    >
                      <span style={{ color: "var(--burgundy)" }}>×</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "var(--space-10)", marginBottom: "var(--space-10)" }}>
              <h2 style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "var(--space-5)" }}>
                Core Principles
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0", borderLeft: "1px solid var(--border)", borderTop: "1px solid var(--border)" }}>
                {[
                  {
                    title: "Transparency",
                    body: "Every scoring factor is documented and published. Methodology changes are versioned. We do not hide how the scores are calculated.",
                  },
                  {
                    title: "Precision",
                    body: "Intelligence without precision is noise. Every data point is sourced, normalised, and weighted according to a published methodology.",
                  },
                  {
                    title: "Disagreement is valuable",
                    body: "When AI models disagree, we display that disagreement prominently. Suppressing dissenting signals would corrupt the intelligence product.",
                  },
                  {
                    title: "No urgency, no pressure",
                    body: "We will never manufacture urgency. There are no countdown timers, no expiring signals, no FOMO mechanics.",
                  },
                ].map((p) => (
                  <div
                    key={p.title}
                    style={{
                      padding: "var(--space-8)",
                      borderRight: "1px solid var(--border)",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "var(--space-3)" }}>
                      {p.title}
                    </h3>
                    <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: 1.7 }}>
                      {p.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
