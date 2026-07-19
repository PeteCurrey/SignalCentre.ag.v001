import { NextRequest, NextResponse } from "next/server";
import { sendWebhookAlert } from "@/lib/alerts/channels/webhook";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase/client";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const userId = "mock-user-123";

  if (!isSupabaseConfigured()) {
     return NextResponse.json({ success: true, message: "Mock test dispatched" });
  }

  const body = await request.json();
  const db = createServerClient();

  // Save the URL to user_webhooks first
  if (body.url) {
      await db.from("user_webhooks").upsert({ user_id: userId, url: body.url } as any);
  }

  const success = await sendWebhookAlert(userId, {
    alert_type: "test",
    instrument: "EURUSD",
    dcs: 85,
    direction: "bullish",
    signal_id: "test-signal-id",
    timestamp: new Date().toISOString(),
    message: "This is a test alert from Signal Centre."
  });

  if (success) {
      return NextResponse.json({ success: true });
  } else {
      return NextResponse.json({ success: false, error: "Webhook delivery failed" }, { status: 500 });
  }
}
