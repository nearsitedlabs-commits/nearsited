import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { classifyWebsite } from "@/lib/types";
import { expensiveOpLimiter, checkRateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { geocodeCity, fetchPlacesWithPagination, fetchPlaceDetails } from "@/lib/google-places";
import { discoverSchema } from "@/lib/validation";
import { writeJson, writeProgress } from "@/lib/api/stream-utils";
import { BUSINESS_TYPE_TO_PLACES_TYPE } from "@/lib/data/places-types";
import { checkSearch, deductSearch } from "@/lib/credits";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // ── Zod validation ──────────────────────────────────────────────────────
    const parsed = discoverSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues.map((i) => i.message) },
        { status: 400 },
      );
    }
    const { city, businessType, radiusMeters } = parsed.data;

    console.log("[DISCOVER] Request:", { city, businessType, radiusMeters });

    // Authenticate user from session — never trust client-supplied userId
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized — please sign in" },
        { status: 401 },
      );
    }

    // Search limit check — must pass before any external API calls
    const searchCheck = await checkSearch(user.id);
    if (!searchCheck.allowed) {
      console.log(`[DISCOVER] Search limit reached for user=...${user.id.slice(-4)} used=${searchCheck.searches_used}/${searchCheck.searches_limit}`);
      return NextResponse.json(
        { error: "Search limit reached", searches_used: searchCheck.searches_used, searches_limit: searchCheck.searches_limit },
        { status: 429 },
      );
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      console.log("[DISCOVER] Missing Google Places API key");
      return NextResponse.json(
        { error: "Server configuration error: missing Google Places API key" },
        { status: 500 },
      );
    }

    // Rate limit: strict limit for expensive discovery operations
    const identifier = getRateLimitIdentifier(request, user.id);
    const blocked = await checkRateLimit(request, expensiveOpLimiter, identifier);
    if (blocked) return blocked;

    const radius = radiusMeters ?? 10000; // default 10km
    const expandedRadius = Math.round(radius * 1.5);

    // 1. Geocode the city to lat/lng
    const geocodeResult = await geocodeCity(city, apiKey);

    if (!geocodeResult.ok || !geocodeResult.data) {
      console.log("[DISCOVER] Geocoding failed:", { error: geocodeResult.error, city });
      const statusCode = geocodeResult.timedOut ? 504 : geocodeResult.status === 404 ? 404 : 502;
      const errorMsg = geocodeResult.timedOut
        ? "Geocoding request timed out — please try again"
        : geocodeResult.error === "City not found"
          ? "City not found"
          : "Geocoding API request failed";
      return NextResponse.json(
        { error: errorMsg, details: geocodeResult.error === "City not found" ? "Could not geocode city name" : undefined },
        { status: statusCode },
      );
    }

    const { lat, lng } = geocodeResult.data;
    console.log("[DISCOVER] Geocoded coordinates:", { lat, lng, city });

    // 2. Build and run multiple Nearby Search queries in parallel
    const locationParam = `${lat},${lng}`;
    const keyword = encodeURIComponent(businessType);

    // Query 1: Original keyword search (existing behaviour)
    const query1Url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${locationParam}&radius=${radius}&keyword=${keyword}&key=${apiKey}`;

    // Query 2: Keyword + Google Places type filter
    const placesType = BUSINESS_TYPE_TO_PLACES_TYPE[businessType] ?? null;
    const query2Url = placesType
      ? `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${locationParam}&radius=${radius}&keyword=${keyword}&type=${placesType}&key=${apiKey}`
      : null;

    // Query 3: Radius-expanded search at 1.5× the selected radius
    const query3Url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${locationParam}&radius=${expandedRadius}&keyword=${keyword}&key=${apiKey}`;

    const queryConfigs = [
      { label: "keyword", url: query1Url },
      ...(query2Url ? [{ label: "keyword+type", url: query2Url }] : []),
      { label: "expanded-radius", url: query3Url },
    ];

    console.log("[DISCOVER] Running", queryConfigs.length, "parallel queries");

    const queryResults = await Promise.allSettled(
      queryConfigs.map((q) =>
        fetchPlacesWithPagination(q.url, apiKey, 3).then((places) => ({
          label: q.label,
          places,
        })),
      ),
    );

    // Collect results from each query, handling failures gracefully
    const queryCounts: { label: string; count: number }[] = [];
    const allPlaces: Record<string, unknown>[] = [];

    for (const result of queryResults) {
      if (result.status === "fulfilled") {
        queryCounts.push({ label: result.value.label, count: result.value.places.length });
        allPlaces.push(...result.value.places);
      } else {
        console.log("[DISCOVER] A query failed:", result.reason);
        queryCounts.push({ label: "unknown", count: 0 });
      }
    }

    // Deduplicate by place_id
    const seenPlaceIds = new Set<string>();
    const uniquePlaces: Record<string, unknown>[] = [];

    for (const place of allPlaces) {
      const pid = (place as Record<string, unknown>).place_id as string | undefined;
      if (pid && !seenPlaceIds.has(pid)) {
        seenPlaceIds.add(pid);
        uniquePlaces.push(place);
      }
    }

    const postDedupCount = uniquePlaces.length;

    // Log multi-query stats
    const queryStats = queryCounts.map((q) => `${q.count} from ${q.label}`).join(", ");
    console.log(`[DISCOVER] multi-query: ${queryStats}, ${postDedupCount} unique after dedup`);

    if (uniquePlaces.length === 0) {
      console.log("[DISCOVER] No businesses found for:", { city, businessType });
      return NextResponse.json({
        businesses: [],
        total: 0,
        flagged: 0,
        message: "No businesses found in this area",
      });
    }

    // ------------------------------------------------------------------
    // Everything up to this point is synchronous (geocode → queries → dedup).
    // Now we stream results progressively so the client can render immediately.
    // ------------------------------------------------------------------

    const encoder = new TextEncoder();
    const adminClient = createAdminClient();
    const placeIds: string[] = [];

    for (const place of uniquePlaces) {
      const pid = (place as Record<string, unknown>).place_id as string | undefined;
      if (pid) placeIds.push(pid);
    }

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // ---- Step A: Batched cache lookup ----
          writeProgress(controller, encoder, "cache-lookup", `Looking up ${placeIds.length} place_ids in cache`);

          type CacheRow = {
            place_id: string;
            website: string | null;
            website_status: string | null;
            details_fetched_at: string | null;
            rating: number | null;
            review_count: number | null;
            ratings_fetched_at: string | null;
          };
          const { data: cachedRows } = await adminClient
            .from("places_cache")
            .select("place_id, website, website_status, details_fetched_at, rating, review_count, ratings_fetched_at")
            .in("place_id", placeIds) as unknown as { data: CacheRow[] | null };

          const cacheMap = new Map<string, CacheRow>();
          for (const row of cachedRows ?? []) {
            cacheMap.set(row.place_id, row);
          }

          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

          const needsFetch: { place_id: string; index: number }[] = [];
          const enrichedWebsites: (string | null)[] = new Array(uniquePlaces.length).fill(null);
          const enrichedStatuses: string[] = new Array(uniquePlaces.length).fill("unknown");
          const enrichedPhones: (string | null)[] = new Array(uniquePlaces.length).fill(null);
          let cacheHits = 0;

          // Generate stable IDs upfront so the client has them for pipeline/actions
          const businessIds: string[] = uniquePlaces.map(() => crypto.randomUUID());

          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

          // Cache hits whose rating data is stale — refresh from Nearby Search data (no extra API call)
          const staleRatingBatch: { place_id: string; rating: number | null; review_count: number | null; ratings_fetched_at: string }[] = [];

          for (let i = 0; i < uniquePlaces.length; i++) {
            const place = uniquePlaces[i] as Record<string, unknown>;
            const pid = place.place_id as string | undefined;
            if (!pid) continue;

            const cached = cacheMap.get(pid);

            if (cached && cached.details_fetched_at && new Date(cached.details_fetched_at) >= thirtyDaysAgo) {
              // Fresh cache hit — website data is current
              enrichedWebsites[i] = cached.website;
              enrichedStatuses[i] = cached.website_status ?? "unknown";
              cacheHits++;

              // Refresh rating if stale (Nearby Search already returned fresh data)
              if (!cached.ratings_fetched_at || new Date(cached.ratings_fetched_at) < sevenDaysAgo) {
                staleRatingBatch.push({
                  place_id: pid,
                  rating: (place.rating as number) ?? null,
                  review_count: (place.user_ratings_total as number) ?? null,
                  ratings_fetched_at: new Date().toISOString(),
                });
              }
            } else {
              // Needs fetch — leave as null/"unknown" for now
              needsFetch.push({ place_id: pid, index: i });
            }
          }

          // Fire-and-forget: update stale ratings for cache hits (no awaited, doesn't block stream)
          if (staleRatingBatch.length > 0) {
            (adminClient.from("places_cache") as ReturnType<typeof adminClient.from>)
              .upsert(staleRatingBatch, { onConflict: "place_id" })
              .then(({ error }: { error: unknown }) => {
                if (error) console.error("[DISCOVER] stale rating batch update failed:", error);
              });
          }

          // ---- Step B: Stream initial results (immediate) ----
          writeProgress(
            controller,
            encoder,
            "results",
            `${uniquePlaces.length} unique places, ${cacheHits} cache hits, ${needsFetch.length} pending enrichment`,
          );

          const initialBusinesses = uniquePlaces.map((place, i) => ({
            id: businessIds[i],
            place_id: (place as Record<string, unknown>).place_id,
            name: (place as Record<string, unknown>).name,
            address: (place as Record<string, unknown>).vicinity ?? (place as Record<string, unknown>).formatted_address,
            rating: (place as Record<string, unknown>).rating ?? null,
            review_count: (place as Record<string, unknown>).user_ratings_total ?? 0,
            website: enrichedWebsites[i] ?? null,
            website_status: enrichedStatuses[i],
          }));

          writeJson(controller, encoder, {
            type: "results",
            data: initialBusinesses,
            total: uniquePlaces.length,
            cacheHits,
            needsFetch: needsFetch.length,
          });

          // ---- Step C: Fetch Place Details in batches, streaming updates ----
          if (needsFetch.length > 0) {
            writeProgress(controller, encoder, "enriching", `Fetching Place Details for ${needsFetch.length} places`);

            let detailsCalls = 0;
            const BATCH_SIZE = 25;

            for (let batchStart = 0; batchStart < needsFetch.length; batchStart += BATCH_SIZE) {
              const batch = needsFetch.slice(batchStart, batchStart + BATCH_SIZE);

              const batchResults = await Promise.allSettled(
                batch.map(async ({ place_id, index }) => {
                  const detailsResult = await fetchPlaceDetails(place_id, apiKey);
                  if (!detailsResult.ok) {
                    throw new Error(detailsResult.error ?? "Place Details request failed");
                  }

                  const website = detailsResult.data!.website;
                  const phone = detailsResult.data!.phone;
                  const websiteStatus = classifyWebsite(website);

                  return { place_id, index, website, phone, websiteStatus };
                }),
              );

              const enriched: { id: string; website: string | null; phone: string | null; website_status: string; flagged_for_outreach: boolean }[] = [];
              // Collect successful results for batched cache upsert
              const cacheBatch: { place_id: string; website: string | null; website_status: string; details_fetched_at: string; rating: number | null; review_count: number | null; ratings_fetched_at: string }[] = [];

              for (const result of batchResults) {
                if (result.status === "fulfilled") {
                  const { place_id, index, website, phone, websiteStatus } = result.value;
                  enrichedWebsites[index] = website;
                  enrichedStatuses[index] = websiteStatus;
                  enrichedPhones[index] = phone;
                  const flagged = websiteStatus === "no_website" || websiteStatus === "social_only" || websiteStatus === "platform_only";
                  enriched.push({ id: businessIds[index], website, phone, website_status: websiteStatus, flagged_for_outreach: flagged });
                  detailsCalls++;

                  const srcPlace = uniquePlaces[index] as Record<string, unknown>;
                  cacheBatch.push({
                    place_id,
                    website,
                    website_status: websiteStatus,
                    details_fetched_at: new Date().toISOString(),
                    rating: (srcPlace.rating as number) ?? null,
                    review_count: (srcPlace.user_ratings_total as number) ?? null,
                    ratings_fetched_at: new Date().toISOString(),
                  });
                } else {
                  console.log("[DISCOVER] details fetch failed for a place");
                }
              }

              // Batch upsert into places_cache (reduces N round-trips to 1 per batch)
              if (cacheBatch.length > 0) {
                try {
                  await (adminClient.from("places_cache") as ReturnType<typeof adminClient.from>)
                    .upsert(cacheBatch, { onConflict: "place_id" });
                } catch (err) {
                  console.error("[DISCOVER] places_cache batch upsert failed:", err);
                }
              }

              if (enriched.length > 0) {
                writeJson(controller, encoder, {
                  type: "enrichment",
                  updated: enriched,
                });
              }
            }

            console.log("[DISCOVER] enrichment — cache hits:", cacheHits, "details calls:", detailsCalls, "total:", uniquePlaces.length);
          }

          // ---- Step D: Upsert all businesses to the DB (BATCHED) ----
          writeProgress(controller, encoder, "persisting", `Upserting ${uniquePlaces.length} businesses`);

          // supabase is already created above for auth — reuse it
          const upsertedBusinesses: Record<string, unknown>[] = [];

          // Build the full list of business rows first
          const businessRows: Record<string, unknown>[] = [];
          for (let i = 0; i < uniquePlaces.length; i++) {
            const place = uniquePlaces[i] as Record<string, unknown>;
            const enrichedWebsite = enrichedWebsites[i];
            const enrichedPhone = enrichedPhones[i];

            const websiteStatus = classifyWebsite(enrichedWebsite);
            const id = businessIds[i];
            const isFlagged = websiteStatus === "no_website" || websiteStatus === "social_only" || websiteStatus === "platform_only";
            const outreachReason = isFlagged ? websiteStatus : null;

            businessRows.push({
              id,
              user_id: user.id,
              place_id: place.place_id,
              name: place.name,
              address: place.vicinity ?? place.formatted_address,
              website: enrichedWebsite ?? place.website ?? null,
              phone: enrichedPhone ?? "",
              website_status: websiteStatus,
              flagged_for_outreach: isFlagged,
              outreach_reason: outreachReason,
              rating: place.rating ?? null,
              review_count: place.user_ratings_total ?? 0,
              city,
              business_type: businessType,
              discovered_at: new Date().toISOString(),
            });
          }

          // Batch upsert — reduces N sequential round-trips to N/BATCH_SIZE
          const BATCH_SIZE = 50;
          for (let batchStart = 0; batchStart < businessRows.length; batchStart += BATCH_SIZE) {
            const batch = businessRows.slice(batchStart, batchStart + BATCH_SIZE);
            const { data: upserted, error: upsertError } = await supabase
              .from("businesses")
              .upsert(batch, {
                onConflict: "place_id,user_id",
                ignoreDuplicates: false,
              })
              .select();

            if (upsertError) {
              console.error("[DISCOVER] Batch upsert failed:", upsertError);
              // Still add the rows we intended to upsert so the client gets partial results
              for (const row of batch) {
                upsertedBusinesses.push(row as Record<string, unknown>);
              }
            } else if (upserted) {
              upsertedBusinesses.push(...(upserted as Record<string, unknown>[]));
            }
          }

          // ---- Step E: Final summary ----
          const flagged = upsertedBusinesses.filter(
            (b) => (b as Record<string, unknown>).website_status !== "has_website",
          ).length;

          console.log("[DISCOVER] Success - returning:", { total: upsertedBusinesses.length, flagged });

          // Deduct one search from the user's monthly allowance
          await deductSearch(user.id);

          writeJson(controller, encoder, {
            type: "done",
            businesses: upsertedBusinesses,
            total: upsertedBusinesses.length,
            flagged,
          });

          controller.close();
        } catch (error) {
          console.error("[DISCOVER] Stream error:", error);
          writeJson(controller, encoder, { type: "error", message: "Internal server error during streaming" });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "application/x-ndjson" },
    });
  } catch (error) {
    console.error("[DISCOVER] API error:", error);
    if (error instanceof Error) {
      console.error("[DISCOVER] Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
