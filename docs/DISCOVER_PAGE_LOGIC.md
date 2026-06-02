# Discover Page — Opportunity Badge, Filters & Sort Logic

> Source files:
> - [`src/app/dashboard/discover/page.tsx`](../src/app/dashboard/discover/page.tsx)
> - [`src/lib/ui-constants.ts`](../src/lib/ui-constants.ts)

---

## 1. Opportunity Indicator Badge

### Source: [`discover/page.tsx:1268-1282`](../src/app/dashboard/discover/page.tsx:1268)

```tsx
const auditScore = business.audit?.mobile?.performance_score ?? null;
const levelKey = getOpportunityLevel(business.website_status, auditScore);
const indicator = OPPORTUNITY_INDICATORS[levelKey] ?? OPPORTUNITY_INDICATORS.low;
```

Delegates to [`getOpportunityLevel(websiteStatus, score)`](../src/lib/ui-constants.ts:61):

```tsx
export function getOpportunityLevel(websiteStatus: string, score: number | null): string {
  if (websiteStatus === "has_website") {
    if (score === null) return "website";        // → "Website Opportunity"
    if (score >= 70) return "high";              // → "High Opportunity"
    if (score >= 40) return "medium";            // → "Medium Opportunity"
    return "low";                                 // → "Low Opportunity"
  }
  if (websiteStatus === "no_website") return "no_website";     // → "No Website Found"
  if (websiteStatus === "social_only") return "social";        // → "Social Presence Only"
  if (websiteStatus === "platform_only") {
    if (score !== null && score >= 70) return "high";          // → "High Opportunity"
    return "website";                                           // → "Website Opportunity"
  }
  return "medium";
}
```

### Badge appearance mapping ([`OPPORTUNITY_INDICATORS`](../src/lib/ui-constants.ts:49))

| Level Key | Label | Border/Text/BG | Dot Color |
|-----------|-------|---------------|-----------|
| `high` | High Opportunity | `badge-green-*` | green |
| `medium` | Medium Opportunity | `badge-amber-*` | amber |
| `low` | Low Opportunity | `badge-red-*` | red |
| `website` | Website Opportunity | `badge-green-*` | green |
| `social` | Social Presence Only | `badge-amber-*` | amber |
| `no_website` | No Website Found | `badge-red-*` | red |

### Decision table

| `website_status` | `audit?.mobile?.performance_score` | Badge shown |
|---|---|---|
| `no_website` | any (incl. null) | **No Website Found** (red) |
| `social_only` | any (incl. null) | **Social Presence Only** (amber) |
| `platform_only` | `null` | **Website Opportunity** (green) |
| `platform_only` | `≥ 70` | **High Opportunity** (green) |
| `has_website` | `null` (not yet audited) | **Website Opportunity** (green) |
| `has_website` | `≥ 70` | **High Opportunity** (green) |
| `has_website` | `40–69` | **Medium Opportunity** (amber) |
| `has_website` | `< 40` | **Low Opportunity** (red) |

---

## 2. Filter Tabs

### Source: [`discover/page.tsx:113-119`](../src/app/dashboard/discover/page.tsx:113)

```tsx
const FILTER_TABS: FilterTab[] = [
  { value: "all",           label: "All" },
  { value: "no_website",    label: "Website Opportunity" },
  { value: "social_only",   label: "Social Presence" },
  { value: "platform_only", label: "Platform Presence" },
  { value: "has_website",   label: "Opportunity Found" },
];
```

### Filtering logic ([`:367-371`](../src/app/dashboard/discover/page.tsx:367))

```tsx
const filtered = results.filter((b) => {
  if (websiteFilter !== "all" && b.website_status !== websiteFilter) return false;
  return true;
});
```

- **`all`** — shows every business (no filtering)
- Each other tab **exactly matches** `business.website_status` against the filter value

### Render location ([`:1209-1224`](../src/app/dashboard/discover/page.tsx:1209))

Rendered as pill buttons inside a segmented control:

```tsx
<div className="flex gap-1 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-1">
  {FILTER_TABS.map((tab) => (
    <button
      key={tab.value}
      onClick={() => setWebsiteFilter(tab.value)}
      className={`rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap ${
        websiteFilter === tab.value
          ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--brand-shadow-xs)] font-semibold"
          : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
      }`}
    >
      {tab.label}
    </button>
  ))}
</div>
```

---

## 3. Sort Dropdown

### Source: [`discover/page.tsx:96-104`](../src/app/dashboard/discover/page.tsx:96)

```tsx
const SORT_OPTIONS: SortOption[] = [
  { value: "opportunity-desc", label: "Opportunity (Highest First)" },
  { value: "opportunity-asc",  label: "Opportunity (Lowest First)" },
  { value: "rating-desc",      label: "Rating (High to Low)" },
  { value: "rating-asc",       label: "Rating (Low to High)" },
  { value: "name-asc",         label: "Name (A-Z)" },
  { value: "date-desc",        label: "Most Recently Added" },
  { value: "outreach-first",   label: "Flagged for Outreach First" },
];
```

### Sort logic ([`:373-403`](../src/app/dashboard/discover/page.tsx:373))

| Sort option | Comparator |
|---|---|
| `opportunity-desc` | Computes effective opportunity score: `no_website`/`social_only` → 90, `platform_only` → 75, else `auditScore ?? 0`. Sorts descending. |
| `opportunity-asc` | Same computation, sorts ascending. |
| `rating-desc` | `b.rating - a.rating` (highest first) |
| `rating-asc` | `a.rating - b.rating` (lowest first) |
| `name-asc` | `a.name.localeCompare(b.name)` (A–Z) |
| `date-desc` | No sort (preserves insertion order) |
| `outreach-first` | Flagged businesses first (`flagged_for_outreach === true`), then by rating descending |

```tsx
const sorted = [...filtered].sort((a, b) => {
  switch (sortOption) {
    case "opportunity-desc":
    case "opportunity-asc": {
      const aScore = a.audit?.mobile?.performance_score ?? null;
      const bScore = b.audit?.mobile?.performance_score ?? null;
      const aOpp = a.website_status === "no_website" || a.website_status === "social_only" ? 90
                 : a.website_status === "platform_only" ? 75
                 : aScore ?? 0;
      const bOpp = b.website_status === "no_website" || b.website_status === "social_only" ? 90
                 : b.website_status === "platform_only" ? 75
                 : bScore ?? 0;
      const cmp = aOpp - bOpp;
      return sortOption === "opportunity-desc" ? -cmp : cmp;
    }
    case "rating-asc":
      return (a.rating ?? 0) - (b.rating ?? 0);
    case "rating-desc":
      return (b.rating ?? 0) - (a.rating ?? 0);
    case "name-asc":
      return a.name.localeCompare(b.name);
    case "outreach-first":
      if (a.flagged_for_outreach && !b.flagged_for_outreach) return -1;
      if (!a.flagged_for_outreach && b.flagged_for_outreach) return 1;
      return (b.rating ?? 0) - (a.rating ?? 0);
    case "date-desc":
    default:
      return 0;
  }
});
```

### Note on opportunity sort vs badge consistency

The sort already used `website_status` as a fallback (90 for `no_website`/`social_only`, 75 for `platform_only`), but the **badge display** was incorrectly defaulting to `oppScore = 0` → "Low Opportunity" before the fix. Now both sort and badge use the same `website_status`-aware logic.

---

## 4. Helper: `website_status` values

| Status | Meaning |
|---|---|
| `has_website` | Business has a detectable website URL |
| `no_website` | No website found at all |
| `social_only` | Only social media profiles found (Facebook, Instagram, etc.) |
| `platform_only` | Only third-party platform page found (Google Maps, Yelp, etc.) |
| `unknown` | Status not yet determined |
