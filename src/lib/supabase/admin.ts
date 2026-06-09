/**
 * ⚠️ ADMIN SUPABASE CLIENT — BYPASSES ROW LEVEL SECURITY
 *
 * This client uses the SUPABASE_SERVICE_ROLE_KEY, which has full
 * read/write access to all tables regardless of RLS policies.
 *
 * It MUST only ever be imported in server-side code (API routes,
 * server actions, server components) — NEVER in a client component
 * or anything that ships to the browser, because it would leak the
 * service role key to the client.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function createAdminClient(): SupabaseClient {
  if (client) return client;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL environment variables",
    );
  }

  client = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return client;
}
