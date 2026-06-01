import { writeFileSync } from "fs";

const response = await fetch(
  "https://raw.githubusercontent.com/dr5hn/countries-states-cities-database/master/json/countries%2Bstates%2Bcities.json"
);
const countries = await response.json();

const entries = [];

for (const country of countries) {
  const countryName = country.name;
  if (!country.states) continue;
  for (const state of country.states) {
    const stateName = state.name;
    if (!state.cities) continue;
    for (const city of state.cities) {
      const cityName = city.name;
      const label = stateName
        ? `${cityName}, ${stateName}, ${countryName}`
        : `${cityName}, ${countryName}`;
      entries.push({
        city: cityName,
        state: stateName || "",
        country: countryName,
        label,
        value: label,
      });
    }
  }
}

// Deduplicate by value
const seen = new Set();
const deduped = [];
for (const entry of entries) {
  if (!seen.has(entry.value)) {
    seen.add(entry.value);
    deduped.push(entry);
  }
}

deduped.sort((a, b) => a.label.localeCompare(b.label));

writeFileSync(
  "src/lib/data/cities.json",
  JSON.stringify(deduped, null, 2)
);
console.log(`Saved ${deduped.length} cities`);
