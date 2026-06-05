import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDodoClient } from "@/lib/dodo";
import { VALID_PRODUCTS } from "@/lib/products";
import { checkoutSchema } from "@/lib/validation";
import { rateLimiter, checkRateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";

/**
 * Redact email addresses from a string for safe logging.
 * Replaces anything resembling an email with `[EMAIL REDACTED]`.
 */
function redactPII(input: string): string {
  return input.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[EMAIL REDACTED]");
}

export async function POST(req: NextRequest) {
  // ── Rate limit (pre-auth, by IP) ───────────────────────────────────────
  const ipLimit = await checkRateLimit(req, rateLimiter, getRateLimitIdentifier(req));
  if (ipLimit) return ipLimit;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ── Rate limit (post-auth, by user ID) ────────────────────────────────
  const userLimit = await checkRateLimit(req, rateLimiter, getRateLimitIdentifier(req, user.id));
  if (userLimit) return userLimit;

  const body = await req.json().catch(() => ({}));
  
  // ── Zod validation ──────────────────────────────────────────────────────
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.issues.map((i) => i.message) },
      { status: 400 },
    );
  }
  const { productId } = parsed.data;

  if (!(VALID_PRODUCTS as readonly string[]).includes(productId)) {
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
      console.error("[CHECKOUT] No checkout_url in response for user=%s product=%s", user.id.slice(-4), productId);
      return NextResponse.json({ error: "No checkout URL returned" }, { status: 502 });
    }

    console.log("[CHECKOUT] Created session for user=%s product=%s", user.id.slice(-4), productId);
    return NextResponse.json({ url: session.checkout_url });
  } catch (err) {
    const safeMessage = err instanceof Error ? redactPII(err.message) : String(err);
    console.error("[CHECKOUT] Error creating session: %s", safeMessage);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 502 });
  }
}
