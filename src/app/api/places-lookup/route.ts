import { NextRequest, NextResponse } from "next/server";
import { buildGoogleUrl } from "@/lib/google-places";
import { businessTypes } from "@/lib/data/businessTypes";

const PLACES_BASE = "https://maps.googleapis.com/maps/api/place";

function extractNameFromMapsUrl(raw: string): string | null {
  try {
    // Decode percent-encoding and normalize + to space
    const decoded = decodeURIComponent(raw).replace(/\+/g, " ");
    // Standard URL: /maps/place/BUSINESS NAME/@...
    const pathMatch = decoded.match(/\/maps\/place\/([^/@?#]+)/i);
    if (pathMatch) return pathMatch[1].trim();
    // ?q= or &q= fallback
    const url = new URL(raw);
    const q = url.searchParams.get("q");
    if (q) return decodeURIComponent(q).replace(/\+/g, " ").trim();
  } catch {
    // malformed URL — fall through
  }
  return null;
}

function mapGoogleTypes(googleTypes: string[]): string | null {
  for (const gt of googleTypes) {
    // skip generic Google tags that don't map to business categories
    if (["establishment", "point_of_interest", "geocode", "locality", "political"].includes(gt)) continue;
    const normalised = gt.replace(/_/g, " ");
    const match = businessTypes.find(
      (bt) => bt.value === normalised || bt.value === gt || normalised.startsWith(bt.value) || bt.value.startsWith(normalised)
    );
    if (match) return match.value;
  }
  return null;
}

function extractCity(formattedAddress: string): string {
  // "123 Main St, Chennai, Tamil Nadu 600001, India" → "Chennai"
  const parts = formattedAddress.split(",").map((p) => p.trim());
  // City is usually the second-to-last or third-to-last segment
  if (parts.length >= 3) return parts[parts.length - 3] || parts[parts.length - 2] || "";
  if (parts.length >= 2) return parts[parts.length - 2] || "";
  return "";
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mapsUrl = searchParams.get("mapsUrl");
  const query = searchParams.get("query");

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.error("[PLACES-LOOKUP] GOOGLE_PLACES_API_KEY not set");
    return NextResponse.json({ found: false, error: "API key missing" }, { status: 500 });
  }

  let searchQuery: string | null = null;

  if (mapsUrl) {
    // Follow short-URL redirects server-side
    let resolvedUrl = mapsUrl;
    if (/goo\.gl|maps\.app\.goo\.gl/i.test(mapsUrl)) {
      try {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 5000);
        const resp = await fetch(mapsUrl, { method: "HEAD", redirect: "follow", signal: controller.signal });
        resolvedUrl = resp.url || mapsUrl;
      } catch {
        resolvedUrl = mapsUrl;
      }
    }
    searchQuery = extractNameFromMapsUrl(resolvedUrl);
    if (!searchQuery) {
      console.warn("[PLACES-LOOKUP] Could not extract business name from URL:", resolvedUrl);
      return NextResponse.json({ found: false });
    }
  } else if (query) {
    searchQuery = query.trim();
  }

  if (!searchQuery) {
    return NextResponse.json({ found: false });
  }

  console.log(`[PLACES-LOOKUP] Searching for: "${searchQuery}"`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const url = buildGoogleUrl(`${PLACES_BASE}/findplacefromtext/json`, {
      input: searchQuery,
      inputtype: "textquery",
      fields: "place_id,name,formatted_address,types,rating,user_ratings_total,formatted_phone_number,website",
    }, apiKey);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) {
      console.error(`[PLACES-LOOKUP] Places API HTTP ${res.status}`);
      return NextResponse.json({ found: false });
    }

    const json = await res.json() as {
      status: string;
      candidates?: Array<{
        place_id: string;
        name: string;
        formatted_address?: string;
        types?: string[];
        rating?: number;
        user_ratings_total?: number;
        formatted_phone_number?: string;
        website?: string;
      }>;
    };

    console.log(`[PLACES-LOOKUP] Status: ${json.status}, candidates: ${json.candidates?.length ?? 0}`);

    if (json.status !== "OK" || !json.candidates?.length) {
      return NextResponse.json({ found: false });
    }

    const place = json.candidates[0];
    const city = place.formatted_address ? extractCity(place.formatted_address) : null;
    const suggested_business_type = mapGoogleTypes(place.types ?? []);

    return NextResponse.json({
      found: true,
      name: place.name,
      address: place.formatted_address ?? null,
      city: city || null,
      place_id: place.place_id,
      rating: place.rating ?? null,
      review_count: place.user_ratings_total ?? null,
      phone: place.formatted_phone_number ?? null,
      suggested_business_type,
      website: place.website ?? null,
    });
  } catch (err) {
    clearTimeout(timeout);
    if ((err as Error).name === "AbortError") {
      console.error("[PLACES-LOOKUP] Timed out");
    } else {
      console.error("[PLACES-LOOKUP] Error:", err);
    }
    return NextResponse.json({ found: false });
  }
}
