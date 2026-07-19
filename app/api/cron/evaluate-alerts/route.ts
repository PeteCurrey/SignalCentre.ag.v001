import { NextRequest, NextResponse } from "next/server";
import { evaluateAlerts } from "@/lib/alerts/evaluator";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  // 1. Verify authorization
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await evaluateAlerts();
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error("[cron/evaluate-alerts] Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
