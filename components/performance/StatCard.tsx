import React from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  highlight?: boolean;
}

export function StatCard({ title, value, subtitle, trend, trendValue, highlight }: StatCardProps) {
  return (
    <div
      style={{
        backgroundColor: highlight ? "var(--bg-stone)" : "var(--bg-base)",
        border: "1px solid var(--border)",
        padding: "var(--space-5)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-2)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {highlight && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 4,
            height: "100%",
            backgroundColor: "var(--navy)",
          }}
        />
      )}
      <span
        style={{
          fontSize: "0.6875rem",
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--text-muted)",
        }}
      >
        {title}
      </span>
      <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-3)" }}>
        <span
          style={{
            fontSize: "2rem",
            fontWeight: 500,
            fontFamily: "var(--font-mono)",
            color: "var(--text-primary)",
            letterSpacing: "-0.02em",
            lineHeight: 1,
          }}
        >
          {value}
        </span>
        {trend && trendValue && (
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              fontFamily: "var(--font-mono)",
              color:
                trend === "up"
                  ? "var(--green)"
                  : trend === "down"
                  ? "var(--burgundy)"
                  : "var(--text-muted)",
            }}
          >
            {trend === "up" ? "↑" : trend === "down" ? "↓" : "−"} {trendValue}
          </span>
        )}
      </div>
      {subtitle && (
        <span
          style={{
            fontSize: "0.75rem",
            color: "var(--text-secondary)",
            marginTop: "var(--space-1)",
          }}
        >
          {subtitle}
        </span>
      )}
    </div>
  );
}
