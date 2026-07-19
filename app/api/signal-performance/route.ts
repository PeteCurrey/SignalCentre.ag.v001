// ============================================================
// app/api/signal-performance/route.ts
// Returns aggregated statistics for the performance dashboard
// ============================================================

import { NextResponse } from "next/server";
import { getPerformanceStats } from "@/lib/performance-client";

export const runtime = "nodejs";

export async function GET() {
  try {
    const stats = await getPerformanceStats();
    
    return NextResponse.json(stats, {
      headers: {
        // Cache for 15 minutes, stale-while-revalidate for 1 hour
        "Cache-Control": "public, max-age=900, stale-while-revalidate=3600",
      },
    });
  } catch (err) {
    console.error("[api/signal-performance] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch performance stats" },
      { status: 500 }
    );
  }
}
