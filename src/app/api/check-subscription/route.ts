import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api/with-auth";
import { scopedAdmin } from "@/lib/api/scoped-admin";
import { getDodoClient, getDodoProducts, FREE_TRIAL_AUDIT_LIMIT } from "@/lib/dodo";

/**
 * GET /api/check-subscription
 *
 * Reconciliation endpoint for the webhook fallback scenario.
 */

type DodoSubscription = {
  id: string;
  product_id: string;
  status: string;
  customer_id: string;
};

async function handler({ user }: { user: { id: string; email?: string | null } }) {
  const admin = scopedAdmin(user.id);
  const dodo = getDodoClient();

  // 1. Read current subscription from DB
  const { data: subRow } = await admin
    .from("subscriptions")
    .select("tier, audits_used, audits_limit, dodo_customer_id, dodo_subscription_id")
    .maybeSingle();

  // Self-heal: bump stale free-tier limits below the standard cap
  const storedTier: string | null = (subRow as unknown as { tier?: string } | null)?.tier ?? "free_trial";
  const storedLimit: number = (subRow as unknown as { audits_limit?: number } | null)?.audits_limit ?? FREE_TRIAL_AUDIT_LIMIT;
  if (storedTier === "free_trial" && storedLimit < FREE_TRIAL_AUDIT_LIMIT) {
    await admin.from("subscriptions").update({ audits_limit: FREE_TRIAL_AUDIT_LIMIT });
    console.log(`[CHECK-SUBSCRIPTION] Healed stale free limit ${storedLimit}→${FREE_TRIAL_AUDIT_LIMIT} for user=...${user.id.slice(-4)}`);
  }

  // 2. Get Dodo customer ID from the subscription row
  const dodoCustomerId = (subRow as unknown as { dodo_customer_id?: string } | null)?.dodo_customer_id ?? null;

  // 3. If no Dodo customer exists, return free-tier state
  if (!dodoCustomerId) {
    return NextResponse.json({
      synced: false,
      reason: "no_dodo_customer",
      tier: (subRow as unknown as { tier?: string } | null)?.tier ?? "free_trial",
      audits_used: (subRow as unknown as { audits_used?: number } | null)?.audits_used ?? 0,
      audits_limit: (subRow as unknown as { audits_limit?: number } | null)?.audits_limit ?? FREE_TRIAL_AUDIT_LIMIT,
    });
  }

  // 4. Call Dodo API to check subscription status
  let dodoSubscriptions: Array<DodoSubscription> = [];

  try {
    dodoSubscriptions = await dodo.subscriptions.list({
      customer_id: dodoCustomerId,
    }) as unknown as Array<DodoSubscription>;
  } catch (err) {
    console.error("[CHECK-SUBSCRIPTION] Dodo API error:", err);
    return NextResponse.json({
      synced: false,
      reason: "dodo_api_error",
      tier: (subRow as unknown as { tier?: string } | null)?.tier ?? "free_trial",
      audits_used: (subRow as unknown as { audits_used?: number } | null)?.audits_used ?? 0,
      audits_limit: (subRow as unknown as { audits_limit?: number } | null)?.audits_limit ?? FREE_TRIAL_AUDIT_LIMIT,
    });
  }

  // 5. Find active subscription from Dodo
  const activeSub = dodoSubscriptions.find(
    (s) => s.status === "active" || s.status === "renewed"
  );

  if (!activeSub) {
    return NextResponse.json({
      synced: true,
      reason: "no_active_dodo_subscription",
      tier: (subRow as unknown as { tier?: string } | null)?.tier ?? "free_trial",
      audits_used: (subRow as unknown as { audits_used?: number } | null)?.audits_used ?? 0,
      audits_limit: (subRow as unknown as { audits_limit?: number } | null)?.audits_limit ?? FREE_TRIAL_AUDIT_LIMIT,
    });
  }

  // 6. Resolve product → tier info
  const productInfo = getDodoProducts()[activeSub.product_id];
  if (!productInfo) {
    console.log(`[CHECK-SUBSCRIPTION] Unknown product_id=${activeSub.product_id} for user=...${user.id.slice(-4)}`);
    return NextResponse.json({
      synced: false,
      reason: "unknown_product",
      product_id: activeSub.product_id,
      tier: (subRow as unknown as { tier?: string } | null)?.tier ?? "free_trial",
      audits_used: (subRow as unknown as { audits_used?: number } | null)?.audits_used ?? 0,
      audits_limit: (subRow as unknown as { audits_limit?: number } | null)?.audits_limit ?? FREE_TRIAL_AUDIT_LIMIT,
    });
  }

  // 7. Check if already in sync
  const alreadySynced =
    (subRow as unknown as { tier?: string } | null)?.tier === productInfo.tier &&
    (subRow as unknown as { audits_limit?: number } | null)?.audits_limit === productInfo.limit &&
    (subRow as unknown as { dodo_subscription_id?: string } | null)?.dodo_subscription_id === activeSub.id;

  if (alreadySynced) {
    const row = subRow as unknown as { tier: string; audits_used: number; audits_limit: number };
    return NextResponse.json({
      synced: true,
      reason: "already_in_sync",
      tier: row.tier,
      audits_used: row.audits_used,
      audits_limit: row.audits_limit,
    });
  }

  // 8. Sync — upsert subscription row from Dodo data
  const now = new Date();
  const resetAt = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

  const { error: upsertError } = await admin.from("subscriptions").upsert({
    user_id: user.id,
    dodo_customer_id: dodoCustomerId,
    dodo_subscription_id: activeSub.id,
    tier: productInfo.tier,
    audits_limit: productInfo.limit,
    audits_used: 0,
    credits_reset_at: resetAt,
  }, { onConflict: "user_id" });

  if (upsertError) {
    console.error("[CHECK-SUBSCRIPTION] Upsert error", {
      code: upsertError.code,
      message: upsertError.message,
    });
    return NextResponse.json({
      synced: false,
      reason: "db_error",
      tier: (subRow as unknown as { tier?: string } | null)?.tier ?? "free_trial",
      audits_used: 0,
      audits_limit: productInfo.limit,
    });
  }

  console.log(`[CHECK-SUBSCRIPTION] Reconciled: user=...${user.id.slice(-4)} tier=${productInfo.tier} limit=${productInfo.limit}`);

  return NextResponse.json({
    synced: true,
    reason: "reconciled",
    tier: productInfo.tier,
    audits_used: 0,
    audits_limit: productInfo.limit,
  });
}

export const GET = withAuth(handler);
