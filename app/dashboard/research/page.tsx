import type { Metadata } from "next";

export const metadata: Metadata = { title: "Research" };

export default function ResearchPage() {
  return (
    <div style={{ padding: "var(--space-8) var(--space-10)" }}>
      <div style={{ marginBottom: "var(--space-8)", paddingBottom: "var(--space-6)", borderBottom: "1px solid var(--border)" }}>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 500, color: "var(--text-primary)", marginBottom: "var(--space-1)" }}>Research Library</h1>
        <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Curated macro and technical research. Pro Desk and Institutional tiers.</p>
      </div>

      <div
        style={{
          border: "1px solid var(--border)",
          padding: "var(--space-16)",
          textAlign: "center",
          backgroundColor: "var(--bg-warm)",
        }}
      >
        <div style={{ fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "var(--space-3)" }}>
          Coming Soon
        </div>
        <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", maxWidth: "400px", margin: "0 auto" }}>
          The research library will contain curated macro reports, technical analysis archives, and AI-generated weekly briefs. Available to Pro Desk and Institutional subscribers.
        </p>
      </div>
    </div>
  );
}
