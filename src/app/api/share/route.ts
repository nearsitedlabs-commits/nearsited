import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimiter, checkRateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // 1. Auth
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized — please sign in" },
        { status: 401 },
      );
    }

    // Rate limit: standard limit for share operations
    const identifier = getRateLimitIdentifier(request, user.id);
    const blocked = await checkRateLimit(request, rateLimiter, identifier);
    if (blocked) return blocked;

    // 2. Parse body
    const body = await request.json();
    const { businessId } = body as { businessId?: string };

    if (!businessId || typeof businessId !== "string") {
      return NextResponse.json(
        { error: "Missing required field: businessId" },
        { status: 400 },
      );
    }

    // 3. Verify the user owns this business
    const { data: biz, error: bizError } = await supabase
      .from("businesses")
      .select("id, name")
      .eq("id", businessId)
      .eq("user_id", user.id)
      .single();

    if (bizError || !biz) {
      return NextResponse.json(
        { error: "Business not found or not owned by you" },
        { status: 404 },
      );
    }

    // 4. Check if a share link already exists for this business
    const { data: existing } = await supabase
      .from("share_links")
      .select("token")
      .eq("business_id", businessId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      // Reuse existing token
      const url = `${request.nextUrl.origin}/share/${existing.token}`;
      return NextResponse.json({ token: existing.token, url });
    }

    // 5. Generate new share link
    const token = crypto.randomUUID();
    const admin = createAdminClient();

    console.log("[SHARE] User authed:", user.id);
    console.log("[SHARE] Business verified:", businessId, biz.name);
    console.log("[SHARE] Attempting share_links insert with token:", token);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: insertData, error: insertError } = await (admin.from("share_links") as any).insert({
      id: crypto.randomUUID(),
      business_id: businessId,
      user_id: user.id,
      token,
    }).select();

    if (insertError) {
      console.error("[SHARE] Insert failed:", { code: insertError.code, message: insertError.message, details: insertError.details, hint: insertError.hint });
      return NextResponse.json(
        { error: "Failed to create share link" },
        { status: 500 },
      );
    }

    console.log("[SHARE] Insert succeeded:", insertData);

    const url = `${request.nextUrl.origin}/share/${token}`;
    console.log("[SHARE] Created share link for business:", biz.name, "token:", token);

    return NextResponse.json({ token, url });
  } catch (error) {
    console.error("[SHARE] Unexpected error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
