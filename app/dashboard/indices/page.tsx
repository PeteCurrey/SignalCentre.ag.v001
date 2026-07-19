import type { Metadata } from "next";
import { LiveFeedTable } from "@/components/feed/LiveFeedTable";
import { getActiveSignals } from "@/lib/data/signals";

export const metadata: Metadata = { title: "Indices Intelligence" };

export const revalidate = 0;

export default async function IndicesPage() {
  const signals = await getActiveSignals("INDICES");
  return (
    <div style={{ padding: "var(--space-8) var(--space-10)" }}>
      <div style={{ marginBottom: "var(--space-6)", paddingBottom: "var(--space-6)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "var(--space-1)" }}>Asset Class</div>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 500, color: "var(--text-primary)", marginBottom: "var(--space-1)" }}>Indices Intelligence</h1>
        <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>{signals.length} active signals · US, European and Asia-Pacific indices</p>
      </div>
      <div style={{ border: "1px solid var(--border)" }}>
        <LiveFeedTable signals={signals} showFilters={false} isPublic={false} />
      </div>
    </div>
  );
}
