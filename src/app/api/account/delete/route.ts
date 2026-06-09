import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api/with-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Permanently deletes the user account and all associated data.
 * All tables have ON DELETE CASCADE from profiles.id, so deleting the
 * profile row cascades to businesses, pipeline, pitches, audits, etc.
 */
export const POST = withAuth(async ({ user }) => {
  const admin = createAdminClient();
  const server = await createClient();

  // 1. Delete the auth user (this cascades via trigger to profiles)
  const { error: authError } = await server.auth.admin.deleteUser(user.id);
  if (authError) {
    console.error(`[ACCOUNT/DELETE] auth delete failed for user=...${user.id.slice(-4)}`, {
      message: authError.message,
    });
    return NextResponse.json({ error: "Failed to delete account. Please contact support." }, { status: 500 });
  }

  // 2. Hard-delete the profile row (safety net — trigger should handle this, but be explicit)
  const { error: profileError } = await admin.from("profiles").delete().eq("id", user.id);
  if (profileError) {
    console.error(`[ACCOUNT/DELETE] profile delete failed for user=...${user.id.slice(-4)}`, {
      message: profileError.message,
    });
    // Auth user already deleted — log and return partial success
    return NextResponse.json({ error: "Account partially deleted. Please contact support to complete cleanup." }, { status: 500 });
  }

  console.log(`[ACCOUNT/DELETE] user=...${user.id.slice(-4)} — account and all data permanently deleted`);
  return NextResponse.json({ success: true });
});
