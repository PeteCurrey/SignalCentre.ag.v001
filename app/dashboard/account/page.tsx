import type { Metadata } from "next";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  return (
    <div style={{ padding: "var(--space-8) var(--space-10)" }}>
      <div
        style={{
          marginBottom: "var(--space-8)",
          paddingBottom: "var(--space-6)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <h1
          style={{
            fontSize: "1.25rem",
            fontWeight: 500,
            color: "var(--text-primary)",
            marginBottom: "var(--space-1)",
          }}
        >
          Account
        </h1>
        <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
          Manage your subscription and account details.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "var(--space-8)",
        }}
      >
        {/* Profile */}
        <div>
          <h2
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--text-muted)",
              marginBottom: "var(--space-5)",
            }}
          >
            Profile
          </h2>
          <div style={{ border: "1px solid var(--border)" }}>
            {[
              { label: "Name", value: "—" },
              { label: "Email", value: "—" },
              { label: "Member Since", value: "—" },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "var(--space-4) var(--space-5)",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <span
                  style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}
                >
                  {item.label}
                </span>
                <span
                  style={{
                    fontSize: "0.8125rem",
                    color: "var(--text-primary)",
                    fontWeight: 500,
                  }}
                >
                  {item.value}
                </span>
              </div>
            ))}

            <div
              style={{
                padding: "var(--space-4) var(--space-5)",
                backgroundColor: "var(--bg-warm)",
              }}
            >
              <p
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--text-muted)",
                  lineHeight: 1.65,
                }}
              >
                Authentication is configured separately. Add your Clerk API
                keys to <code style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>.env.local</code>{" "}
                to enable sign-in.
              </p>
            </div>
          </div>
        </div>

        {/* Subscription */}
        <div>
          <h2
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--text-muted)",
              marginBottom: "var(--space-5)",
            }}
          >
            Subscription
          </h2>
          <div style={{ border: "1px solid var(--border)" }}>
            {[
              { label: "Current Plan", value: "Professional" },
              { label: "Monthly Fee", value: "£99.00" },
              { label: "Renewal Date", value: "24 Jul 2026" },
              {
                label: "Status",
                value: "Active",
                color: "var(--green)" as string,
              },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "var(--space-4) var(--space-5)",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <span
                  style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}
                >
                  {item.label}
                </span>
                <span
                  style={{
                    fontSize: "0.8125rem",
                    fontWeight: 500,
                    color: (item as { color?: string }).color || "var(--text-primary)",
                  }}
                >
                  {item.value}
                </span>
              </div>
            ))}
            <div
              style={{
                padding: "var(--space-4) var(--space-5)",
                display: "flex",
                gap: "var(--space-3)",
              }}
            >
              <button
                style={{
                  padding: "7px 16px",
                  border: "1px solid var(--border-strong)",
                  background: "transparent",
                  fontSize: "0.8125rem",
                  cursor: "pointer",
                  fontFamily: "var(--font-sans)",
                  color: "var(--text-secondary)",
                }}
              >
                Upgrade Plan
              </button>
              <button
                style={{
                  padding: "7px 16px",
                  border: "1px solid var(--border)",
                  background: "transparent",
                  fontSize: "0.8125rem",
                  cursor: "pointer",
                  fontFamily: "var(--font-sans)",
                  color: "var(--burgundy)",
                }}
              >
                Cancel Subscription
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
