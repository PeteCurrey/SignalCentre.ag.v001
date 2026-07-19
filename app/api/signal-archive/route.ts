// ============================================================
// app/api/signal-archive/route.ts
// Returns paginated and filtered historical signal data
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getArchivePage, type ArchiveFilters } from "@/lib/performance-client";
import type { AssetClass, SignalOutcome } from "@/lib/supabase/types";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const filters: ArchiveFilters = {
    page: parseInt(searchParams.get("page") || "1", 10),
    limit: parseInt(searchParams.get("limit") || "20", 10),
    asset_class: (searchParams.get("asset_class") as AssetClass) || undefined,
    outcome: (searchParams.get("outcome") as SignalOutcome) || undefined,
    timeframe: searchParams.get("timeframe") || undefined,
    from: searchParams.get("from") || undefined,
    to: searchParams.get("to") || undefined,
  };

  try {
    const pageData = await getArchivePage(filters);
    
    return NextResponse.json(pageData, {
      headers: {
        // Shorter cache for pagination
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    });
  } catch (err) {
    console.error("[api/signal-archive] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch signal archive" },
      { status: 500 }
    );
  }
}
