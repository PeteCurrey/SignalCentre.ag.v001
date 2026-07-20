import type { Metadata } from "next";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";

export const metadata: Metadata = {
  title: {
    default: "Dashboard",
    template: "%s | Signal Centre",
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
      }}
    >
      <DashboardSidebar />
      <main
        style={{
          flex: 1,
          backgroundColor: "var(--bg-base)",
          overflow: "auto",
        }}
      >
        {children}
      </main>
    </div>
  );
}
