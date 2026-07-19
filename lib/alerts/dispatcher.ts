import { createServiceClient } from "@/lib/supabase/client";
import { sendEmailAlert } from "./channels/email";
import { sendWebhookAlert } from "./channels/webhook";
import { sendPushAlert } from "./channels/push";

export async function dispatchAlert(
  userId: string,
  alertId: string,
  channels: string[],
  instrument: string,
  direction: string,
  dcs: number,
  signalId: string
) {
  const db = createServiceClient();
  const deliveryStatus: Record<string, boolean> = {};

  // Construct message
  const message = `${instrument} DCS reached ${dcs} — ${direction.toUpperCase()}`;

  // 1. Dispatch in parallel
  const tasks = [];

  if (channels.includes("email")) {
    tasks.push(
      sendEmailAlert(userId, instrument, direction, dcs, signalId)
        .then((success) => { deliveryStatus.email = success; })
    );
  }

  if (channels.includes("webhook")) {
    tasks.push(
      sendWebhookAlert(userId, {
        alert_type: "dcs_above",
        instrument,
        dcs,
        direction,
        signal_id: signalId,
        timestamp: new Date().toISOString(),
      }).then((success) => { deliveryStatus.webhook = success; })
    );
  }

  if (channels.includes("browser")) {
    tasks.push(
      sendPushAlert(userId, {
        title: `Alert: ${instrument} ${direction.toUpperCase()}`,
        body: `DCS Score: ${dcs}`,
        data: { url: `/signals/${instrument}?id=${signalId}` }
      }).then((success) => { deliveryStatus.browser = success; })
    );
  }

  await Promise.allSettled(tasks);

  // 2. Log notification in database
  await db.from("notifications").insert({
    user_id: userId,
    alert_id: alertId,
    message,
    signal_id: signalId,
    delivery_status: deliveryStatus,
  } as any);
}
