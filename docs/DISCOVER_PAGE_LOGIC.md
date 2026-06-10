# Discover Page — Tiered List, Filters, Sort & Scoring Logic

> Source files:
> - [`src/app/dashboard/discover/page.tsx`](../src/app/dashboard/discover/page.tsx)
> - [`src/app/dashboard/discover/components/ResultCard.tsx`](../src/app/dashboard/discover/components/ResultCard.tsx)
> - [`src/app/dashboard/discover/components/ResultsFilterBar.tsx`](../src/app/dashboard/discover/components/ResultsFilterBar.tsx)
> - [`src/lib/scoring.ts`](../src/lib/scoring.ts)
> - [`src/app/dashboard/discover/components/types.ts`](../src/app/dashboard/discover/components/types.ts)

---

## 1. List Structure — Grouped by Score Tier

Results are rendered in three tier groups (**HIGH** / **MEDIUM** / **LOW**) with a header row separating each:

### Tier thresholds

| Tier | Score range | Color |
|------|-------------|-------|
| HIGH | ≥ 70 | green (`--score-good`) |
| MEDIUM | 45–69 | amber (`--score-mid`) |
| LOW | < 45 | red (`--score-high`) |

### Tier header ([`page.tsx`](../src/app/dashboard/discover/page.tsx))

Each tier begins with a full-width strip (~36px tall) containing:

- **Left**: Small colored pill showing `"HIGH · 13 leads"` using semantic colors
- **Left meta**: 11px tertiary description (e.g. `"All no-website · Score 71+"` or `"Has site · estimated ~50-69"`)
- **Right**: Bulk action button appropriate to the tier:
  - **"+ All to pipeline"** for No-Website tiers (no credit cost)
  - **"Audit all (N credits)"** for Has-Website tiers (N = number of rows in tier)

### Row rendering ([`ResultCard.tsx`](../src/app/dashboard/discover/components/ResultCard.tsx))

Each row is ~42px tall with:

1. **Score circle** — 28×28, border-only (no fill), color from tier ramp. Shows the numeric score.
2. **Business name** — single line with ellipsis overflow
3. **Rating + review count** — `"4.9★ · 639"` in 11px tertiary text, right-aligned
4. **Two action buttons**:
   - No-Website rows: [View] [+ Pipeline]
   - Has-Website rows: [Audit] [+ Pipeline]
   - Both buttons compact (text-[11px], h-7)

**Removed from rows**: phone icon, map pin icon, business type + city text (was redundant with search query at the top).

### Collapse after 5 rows ([`page.tsx`](../src/app/dashboard/discover/page.tsx))

After the first 5 rows in each tier, remaining rows are hidden behind a clickable toggle:
- `"+ N more in this tier"` — click expands the tier
- Once expanded, shows `"Show fewer"` to collapse back

---

## 2. Header Strip ([`ResultsFilterBar.tsx`](../src/app/dashboard/discover/components/ResultsFilterBar.tsx))

Above the tiered list, a compact two-line header:

- **Line 1** (13px, weight 500): `"{businessType}s near {location}"` e.g. "Dermatologists near Trivandrum"
- **Line 2** (11px, tertiary): `"{count} results · {flagged} flagged · Sort: {sortKey} ▾"`

### Sort options

| Value | Label |
|-------|-------|
| `score-desc` | Score (default) |
| `reviews-desc` | Review count |
| `rating-desc` | Rating |
| `recency-desc` | Recency |
| `name-asc` | Alphabetical |

---

## 3. Filter Chips ([`ResultsFilterBar.tsx`](../src/app/dashboard/discover/components/ResultsFilterBar.tsx))

Single line of pill-style filter chips above the list:

```
Filter: All · Has site · No site · Social only · Platform only
```

- Active chip uses normal text color (`text-[var(--text-primary)]`)
- Inactive chips use tertiary text (`text-[var(--text-tertiary)]`)
- Filtering matches `business.website_status` against the selected value

---

## 4. Scoring Logic ([`src/lib/scoring.ts`](../src/lib/scoring.ts))

### Effective score computation ([`page.tsx`](../src/app/dashboard/discover/page.tsx): `getEffectiveScore`)

Each business gets a numeric score used for tier assignment:

1. **If audit data exists** (mobile/desktop performance scores or design score):
   - Uses `computeOpportunityScore()` which blends:
     - `websiteWeakness()` — website quality converted to weakness signal
     - `businessViabilityMultiplier()` — review count + rating
     - `getIndustryMultiplier()` — business type opportunity boost/penalty
   - Full formula: `weakness × viability × industry`

2. **If no audit data** (preliminary estimate):
   - Uses `estimatedOpportunity()` which delegates to:
     - **`noWebsiteOpportunityScore()`** for `no_website` leads (differentiated by social proof)
     - Website quality heuristics for `has_website`/`social_only`/`platform_only`

### No-Website Scoring — Differentiated ([`scoring.ts`](../src/lib/scoring.ts): `noWebsiteOpportunityScore`)

Previously all no-website leads scored ~95 (flat), making the page useless as a prioritization tool. The new formula differentiates within the tier:

```
Base: 80
+ Review count factor: log(reviews) × 3, capped at +15
+ Rating factor: (rating - 4.0) × 5, capped at +5
= Result: 80–100
```

**Examples**:

| Reviews | Rating | Score | Calculation |
|---------|--------|-------|-------------|
| 10 | 4.0 | 87 | 80 + 6.9 + 0 |
| 93 | 4.7 | 97 | 80 + 13.8 + 3.5 |
| 639 | 4.9 | 100 | 80 + 15(capped) + 4.5 |
| 10000 | 5.0 | 100 | 80 + 15(capped) + 5(capped) |

This means a 4.9★ dermatologist with 639 reviews scores **higher** than a 4.7★ with 93 reviews — the differentiation the page needs.

---

## 5. Label Hygiene

| Before | After |
|--------|-------|
| `+ Add` | `+ Pipeline` |
| `View Opportunity` | `View` |
| `"Find businesses worth reaching out to."` (period) | `"Find businesses worth reaching out to"` (no period) |

The sort dropdown label was previously `"Opportunity ▾"` which was unclear. It's now integrated into the header strip's second line: `"Sort: Score ▾"`.

---

## 6. Bulk Actions

### No-Website tiers: "+ All to pipeline"
- Adds every business in the tier to the pipeline
- No credit cost (no audit needed)
- Shows loading spinner per tier during bulk operation
- Displays toast: `"Added N leads to pipeline"`

### Has-Website tiers: "Audit all (N credits)"
- Starts audits for every auditable business in the tier
- Shows credit cost upfront (N = number of rows)
- Displays toast: `"Started audit for N businesses"`

---

## 7. `website_status` values

| Status | Meaning |
|--------|---------|
| `has_website` | Business has a detectable website URL |
| `no_website` | No website found at all |
| `social_only` | Only social media profiles found (Facebook, Instagram, etc.) |
| `platform_only` | Only third-party platform page found (Google Maps, Yelp, etc.) |
| `unknown` | Status not yet determined |
