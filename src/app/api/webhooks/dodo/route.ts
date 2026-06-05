import { NextRequest, NextResponse } from "next/server";
import { getDodoClient, DODO_PRODUCTS, FREE_AUDIT_LIMIT } from "@/lib/dodo";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const headers: Record<string, string> = {};
  req.headers.forEach((v, k) => { headers[k] = v; });

  // Verify signature
  const dodo = getDodoClient();
  let event: Record<string, unknown>;
  try {
    event = dodo.webhooks.unwrap(rawBody, {
      headers,
      key: process.env.DODO_WEBHOOK_SECRET,
    }) as unknown as Record<string, unknown>;
  } catch (err) {
    console.error("[DODO/WEBHOOK] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const eventType = event.type as string;
  const payload = event.data as Record<string, unknown>;

  console.log(`[DODO/WEBHOOK] event=${eventType}`);

  const admin = createAdminClient();

  // ── Subscription events ────────────────────────────────────────────────────
  if (payload?.payload_type === "Subscription") {
    const sub = payload as {
      subscription_id: string;
      product_id: string;
      customer_id: string;
      status: string;
      customer?: { email?: string; customer_id?: string };
      metadata?: Record<string, string>;
    };

    const productInfo = DODO_PRODUCTS[sub.product_id];
    const isActive = ["active", "renewed"].includes(sub.status) ||
      ["subscription.active", "subscription.renewed", "subscription.plan_changed"].includes(eventType);
    const isCancelled = ["subscription.cancelled", "subscription.expired", "subscription.failed"].includes(eventType);

    // Find user: metadata (from checkout) → dodo_subscription_id → email
    let userId: string | null = null;

    // 1. Try metadata.user_id (passed from checkout session)
    if (sub.metadata?.user_id) {
      userId = sub.metadata.user_id;
      console.log(`[DODO/WEBHOOK] Found user via metadata.user_id=${userId} for subscription ${sub.subscription_id}`);
    }

    // 2. Try existing dodo_subscription_id in DB
    if (!userId) {
      const result = await admin
        .from("subscriptions")
        .select("user_id")
        .eq("dodo_subscription_id", sub.subscription_id)
        .maybeSingle() as { data: { user_id: string } | null };
      if (result.data) {
        userId = result.data.user_id;
        console.log(`[DODO/WEBHOOK] Found user via dodo_subscription_id for subscription ${sub.subscription_id}`);
      }
    }

    // 3. Try customer email lookup
    if (!userId && sub.customer?.email) {
      const result2 = await admin
        .from("profiles")
        .select("id")
        .eq("email", sub.customer.email)
        .maybeSingle() as { data: { id: string } | null };
      if (result2.data) {
        userId = result2.data.id;
        console.log(`[DODO/WEBHOOK] Found user via email ${sub.customer.email} for subscription ${sub.subscription_id}`);
      }
    }

    if (!userId) {
      console.warn(`[DODO/WEBHOOK] Could not resolve user for subscription ${sub.subscription_id}`);
      return NextResponse.json({ received: true });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subTable = (admin as any).from("subscriptions");

    if (isCancelled) {
      // Read current audits_used so we can cap it at the free limit on downgrade
      const { data: currentSub } = await subTable
        .select("audits_used")
        .eq("user_id", userId)
        .maybeSingle() as { data: { audits_used: number } | null };
      const currentUsed = (currentSub as { audits_used: number } | null)?.audits_used ?? 0;
      const cappedUsed = Math.min(currentUsed, FREE_AUDIT_LIMIT);

      const { error } = await subTable
        .update({
          tier: "free",
          audits_limit: FREE_AUDIT_LIMIT,
          audits_used: cappedUsed,
          dodo_subscription_id: sub.subscription_id,
        })
        .eq("user_id", userId);
      if (error) console.error("[DODO/WEBHOOK] Cancel update error", error);
      else if (cappedUsed < currentUsed) {
        console.log(`[DODO/WEBHOOK] Capped audits_used from ${currentUsed} to ${cappedUsed} on downgrade for user=${userId}`);
      }
    } else if (isActive && productInfo) {
      const now = new Date();
      const resetAt = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
      const { error } = await subTable.upsert({
        user_id: userId,
        dodo_customer_id: sub.customer_id,
        dodo_subscription_id: sub.subscription_id,
        tier: productInfo.tier,
        audits_limit: productInfo.limit,
        audits_used: 0,
        credits_reset_at: resetAt,
      }, { onConflict: "user_id" });
      if (error) console.error("[DODO/WEBHOOK] Upsert error", error);
      else console.log(`[DODO/WEBHOOK] Subscription updated: user=${userId} tier=${productInfo.tier}`);
    }
  }

  return NextResponse.json({ received: true });
}
