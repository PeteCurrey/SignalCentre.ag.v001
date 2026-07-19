import Link from "next/link";

const FOOTER_COLS = [
  {
    title: "Platform",
    links: [
      { label: "Live Intelligence Feed", href: "/dashboard/live-feed" },
      { label: "Forex Coverage", href: "/dashboard/forex" },
      { label: "Indices Coverage", href: "/dashboard/indices" },
      { label: "Commodities", href: "/dashboard/commodities" },
      { label: "Crypto Intelligence", href: "/dashboard/crypto" },
    ],
  },
  {
    title: "Methodology",
    links: [
      { label: "Signal Scoring", href: "/methodology#scoring" },
      { label: "Consensus Engine", href: "/methodology#consensus" },
      { label: "Data Sources", href: "/methodology#data" },
      { label: "Risk Framework", href: "/methodology#risk" },
      { label: "Accuracy Tracking", href: "/methodology#accuracy" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Pricing", href: "/pricing" },
      { label: "Legal", href: "/legal" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
    ],
  },
];

const LEGAL_NOTICE = `Signal Center provides market intelligence for informational purposes only. 
Nothing on this platform constitutes financial advice, an invitation to trade, or a 
recommendation to buy or sell any financial instrument. Past signal accuracy is not 
indicative of future results. Trading financial instruments carries significant risk of 
loss. Signal Center is not regulated by the FCA. Ensure you understand the risks involved.`;

export function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--border)",
        backgroundColor: "var(--bg-warm)",
        padding: "var(--space-16) 0 var(--space-8)",
      }}
    >
      <div
        style={{
          maxWidth: "var(--max-width)",
          margin: "0 auto",
          padding: "0 var(--space-8)",
        }}
      >
        {/* Top section */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr 1fr",
            gap: "var(--space-12)",
            marginBottom: "var(--space-16)",
          }}
        >
          {/* Brand */}
          <div>
            <div style={{ marginBottom: "var(--space-4)" }}>
              <span
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  letterSpacing: "0.05em",
                  color: "var(--navy)",
                }}
              >
                SIGNAL
              </span>
              <span
                style={{
                  width: "1px",
                  height: "12px",
                  backgroundColor: "var(--platinum)",
                  margin: "0 6px",
                  display: "inline-block",
                  verticalAlign: "middle",
                }}
              />
              <span
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.875rem",
                  fontWeight: 300,
                  letterSpacing: "0.12em",
                  color: "var(--navy)",
                }}
              >
                CENTER
              </span>
            </div>
            <p
              style={{
                fontSize: "0.8125rem",
                color: "var(--text-muted)",
                lineHeight: "1.6",
                maxWidth: "220px",
              }}
            >
              Institutional market intelligence for professional traders and
              proprietary desks.
            </p>
          </div>

          {/* Nav Columns */}
          {FOOTER_COLS.map((col) => (
            <div key={col.title}>
              <h6
                style={{
                  fontSize: "0.625rem",
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                  marginBottom: "var(--space-4)",
                }}
              >
                {col.title}
              </h6>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {col.links.map((link) => (
                  <li key={link.href} style={{ marginBottom: "var(--space-2)" }}>
                    <Link
                      href={link.href}
                      style={{
                        fontSize: "0.8125rem",
                        color: "var(--text-muted)",
                        textDecoration: "none",
                        transition: "color var(--duration-base)",
                      }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Legal Divider */}
        <div
          style={{
            borderTop: "1px solid var(--border)",
            paddingTop: "var(--space-8)",
          }}
        >
          <p
            style={{
              fontSize: "0.75rem",
              color: "var(--text-disabled)",
              lineHeight: "1.7",
              maxWidth: "720px",
              marginBottom: "var(--space-6)",
            }}
          >
            {LEGAL_NOTICE}
          </p>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: "0.75rem",
                color: "var(--text-disabled)",
                fontFamily: "var(--font-mono)",
              }}
            >
              © {new Date().getFullYear()} Signal Center Ltd. All rights reserved.
            </span>
            <span
              style={{
                fontSize: "0.6875rem",
                color: "var(--text-disabled)",
                letterSpacing: "0.04em",
              }}
            >
              signalcenter.co.uk
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
