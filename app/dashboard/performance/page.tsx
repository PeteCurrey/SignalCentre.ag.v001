import type { Metadata } from "next";
import { MOCK_SIGNALS } from "@/lib/data/mock-signals";

export const metadata: Metadata = { title: "Performance" };

// Generate mock historical performance data
const PERFORMANCE_DATA = [
  { period: "Jun 2026", totalSignals: 48, highConviction: 18, grade_a: 14, grade_b: 22, grade_c: 12 },
  { period: "May 2026", totalSignals: 52, highConviction: 21, grade_a: 16, grade_b: 24, grade_c: 12 },
  { period: "Apr 2026", totalSignals: 44, highConviction: 16, grade_a: 12, grade_b: 20, grade_c: 12 },
  { period: "Mar 2026", totalSignals: 61, highConviction: 24, grade_a: 18, grade_b: 28, grade_c: 15 },
];

export default function PerformancePage() {
  return (
    <div style={{ padding: "var(--space-8) var(--space-10)" }}>
      <div style={{ marginBottom: "var(--space-8)", paddingBottom: "var(--space-6)", borderBottom: "1px solid var(--border)" }}>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 500, color: "var(--text-primary)", marginBottom: "var(--space-1)" }}>Signal Performance</h1>
        <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Historical signal distribution and conviction tracking.</p>
      </div>

      {/* Note */}
      <div
        style={{
          padding: "var(--space-4) var(--space-5)",
          backgroundColor: "var(--bg-warm)",
          border: "1px solid var(--border)",
          borderLeft: "3px solid var(--amber)",
          marginBottom: "var(--space-8)",
        }}
      >
        <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.65 }}>
          <strong style={{ color: "var(--text-primary)" }}>Transparency note:</strong> Signal Center does not display win/loss rates. We track signal distribution, conviction accuracy, and AI consensus calibration. Outcome tracking requires user-defined criteria and is planned for Phase 2.
        </p>
      </div>

      {/* Historical table */}
      <div style={{ border: "1px solid var(--border)" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Period</th>
              <th>Total Signals</th>
              <th>High Conviction (≥70)</th>
              <th>Grade A / A+</th>
              <th>Grade B</th>
              <th>Grade C / D</th>
            </tr>
          </thead>
          <tbody>
            {PERFORMANCE_DATA.map((row) => (
              <tr key={row.period}>
                <td>
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 500 }}>
                    {row.period}
                  </span>
                </td>
                <td>
                  <span style={{ fontFamily: "var(--font-mono)" }}>{row.totalSignals}</span>
                </td>
                <td>
                  <span style={{ fontFamily: "var(--font-mono)", color: "var(--green)" }}>{row.highConviction}</span>
                </td>
                <td>
                  <span style={{ fontFamily: "var(--font-mono)", color: "var(--green)" }}>{row.grade_a}</span>
                </td>
                <td>
                  <span style={{ fontFamily: "var(--font-mono)", color: "var(--amber)" }}>{row.grade_b}</span>
                </td>
                <td>
                  <span style={{ fontFamily: "var(--font-mono)", color: "var(--burgundy)" }}>{row.grade_c}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
