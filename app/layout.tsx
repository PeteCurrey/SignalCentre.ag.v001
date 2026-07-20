import type { Metadata } from "next";
import "./globals.css";

// Clerk is optional — only loaded when valid keys are configured
const hasClerkKeys =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith("pk_") &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.includes("replace_with");

export const metadata: Metadata = {
  title: {
    default: "Signal Centre — Institutional Market Intelligence",
    template: "%s | Signal Centre",
  },
  description:
    "Professional market intelligence platform providing AI consensus analysis, signal scoring, and decision-support infrastructure for Forex, Indices, Commodities and Crypto.",
  keywords: [
    "market intelligence",
    "forex signals",
    "institutional trading",
    "AI consensus",
    "market analysis",
    "trading signals",
    "indices",
    "commodities",
    "crypto analysis",
  ],
  authors: [{ name: "Signal Centre" }],
  creator: "Signal Centre",
  publisher: "Signal Centre",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://signalcentre.co.uk"
  ),
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: "https://signalcentre.co.uk",
    siteName: "Signal Centre",
    title: "Signal Centre — Institutional Market Intelligence",
    description:
      "Multi-source market intelligence and AI consensus analysis for professional traders and proprietary desks.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Signal Centre — Institutional Market Intelligence",
    description:
      "Multi-source market intelligence and AI consensus analysis for professional traders and proprietary desks.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

async function LayoutInner({ children }: { children: React.ReactNode }) {
  if (hasClerkKeys) {
    const { ClerkProvider } = await import("@clerk/nextjs");
    return (
      <ClerkProvider>
        <html lang="en-GB">
          <head>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link
              rel="preconnect"
              href="https://fonts.gstatic.com"
              crossOrigin="anonymous"
            />
          </head>
          <body>{children}</body>
        </html>
      </ClerkProvider>
    );
  }

  return (
    <html lang="en-GB">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <LayoutInner>{children}</LayoutInner>;
}
