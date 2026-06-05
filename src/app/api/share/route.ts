import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api/with-auth";
import { scopedAdmin } from "@/lib/api/scoped-admin";
import { businessIdOnlySchema } from "@/lib/validation";

export const POST = withAuth(async ({ request, user, supabase }) => {
  // 2. Parse body
  const body = await request.json();
  
  // ── Zod validation ──────────────────────────────────────────────────────
  const parsed = businessIdOnlySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.issues.map((i) => i.message) },
      { status: 400 },
    );
  }
  const { businessId } = parsed.data;

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
  const admin = scopedAdmin(user.id);

  console.log("[SHARE] User authed:...", user.id.slice(-4));
  console.log("[SHARE] Business verified:", businessId, biz.name);

  const { error: insertError } = await admin
    .from("share_links")
    .insert({
      id: crypto.randomUUID(),
      business_id: businessId,
      user_id: user.id,
      token,
    });

  if (insertError) {
    console.error("[SHARE] Insert failed:", { code: insertError.code, message: insertError.message });
    return NextResponse.json(
      { error: "Failed to create share link" },
      { status: 500 },
    );
  }

  const url = `${request.nextUrl.origin}/share/${token}`;
  console.log("[SHARE] Created share link for business:", biz.name, "token:", token);

  return NextResponse.json({ token, url });
});
