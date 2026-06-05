import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDodoClient, DODO_PRODUCTS, FREE_AUDIT_LIMIT } from "@/lib/dodo";

/**
 * GET /api/check-subscription
 *
 * Reconciliation endpoint for the webhook fallback scenario.
 * If the Dodo webhook never arrived (network issue, misconfiguration),
 * a paying user would be stuck on free tier. This endpoint:
 *
 * 1. Looks up the user's subscription row
 * 2. Resolves the Dodo customer ID (from local row OR by email lookup)
 * 3. Calls Dodo API to check subscription status
 * 4. If Dodo shows active subscription but local DB doesn't match, syncs it
 *
 * Called by the settings page on load (especially with ?upgraded=1).
 */
export async function GET() {
  try {
    // 1. Authenticate
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get current subscription row
    const admin = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subTable = (admin as any).from("subscriptions") as any;

    const { data: subRow } = await subTable
      .select("tier, audits_used, audits_limit, dodo_customer_id, dodo_subscription_id")
      .eq("user_id", user.id)
      .maybeSingle();

    // 3. Resolve the Dodo customer ID
    const dodo = getDodoClient();
    let dodoCustomerId: string | null = subRow?.dodo_customer_id ?? null;

    // If no dodo_customer_id in local DB, try to find it by email via Dodo API
    if (!dodoCustomerId) {
      try {
        // Get user email from auth profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("email")
          .eq("id", user.id)
          .single();

        if (profile?.email) {
          // Look up customer in Dodo by email
          const customers = await dodo.customers.list({ email: profile.email }) as unknown as Array<{
            customer_id: string;
            email: string;
          }>;

          if (Array.isArray(customers) && customers.length > 0) {
            dodoCustomerId = customers[0].customer_id;
            console.log(`[CHECK-SUBSCRIPTION] Resolved customer by email for user=${user.id} customer=${dodoCustomerId}`);
          }
        }
      } catch (emailErr) {
        console.error("[CHECK-SUBSCRIPTION] Email lookup error:", emailErr);
        // Non-fatal — continue with null dodoCustomerId
      }
    }

    // If still no customer ID, we can't reconcile
    if (!dodoCustomerId) {
      return NextResponse.json({
        synced: false,
        reason: "no_dodo_customer",
        tier: subRow?.tier ?? "free",
        audits_used: subRow?.audits_used ?? 0,
        audits_limit: subRow?.audits_limit ?? FREE_AUDIT_LIMIT,
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
        tier: subRow?.tier ?? "free",
        audits_used: subRow?.audits_used ?? 0,
        audits_limit: subRow?.audits_limit ?? FREE_AUDIT_LIMIT,
      });
    }

    // 5. Find active subscription from Dodo
    const activeSub = dodoSubscriptions.find(
      (s) => s.status === "active" || s.status === "renewed"
    );

    if (!activeSub) {
      // No active subscription in Dodo — local state is correct
      return NextResponse.json({
        synced: true,
        reason: "no_active_dodo_subscription",
        tier: subRow?.tier ?? "free",
        audits_used: subRow?.audits_used ?? 0,
        audits_limit: subRow?.audits_limit ?? FREE_AUDIT_LIMIT,
      });
    }

    // 6. Check if local state matches Dodo state
    const productInfo = DODO_PRODUCTS[activeSub.product_id];
    const alreadySynced = productInfo &&
      subRow?.tier === productInfo.tier &&
      subRow?.audits_limit === productInfo.limit &&
      subRow?.dodo_subscription_id === activeSub.id;

    if (alreadySynced) {
      return NextResponse.json({
        synced: true,
        reason: "already_in_sync",
        tier: subRow.tier,
        audits_used: subRow.audits_used,
        audits_limit: subRow.audits_limit,
      });
    }

    // 7. Sync: update local DB to match Dodo state
    if (productInfo) {
      const now = new Date();
      const resetAt = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

      const { error } = await subTable.upsert({
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

      console.log(`[CHECK-SUBSCRIPTION] Synced user=${user.id} to tier=${productInfo.tier} via Dodo reconciliation`);

      return NextResponse.json({
        synced: true,
        reason: "reconciled",
        tier: productInfo.tier,
        audits_used: 0,
        audits_limit: productInfo.limit,
        previous_tier: subRow?.tier ?? "free",
      });
    }

    // Active subscription but unknown product ID
    return NextResponse.json({
      synced: false,
      reason: "unknown_product",
      product_id: activeSub.product_id,
      tier: subRow?.tier ?? "free",
      audits_used: subRow?.audits_used ?? 0,
      audits_limit: subRow?.audits_limit ?? FREE_AUDIT_LIMIT,
    });

  } catch (err) {
    console.error("[CHECK-SUBSCRIPTION] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error", synced: false },
      { status: 500 }
    );
  }
}
