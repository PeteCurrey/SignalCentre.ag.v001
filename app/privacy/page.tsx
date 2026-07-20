import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for Signal Centre.",
};

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main>
        <section style={{ padding: "var(--space-20) 0 var(--space-16)", borderBottom: "1px solid var(--border)", minHeight: "60vh" }}>
          <div className="container-narrow">
            <h1 style={{ fontSize: "2rem", fontWeight: 500, color: "var(--text-primary)", letterSpacing: "-0.02em", marginBottom: "var(--space-8)" }}>
              Privacy Policy
            </h1>
            <div style={{ fontSize: "1rem", color: "var(--text-secondary)", lineHeight: 1.8 }}>
              <p style={{ marginBottom: "var(--space-6)" }}>
                Signal Centre is committed to protecting your privacy. This policy outlines how we collect, use, and protect your personal information.
              </p>
              <h2 style={{ fontSize: "1.25rem", color: "var(--text-primary)", marginBottom: "var(--space-4)", marginTop: "var(--space-8)" }}>1. Information We Collect</h2>
              <p style={{ marginBottom: "var(--space-6)" }}>
                When you register for an account, we collect basic information such as your name, email address, and authentication details via our authentication provider (Clerk). We do not directly store your payment information; all payments are processed securely by our payment gateway.
              </p>
              <h2 style={{ fontSize: "1.25rem", color: "var(--text-primary)", marginBottom: "var(--space-4)", marginTop: "var(--space-8)" }}>2. How We Use Your Information</h2>
              <p style={{ marginBottom: "var(--space-6)" }}>
                We use your information solely to provide and improve the Signal Centre service, to communicate with you regarding your account or platform updates, and to ensure the security of our platform. We do not sell your personal data to third parties.
              </p>
              <h2 style={{ fontSize: "1.25rem", color: "var(--text-primary)", marginBottom: "var(--space-4)", marginTop: "var(--space-8)" }}>3. Data Security</h2>
              <p style={{ marginBottom: "var(--space-6)" }}>
                We employ industry-standard security measures to protect your data. Your data is stored securely in our database (Supabase) and access is strictly controlled.
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
