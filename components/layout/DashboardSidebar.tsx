"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_SECTIONS = [
  {
    label: "Intelligence",
    items: [
      { label: "Overview", href: "/dashboard" },
      { label: "Live Feed", href: "/dashboard/live-feed" },
    ],
  },
  {
    label: "Asset Classes",
    items: [
      { label: "Forex", href: "/dashboard/forex" },
      { label: "Indices", href: "/dashboard/indices" },
      { label: "Commodities", href: "/dashboard/commodities" },
      { label: "Crypto", href: "/dashboard/crypto" },
    ],
  },
  {
    label: "Analysis",
    items: [
      { label: "Research", href: "/dashboard/research" },
      { label: "Performance", href: "/dashboard/performance" },
      { label: "Alerts", href: "/dashboard/alerts" },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Account", href: "/dashboard/account" },
      { label: "Settings", href: "/dashboard/settings" },
    ],
  },
];

function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav style={{ flex: 1, padding: "var(--space-6) 0" }}>
      {NAV_SECTIONS.map((section) => (
        <div key={section.label} style={{ marginBottom: "var(--space-6)" }}>
          <div
            style={{
              fontSize: "0.5625rem",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--text-disabled)",
              padding: "0 var(--space-5)",
              marginBottom: "var(--space-1)",
              fontFamily: "var(--font-sans)",
            }}
          >
            {section.label}
          </div>
          {section.items.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "block",
                  padding: "6px var(--space-5)",
                  fontSize: "0.8125rem",
                  fontWeight: isActive ? 500 : 400,
                  color: isActive ? "var(--navy)" : "var(--text-muted)",
                  backgroundColor: isActive ? "var(--navy-muted)" : "transparent",
                  textDecoration: "none",
                  borderLeft: isActive
                    ? "2px solid var(--navy)"
                    : "2px solid transparent",
                  transition: "all var(--duration-base)",
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

export function DashboardSidebar() {
  return (
    <aside
      style={{
        width: "var(--sidebar-width)",
        minHeight: "100vh",
        borderRight: "1px solid var(--border)",
        backgroundColor: "var(--bg-warm)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        position: "sticky",
        top: 0,
        height: "100vh",
        overflowY: "auto",
      }}
    >
      {/* Logo */}
      <Link
        href="/"
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 0,
          textDecoration: "none",
          padding: "var(--space-5) var(--space-5)",
          height: "var(--header-height)",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}
      >
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
            margin: "0 7px",
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
      </Link>

      <SidebarNav />

      {/* Bottom — account link */}
      <div
        style={{
          padding: "var(--space-4) var(--space-5)",
          borderTop: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: "var(--space-3)",
        }}
      >
        <div
          style={{
            width: "28px",
            height: "28px",
            backgroundColor: "var(--navy)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: "0.625rem",
              fontWeight: 600,
              color: "var(--bg-base)",
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.04em",
            }}
          >
            SC
          </span>
        </div>
        <Link
          href="/dashboard/account"
          style={{
            fontSize: "0.8125rem",
            color: "var(--text-muted)",
            textDecoration: "none",
          }}
        >
          Account
        </Link>
      </div>
    </aside>
  );
}
