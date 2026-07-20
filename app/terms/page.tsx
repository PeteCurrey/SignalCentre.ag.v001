import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service for Signal Centre.",
};

export default function TermsPage() {
  return (
    <>
      <Header />
      <main>
        <section style={{ padding: "var(--space-20) 0 var(--space-16)", borderBottom: "1px solid var(--border)", minHeight: "60vh" }}>
          <div className="container-narrow">
            <h1 style={{ fontSize: "2rem", fontWeight: 500, color: "var(--text-primary)", letterSpacing: "-0.02em", marginBottom: "var(--space-8)" }}>
              Terms of Service
            </h1>
            <div style={{ fontSize: "1rem", color: "var(--text-secondary)", lineHeight: 1.8 }}>
              <p style={{ marginBottom: "var(--space-6)" }}>
                By using Signal Centre, you agree to these terms. Signal Centre provides market intelligence and AI consensus analysis for informational purposes only. We do not provide regulated financial advice.
              </p>
              <h2 style={{ fontSize: "1.25rem", color: "var(--text-primary)", marginBottom: "var(--space-4)", marginTop: "var(--space-8)" }}>1. No Financial Advice</h2>
              <p style={{ marginBottom: "var(--space-6)" }}>
                The content on this platform does not constitute financial advice, investment advice, trading advice, or any other sort of advice. You should not treat any of the platform's content as such. You alone assume the sole responsibility of evaluating the merits and risks associated with the use of any information on the platform before making any decisions based on such information.
              </p>
              <h2 style={{ fontSize: "1.25rem", color: "var(--text-primary)", marginBottom: "var(--space-4)", marginTop: "var(--space-8)" }}>2. Subscription and Access</h2>
              <p style={{ marginBottom: "var(--space-6)" }}>
                Subscriptions are billed on a monthly basis. You may cancel your subscription at any time. We do not offer prorated refunds for partial months. Access continues until the end of your current billing period following a cancellation.
              </p>
              <h2 style={{ fontSize: "1.25rem", color: "var(--text-primary)", marginBottom: "var(--space-4)", marginTop: "var(--space-8)" }}>3. Data and Accuracy</h2>
              <p style={{ marginBottom: "var(--space-6)" }}>
                While we strive to provide accurate and timely information, Signal Centre does not guarantee the accuracy, completeness, or timeliness of the data presented. Trading in financial markets involves significant risk of loss.
              </p>
              <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginTop: "var(--space-12)" }}>
                Last updated: 20 July 2026
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
