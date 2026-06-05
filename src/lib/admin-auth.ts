/**
 * Admin authorization module.
 *
 * Replaces the previous email-comparison pattern with a proper
 * database-backed role check. Admins are stored in the `admin_users`
 * Supabase table with user_id foreign keys.
 *
 * Usage in layout.tsx:
 *   import { requireAdmin } from "@/lib/admin-auth";
 *   const { user } = await requireAdmin(); // redirects if not admin
 */

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

let _adminUserIds: Set<string> | null = null;
let _lastFetch = 0;
// 30s TTL — short enough that adding an admin propagates quickly.
// This cache is per-process; serverless cold starts always re-fetch from DB.
const CACHE_TTL_MS = 30_000;

/**
 * Fetch admin user IDs from the `admin_users` table.
 * Uses a simple in-memory cache to avoid DB hits on every request.
 */
async function getAdminUserIds(): Promise<Set<string>> {
  const now = Date.now();
  if (_adminUserIds && now - _lastFetch < CACHE_TTL_MS) {
    return _adminUserIds;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("admin_users")
    .select("user_id");

  if (error) {
    console.error("[ADMIN-AUTH] Failed to fetch admin_users:", error.message);
    // Fall back to empty set — no one gets admin access
    return new Set<string>();
  }

  _adminUserIds = new Set((data ?? []).map((r) => r.user_id));
  _lastFetch = now;
  return _adminUserIds;
}

/**
 * Check if the current user is an admin.
 * Returns the user if admin, redirects otherwise.
 *
 * Usage in server components/layouts:
 *   const user = await requireAdmin();
 *   // user is guaranteed admin here
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const adminIds = await getAdminUserIds();
  if (!adminIds.has(user.id)) {
    redirect("/dashboard");
  }

  return { user };
}

/**
 * Check if a specific user ID is an admin.
 * Useful for API routes that need admin checks but shouldn't redirect.
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const adminIds = await getAdminUserIds();
  return adminIds.has(userId);
}

/**
 * Invalidate the admin cache (useful after adding/removing an admin).
 */
export function invalidateAdminCache() {
  _adminUserIds = null;
  _lastFetch = 0;
}
