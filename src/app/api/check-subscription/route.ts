import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api/with-auth";
import { scopedAdmin } from "@/lib/api/scoped-admin";
import { getDodoClient, DODO_PRODUCTS, FREE_AUDIT_LIMIT } from "@/lib/dodo";

/**
 * GET /api/check-subscription
 *
 * Reconciliation endpoint for the webhook fallback scenario.
 */
export const GET = withAuth(async ({ user, supabase }) => {
  // 2. Get current subscription row
  const admin = scopedAdmin(user.id);

  const { data: subRow } = await admin
    .from("subscriptions")
    .select("tier, audits_used, audits_limit, dodo_customer_id, dodo_subscription_id")
    .maybeSingle();

  // Self-heal: bump stale free-tier limits created before FREE_AUDIT_LIMIT was raised
  const storedTier = (subRow as { tier?: string } | null)?.tier ?? "free";
  const storedLimit = (subRow as { audits_limit?: number } | null)?.audits_limit ?? FREE_AUDIT_LIMIT;
  if (storedTier === "free" && storedLimit < FREE_AUDIT_LIMIT) {
    await (admin as any).from("subscriptions").update({ audits_limit: FREE_AUDIT_LIMIT }).eq("user_id", user.id);
    console.log(`[CHECK-SUBSCRIPTION] Healed stale free limit ${storedLimit}→${FREE_AUDIT_LIMIT} for user=...${user.id.slice(-4)}`);
  }

  // 3. Resolve the Dodo customer ID
  const dodo = getDodoClient();
  let dodoCustomerId: string | null = (subRow as { dodo_customer_id?: string } | null)?.dodo_customer_id ?? null;

  // If no dodo_customer_id in local DB, try to find it by email via Dodo API
  if (!dodoCustomerId) {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", user.id)
        .single();

      if (profile?.email) {
        const customers = await dodo.customers.list({ email: profile.email }) as unknown as Array<{
          customer_id: string;
          email: string;
        }>;

        if (Array.isArray(customers) && customers.length > 0) {
          dodoCustomerId = customers[0].customer_id;
          console.log(`[CHECK-SUBSCRIPTION] Resolved customer by email for user=...${user.id.slice(-4)} customer=${dodoCustomerId}`);
        }
      }
    } catch (emailErr) {
      console.error("[CHECK-SUBSCRIPTION] Email lookup error:", emailErr);
    }
  }

  if (!dodoCustomerId) {
    return NextResponse.json({
      synced: false,
      reason: "no_dodo_customer",
      tier: (subRow as { tier?: string } | null)?.tier ?? "free",
      audits_used: (subRow as { audits_used?: number } | null)?.audits_used ?? 0,
      audits_limit: (subRow as { audits_limit?: number } | null)?.audits_limit ?? FREE_AUDIT_LIMIT,
    });
  }

  // 4. Call Dodo API to check subscription status
  let dodoSubscriptions: Array<{
    id: string;
    product_id: string;
    status: string;
    customer_id: string;
  }> = [];

  try {
    dodoSubscriptions = await dodo.subscriptions.list({
      customer_id: dodoCustomerId,
    }) as unknown as Array<{
      id: string;
      product_id: string;
      status: string;
      customer_id: string;
    }>;
  } catch (err) {
    console.error("[CHECK-SUBSCRIPTION] Dodo API error:", err);
    return NextResponse.json({
      synced: false,
      reason: "dodo_api_error",
      tier: (subRow as { tier?: string } | null)?.tier ?? "free",
      audits_used: (subRow as { audits_used?: number } | null)?.audits_used ?? 0,
      audits_limit: (subRow as { audits_limit?: number } | null)?.audits_limit ?? FREE_AUDIT_LIMIT,
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
      tier: (subRow as { tier?: string } | null)?.tier ?? "free",
      audits_used: (subRow as { audits_used?: number } | null)?.audits_used ?? 0,
      audits_limit: (subRow as { audits_limit?: number } | null)?.audits_limit ?? FREE_AUDIT_LIMIT,
    });
  }

  // 6. Check if local state matches Dodo state
  const productInfo = DODO_PRODUCTS[activeSub.product_id];
  const alreadySynced = productInfo &&
    (subRow as { tier?: string } | null)?.tier === productInfo.tier &&
    (subRow as { audits_limit?: number } | null)?.audits_limit === productInfo.limit &&
    (subRow as { dodo_subscription_id?: string } | null)?.dodo_subscription_id === activeSub.id;

  if (alreadySynced) {
    return NextResponse.json({
      synced: true,
      reason: "already_in_sync",
      tier: (subRow as { tier: string }).tier,
      audits_used: (subRow as { audits_used: number }).audits_used,
      audits_limit: (subRow as { audits_limit: number }).audits_limit,
    });
  }

  // 7. Sync: update local DB to match Dodo state
  if (productInfo) {
    const now = new Date();
    const resetAt = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

    const { error } = await admin.from("subscriptions").upsert({
      user_id: user.id,
      dodo_customer_id: dodoCustomerId,
      dodo_subscription_id: activeSub.id,
      tier: productInfo.tier,
      audits_limit: productInfo.limit,
      audits_used: 0,
      credits_reset_at: resetAt,
    }, { onConflict: "user_id" });

    if (error) {
      console.error("[CHECK-SUBSCRIPTION] Sync error:", error);
      return NextResponse.json({
        synced: false,
        reason: "sync_error",
        error: error.message,
      }, { status: 500 });
    }

    console.log(`[CHECK-SUBSCRIPTION] Synced user=...${user.id.slice(-4)} to tier=${productInfo.tier} via Dodo reconciliation`);

    return NextResponse.json({
      synced: true,
      reason: "reconciled",
      tier: productInfo.tier,
      audits_used: 0,
      audits_limit: productInfo.limit,
      previous_tier: (subRow as { tier?: string } | null)?.tier ?? "free",
    });
  }

  return NextResponse.json({
    synced: false,
    reason: "unknown_product",
    product_id: activeSub.product_id,
    tier: (subRow as { tier?: string } | null)?.tier ?? "free",
    audits_used: (subRow as { audits_used?: number } | null)?.audits_used ?? 0,
    audits_limit: (subRow as { audits_limit?: number } | null)?.audits_limit ?? FREE_AUDIT_LIMIT,
  });
});
