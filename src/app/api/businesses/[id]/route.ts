import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeOpportunityScore, estimatedOpportunity } from "@/lib/scoring";

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

  const body = await request.json() as {
    name?: string;
    city?: string;
    businessType?: string;
    placeId?: string;
    rating?: number;
    reviewCount?: number;
    phone?: string;
  };

  const admin = createAdminClient();

  // Verify ownership before updating
  const { data: existing, error: fetchErr } = await (admin as any)
    .from("businesses")
    .select("id, user_id, performance_score, design_score, website_status, website, rating, review_count")
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
      updates.opportunity_score = computeOpportunityScore(
        perfScore,
        newReviewCount,
        newRating,
        newBusinessType
      );
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

  const { data: updated, error: updateErr } = await (admin as any)
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
