import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDodoClient } from "@/lib/dodo";

const VALID_PRODUCTS = [
  "pdt_0NgNzY19yqBBRy9eriQzV", // Test — Starter Monthly
];

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { productId } = await req.json().catch(() => ({}));
  if (!productId || !VALID_PRODUCTS.includes(productId)) {
    return NextResponse.json({ error: "Invalid product" }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", user.id)
    .single();

  const origin = req.headers.get("origin") ?? "https://nearsited.io";

  try {
    const dodo = getDodoClient();
    const session = await dodo.checkoutSessions.create({
      product_cart: [{ product_id: productId, quantity: 1 }],
      return_url: `${origin}/dashboard/settings?upgraded=1`,
      customer: {
        email: profile?.email ?? user.email ?? "",
        name: profile?.full_name ?? null,
      },
      metadata: { user_id: user.id },
    });

    if (!session.checkout_url) {
      console.error("[CHECKOUT] No checkout_url in response for user=%s product=%s", user.id, productId);
      return NextResponse.json({ error: "No checkout URL returned" }, { status: 502 });
    }

    console.log("[CHECKOUT] Created session for user=%s product=%s", user.id, productId);
    return NextResponse.json({ url: session.checkout_url });
  } catch (err) {
    console.error("[CHECKOUT] Error creating session:", err);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 502 });
  }
}
