import { createAdminClient } from "@/lib/supabase/admin";
import { FREE_AUDIT_LIMIT, FREE_SEARCH_LIMIT } from "@/lib/dodo";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const subTable = () => (createAdminClient() as any).from("subscriptions");

type SubRow = {
  tier: string;
  audits_used: number;
  audits_limit: number;
  searches_used: number;
  searches_limit: number;
  credits_reset_at: string | null;
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
  await subTable().upsert({ user_id: userId, ...row }, { onConflict: "user_id", ignoreDuplicates: true });
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
 * Increments audits_used by 1 atomically using optimistic concurrency control.
 * Retries up to 3 times if a concurrent request modifies the row between read and write.
 * Called after a successful non-cached audit.
 */
export async function deductCredit(userId: string): Promise<void> {
  const MAX_RETRIES = 3;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const { data } = await subTable().select("audits_used").eq("user_id", userId).maybeSingle();
    const current = (data as { audits_used: number } | null)?.audits_used ?? 0;
    const newValue = current + 1;

    // Optimistic update: only succeeds if audits_used hasn't changed since we read it
    const { error } = await subTable()
      .update({ audits_used: newValue })
      .eq("user_id", userId)
      .eq("audits_used", current)
      .select("audits_used");

    if (!error) {
      console.log(`[CREDITS] deducted user=...${userId.slice(-4)} now=${newValue}`);
      return;
    }

    // If the update matched 0 rows (race), retry
    console.warn(`[CREDITS] retry ${attempt + 1}/${MAX_RETRIES} for user=...${userId.slice(-4)}: concurrent modification detected`);
  }

  console.error(`[CREDITS] failed to deduct credit for user=...${userId.slice(-4)} after ${MAX_RETRIES} attempts`);
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
 * Increments searches_used by 1 atomically using optimistic concurrency control.
 * Retries up to 3 times on concurrent modification. Called after a successful discover search.
 */
export async function deductSearch(userId: string): Promise<void> {
  const MAX_RETRIES = 3;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const { data } = await subTable().select("searches_used").eq("user_id", userId).maybeSingle();
    const current = (data as { searches_used: number } | null)?.searches_used ?? 0;
    const newValue = current + 1;

    const { error } = await subTable()
      .update({ searches_used: newValue })
      .eq("user_id", userId)
      .eq("searches_used", current)
      .select("searches_used");

    if (!error) {
      console.log(`[CREDITS] search deducted user=...${userId.slice(-4)} now=${newValue}`);
      return;
    }

    console.warn(`[CREDITS] search retry ${attempt + 1}/${MAX_RETRIES} for user=...${userId.slice(-4)}`);
  }

  console.error(`[CREDITS] failed to deduct search for user=...${userId.slice(-4)} after ${MAX_RETRIES} attempts`);
}
