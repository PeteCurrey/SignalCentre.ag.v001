import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Legal",
  description: "Legal information and regulatory status for Signal Centre.",
};

export default function LegalPage() {
  return (
    <>
      <Header />
      <main>
        <section style={{ padding: "var(--space-20) 0 var(--space-16)", borderBottom: "1px solid var(--border)", minHeight: "60vh" }}>
          <div className="container-narrow">
            <h1 style={{ fontSize: "2rem", fontWeight: 500, color: "var(--text-primary)", letterSpacing: "-0.02em", marginBottom: "var(--space-8)" }}>
              Legal & Regulatory
            </h1>
            <div style={{ fontSize: "1rem", color: "var(--text-secondary)", lineHeight: 1.8 }}>
              <p style={{ marginBottom: "var(--space-6)" }}>
                Signal Centre provides market intelligence tools and AI consensus models for professional traders, proprietary trading desks, and sophisticated investors.
              </p>
              <h2 style={{ fontSize: "1.25rem", color: "var(--text-primary)", marginBottom: "var(--space-4)", marginTop: "var(--space-8)" }}>Regulatory Status</h2>
              <p style={{ marginBottom: "var(--space-6)" }}>
                Signal Centre is an independent market intelligence provider. We are <strong>not</strong> regulated by the Financial Conduct Authority (FCA) or any other financial regulatory body. We do not hold client funds, we do not execute trades, and we do not provide bespoke investment advice or portfolio management services.
              </p>
              <h2 style={{ fontSize: "1.25rem", color: "var(--text-primary)", marginBottom: "var(--space-4)", marginTop: "var(--space-8)" }}>Nature of Service</h2>
              <p style={{ marginBottom: "var(--space-6)" }}>
                All information, analysis, and signals provided by Signal Centre are for educational and informational purposes only. The platform acts as a decision-support infrastructure. You must conduct your own due diligence and consult with a licensed financial advisor before making any trading decisions.
              </p>
              <ul style={{ listStyle: "none", padding: 0, marginTop: "var(--space-8)" }}>
                <li style={{ marginBottom: "var(--space-4)" }}>
                  <Link href="/terms" style={{ color: "var(--navy)", textDecoration: "underline", fontWeight: 500 }}>
                    Read our full Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" style={{ color: "var(--navy)", textDecoration: "underline", fontWeight: 500 }}>
                    Read our Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
