import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { classifyWebsite, type WebsiteStatus } from "@/lib/types";

/**
 * Maps Nearsited business_type values to Google Places Nearby Search `type` values.
 * Google Places supported types: https://developers.google.com/maps/documentation/places/web-service/supported-types
 */
const BUSINESS_TYPE_TO_PLACES_TYPE: Record<string, string> = {
  // Food & Drink
  restaurant: "restaurant",
  cafe: "cafe",
  bar: "bar",
  bakery: "bakery",
  "pizza restaurant": "restaurant",
  "sushi restaurant": "restaurant",
  "fast food restaurant": "meal_takeaway",
  "ice cream shop": "ice_cream",
  "juice bar": "cafe",
  "food truck": "meal_takeaway",

  // Health & Medical
  dentist: "dentist",
  doctor: "doctor",
  pharmacy: "pharmacy",
  physiotherapist: "physiotherapist",
  optician: "optician",
  veterinarian: "veterinary_care",
  chiropractor: "doctor",
  "mental health clinic": "doctor",
  dermatologist: "doctor",

  // Beauty & Wellness
  "hair salon": "hair_care",
  barbershop: "hair_care",
  "nail salon": "beauty_salon",
  spa: "spa",
  "massage therapy": "spa",
  "tattoo shop": "beauty_salon",
  "tanning salon": "beauty_salon",
  "eyebrow threading": "beauty_salon",

  // Fitness
  gym: "gym",
  "yoga studio": "gym",
  "pilates studio": "gym",
  "crossfit gym": "gym",
  "martial arts school": "gym",
  "dance studio": "gym",
  "swimming pool": "gym",

  // Retail
  "clothing store": "clothing_store",
  "electronics store": "electronics_store",
  "furniture store": "furniture_store",
  "jewelry store": "jewelry_store",
  bookstore: "book_store",
  "toy store": "store",
  "pet store": "pet_store",
  supermarket: "supermarket",
  florist: "florist",
  "gift shop": "store",

  // Home Services
  plumber: "plumber",
  electrician: "electrician",
  "cleaning service": "general_contractor",
  "interior designer": "interior_goods",
  painter: "painter",
  landscaping: "landscaping",
  "pest control": "general_contractor",
  locksmith: "locksmith",
  "roofing contractor": "roofing_contractor",

  // Professional Services
  lawyer: "lawyer",
  accountant: "accounting",
  "real estate agency": "real_estate_agency",
  "insurance agency": "insurance_agency",
  "financial advisor": "finance",
  "marketing agency": "advertising",
  "travel agency": "travel_agency",
  photographer: "photographer",
  "printing service": "printing",

  // Automotive
  "car dealer": "car_dealer",
  "auto repair shop": "car_repair",
  "car wash": "car_wash",
  "tire shop": "car_repair",
  "auto parts store": "auto_parts_store",
  "motorcycle dealer": "motorcycle_dealer",
  "car detailing": "car_repair",

  // Education
  "tutoring center": "school",
  "driving school": "school",
  "language school": "school",
  "music school": "school",
  "art school": "school",
  preschool: "school",

  // Hospitality
  hotel: "lodging",
  hostel: "lodging",
  "bed and breakfast": "lodging",
  "event venue": "banquet_hall",
  "wedding venue": "banquet_hall",

  // Entertainment
  nightclub: "night_club",
  "movie theater": "movie_theater",
  "bowling alley": "bowling_alley",
  "escape room": "amusement_center",
  arcade: "amusement_center",
  "karaoke bar": "night_club",
};

/**
 * Creates an AbortController with an automatic timeout.
 * Returns { controller, clear } — always call clear() in a finally block.
 */
function createTimeoutController(timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return { controller, clear: () => clearTimeout(timeout) };
}

/**
 * Wraps a single Google API fetch call with timeout, retry (on 429/500), and
 * error classification. Returns a normalized result so callers don't need to
 * handle raw fetch errors.
 */
async function fetchGoogleApi(
  url: string,
  timeoutMs: number = 10000,
): Promise<{
  ok: boolean;
  data?: Record<string, unknown>;
  error?: string;
  timedOut?: boolean;
  status?: number;
}> {
  async function attempt(): Promise<{
    ok: boolean;
    data?: Record<string, unknown>;
    error?: string;
    timedOut?: boolean;
    status?: number;
  }> {
    const { controller, clear } = createTimeoutController(timeoutMs);
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        return {
          ok: false,
          error: `Google API returned ${response.status}`,
          status: response.status,
        };
      }
      const data = await response.json();
      return { ok: true, data: data as Record<string, unknown> };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown fetch error";
      const isAbort = err instanceof DOMException && err.name === "AbortError";
      return {
        ok: false,
        error: isAbort ? `Request timed out after ${timeoutMs}ms` : message,
        timedOut: isAbort,
      };
    } finally {
      clear();
    }
  }

  const first = await attempt();
  if (first.ok) return first;

  // Retry on transient HTTP errors (500, 429) — not on 4xx, timeout, or network
  const isTransient = first.status === 500 || first.status === 429;
  if (isTransient) {
    console.log(`[DISCOVER] Retrying after HTTP ${first.status}...`);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return attempt();
  }

  return first;
}

/**
 * Fetches all pages from a Google Places Nearby Search URL (up to `maxPages` pages).
 * Returns the combined array of place results. Uses timeout + retry internally.
 */
async function fetchPlacesWithPagination(
  baseUrl: string,
  apiKey: string,
  maxPages: number = 3,
): Promise<Record<string, unknown>[]> {
  const allPlaces: Record<string, unknown>[] = [];

  const firstPageResult = await fetchGoogleApi(baseUrl, 15000);
  if (!firstPageResult.ok) {
    console.log("[DISCOVER] Places API request failed:", {
      error: firstPageResult.error,
      timedOut: firstPageResult.timedOut,
    });
    return allPlaces;
  }

  const data = firstPageResult.data!;
  console.log("[DISCOVER] Places API status:", data.status);

  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    console.log("[DISCOVER] Places API non-OK status:", data.status, data.error_message ?? "");
    return allPlaces;
  }

  if (data.status === "ZERO_RESULTS") {
    return allPlaces;
  }

  allPlaces.push(...((data.results as Record<string, unknown>[]) ?? []));

  let nextPageToken: string | undefined = data.next_page_token as string | undefined;
  let pagesFetched = 1;

  while (nextPageToken && pagesFetched < maxPages) {
    // Google's next_page_token is not immediately valid; wait before using it
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const pageUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?pagetoken=${nextPageToken}&key=${apiKey}`;
    console.log("[DISCOVER] Fetching page", pagesFetched + 1);

    const pageResult = await fetchGoogleApi(pageUrl, 15000);
    if (!pageResult.ok) {
      console.log("[DISCOVER] Paginated request failed:", {
        error: pageResult.error,
        timedOut: pageResult.timedOut,
      });
      break;
    }

    const pageData = pageResult.data!;
    console.log("[DISCOVER] Page", pagesFetched + 1, "status:", pageData.status);

    if (pageData.status === "INVALID_REQUEST") {
      // Token may not be ready yet — wait and retry once
      console.log("[DISCOVER] Retrying page", pagesFetched + 1, "after 1s delay...");
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const retryResult = await fetchGoogleApi(pageUrl, 15000);
      if (retryResult.ok) {
        const retryData = retryResult.data!;
        console.log("[DISCOVER] Retry page", pagesFetched + 1, "status:", retryData.status);

        if (retryData.status === "OK" && retryData.results) {
          allPlaces.push(...(retryData.results as Record<string, unknown>[]));
          nextPageToken = retryData.next_page_token as string | undefined;
          pagesFetched++;
          continue;
        }
      }
      // Give up on this page
      console.log("[DISCOVER] Giving up on page", pagesFetched + 1);
      break;
    }

    if (pageData.status === "OK" && pageData.results) {
      allPlaces.push(...(pageData.results as Record<string, unknown>[]));
      nextPageToken = pageData.next_page_token as string | undefined;
      pagesFetched++;
    } else {
      console.log("[DISCOVER] Unexpected status on page", pagesFetched + 1, ":", pageData.status);
      break;
    }
  }

  console.log("[DISCOVER] Fetched", pagesFetched, "page(s), total places in this query:", allPlaces.length);
  return allPlaces;
}

/**
 * Helper to write an NDJSON line to the stream controller.
 */
function writeJson(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  data: unknown,
) {
  controller.enqueue(encoder.encode(JSON.stringify(data) + "\n"));
}

/**
 * Write a progress event to the stream.
 */
function writeProgress(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  phase: string,
  detail?: string,
) {
  writeJson(controller, encoder, { type: "progress", phase, detail: detail ?? "" });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { city, businessType, userId, radiusMeters } = body;

    console.log("[DISCOVER] Incoming request body:", JSON.stringify(body, null, 2));

    // Validate required fields
    if (!city || !businessType || !userId) {
      console.log("[DISCOVER] Missing required fields:", { city, businessType, userId });
      return NextResponse.json(
        { error: "Missing required fields: city, businessType, userId" },
        { status: 400 },
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

    const radius = radiusMeters ?? 10000; // default 10km
    const expandedRadius = Math.round(radius * 1.5);

    // 1. Geocode the city to lat/lng
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(city)}&key=${apiKey}`;
    console.log("[DISCOVER] Geocoding URL:", geocodeUrl.replace(apiKey, "REDACTED"));

    const geocodeResult = await fetchGoogleApi(geocodeUrl, 10000);

    if (!geocodeResult.ok) {
      console.log("[DISCOVER] Geocoding API request failed:", {
        error: geocodeResult.error,
        timedOut: geocodeResult.timedOut,
      });
      const statusCode = geocodeResult.timedOut ? 504 : 502;
      const errorMsg = geocodeResult.timedOut
        ? "Geocoding request timed out — please try again"
        : "Geocoding API request failed";
      return NextResponse.json(
        { error: errorMsg },
        { status: statusCode },
      );
    }

    const geocodeData = geocodeResult.data as {
      status: string;
      results: Array<{
        geometry: { location: { lat: number; lng: number } };
      }>;
    };
    console.log("[DISCOVER] Geocoding API response status:", geocodeData.status);

    if (geocodeData.status !== "OK" || !geocodeData.results?.[0]) {
      console.log("[DISCOVER] Geocoding returned no results for city:", city);
      return NextResponse.json(
        {
          error: "City not found",
          details: "Could not geocode city name",
        },
        { status: 404 },
      );
    }

    const { lat, lng } = geocodeData.results[0].geometry.location;
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

    const preDedupCount = allPlaces.length;
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

          type CacheRow = { place_id: string; website: string | null; website_status: string | null; details_fetched_at: string | null };
          const { data: cachedRows } = await adminClient
            .from("places_cache")
            .select("place_id, website, website_status, details_fetched_at")
            .in("place_id", placeIds) as unknown as { data: CacheRow[] | null };

          const cacheMap = new Map<string, CacheRow>();
          for (const row of cachedRows ?? []) {
            cacheMap.set(row.place_id, row);
          }

          const ninetyDaysAgo = new Date();
          ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

          const needsFetch: { place_id: string; index: number }[] = [];
          const enrichedWebsites: (string | null)[] = new Array(uniquePlaces.length).fill(null);
          const enrichedStatuses: string[] = new Array(uniquePlaces.length).fill("unknown");
          let cacheHits = 0;

          // Generate stable IDs upfront so the client has them for pipeline/actions
          const businessIds: string[] = uniquePlaces.map(() => crypto.randomUUID());

          for (let i = 0; i < uniquePlaces.length; i++) {
            const place = uniquePlaces[i] as Record<string, unknown>;
            const pid = place.place_id as string | undefined;
            if (!pid) continue;

            const cached = cacheMap.get(pid);

            if (cached && cached.details_fetched_at && new Date(cached.details_fetched_at) >= ninetyDaysAgo) {
              // Fresh cache hit
              enrichedWebsites[i] = cached.website;
              enrichedStatuses[i] = cached.website_status ?? "unknown";
              cacheHits++;
            } else {
              // Needs fetch — leave as null/"unknown" for now
              needsFetch.push({ place_id: pid, index: i });
            }
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
            const BATCH_SIZE = 10;

            for (let batchStart = 0; batchStart < needsFetch.length; batchStart += BATCH_SIZE) {
              const batch = needsFetch.slice(batchStart, batchStart + BATCH_SIZE);

              const batchResults = await Promise.allSettled(
                batch.map(async ({ place_id, index }) => {
                  const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&fields=website&key=${apiKey}`;
                  const detailsResult = await fetchGoogleApi(detailsUrl, 10000);
                  if (!detailsResult.ok) {
                    throw new Error(detailsResult.error ?? "Place Details request failed");
                  }

                  const data = detailsResult.data as {
                    status: string;
                    result?: { website?: string };
                  };
                  if (data.status !== "OK") throw new Error(`API status: ${data.status}`);

                  const website: string | null = data.result?.website ?? null;
                  const websiteStatus = classifyWebsite(website);

                  return { place_id, index, website, websiteStatus };
                }),
              );

              const enriched: { id: string; website: string | null; website_status: string }[] = [];

              for (const result of batchResults) {
                if (result.status === "fulfilled") {
                  const { place_id, index, website, websiteStatus } = result.value;
                  enrichedWebsites[index] = website;
                  enrichedStatuses[index] = websiteStatus;
                  enriched.push({ id: businessIds[index], website, website_status: websiteStatus });
                  detailsCalls++;

                  // Upsert into places_cache
                  try {
                    await (adminClient.from("places_cache") as ReturnType<typeof adminClient.from>)
                      .upsert(
                        {
                          place_id,
                          website,
                          website_status: websiteStatus,
                          details_fetched_at: new Date().toISOString(),
                        },
                        { onConflict: "place_id" },
                      );
                  } catch (err) {
                    console.error("[DISCOVER] places_cache upsert failed for", place_id, err);
                  }
                } else {
                  console.log("[DISCOVER] details fetch failed for a place");
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

          // ---- Step D: Upsert all businesses to the DB ----
          writeProgress(controller, encoder, "persisting", `Upserting ${uniquePlaces.length} businesses`);

          const supabase = await createClient();
          const upsertedBusinesses: Record<string, unknown>[] = [];

          for (let i = 0; i < uniquePlaces.length; i++) {
            const place = uniquePlaces[i] as Record<string, unknown>;
            const enrichedWebsite = enrichedWebsites[i];
            const enrichedStatus = enrichedStatuses[i];

            // Classify the website URL to get the canonical status
            const websiteStatus = classifyWebsite(enrichedWebsite);

            const id = businessIds[i];

            // Determine outreach flag based on website status
            const isFlagged = websiteStatus === "no_website" || websiteStatus === "social_only" || websiteStatus === "platform_only";
            const outreachReason = isFlagged ? websiteStatus : null;

            const { data: upserted, error: upsertError } = await supabase
              .from("businesses")
              .upsert(
                {
                  id,
                  user_id: userId,
                  place_id: place.place_id,
                  name: place.name,
                  address: place.vicinity ?? place.formatted_address,
                  website: enrichedWebsite ?? place.website ?? null,
                  phone: "",
                  website_status: websiteStatus,
                  flagged_for_outreach: isFlagged,
                  outreach_reason: outreachReason,
                  rating: place.rating ?? null,
                  review_count: place.user_ratings_total ?? 0,
                  city,
                  business_type: businessType,
                  discovered_at: new Date().toISOString(),
                },
                {
                  onConflict: "place_id,user_id",
                  ignoreDuplicates: false,
                },
              )
              .select()
              .single();

            if (upsertError) {
              console.error("[DISCOVER] Failed to upsert business:", upsertError);
              continue;
            }

            upsertedBusinesses.push(upserted);
          }

          // ---- Step E: Final summary ----
          const flagged = upsertedBusinesses.filter(
            (b) => (b as Record<string, unknown>).website_status !== "has_website",
          ).length;

          console.log("[DISCOVER] Success - returning:", { total: upsertedBusinesses.length, flagged });

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
