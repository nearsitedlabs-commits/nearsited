import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api/with-auth";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/settings/notifications — returns the user's notification prefs
 * POST /api/settings/notifications — updates notification prefs (expects partial JSON body)
 */
export const GET = withAuth(async ({ user }) => {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("notification_prefs")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error(`[SETTINGS/NOTIFICATIONS] GET failed for user=...${user.id.slice(-4)}`, {
      message: error.message,
    });
    // Return defaults on error
    return NextResponse.json({
      audit_complete: true,
      pitch_generated: true,
      low_credits: true,
      weekly_digest: true,
    });
  }

  const prefs = (data?.notification_prefs as Record<string, boolean>) ?? {};
  return NextResponse.json({
    audit_complete: prefs.audit_complete ?? true,
    pitch_generated: prefs.pitch_generated ?? true,
    low_credits: prefs.low_credits ?? true,
    weekly_digest: prefs.weekly_digest ?? true,
  });
});

export const POST = withAuth(async ({ request, user }) => {
  const body = await request.json().catch(() => ({}));
  const admin = createAdminClient();

  // Whitelist valid keys
  const validKeys = ["audit_complete", "pitch_generated", "low_credits", "weekly_digest"];
  const updates: Record<string, boolean> = {};
  for (const key of validKeys) {
    if (typeof body[key] === "boolean") {
      updates[key] = body[key];
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid notification preferences provided" }, { status: 400 });
  }

  // Merge with existing prefs (read current, merge, write back)
  const { data: current } = await admin
    .from("profiles")
    .select("notification_prefs")
    .eq("id", user.id)
    .single();

  const merged = {
    ...((current?.notification_prefs as Record<string, boolean>) ?? {}),
    ...updates,
  };

  const { error } = await admin
    .from("profiles")
    .update({ notification_prefs: merged })
    .eq("id", user.id);

  if (error) {
    console.error(`[SETTINGS/NOTIFICATIONS] POST failed for user=...${user.id.slice(-4)}`, {
      message: error.message,
    });
    return NextResponse.json({ error: "Failed to update notification preferences" }, { status: 500 });
  }

  return NextResponse.json({ success: true, prefs: merged });
});
