import { createAdminClient } from "@/lib/supabase/admin";
import { FREE_AUDIT_LIMIT, FREE_SEARCH_LIMIT } from "@/lib/dodo";

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
  searches_used: number;
  searches_limit: number;
  credits_reset_at: string | null;
};

/** Shape returned by the deduct_audit_credit / deduct_search_credit RPC. */
type DeductResult = {
  success: boolean;
  audits_used?: number;
  audits_limit?: number;
  searches_used?: number;
  searches_limit?: number;
};

/**
 * Returns the user's subscription row. If none exists, provisions a free-tier row.
 */
export async function getSubscription(userId: string): Promise<SubRow> {
  const { data } = await subTable()
    .select("tier, audits_used, audits_limit, searches_used, searches_limit, credits_reset_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (data) return data as SubRow;

  // No row — provision free tier with monthly reset from day one
  const now = new Date();
  const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
  const row: SubRow = {
    tier: "free",
    audits_used: 0,
    audits_limit: FREE_AUDIT_LIMIT,
    searches_used: 0,
    searches_limit: FREE_SEARCH_LIMIT,
    credits_reset_at: nextReset,
  };
  const { error: upsertError } = await subTable().upsert({ user_id: userId, ...row }, { onConflict: "user_id", ignoreDuplicates: true });
  if (upsertError) {
    console.error(`[CREDITS] getSubscription upsert failed for user=...${userId.slice(-4)}`, {
      code: upsertError.code,
      message: upsertError.message,
    });
  }
  return row;
}

/**
 * Checks if the user may run an audit.
 * Auto-resets monthly counter when credits_reset_at is in the past.
 * Returns { allowed, audits_used, audits_limit }.
 */
export async function checkCredit(userId: string): Promise<{ allowed: boolean; audits_used: number; audits_limit: number }> {
  let row = await getSubscription(userId);

  // Monthly reset
  if (row.credits_reset_at && new Date(row.credits_reset_at) <= new Date()) {
    const now = new Date();
    const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
    await subTable()
      .update({ audits_used: 0, credits_reset_at: nextReset })
      .eq("user_id", userId);
    row = { ...row, audits_used: 0, credits_reset_at: nextReset };
    console.log(`[CREDITS] Monthly reset user=...${userId.slice(-4)}`);
  }

  const allowed = row.audits_used < row.audits_limit;
  console.log(`[CREDITS] check user=...${userId.slice(-4)} used=${row.audits_used} limit=${row.audits_limit} allowed=${allowed}`);
  return { allowed, audits_used: row.audits_used, audits_limit: row.audits_limit };
}

/**
 * Atomically checks and deducts one audit credit via the
 * `deduct_audit_credit` PostgreSQL function.
 *
 * Uses `SELECT … FOR UPDATE` + `SET audits_used = audits_used + 1` inside a
 * single server-side transaction, eliminating the race condition where two
 * concurrent requests both read `audits_used` before either writes.
 *
 * Monthly resets are handled inside the function, so callers no longer need
 * a separate `checkCredit()` call for correctness (though `checkCredit()` is
 * still useful as a fast-path early-return to avoid wasted work).
 *
 * Returns `{ success, audits_used, audits_limit }`.
 */
export async function deductCredit(
  userId: string,
): Promise<{ success: boolean; audits_used: number; audits_limit: number }> {
  const { data, error } = await admin.rpc("deduct_audit_credit", {
    p_user_id: userId,
  });

  if (error) {
    console.error(`[CREDITS] deductCredit RPC failed for user=...${userId.slice(-4)}`, {
      code: error.code,
      message: error.message,
    });
    return { success: false, audits_used: 0, audits_limit: 0 };
  }

  const result = data as DeductResult;

  if (!result.success) {
    console.log(
      `[CREDITS] deductCredit rejected user=...${userId.slice(-4)} ` +
        `used=${result.audits_used} limit=${result.audits_limit} — limit reached`,
    );
  } else {
    console.log(
      `[CREDITS] deducted user=...${userId.slice(-4)} ` +
        `now=${result.audits_used}/${result.audits_limit}`,
    );
  }

  return {
    success: result.success,
    audits_used: result.audits_used ?? 0,
    audits_limit: result.audits_limit ?? 0,
  };
}

/**
 * Checks if the user may run a city search.
 * Auto-resets monthly counter when credits_reset_at is in the past (paid plans).
 * Free users: no reset (lifetime allowance of FREE_SEARCH_LIMIT).
 */
export async function checkSearch(userId: string): Promise<{ allowed: boolean; searches_used: number; searches_limit: number }> {
  let row = await getSubscription(userId);

  // Monthly reset for paid plans only
  if (row.credits_reset_at && new Date(row.credits_reset_at) <= new Date()) {
    const now = new Date();
    const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
    await subTable()
      .update({ searches_used: 0, credits_reset_at: nextReset })
      .eq("user_id", userId);
    row = { ...row, searches_used: 0, credits_reset_at: nextReset };
    console.log(`[CREDITS] Monthly search reset user=...${userId.slice(-4)}`);
  }

  const allowed = row.searches_used < row.searches_limit;
  console.log(`[CREDITS] search check user=...${userId.slice(-4)} used=${row.searches_used} limit=${row.searches_limit} allowed=${allowed}`);
  return { allowed, searches_used: row.searches_used, searches_limit: row.searches_limit };
}

/**
 * Atomically checks and deducts one search credit via the
 * `deduct_search_credit` PostgreSQL function.
 *
 * Same atomic pattern as `deductCredit` — eliminates the race condition
 * by performing the check and increment inside a single locked transaction.
 *
 * Returns `{ success, searches_used, searches_limit }`.
 */
export async function deductSearch(
  userId: string,
): Promise<{ success: boolean; searches_used: number; searches_limit: number }> {
  const { data, error } = await admin.rpc("deduct_search_credit", {
    p_user_id: userId,
  });

  if (error) {
    console.error(`[CREDITS] deductSearch RPC failed for user=...${userId.slice(-4)}`, {
      code: error.code,
      message: error.message,
    });
    return { success: false, searches_used: 0, searches_limit: 0 };
  }

  const result = data as DeductResult;

  if (!result.success) {
    console.log(
      `[CREDITS] deductSearch rejected user=...${userId.slice(-4)} ` +
        `used=${result.searches_used} limit=${result.searches_limit} — limit reached`,
    );
  } else {
    console.log(
      `[CREDITS] search deducted user=...${userId.slice(-4)} ` +
        `now=${result.searches_used}/${result.searches_limit}`,
    );
  }

  return {
    success: result.success,
    searches_used: result.searches_used ?? 0,
    searches_limit: result.searches_limit ?? 0,
  };
}
