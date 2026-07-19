import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PRICING_TIERS } from "@/lib/data/mock-signals";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Straightforward subscription pricing for Signal Center. Professional £99/mo, Pro Desk £249/mo, Institutional £499/mo.",
};

export default function PricingPage() {
  return (
    <>
      <Header />
      <main>
        <section
          style={{
            padding: "var(--space-20) 0 var(--space-16)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div className="container">
            <div style={{ maxWidth: "520px", marginBottom: "var(--space-16)" }}>
              <h1
                style={{
                  fontSize: "2rem",
                  fontWeight: 500,
                  color: "var(--text-primary)",
                  letterSpacing: "-0.02em",
                  marginBottom: "var(--space-4)",
                }}
              >
                Pricing
              </h1>
              <p style={{ fontSize: "1rem", color: "var(--text-secondary)", lineHeight: 1.75 }}>
                Three tiers designed for different levels of analytical requirement. No annual commitment pressure, no introductory pricing that expires. What you see is what you pay.
              </p>
            </div>

            {/* Pricing grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "0",
                borderLeft: "1px solid var(--border)",
                borderTop: "1px solid var(--border)",
                marginBottom: "var(--space-10)",
              }}
            >
              {PRICING_TIERS.map((tier) => (
                <div
                  key={tier.id}
                  style={{
                    padding: "var(--space-10)",
                    borderRight: "1px solid var(--border)",
                    borderBottom: "1px solid var(--border)",
                    backgroundColor: tier.highlighted ? "var(--navy)" : "var(--bg-base)",
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

                  <h2
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      color: tier.highlighted ? "rgba(255,255,255,0.7)" : "var(--text-muted)",
                      marginBottom: "var(--space-3)",
                    }}
                  >
                    {tier.name}
                  </h2>

                  <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "var(--space-2)" }}>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "2.25rem",
                        fontWeight: 500,
                        color: tier.highlighted ? "var(--bg-base)" : "var(--text-primary)",
                      }}
                    >
                      £{tier.price}
                    </span>
                    <span style={{ fontSize: "0.875rem", color: tier.highlighted ? "rgba(255,255,255,0.5)" : "var(--text-muted)" }}>
                      /month
                    </span>
                  </div>

                  <p
                    style={{
                      fontSize: "0.8125rem",
                      color: tier.highlighted ? "rgba(255,255,255,0.6)" : "var(--text-muted)",
                      lineHeight: 1.65,
                      marginBottom: "var(--space-8)",
                      minHeight: "52px",
                    }}
                  >
                    {tier.description}
                  </p>

                  <Link
                    href="/sign-up"
                    style={{
                      display: "block",
                      padding: "11px 20px",
                      textAlign: "center",
                      border: tier.highlighted ? "1px solid rgba(255,255,255,0.25)" : "1px solid var(--border-strong)",
                      color: tier.highlighted ? "var(--bg-base)" : "var(--text-primary)",
                      backgroundColor: "transparent",
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      letterSpacing: "0.02em",
                      textDecoration: "none",
                      marginBottom: "var(--space-8)",
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
                          borderTop: `1px solid ${tier.highlighted ? "rgba(255,255,255,0.08)" : "var(--border)"}`,
                        }}
                      >
                        <span style={{ color: tier.highlighted ? "rgba(255,255,255,0.4)" : "var(--green)", fontSize: "0.75rem", marginTop: "2px", flexShrink: 0 }}>✓</span>
                        <span style={{ fontSize: "0.8125rem", color: tier.highlighted ? "rgba(255,255,255,0.7)" : "var(--text-secondary)", lineHeight: 1.5 }}>
                          {feat}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Note */}
            <div style={{ maxWidth: "560px" }}>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", lineHeight: 1.75, marginBottom: "var(--space-4)" }}>
                All plans are billed monthly. Cancel at any time. Cancellation takes effect at the end of your current billing period — you retain access until that date.
              </p>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", lineHeight: 1.75 }}>
                For institutional arrangements, multi-seat licensing or custom data requirements, contact us directly.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
