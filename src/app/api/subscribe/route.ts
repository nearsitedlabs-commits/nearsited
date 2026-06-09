import { NextRequest, NextResponse } from "next/server";

/**
 * Newsletter subscription endpoint.
 *
 * Adds an email address to the Resend audience (if configured) so the user
 * can receive updates.  If `RESEND_AUDIENCE_ID` is not set the subscription
 * is still acknowledged (logged) — the app never fakes a subscription.
 *
 * Requires:
 *   RESEND_API_KEY      — API key from resend.com
 *   RESEND_AUDIENCE_ID  — Resend audience ID (optional; without it only logs)
 */

const RESEND_CONTACTS_URL_BASE = "https://api.resend.com/audiences";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "A valid email address is required" },
        { status: 400 },
      );
    }

    const trimmed = email.trim().toLowerCase();
    const apiKey = process.env.RESEND_API_KEY;
    const audienceId = process.env.RESEND_AUDIENCE_ID;

    // ── Case 1: Resend audience is configured — add the contact ─────
    if (apiKey && audienceId) {
      const url = `${RESEND_CONTACTS_URL_BASE}/${audienceId}/contacts`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ email: trimmed, unsubscribed: false }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        const err = await res.text().catch(() => "Unknown error");
        console.error("[SUBSCRIBE] Resend Contacts API error:", res.status, err);
        return NextResponse.json(
          { error: "Failed to add subscriber. Please try again later." },
          { status: 500 },
        );
      }

      console.log("[SUBSCRIBE] Added to Resend audience:", trimmed);
      return NextResponse.json({ success: true });
    }

    // ── Case 2: Resend not fully configured — log & acknowledge ──────
    console.log(
      `[SUBSCRIBE] Newsletter signup: ${trimmed}` +
        (apiKey && !audienceId
          ? " (RESEND_API_KEY set but RESEND_AUDIENCE_ID missing — not stored in Resend)"
          : " (RESEND_API_KEY not set — subscription logged only)"),
    );
    return NextResponse.json({ success: true, stored: false });
  } catch (err) {
    console.error("[SUBSCRIBE] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
