import webpush from "web-push";
import { createServiceClient } from "@/lib/supabase/client";

// Configure web-push with VAPID keys
try {
  if (
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
    process.env.VAPID_PRIVATE_KEY &&
    !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY.includes("replace_me") &&
    !process.env.VAPID_PRIVATE_KEY.includes("replace_me")
  ) {
    webpush.setVapidDetails(
      "mailto:alerts@signalcentre.co.uk",
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
  }
} catch (err) {
  console.warn("[WebPush] Failed to configure VAPID keys (likely invalid format). Push will be mocked.", err);
}

export async function sendPushAlert(userId: string, payload: any) {
  if (!process.env.VAPID_PRIVATE_KEY || process.env.VAPID_PRIVATE_KEY.includes("your_vapid")) {
    console.log(`[WebPush Mock] Would send push to ${userId}:`, payload);
    return true;
  }

  const db = createServiceClient();
  
  // Get all active push subscriptions for the user
  const { data: subs } = await db
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", userId) as { data: any[] | null };

  if (!subs || subs.length === 0) return false;

  const pushPayload = JSON.stringify({
    title: payload.title || "Signal Centre Alert",
    body: payload.body,
    icon: "/icon.png", // Assume we have a standard PWA icon
    data: payload.data || {},
  });

  let successCount = 0;

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        pushPayload
      );
      successCount++;
    } catch (err: any) {
      if (err.statusCode === 404 || err.statusCode === 410) {
        // Subscription is expired or invalid, clean it up
        await db.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
      } else {
        console.error("WebPush send error:", err);
      }
    }
  }

  return successCount > 0;
}
