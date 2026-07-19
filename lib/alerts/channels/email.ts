import { createServiceClient } from "@/lib/supabase/client";

export async function sendEmailAlert(
  userId: string,
  instrument: string,
  direction: string,
  dcs: number,
  signalId: string
) {
  // In a real app, you'd fetch the user's email address from Clerk or Supabase Auth.
  // For now, we simulate this or just log it since we don't have a verified domain configured in Resend.
  
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.includes("123456789")) {
    console.log(`[Email Alert Mock] Would send to user ${userId} for ${instrument} (${direction}) DCS: ${dcs}`);
    return true;
  }

  try {
    // Basic implementation using fetch directly to avoid full Resend SDK instantiation overhead if unnecessary
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Signal Centre <alerts@signalcentre.co.uk>",
        to: "user@example.com", // Mock target
        subject: `Signal Centre Alert: ${instrument} DCS ${dcs} — ${direction.toUpperCase()}`,
        html: `
          <div style="font-family: monospace; background: #0c0c0e; color: #e0dfdb; padding: 20px;">
            <h2>Signal Centre Floor Alert</h2>
            <p><strong>Instrument:</strong> ${instrument}</p>
            <p><strong>Direction:</strong> <span style="color: ${direction === 'bullish' ? '#238636' : '#ba1a1a'}">${direction.toUpperCase()}</span></p>
            <p><strong>DCS:</strong> ${dcs}</p>
            <a href="https://signalcentre.co.uk/signals/${instrument}?id=${signalId}" style="color: #6a9fb5;">View Signal Details</a>
          </div>
        `,
      }),
    });

    if (!res.ok) {
        console.error("Resend error:", await res.text());
        return false;
    }
    return true;
  } catch (err) {
    console.error("Email dispatch failed:", err);
    return false;
  }
}
