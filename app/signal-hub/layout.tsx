import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Signal Hub",
  description: "Live signal intelligence feed — all active signals ordered by conviction.",
};

export default function SignalHubLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
