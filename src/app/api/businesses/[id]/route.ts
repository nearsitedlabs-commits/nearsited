import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { blendQualityForOpportunity, computeOpportunityScore, estimatedOpportunity } from "@/lib/scoring";
import { z } from "zod";

/**
 * Zod schema for PATCH /api/businesses/[id] request body.
 * Validates types, coercions numbers, and rejects unknown fields.
 */
const patchBusinessSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  city: z.string().min(1).max(100).optional(),
  businessType: z.string().min(1).max(100).optional(),
  placeId: z.string().min(1).max(200).optional(),
  rating: z.number().min(0).max(5).optional(),
  reviewCount: z.number().int().min(0).optional(),
  phone: z.string().min(1).max(30).optional(),
}).strict();

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof patchBusinessSchema>;
  try {
    const raw = await request.json();
    const parsed = patchBusinessSchema.safeParse(raw);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      console.warn("[BUSINESSES-PATCH] validation failed:", fieldErrors);
      return NextResponse.json(
        { error: "Invalid request body", details: fieldErrors },
        { status: 400 },
      );
    }
    body = parsed.data;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Verify ownership before updating
  const { data: existing, error: fetchErr } = await admin
    .from("businesses")
    .select("id, user_id, performance_score, design_score, business_type, website_status, website, rating, review_count")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr) {
    console.error("[BUSINESSES-PATCH] fetch error:", fetchErr);
    return NextResponse.json({ error: "Failed to fetch business" }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (existing.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.city !== undefined) updates.city = body.city;
  if (body.businessType !== undefined) updates.business_type = body.businessType;
  if (body.placeId !== undefined) updates.place_id = body.placeId;
  if (body.rating !== undefined) updates.rating = body.rating;
  if (body.reviewCount !== undefined) updates.review_count = body.reviewCount;
  if (body.phone !== undefined) updates.phone = body.phone;

  // Recalculate opportunity_score if rating/reviews changed or business_type changed
  const newRating = body.rating ?? existing.rating ?? 0;
  const newReviewCount = body.reviewCount ?? existing.review_count ?? 0;
  const newBusinessType = body.businessType ?? existing.business_type;
  const perfScore = existing.performance_score;

  if (body.rating !== undefined || body.reviewCount !== undefined || body.businessType !== undefined) {
    if (perfScore != null) {
      const blendedQ = blendQualityForOpportunity(null, perfScore, existing.design_score ?? null);
      updates.opportunity_score = computeOpportunityScore(blendedQ, newReviewCount, newRating, newBusinessType);
    } else {
      // No audit yet — use estimatedOpportunity
      updates.opportunity_score = estimatedOpportunity({
        website_status: existing.website_status,
        website: existing.website,
        rating: newRating,
        user_ratings_total: newReviewCount,
      });
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ success: true, message: "No changes" });
  }

  const { data: updated, error: updateErr } = await admin
    .from("businesses")
    .update(updates)
    .eq("id", id)
    .select("id, name, city, business_type, opportunity_score, rating, review_count")
    .maybeSingle();

  if (updateErr) {
    console.error("[BUSINESSES-PATCH] update error:", { code: updateErr.code, message: updateErr.message, details: updateErr.details, hint: updateErr.hint });
    return NextResponse.json({ error: "Failed to update business" }, { status: 500 });
  }

  return NextResponse.json({ success: true, business: updated });
}
