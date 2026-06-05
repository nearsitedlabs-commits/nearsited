import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimiter, checkRateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Rate limit: standard limit for refresh operations
    const identifier = getRateLimitIdentifier(request, user.id);
    const blocked = await checkRateLimit(request, rateLimiter, identifier);
    if (blocked) return blocked;

    const body = await request.json() as { businessId?: string };
    const { businessId } = body;
    if (!businessId) return NextResponse.json({ error: "businessId required" }, { status: 400 });

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

    // Check staleness in places_cache
    const { data: cached } = await adminClient
      .from("places_cache")
      .select("ratings_fetched_at")
      .eq("place_id", business.place_id)
      .maybeSingle() as unknown as { data: { ratings_fetched_at: string | null } | null };

    const isFresh =
      cached?.ratings_fetched_at &&
      Date.now() - new Date(cached.ratings_fetched_at).getTime() < SEVEN_DAYS_MS;

    if (isFresh) {
      return NextResponse.json({ refreshed: false, reason: "fresh" });
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) return NextResponse.json({ refreshed: false, reason: "no_api_key" });

    // Fetch fresh rating via Place Details (rating + user_ratings_total fields)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    let rating: number | null = null;
    let reviewCount: number | null = null;

    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${business.place_id}&fields=rating,user_ratings_total&key=${apiKey}`;
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!res.ok) {
        console.error(`[REFRESH-RATINGS] Places API HTTP ${res.status}`);
        return NextResponse.json({ refreshed: false, reason: "api_http_error" });
      }

      const data = await res.json() as {
        status: string;
        result?: { rating?: number; user_ratings_total?: number };
      };

      if (data.status !== "OK") {
        console.error(`[REFRESH-RATINGS] Places API status: ${data.status}`);
        return NextResponse.json({ refreshed: false, reason: `api_status_${data.status}` });
      }

      rating = data.result?.rating ?? null;
      reviewCount = data.result?.user_ratings_total ?? null;
    } catch (fetchErr) {
      clearTimeout(timeout);
      console.error("[REFRESH-RATINGS] fetch failed:", fetchErr);
      return NextResponse.json({ refreshed: false, reason: "fetch_error" });
    }

    const now = new Date().toISOString();

    // Update places_cache
    const { error: cacheErr } = await (adminClient.from("places_cache") as ReturnType<typeof adminClient.from>)
      .upsert(
        { place_id: business.place_id, rating, review_count: reviewCount, ratings_fetched_at: now },
        { onConflict: "place_id" },
      );
    if (cacheErr) console.error("[REFRESH-RATINGS] places_cache upsert failed:", cacheErr);

    // Update the businesses row for this user
    const { error: bizErr } = await (adminClient.from("businesses") as ReturnType<typeof adminClient.from>)
      .update({ rating, review_count: reviewCount })
      .eq("id", businessId);
    if (bizErr) console.error("[REFRESH-RATINGS] businesses update failed:", bizErr);

    console.log(`[REFRESH-RATINGS] refreshed ${business.place_id}: rating=${rating} reviews=${reviewCount}`);
    return NextResponse.json({ refreshed: true, rating, review_count: reviewCount });
  } catch (err) {
    console.error("[REFRESH-RATINGS] error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
