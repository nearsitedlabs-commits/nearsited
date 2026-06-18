import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api/with-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { FREE_TRIAL_AUDIT_LIMIT } from "@/lib/dodo";

/**
 * Soft-deletes the user account:
 * - Sets `profiles.deleted_at = now()` so the email stays "taken" in Supabase Auth
 *   and the user cannot re-register to claim a fresh free trial.
 * - Caps the subscription audits_used to the limit so no further audits can run.
 * - Revokes all active sessions.
 * - Child data (businesses, pipeline, pitches, etc.) is NOT hard-deleted for
 *   privacy, but remains inaccessible because the account cannot be logged into.
 *
 * Why soft-delete instead of hard-delete?
 * Without it, a user could delete → re-signup → get 20 fresh free audits
 * indefinitely. Keeping the auth user + deleted_at flag means the email is
 * permanently tied to a used trial.
 */
export const POST = withAuth(async ({ user }) => {
  const admin = createAdminClient();

  // 1. Set deleted_at on the profile (soft-delete)
  const { error: profileError } = await admin
    .from("profiles")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", user.id);

  if (profileError) {
    console.error(`[ACCOUNT/DELETE] soft-delete failed for user=...${user.id.slice(-4)}`, {
      message: profileError.message,
    });
    return NextResponse.json({ error: "Failed to delete account. Please contact support." }, { status: 500 });
  }

  // 2. Cap subscription — set audits_used = audits_limit so no more audits can run
  const { error: subError } = await admin.rpc("cap_subscription_audits", {
    p_user_id: user.id,
  });
  if (subError) {
    // Non-fatal — log but don't block the deletion
    console.error(`[ACCOUNT/DELETE] cap subscription failed for user=...${user.id.slice(-4)}`, {
      message: subError.message,
    });
  }

  // 3. Revoke all active sessions so the user is signed out everywhere
  const { error: signOutError } = await admin.auth.admin.signOut(user.id);
  if (signOutError) {
    console.error(`[ACCOUNT/DELETE] sign-out failed for user=...${user.id.slice(-4)}`, {
      message: signOutError.message,
    });
    // Non-fatal — the session cookie will expire naturally
  }

  console.log(`[ACCOUNT/DELETE] user=...${user.id.slice(-4)} — account soft-deleted (deleted_at set, sessions revoked)`);
  return NextResponse.json({ success: true });
});
