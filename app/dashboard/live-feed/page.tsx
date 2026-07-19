import type { Metadata } from "next";
import { LiveFeedTable } from "@/components/feed/LiveFeedTable";
import { MOCK_SIGNALS, MARKET_SUMMARY } from "@/lib/data/mock-signals";
import { getRelativeTime } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Live Intelligence Feed",
};

export default function LiveFeedPage() {
  return (
    <div style={{ padding: "var(--space-8) var(--space-10)" }}>
      {/* Page Header */}
      <div
        style={{
          marginBottom: "var(--space-6)",
          paddingBottom: "var(--space-6)",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "1.25rem",
              fontWeight: 500,
              color: "var(--text-primary)",
              marginBottom: "var(--space-1)",
            }}
          >
            Live Intelligence Feed
          </h1>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
            {MOCK_SIGNALS.length} instruments · Last updated{" "}
            {getRelativeTime(MARKET_SUMMARY.lastUpdated)}
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-6)",
          }}
        >
          <div
            style={{
              textAlign: "right",
            }}
          >
            <div
              style={{
                fontSize: "0.6875rem",
                color: "var(--text-muted)",
                marginBottom: "2px",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              High Conviction
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "1.25rem",
                fontWeight: 500,
                color: "var(--green)",
              }}
            >
              {MARKET_SUMMARY.highConviction}
            </div>
          </div>
          <div
            style={{
              textAlign: "right",
            }}
          >
            <div
              style={{
                fontSize: "0.6875rem",
                color: "var(--text-muted)",
                marginBottom: "2px",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              AI Aligned
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "1.25rem",
                fontWeight: 500,
                color: "var(--navy)",
              }}
            >
              {MARKET_SUMMARY.consensusDistribution.aligned}
            </div>
          </div>
          <div
            style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                backgroundColor: "var(--green)",
                borderRadius: "50%",
                display: "inline-block",
              }}
            />
            <span
              style={{
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                fontFamily: "var(--font-mono)",
              }}
            >
              Live
            </span>
          </div>
        </div>
      </div>

      {/* Full table with filters */}
      <div style={{ border: "1px solid var(--border)" }}>
        <LiveFeedTable signals={MOCK_SIGNALS} showFilters isPublic={false} />
      </div>

      {/* Footer note */}
      <p
        style={{
          marginTop: "var(--space-4)",
          fontSize: "0.75rem",
          color: "var(--text-disabled)",
        }}
      >
        Signals refresh automatically every 60 seconds. Conviction scores are
        recalculated on each data pull. Historical archive available in Research.
      </p>
    </div>
  );
}
