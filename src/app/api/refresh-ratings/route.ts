import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api/with-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchPlaceRatings } from "@/lib/google-places";
import { businessIdOnlySchema } from "@/lib/validation";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export const POST = withAuth(async ({ request, user, supabase }) => {
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

  // Verify the business belongs to this user and get place_id
  const { data: business } = await supabase
    .from("businesses")
    .select("place_id")
    .eq("id", businessId)
    .eq("user_id", user.id)
    .single();

  if (!business?.place_id) {
    return NextResponse.json({ refreshed: false, reason: "no_place_id" });
  }

  const adminClient = createAdminClient();

  // Check staleness in places_cache (shared cache — no user_id column)
  const { data: cached } = await adminClient.from("places_cache")
    .select("ratings_fetched_at")
    .eq("place_id", business.place_id)
    .maybeSingle();

  const isFresh =
    cached?.ratings_fetched_at &&
    Date.now() - new Date(cached.ratings_fetched_at).getTime() < SEVEN_DAYS_MS;

  if (isFresh) {
    return NextResponse.json({ refreshed: false, reason: "fresh" });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return NextResponse.json({ refreshed: false, reason: "no_api_key" });

  // Fetch fresh rating via Google Places API
  const result = await fetchPlaceRatings(business.place_id, apiKey);
  if (!result.ok || !result.data) {
    return NextResponse.json({ refreshed: false, reason: result.error ?? "fetch_error" });
  }

  const { rating, reviewCount } = result.data;
  const now = new Date().toISOString();

  // Update places_cache (shared cache — raw admin)
  const { error: cacheErr } = await adminClient.from("places_cache")
    .upsert(
      { place_id: business.place_id, rating, review_count: reviewCount, ratings_fetched_at: now },
      { onConflict: "place_id" },
    );
  if (cacheErr) console.error("[REFRESH-RATINGS] places_cache upsert failed:", cacheErr);

  // Update the businesses row for this user
  const { error: bizErr } = await adminClient.from("businesses")
    .update({ rating, review_count: reviewCount } as Record<string, unknown>)
    .eq("id", businessId)
    .eq("user_id", user.id);
  if (bizErr) console.error("[REFRESH-RATINGS] businesses update failed:", bizErr);

  console.log(`[REFRESH-RATINGS] refreshed ${business.place_id}: rating=${rating} reviews=${reviewCount}`);
  return NextResponse.json({ refreshed: true, rating, review_count: reviewCount });
});
