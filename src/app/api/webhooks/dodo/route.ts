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
      customer?: { email?: string };
    };

    const productInfo = DODO_PRODUCTS[sub.product_id];
    const isActive = ["active", "renewed"].includes(sub.status) ||
      ["subscription.active", "subscription.renewed", "subscription.plan_changed"].includes(eventType);
    const isCancelled = ["subscription.cancelled", "subscription.expired", "subscription.failed"].includes(eventType);

    // Find user by dodo_customer_id or email
    let userId: string | null = null;

    const result = await admin
      .from("subscriptions")
      .select("user_id")
      .eq("dodo_subscription_id", sub.subscription_id)
      .maybeSingle() as { data: { user_id: string } | null };
    const existingSub = result.data;

    if (existingSub) {
      userId = existingSub.user_id;
    } else if (sub.customer?.email) {
      const result2 = await admin
        .from("profiles")
        .select("id")
        .eq("email", sub.customer.email)
        .maybeSingle() as { data: { id: string } | null };
      const profile = result2.data;
      userId = profile?.id ?? null;
    }

    if (!userId) {
      console.warn(`[DODO/WEBHOOK] Could not resolve user for subscription ${sub.subscription_id}`);
      return NextResponse.json({ received: true });
    }

    if (isCancelled) {
      const { error } = await admin
        .from("subscriptions")
        .update({ tier: "free", audits_limit: FREE_AUDIT_LIMIT, dodo_subscription_id: sub.subscription_id } as any)
        .eq("user_id", userId);
      if (error) console.error("[DODO/WEBHOOK] Cancel update error", error);
    } else if (isActive && productInfo) {
      const now = new Date();
      const resetAt = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
      const { error } = await admin
        .from("subscriptions")
        .upsert({
          user_id: userId,
          dodo_customer_id: sub.customer_id,
          dodo_subscription_id: sub.subscription_id,
          tier: productInfo.tier,
          audits_limit: productInfo.limit,
          audits_used: 0,
          credits_reset_at: resetAt,
        } as any, { onConflict: "user_id" });
      if (error) console.error("[DODO/WEBHOOK] Upsert error", error);
      else console.log(`[DODO/WEBHOOK] Subscription updated: user=${userId} tier=${productInfo.tier}`);
    }
  }

  return NextResponse.json({ received: true });
}
