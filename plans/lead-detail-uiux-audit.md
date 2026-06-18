# Lead Detail Page — UI/UX Audit

## Pages Analyzed

| Page | Component | Lead Type |
|------|-----------|-----------|
| Main | [`lead-detail-client.tsx`](src/app/dashboard/leads/[id]/lead-detail-client.tsx) | `has_website` with audit data |
| Social only | [`social-opportunity-page.tsx`](src/app/dashboard/leads/[id]/components/social-opportunity-page.tsx) | `social_only` |
| No presence | [`no-digital-presence-page.tsx`](src/app/dashboard/leads/[id]/components/no-digital-presence-page.tsx) | `no_website` |

---

## Redundancies

### 1. StatsRow is empty/wasted on workflow leads

Shown on ALL three pages identically, but for `social_only` and `no_digital_presence`, ALL four stats are null:

| Stat | Main page | Workflow pages |
|-----|-----------|----------------|
| Opportunity Score | ✅ Real value | ✅ Real value |
| Est. Project Value | "Pending analysis" | "Pending analysis" |
| Review Velocity (30d) | "N/A" | "N/A" |
| Local Competition | "N/A" | "N/A" |

**Problem:** Cards 2-4 add no value for workflow leads — they show "N/A" or "Pending analysis" which is noise. This wastes the top content area.

**Fix:** For workflow leads, show a compact summary bar instead of the full 4-card StatsRow. Show only the opportunity score + rating/reviews + lead type badge in a single row.

### 2. Export section duplicated

- Main page uses `LeadExportSection` component (PDF + Share)
- Workflow pages have the same buttons inlined directly

**Fix:** Use `LeadExportSection` consistently across all pages.

### 3. Analysis banners only relevant for has_website

- `AnalysisProgressBanner` and `DesignErrorBanner` only make sense when there's a website to audit
- These are conditionally rendered based on audit state, so technically fine — but they take up space

---

## Missing Content

### 1. No `OpportunityScoreExplanation` on workflow pages

Main page shows it in the right column — it explains WHY the score is what it is. Helpful for all lead types.

### 2. No `HistoryCard` on workflow pages

Audit history only matters when audits exist, so this is acceptable.

### 3. No contextual guidance for workflow leads

For social_only: "This business has Instagram/Facebook but no website — pitch a website build"
For no_digital_presence: "This business has no online presence at all — pitch from scratch"

This guidance exists in the PreCallBrief but could be more prominent.

---

## Layout Inconsistencies

### 1. Right column is thin on workflow pages

Main page has 3 items stacked in the right column:
- PreCallBrief
- OpportunityScoreExplanation
- LeadExportSection

Workflow pages only have:
- PreCallBrief
- Export

The column feels empty.

### 2. Column ratio syntax differs

- Main page: `lg:grid-cols-[3fr_2fr]`
- Workflow pages: `lg:grid-cols-5` with `lg:col-span-3` and `lg:col-span-2`

Same result, different approach.

---

## Recommended Rework

### A. Unified StatsRow for workflow leads

Create a `CompactStatsBar` that shows just: [Score badge] [Rating/reviews] [Lead type tag] — single row, no N/A cards.

### B. Add OpportunityScoreExplanation to workflow pages

It explains the opportunity score context, which is valuable regardless of lead type.

### C. Single source of truth for layout

Consolidate the page layout into one component that adapts based on lead type, rather than three separate page implementations with duplicated code.

### D. Context banner for workflow leads

Above the pitch card, show a one-liner: "This business has [X] — your pitch should focus on [Y]. Use the settings below to tune the angle."
