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

/**
 * Creates an admin client wrapper that auto-filters by user_id.
 *
 * The returned object has the same `.from()` interface but applies
 * `.eq("user_id", userId)` to all operations.
 */
export function scopedAdmin(userId: string) {
  const admin = createAdminClient();

  return {
    /**
     * Access a table scoped to the authenticated user.
     *
     * All subsequent operations (select, insert, update, delete, upsert)
     * are automatically filtered to rows where user_id === userId.
     */
    from: (table: string) => {
      const query = admin.from(table);

      return {
        /**
         * Select rows, automatically scoped to this user.
         * Additional filters can be chained after this.
         */
        select: (...args: Parameters<typeof query.select>) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return (query.select as any)(...args).eq("user_id", userId);
        },

        /**
         * Insert a row, automatically setting user_id.
         * Overwrites any user_id that was already set in the data.
         */
        insert: (values: Record<string, unknown> | Record<string, unknown>[]) => {
          const withUserId = Array.isArray(values)
            ? values.map((v) => ({ ...v, user_id: userId }))
            : { ...values, user_id: userId };
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return (query.insert as any)(withUserId);
        },

        /**
         * Update rows, automatically scoped to this user.
         */
        update: (...args: Parameters<typeof query.update>) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return (query.update as any)(...args).eq("user_id", userId);
        },

        /**
         * Delete rows, automatically scoped to this user.
         */
        delete: (...args: Parameters<typeof query.delete>) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return (query.delete as any)(...args).eq("user_id", userId);
        },

        /**
         * Upsert rows, automatically setting user_id on each row.
         */
        upsert: (
          values: Record<string, unknown> | Record<string, unknown>[],
          options?: { onConflict?: string; ignoreDuplicates?: boolean },
        ) => {
          const withUserId = Array.isArray(values)
            ? values.map((v) => ({ ...v, user_id: userId }))
            : { ...values, user_id: userId };
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return (query.upsert as any)(withUserId, options);
        },
      };
    },
  };
}
