import { createAdminClient } from "@/lib/supabase/admin";
import { FREE_TRIAL_AUDIT_LIMIT } from "@/lib/dodo";
import { getAuditLimit } from "@/lib/tier-features";

/**
 * Returns the admin client — bypasses RLS, used only in server code.
 * The return type omits the Database generic to avoid conflicts with
 * Supabase's strict RPC typing (the `Functions` key in Database maps
 * to `{}`, causing `.rpc()` to reject all calls).
 */
const admin = createAdminClient();

/** Typed reference to the subscriptions table. */
const subTable = () => admin.from("subscriptions");

type SubRow = {
  tier: string;
  audits_used: number;
  audits_limit: number;
  credits_reset_at: string | null;
};

/** Shape returned by the deduct_audit_credit RPC. */
type DeductResult = {
  success: boolean;
  audits_used?: number;
  audits_limit?: number;
};

/**
 * Returns the user's subscription row. If none exists, provisions a free-trial row
 * UNLESS the profile is soft-deleted (deleted_at is set), in which case the
 * subscription is capped at the limit and no further usage is allowed.
 *
 * As a side-effect, backfills zero limits to the database defaults.
 */
export async function getSubscription(userId: string): Promise<SubRow> {
  const { data } = await subTable()
    .select("tier, audits_used, audits_limit, credits_reset_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (data) {
    // Backfill audits_limit that may be null/0 on rows created before migration.
    const limit = getAuditLimit(data.tier);
    const patch: Partial<SubRow> = {};
    if (!data.audits_limit) patch.audits_limit = limit;
    if (Object.keys(patch).length) {
      await subTable().update(patch).eq("user_id", userId);
      return { ...data, ...patch } as SubRow;
    }
    return data as SubRow;
  }

  // ── Soft-delete guard ──────────────────────────────────────────────────
  // If the profile has deleted_at set, do NOT provision a new free trial.
  // Return a capped subscription row that blocks all usage.
  const { data: profile } = await admin
    .from("profiles")
    .select("deleted_at")
    .eq("id", userId)
    .maybeSingle() as { data: { deleted_at: string | null } | null };

  if (profile?.deleted_at) {
    console.log(`[AUDITS] getSubscription blocked for soft-deleted user=...${userId.slice(-4)}`);
    return {
      tier: "free_trial",
      audits_used: FREE_TRIAL_AUDIT_LIMIT,  // Capped — no more audits
      audits_limit: FREE_TRIAL_AUDIT_LIMIT,
      credits_reset_at: null,
    };
  }
  // ── End soft-delete guard ──────────────────────────────────────────────

  // No row — provision free trial (lifetime, no monthly reset)
  const row: SubRow = {
    tier: "free_trial",
    audits_used: 0,
    audits_limit: FREE_TRIAL_AUDIT_LIMIT,
    credits_reset_at: null, // Free trial is lifetime; no monthly reset
  };
  const { error: upsertError } = await subTable().upsert(
    { user_id: userId, ...row },
    { onConflict: "user_id", ignoreDuplicates: true }
  );
  if (upsertError) {
    console.error(`[AUDITS] getSubscription upsert failed for user=...${userId.slice(-4)}`, {
      code: upsertError.code,
      message: upsertError.message,
    });
  }
  return row;
}

/**
 * Checks if the user may run an audit.
 * Auto-resets monthly counter when credits_reset_at is in the past (paid plans only).
 * Free Trial: lifetime allowance, never resets.
 * Returns { allowed, audits_used, audits_limit }.
 */
export async function checkAudit(
  userId: string
): Promise<{ allowed: boolean; audits_used: number; audits_limit: number }> {
  let row = await getSubscription(userId);

  // Monthly reset — for paid plans only (free_trial has no credits_reset_at)
  if (row.credits_reset_at && new Date(row.credits_reset_at) <= new Date()) {
    const now = new Date();
    const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
    await subTable()
      .update({ audits_used: 0, credits_reset_at: nextReset })
      .eq("user_id", userId);
    row = { ...row, audits_used: 0, credits_reset_at: nextReset };
    console.log(`[AUDITS] Monthly reset user=...${userId.slice(-4)}`);
  }

  const allowed = row.audits_used < row.audits_limit;
  console.log(
    `[AUDITS] check user=...${userId.slice(-4)} used=${row.audits_used} limit=${row.audits_limit} allowed=${allowed}`
  );
  return { allowed, audits_used: row.audits_used, audits_limit: row.audits_limit };
}

/**
 * Atomically checks and deducts one audit via the `deduct_audit_credit`
 * PostgreSQL function.
 *
 * Uses `SELECT … FOR UPDATE` + `SET audits_used = audits_used + 1` inside a
 * single server-side transaction, eliminating the race condition where two
 * concurrent requests both read `audits_used` before either writes.
 *
 * Monthly resets are handled inside the function, so callers no longer need
 * a separate `checkAudit()` call for correctness (though `checkAudit()` is
 * still useful as a fast-path early-return to avoid wasted work).
 *
 * Returns `{ success, audits_used, audits_limit }`.
 */
export async function deductAudit(
  userId: string
): Promise<{ success: boolean; audits_used: number; audits_limit: number }> {
  // ── Soft-delete guard ──────────────────────────────────────────────────
  // If the profile is soft-deleted, reject immediately. The RPC function
  // would otherwise upsert a fresh subscription row with audits_used = 0
  // if the old row was cleaned up.
  const { data: profile } = await admin
    .from("profiles")
    .select("deleted_at")
    .eq("id", userId)
    .maybeSingle() as { data: { deleted_at: string | null } | null };

  if (profile?.deleted_at) {
    console.log(`[AUDITS] deductAudit blocked for soft-deleted user=...${userId.slice(-4)}`);
    return { success: false, audits_used: FREE_TRIAL_AUDIT_LIMIT, audits_limit: FREE_TRIAL_AUDIT_LIMIT };
  }
  // ── End soft-delete guard ──────────────────────────────────────────────

  // Defensive backfill: ensure audits_limit is not 0 before the RPC locks the row.
  await getSubscription(userId);

  const { data, error } = await admin.rpc("deduct_audit_credit", {
    p_user_id: userId,
  });

  if (error) {
    console.error(`[AUDITS] deductAudit RPC failed for user=...${userId.slice(-4)}`, {
      code: error.code,
      message: error.message,
    });
    return { success: false, audits_used: 0, audits_limit: 0 };
  }

  const result = data as DeductResult;

  if (!result.success) {
    console.log(
      `[AUDITS] deductAudit rejected user=...${userId.slice(-4)} ` +
        `used=${result.audits_used} limit=${result.audits_limit} — limit reached`
    );
  } else {
    console.log(
      `[AUDITS] deducted user=...${userId.slice(-4)} ` +
        `now=${result.audits_used}/${result.audits_limit}`
    );
  }

  return {
    success: result.success,
    audits_used: result.audits_used ?? 0,
    audits_limit: result.audits_limit ?? 0,
  };
}

/**
 * Atomically refunds one audit via the `refund_audit_credit`
 * PostgreSQL function. Used when an audit was reserved with `deductAudit()`
 * before expensive external API work, but that work ultimately failed to
 * produce a persisted result — the reservation should not be charged.
 */
export async function refundAudit(
  userId: string
): Promise<{ success: boolean; audits_used: number; audits_limit: number }> {
  const { data, error } = await admin.rpc("refund_audit_credit", {
    p_user_id: userId,
  });

  if (error) {
    console.error(`[AUDITS] refundAudit RPC failed for user=...${userId.slice(-4)}`, {
      code: error.code,
      message: error.message,
    });
    return { success: false, audits_used: 0, audits_limit: 0 };
  }

  const result = data as DeductResult;
  console.log(
    `[AUDITS] refunded audit user=...${userId.slice(-4)} now=${result.audits_used}/${result.audits_limit}`
  );

  return {
    success: result.success,
    audits_used: result.audits_used ?? 0,
    audits_limit: result.audits_limit ?? 0,
  };
}
