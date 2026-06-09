/**
 * Scoped Admin Client — wraps the service-role admin client with
 * user-scoping checks to prevent accidental cross-user data access.
 *
 * The raw `createAdminClient()` gives full, unrestricted access to
 * ALL tables. This helper adds a safety layer: every read/write is
 * scoped to a specific user_id, so a bug in calling code won't
 * accidentally leak or modify other users' data.
 *
 * Usage:
 *   import { scopedAdmin } from "@/lib/api/scoped-admin";
 *
 *   // Safely delete only this user's data
 *   const admin = scopedAdmin(user.id);
 *   await admin.from("businesses").delete().eq("id", businessId);
 *
 * Security note:
 *   The scoping is enforced client-side — it relies on the calling
 *   code always using the scoped instance. For server-enforced
 *   protection, rely on RLS policies instead.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db-types";

/**
 * Creates a typed admin client that returns fully typed query builders
 * from `from()`, eliminating the need for `as any` casts at call sites.
 *
 * The `Database` generic enables Supabase's type system to resolve
 * the correct `Row`, `Insert`, and `Update` types for each table.
 */
function typedAdminClient() {
  return createAdminClient() as unknown as SupabaseClient<Database>;
}

/**
 * Helper: chains `.eq("user_id", userId)` on a typed filter builder.
 * The cast is necessary because when `TableName` is a generic
 * (not a concrete literal), TypeScript can't fully resolve the
 * column name constraint through the complex Supabase conditional
 * type chain. The cast is safe — `user_id` exists on every scoped table.
 *
 * Returns the same builder type, so callers still get full type
 * information from the preceding `.select()`, `.insert()`, etc.
 */
function scopeToUser<T>(builder: T, userId: string): T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (builder as any).eq("user_id", userId);
}

/**
 * Creates an admin client wrapper that auto-filters by user_id.
 *
 * The returned object has the same `.from()` interface but applies
 * `.eq("user_id", userId)` to all operations.
 */
export function scopedAdmin(userId: string) {
  const admin = typedAdminClient();

  return {
    /**
     * Access a table scoped to the authenticated user.
     *
     * All subsequent operations (select, insert, update, delete, upsert)
     * are automatically filtered to rows where user_id === userId.
     *
     * The return type is fully typed via the `Database` generic, so
     * `.select()`, `.insert()`, etc. all return properly typed query
     * builders — no `as any` needed at call sites.
     */
    from: <
      TableName extends string & keyof Database["public"]["Tables"],
    >(
      table: TableName,
    ) => {
      const q = admin.from(table);

      return {
        /**
         * Select rows, automatically scoped to this user.
         * Additional filters can be chained after this.
         */
        select: (
          columns?: string,
          options?: { head?: boolean; count?: "exact" | "planned" | "estimated" },
        ) => {
          return scopeToUser(q.select(columns, options), userId);
        },

        /**
         * Insert a row, automatically setting user_id.
         * Overwrites any user_id that was already set in the data.
         */
        insert: (
          values: Record<string, unknown> | Record<string, unknown>[],
        ) => {
          const withUserId = Array.isArray(values)
            ? values.map((v: Record<string, unknown>) => ({ ...v, user_id: userId }))
            : { ...values, user_id: userId };
          // Safe: we only added user_id, which is a required column on
          // every scoped table. The cast is necessary because callers
          // pass loose Record types rather than the exact Row shape.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return q.insert(withUserId as any);
        },

        /**
         * Update rows, automatically scoped to this user.
         */
        update: (
          values: Record<string, unknown>,
          options?: { count?: "exact" | "planned" | "estimated" },
        ) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return scopeToUser(q.update(values as any, options), userId);
        },

        /**
         * Delete rows, automatically scoped to this user.
         */
        delete: (
          options?: { count?: "exact" | "planned" | "estimated" },
        ) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return scopeToUser(q.delete(options as any), userId);
        },

        /**
         * Upsert rows, automatically setting user_id on each row.
         */
        upsert: (
          values: Record<string, unknown> | Record<string, unknown>[],
          options?: { onConflict?: string; ignoreDuplicates?: boolean },
        ) => {
          const withUserId = Array.isArray(values)
            ? values.map((v: Record<string, unknown>) => ({ ...v, user_id: userId }))
            : { ...values, user_id: userId };
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return q.upsert(withUserId as any, options);
        },
      };
    },
  };
}
