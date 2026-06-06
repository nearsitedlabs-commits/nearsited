import { NextRequest, NextResponse } from "next/server";

/**
 * Notifies the admin when a new user signs up.
 * Sends an email via Resend (resend.com).
 *
 * Requires these environment variables:
 *   RESEND_API_KEY   — API key from resend.com (free tier: 100 emails/day)
 *   ADMIN_EMAIL      — your email address to receive notifications
 */

const RESEND_API_URL = "https://api.resend.com/emails";

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const adminEmail = process.env.ADMIN_EMAIL;

    if (!apiKey || !adminEmail) {
      console.warn("[NOTIFY] RESEND_API_KEY or ADMIN_EMAIL not configured — skipping notification");
      return NextResponse.json({ ok: true, skipped: true });
    }

    const displayName = name || email;
    const now = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Calcutta",
      dateStyle: "full",
      timeStyle: "short",
    });

    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: `Nearsited <notifications@${process.env.RESEND_DOMAIN || "nearsited.io"}>`,
        to: [adminEmail],
        subject: `🎉 New signup: ${displayName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2 style="color: #8a9777;">New user signed up</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #888; font-size: 13px;">Name</td>
                <td style="padding: 8px 0; font-size: 13px;">${displayName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #888; font-size: 13px;">Email</td>
                <td style="padding: 8px 0; font-size: 13px;">${email}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #888; font-size: 13px;">Time</td>
                <td style="padding: 8px 0; font-size: 13px;">${now}</td>
              </tr>
            </table>
            <p style="margin-top: 24px; font-size: 12px; color: #999;">
              <a href="https://nearsited.io/admin" style="color: #8a9777;">View admin dashboard →</a>
            </p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => "Unknown error");
      console.error("[NOTIFY] Resend API error:", res.status, err);
      return NextResponse.json({ error: "Failed to send notification" }, { status: 500 });
    }

    console.log("[NOTIFY] Signup notification sent for:", email);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[NOTIFY] Unexpected error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
