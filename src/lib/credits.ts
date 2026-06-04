import { createAdminClient } from "@/lib/supabase/admin";
import { FREE_AUDIT_LIMIT } from "@/lib/dodo";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const subTable = () => (createAdminClient() as any).from("subscriptions");

type SubRow = {
  tier: string;
  audits_used: number;
  audits_limit: number;
  credits_reset_at: string | null;
};

/**
 * Returns the user's subscription row. If none exists, provisions a free-tier row.
 */
export async function getSubscription(userId: string): Promise<SubRow> {
  const { data } = await subTable().select("tier, audits_used, audits_limit, credits_reset_at").eq("user_id", userId).maybeSingle();
  if (data) return data as SubRow;

  // No row — provision free tier
  const row: SubRow = { tier: "free", audits_used: 0, audits_limit: FREE_AUDIT_LIMIT, credits_reset_at: null };
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
    console.log(`[CREDITS] Monthly reset user=${userId}`);
  }

  const allowed = row.audits_used < row.audits_limit;
  console.log(`[CREDITS] check user=${userId} used=${row.audits_used} limit=${row.audits_limit} allowed=${allowed}`);
  return { allowed, audits_used: row.audits_used, audits_limit: row.audits_limit };
}

/**
 * Increments audits_used by 1. Called after a successful non-cached audit.
 */
export async function deductCredit(userId: string): Promise<void> {
  const { data } = await subTable().select("audits_used").eq("user_id", userId).maybeSingle();
  const current = (data as { audits_used: number } | null)?.audits_used ?? 0;
  await subTable().update({ audits_used: current + 1 }).eq("user_id", userId);
  console.log(`[CREDITS] deducted user=${userId} now=${current + 1}`);
}
