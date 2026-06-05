/**
 * Google Places API client.
 *
 * Extracted from src/app/api/discover/route.ts to reduce monolith size
 * and provide a single, reusable interface for all Places API interactions.
 */

// ── Types ──────────────────────────────────────────────────────────────────────

export type GoogleApiResult<T = Record<string, unknown>> = {
  ok: boolean;
  data?: T;
  error?: string;
  timedOut?: boolean;
  status?: number;
};

// ── Constants ───────────────────────────────────────────────────────────────────

const PLACES_BASE = "https://maps.googleapis.com/maps/api/place";
const GEOCODE_BASE = "https://maps.googleapis.com/maps/api/geocode/json";
// ── Safe URL Builder ──────────────────────────────────────────────────────────

/**
 * Build a Google API URL with automatic key redaction in logs.
 *
 * This ensures the API key never appears unredacted in console output,
 * error messages, or stack traces.
 *
 * Usage:
 *   const url = buildGoogleUrl(BASE, { param: "value" }, apiKey);
 *   // url = "https://...?param=value&key=abc123"
 *   // Logs: "https://...?param=value&key=REDACTED"
 */
export function buildGoogleUrl(
  base: string,
  params: Record<string, string>,
  apiKey: string,
): string {
  const allParams = { ...params, key: apiKey };
  const url = `${base}?${new URLSearchParams(allParams).toString()}`;

  // Log with redacted key — safe for production logs
  const redacted = { ...params, key: "REDACTED" };
  console.log(`[GOOGLE-API] ${base}?${new URLSearchParams(redacted).toString()}`);

  return url;
}

// ── Internal helpers ───────────────────────────────────────────────────────────

function createTimeoutController(timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return { controller, clear: () => clearTimeout(timeout) };
}

async function fetchGoogleApi(
  url: string,
  timeoutMs: number = 10000,
): Promise<GoogleApiResult> {
  async function attempt(): Promise<GoogleApiResult> {
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
    console.log(`[GOOGLE-PLACES] Retrying after HTTP ${first.status}...`);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return attempt();
  }

  return first;
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Geocode a city name to lat/lng coordinates.
 */
export async function geocodeCity(
  city: string,
  apiKey: string,
): Promise<GoogleApiResult<{ lat: number; lng: number }>> {
  const url = buildGoogleUrl(GEOCODE_BASE, { address: city }, apiKey);

  const result = await fetchGoogleApi(url, 10000);
  if (!result.ok) return { ok: false, error: result.error, timedOut: result.timedOut, status: result.status };

  const data = result.data as {
    status: string;
    results: Array<{ geometry: { location: { lat: number; lng: number } } }>;
  };

  if (data.status !== "OK" || !data.results?.[0]) {
    return { ok: false, error: "City not found", status: 404 };
  }

  const { lat, lng } = data.results[0].geometry.location;
  return { ok: true, data: { lat, lng } };
}

/**
 * Fetch Place Details for a single place.
 * Returns website and phone number.
 */
export async function fetchPlaceDetails(
  placeId: string,
  apiKey: string,
): Promise<GoogleApiResult<{ website: string | null; phone: string | null }>> {
  const url = buildGoogleUrl(`${PLACES_BASE}/details/json`, { place_id: placeId, fields: "website,formatted_phone_number" }, apiKey);
  const result = await fetchGoogleApi(url, 10000);

  if (!result.ok) return { ok: false, error: result.error, timedOut: result.timedOut, status: result.status };

  const data = result.data as {
    status: string;
    result?: { website?: string; formatted_phone_number?: string };
  };

  if (data.status !== "OK") {
    return { ok: false, error: `Places Details status: ${data.status}` };
  }

  return {
    ok: true,
    data: {
      website: data.result?.website ?? null,
      phone: data.result?.formatted_phone_number ?? null,
    },
  };
}

/**
 * Fetch Place Details for rating/rating count only.
 */
export async function fetchPlaceRatings(
  placeId: string,
  apiKey: string,
): Promise<GoogleApiResult<{ rating: number | null; reviewCount: number | null }>> {
  const url = buildGoogleUrl(`${PLACES_BASE}/details/json`, { place_id: placeId, fields: "rating,user_ratings_total" }, apiKey);

  const { controller, clear } = createTimeoutController(10000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clear();
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };

    const data = (await res.json()) as {
      status: string;
      result?: { rating?: number; user_ratings_total?: number };
    };

    if (data.status !== "OK") {
      return { ok: false, error: `API status: ${data.status}` };
    }

    return {
      ok: true,
      data: {
        rating: data.result?.rating ?? null,
        reviewCount: data.result?.user_ratings_total ?? null,
      },
    };
  } catch (err) {
    clear();
    const message = err instanceof Error ? err.message : "Unknown error";
    return { ok: false, error: message };
  }
}

/**
 * Fetch places from Nearby Search with pagination.
 */
export async function fetchPlacesWithPagination(
  baseUrl: string,
  apiKey: string,
  maxPages: number = 3,
): Promise<Record<string, unknown>[]> {
  const allPlaces: Record<string, unknown>[] = [];

  const firstPageResult = await fetchGoogleApi(baseUrl, 15000);
  if (!firstPageResult.ok) {
    console.log("[GOOGLE-PLACES] First page request failed:", {
      error: firstPageResult.error,
    });
    return allPlaces;
  }

  const data = firstPageResult.data!;
  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    console.log("[GOOGLE-PLACES] Non-OK status:", data.status);
    return allPlaces;
  }

  if (data.status === "ZERO_RESULTS") return allPlaces;

  allPlaces.push(...((data.results as Record<string, unknown>[]) ?? []));

  let nextPageToken: string | undefined = data.next_page_token as string | undefined;
  let pagesFetched = 1;

  while (nextPageToken && pagesFetched < maxPages) {
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const pageUrl = `${PLACES_BASE}/nearbysearch/json?pagetoken=${nextPageToken}&key=${apiKey}`;
    const pageResult = await fetchGoogleApi(pageUrl, 15000);
    if (!pageResult.ok) break;

    const pageData = pageResult.data!;
    if (pageData.status === "INVALID_REQUEST") {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const retryResult = await fetchGoogleApi(pageUrl, 15000);
      if (retryResult.ok) {
        const retryData = retryResult.data!;
        if (retryData.status === "OK" && retryData.results) {
          allPlaces.push(...(retryData.results as Record<string, unknown>[]));
          nextPageToken = retryData.next_page_token as string | undefined;
          pagesFetched++;
          continue;
        }
      }
      break;
    }

    if (pageData.status === "OK" && pageData.results) {
      allPlaces.push(...(pageData.results as Record<string, unknown>[]));
      nextPageToken = pageData.next_page_token as string | undefined;
      pagesFetched++;
    } else {
      break;
    }
  }

  console.log("[GOOGLE-PLACES] Fetched", pagesFetched, "page(s), total:", allPlaces.length);
  return allPlaces;
}
