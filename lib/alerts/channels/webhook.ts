import { createServiceClient } from "@/lib/supabase/client";

export async function sendWebhookAlert(
  userId: string,
  payload: any
) {
  const db = createServiceClient();
  
  // 1. Fetch user webhook URL
  const { data: hook } = await db
    .from("user_webhooks")
    .select("url")
    .eq("user_id", userId)
    .single() as { data: any };

  if (!hook?.url) return false;

  // 2. Exponential backoff retry loop
  let attempt = 0;
  const maxAttempts = 3;

  while (attempt < maxAttempts) {
    try {
      const res = await fetch(hook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "SignalCentre-Alerts/1.0",
        },
        body: JSON.stringify(payload),
        // Timeout to prevent hanging
        signal: AbortSignal.timeout(5000), 
      });

      if (res.ok) {
        return true; // Success
      }
      
      console.warn(`Webhook failed (Attempt ${attempt + 1}): ${res.status}`);
    } catch (err) {
      console.warn(`Webhook error (Attempt ${attempt + 1}):`, err);
    }

    attempt++;
    if (attempt < maxAttempts) {
      // Exponential backoff: 2s, 4s
      await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
    }
  }

  return false;
}
