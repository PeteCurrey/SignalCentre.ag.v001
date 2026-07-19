"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { NotificationBell } from "@/components/alerts/NotificationBell";

const NAV_ITEMS = [
  { label: "Platform", href: "/#platform" },
  { label: "Methodology", href: "/methodology" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
];

export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        height: "var(--header-height)",
        backgroundColor: "var(--bg-base)",
        borderBottom: scrolled ? "1px solid var(--border)" : "1px solid transparent",
        transition: "border-color 200ms ease",
      }}
    >
      <div
        style={{
          maxWidth: "var(--max-width)",
          margin: "0 auto",
          padding: "0 var(--space-8)",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "0",
            textDecoration: "none",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "0.9375rem",
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
              height: "14px",
              backgroundColor: "var(--platinum)",
              margin: "0 8px",
              display: "inline-block",
              verticalAlign: "middle",
            }}
          />
          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "0.9375rem",
              fontWeight: 300,
              letterSpacing: "0.12em",
              color: "var(--navy)",
            }}
          >
            CENTER
          </span>
        </Link>

        {/* Navigation */}
        <nav style={{ display: "flex", alignItems: "center", gap: "var(--space-8)" }}>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "0.8125rem",
                fontWeight: 400,
                letterSpacing: "0.02em",
                color:
                  pathname === item.href
                    ? "var(--text-primary)"
                    : "var(--text-muted)",
                textDecoration: "none",
                transition: "color var(--duration-base)",
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Auth & Notifications */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-6)" }}>
          <NotificationBell />
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
            <Link
              href="/sign-in"
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "0.8125rem",
                fontWeight: 400,
                color: "var(--text-secondary)",
                textDecoration: "none",
              }}
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              id="header-cta"
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "0.8125rem",
                fontWeight: 500,
                color: "var(--bg-base)",
                backgroundColor: "var(--navy)",
                padding: "8px 16px",
                textDecoration: "none",
                letterSpacing: "0.02em",
              }}
            >
              Request Access
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
