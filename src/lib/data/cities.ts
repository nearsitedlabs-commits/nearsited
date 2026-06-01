export type CityOption = {
  value: string;
  label: string;
  city: string;
  state: string;
  country: string;
};

// Lazy-loaded cache — the JSON is 29 MB and MUST NOT be imported at module level
// because it blocks the event loop during server startup (Next.js module resolution).
// Instead, we load it on first access via dynamic import().
let _cityOptions: CityOption[] | null = null;

async function getCityOptions(): Promise<CityOption[]> {
  if (_cityOptions) return _cityOptions;

  const rawCities = ((await import("./cities.json")) as { default: CityOption[] }).default;
  _cityOptions = rawCities
    .filter((c) => c.city.length > 0 && c.country.length > 0)
    .sort((a, b) => a.label.localeCompare(b.label));

  return _cityOptions;
}

// Curated priority list — shown first when the dropdown opens with no query
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

// Build a lookup: city name → priority index (lower = higher priority)
const popularityIndex = new Map<string, number>(
  POPULAR_CITIES.map((name, i) => [name.toLowerCase(), i]),
);

/**
 * Returns cityOptions sorted so that cities matching POPULAR_CITIES appear
 * first (in POPULAR_CITIES order), followed by all remaining cities in
 * alphabetical order. Pass this as `options` to the city SearchableSelect.
 */
export async function getOrderedCities(): Promise<CityOption[]> {
  const cities = await getCityOptions();
  const popular: CityOption[] = [];
  const rest: CityOption[] = [];

  for (const city of cities) {
    const rank = popularityIndex.get(city.city.toLowerCase());
    if (rank !== undefined) {
      popular.push(city);
    } else {
      rest.push(city);
    }
  }

  // Sort popular matches by their position in POPULAR_CITIES
  popular.sort((a, b) => {
    const ra = popularityIndex.get(a.city.toLowerCase()) ?? Infinity;
    const rb = popularityIndex.get(b.city.toLowerCase()) ?? Infinity;
    return ra - rb;
  });

  // rest is already alphabetical (cityOptions is pre-sorted by label)
  return [...popular, ...rest];
}

/**
 * Find a city option by its value string.
 */
export async function findCityOption(value: string): Promise<CityOption | undefined> {
  const cities = await getCityOptions();
  return cities.find((c) => c.value === value);
}
