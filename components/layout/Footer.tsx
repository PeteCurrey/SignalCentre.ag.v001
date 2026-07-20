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

const LEGAL_NOTICE = `Signal Centre provides market intelligence for informational purposes only. 
Trading financial instruments involves substantial risk and may result in the loss of your invested capital. 
You should not invest money that you cannot afford to lose. The platform does not issue financial advice, 
investment recommendations, or direct trading signals. You must independently evaluate the merits of any 
potential trades and consult an independent financial advisor if you are unsure of the risks. Past 
performance is not indicative of future results. AI consensus models can produce inaccurate outputs and 
should not be solely relied upon. Signal Centre and its directors, employees, and affiliates accept no 
liability for any losses or damages incurred as a result of using the platform. You alone assume the sole 
responsibility of evaluating the merits and risks associated with the use of any information on the platform 
before making any decisions based on such information. Over-the-counter derivatives are complex instruments 
and come with a high risk of losing money rapidly due to leverage. Retail investor accounts often lose money 
when trading CFDs. You should consider whether you understand how CFDs work and whether you can afford to 
take the high risk of losing your money. Crypto assets are highly volatile and largely unregulated. There is 
no regulatory protection for crypto asset investors and you could lose all of your money. Signal Centre does 
not provide services to residents of the United States, Japan, Iran, Syria, North Korea, or any other 
jurisdiction where such distribution or use would be contrary to local law or regulation. By using this 
website, you acknowledge that you have read, understood, and agree to be bound by our Terms of Service and 
Privacy Policy. If you do not agree, you must cease using the platform immediately. The information on this 
site is not directed at residents of any particular country and is not intended for distribution to, or use 
by, any person in any country or jurisdiction where such distribution or use would be contrary to local law 
or regulation. Any reliance on the material on this site is at your own risk. The conviction scores and 
risk grades are quantitative measures based on historical relationships and do not guarantee any specific 
loss. Signal Centre is not regulated by the FCA. Ensure you understand the risks involved.`;

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
              © {new Date().getFullYear()} Signal Centre Ltd. All rights reserved.
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
