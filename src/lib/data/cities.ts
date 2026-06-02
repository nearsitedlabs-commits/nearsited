export type CityOption = {
  value: string;
  label: string;
  city: string;
  state: string;
  country: string;
};

/**
 * Fetch ordered cities from the server-side API route.
 *
 * The underlying JSON is 29 MB and MUST NOT be imported anywhere in the
 * client bundle or Turbopack's module graph — it would bloat the dev cache
 * to ~1 GB and freeze laptops on server startup.  Instead, the server reads
 * it with `fs.readFile` (which Turbopack never sees) and we fetch it here
 * via a lightweight HTTP call.
 */
const BASE = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

let _cityOptions: CityOption[] | null = null;

async function getCityOptions(): Promise<CityOption[]> {
  if (_cityOptions) return _cityOptions;

  const res = await fetch(`${BASE}/api/cities/search?limit=all`);
  if (!res.ok) throw new Error(`Failed to fetch cities: ${res.statusText}`);

  const body: { cities: CityOption[] } = await res.json();
  _cityOptions = body.cities;
  return _cityOptions;
}

/**
 * Returns all city options (popular first, then alphabetical).
 */
export async function getOrderedCities(): Promise<CityOption[]> {
  return getCityOptions();
}

/**
 * Find a city option by its value string.
 */
export async function findCityOption(value: string): Promise<CityOption | undefined> {
  const cities = await getCityOptions();
  return cities.find((c) => c.value === value);
}
