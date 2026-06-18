/**
 * Curated list of major metro areas worldwide.
 *
 * Single source of truth — used by:
 * - The cities search API to prioritise popular results
 * - The discover page randomise button to filter the pool to metros only
 *
 * These cities have sufficient density of all business types (including rare
 * ones like "trampoline park", "helicopter tour", etc.) to return meaningful
 * results from a 10km Google Places search.
 */
export const MAJOR_CITIES = [
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
] as const;

export type MajorCity = (typeof MAJOR_CITIES)[number];
