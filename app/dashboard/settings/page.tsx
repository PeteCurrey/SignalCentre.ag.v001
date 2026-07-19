import type { Metadata } from "next";

export const metadata: Metadata = { title: "Settings" };

const SETTING_GROUPS = [
  {
    title: "Display Preferences",
    settings: [
      { label: "Default Asset Class", description: "The asset class shown on dashboard load.", value: "All" },
      { label: "Default Timeframe", description: "Preferred analysis timeframe.", value: "H4" },
      { label: "Score Display", description: "Show scores as numbers or bars.", value: "Both" },
    ],
  },
  {
    title: "Notification Preferences",
    settings: [
      { label: "Email Alerts", description: "Receive triggered alerts via email.", value: "Enabled" },
      { label: "Alert Digest", description: "Daily summary of alert activity.", value: "Disabled" },
    ],
  },
  {
    title: "Data Preferences",
    settings: [
      { label: "Refresh Interval", description: "How often the live feed updates.", value: "60 seconds" },
      { label: "Historical Depth", description: "Timestamp lookback in feed.", value: "24 hours" },
    ],
  },
];

export default function SettingsPage() {
  return (
    <div style={{ padding: "var(--space-8) var(--space-10)" }}>
      <div style={{ marginBottom: "var(--space-8)", paddingBottom: "var(--space-6)", borderBottom: "1px solid var(--border)" }}>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 500, color: "var(--text-primary)", marginBottom: "var(--space-1)" }}>Settings</h1>
        <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Platform preferences and configuration.</p>
      </div>

      <div style={{ maxWidth: "640px" }}>
        {SETTING_GROUPS.map((group) => (
          <div key={group.title} style={{ marginBottom: "var(--space-10)" }}>
            <h2 style={{ fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "var(--space-4)" }}>
              {group.title}
            </h2>
            <div style={{ border: "1px solid var(--border)" }}>
              {group.settings.map((setting, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "var(--space-4) var(--space-5)",
                    borderBottom: i < group.settings.length - 1 ? "1px solid var(--border)" : "none",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--text-primary)", marginBottom: "2px" }}>
                      {setting.label}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {setting.description}
                    </div>
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.8125rem",
                      color: "var(--navy)",
                      fontWeight: 500,
                    }}
                  >
                    {setting.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}

        <p style={{ fontSize: "0.75rem", color: "var(--text-disabled)" }}>
          Settings persistence is available in Phase 2. Current values are platform defaults.
        </p>
      </div>
    </div>
  );
}
