import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { citySearchQuerySchema } from "@/lib/validation";
import { rateLimiter, checkRateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";

// ── Types ─────────────────────────────────────────────────────────────────────

type CityOption = {
  value: string;
  label: string;
  city: string;
  state: string;
  country: string;
};

// ── Server-side cache (loaded once, shared across requests) ───────────────────

let _cityOptions: CityOption[] | null = null;

// NOTE: This file is read with fs.readFile instead of import() so that
// Turbopack never sees the 29 MB JSON as a module dependency.  If it did,
// its dev cache would balloon to ~1 GB and cause laptop freezes on startup.

const CITIES_JSON_PATH = path.resolve(
  process.cwd(),
  "src/lib/data/cities.json",
);

async function getCityOptions(): Promise<CityOption[]> {
  if (_cityOptions) return _cityOptions;

  const raw = await fs.readFile(CITIES_JSON_PATH, "utf-8");
  const rawCities: CityOption[] = JSON.parse(raw);

  _cityOptions = rawCities
    .filter((c) => c.city.length > 0 && c.country.length > 0)
    .sort((a, b) => a.label.localeCompare(b.label));

  return _cityOptions;
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    // ── Rate limit (public endpoint — IP-based) ───────────────────────────
    const identifier = getRateLimitIdentifier(request);
    const blocked = await checkRateLimit(request, rateLimiter, identifier);
    if (blocked) return blocked;

    const { searchParams } = new URL(request.url);
    
    // ── Zod validation ──────────────────────────────────────────────────────
    const queryParams = Object.fromEntries(searchParams.entries());
    const parsed = citySearchQuerySchema.safeParse(queryParams);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues.map((i) => i.message) },
        { status: 400 },
      );
    }
    const { q = "", limit: limitRaw } = parsed.data;
    const returnAll = limitRaw === "all";

    const cities = await getCityOptions();

    // Filter by search query
    const lowerSearch = q.toLowerCase().trim();
    const filtered = lowerSearch
      ? cities.filter((c) => c.label.toLowerCase().includes(lowerSearch))
      : cities;

    // When returning all (used by the client-side library), skip sorting/
    // slicing — the library just needs the full sorted list once.
    if (returnAll) {
      return NextResponse.json({ cities: filtered });
    }

    // Otherwise sort popular first and limit results for the search dropdown
    const POPULAR_CITIES = [
      "Dubai", "Abu Dhabi", "London", "New York", "Los Angeles", "Singapore",
      "Hong Kong", "Tokyo", "Paris", "Zurich", "Geneva", "Dublin", "Amsterdam",
      "Berlin", "Madrid", "Barcelona", "Rome", "Milan", "Sydney", "Melbourne",
      "Toronto", "Vancouver", "San Francisco", "Chicago", "Miami", "Boston",
      "Seattle", "Austin", "Mumbai", "Delhi", "Bangalore", "Chennai", "Hyderabad",
      "Kochi", "Thiruvananthapuram", "Riyadh", "Jeddah", "Doha", "Kuwait City",
      "Muscat", "Manama", "Bangkok", "Kuala Lumpur", "Jakarta", "Manila", "Seoul",
      "Shanghai", "Beijing", "Istanbul", "Lisbon", "Vienna", "Munich", "Edinburgh",
      "Manchester", "Birmingham", "Glasgow", "Dallas", "Houston", "Phoenix",
      "Denver", "Atlanta", "Brisbane", "Perth", "Auckland", "Cape Town", "Sharjah", "Ajman",
    ];
    const popularityIndex = new Map<string, number>(
      POPULAR_CITIES.map((name, i) => [name.toLowerCase(), i]),
    );
    const MAX_RESULTS = 200;
    const seenPopular = new Set<string>();

    const popular: CityOption[] = [];
    const rest: CityOption[] = [];

    for (const city of filtered) {
      const rank = popularityIndex.get(city.city.toLowerCase());
      if (rank !== undefined) {
        if (seenPopular.has(city.city.toLowerCase())) continue;
        seenPopular.add(city.city.toLowerCase());
        popular.push(city);
      } else {
        rest.push(city);
      }
      if (popular.length + rest.length >= MAX_RESULTS && !lowerSearch) break;
    }

    popular.sort((a, b) => {
      const ra = popularityIndex.get(a.city.toLowerCase()) ?? Infinity;
      const rb = popularityIndex.get(b.city.toLowerCase()) ?? Infinity;
      return ra - rb;
    });

    const combined = [...popular, ...rest].slice(0, MAX_RESULTS);

    return NextResponse.json({ cities: combined });
  } catch (error) {
    console.error("[CITIES SEARCH] Error:", error);
    return NextResponse.json(
      { error: "Failed to load cities" },
      { status: 500 },
    );
  }
}
