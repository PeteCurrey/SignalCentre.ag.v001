import type { Metadata } from "next";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase/client";

export const metadata: Metadata = { title: "Performance" };
export const revalidate = 0;

export default async function PerformancePage() {
  let signals: any[] = [];
  
  if (isSupabaseConfigured()) {
    try {
      const db = createServerClient();
      const { data } = await db.from("signals").select("created_at, conviction, risk_grade");
      if (data) signals = data;
    } catch (e) {
      console.error("Failed to fetch performance data", e);
    }
  }

  // Group by month
  const grouped: Record<string, any> = {};
  for (const s of signals) {
    if (!s.created_at) continue;
    const date = new Date(s.created_at);
    const period = date.toLocaleString('default', { month: 'short', year: 'numeric' });
    
    if (!grouped[period]) {
      grouped[period] = {
        period,
        totalSignals: 0,
        highConviction: 0,
        grade_a: 0,
        grade_b: 0,
        grade_c: 0,
      };
    }
    
    grouped[period].totalSignals++;
    if (s.conviction >= 70) grouped[period].highConviction++;
    
    if (s.risk_grade === 'A_PLUS' || s.risk_grade === 'A') grouped[period].grade_a++;
    else if (s.risk_grade === 'B') grouped[period].grade_b++;
    else if (s.risk_grade === 'C' || s.risk_grade === 'D') grouped[period].grade_c++;
  }

  const performanceData = Object.values(grouped).sort((a, b) => {
    return new Date(b.period).getTime() - new Date(a.period).getTime();
  });

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
          <strong style={{ color: "var(--text-primary)" }}>Transparency note:</strong> Signal Centre does not display win/loss rates. We track signal distribution, conviction accuracy, and AI consensus calibration. Outcome tracking requires user-defined criteria and is planned for Phase 2.
        </p>
      </div>

      {/* Historical table */}
      <div style={{ border: "1px solid var(--border)" }}>
        {performanceData.length > 0 ? (
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
              {performanceData.map((row) => (
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
        ) : (
          <div style={{ padding: "var(--space-6)", textAlign: "center", color: "var(--text-muted)", fontSize: "0.8125rem" }}>
            No historical performance data available yet.
          </div>
        )}
      </div>
    </div>
  );
}
