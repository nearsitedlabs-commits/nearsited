# Opportunities Page — Status Taxonomy, Bulk Operations, Cluster Grouping & Metrics

> Source files:
> - [`src/app/dashboard/leads/page.tsx`](../src/app/dashboard/leads/page.tsx)
> - [`src/app/dashboard/leads/components/LeadsTable.tsx`](../src/app/dashboard/leads/components/LeadsTable.tsx)
> - [`src/app/dashboard/leads/components/LeadActionCell.tsx`](../src/app/dashboard/leads/components/LeadActionCell.tsx)
> - [`src/app/dashboard/leads/components/PipelineStatusBadge.tsx`](../src/app/dashboard/leads/components/PipelineStatusBadge.tsx)
> - [`src/app/dashboard/leads/components/helpers.ts`](../src/app/dashboard/leads/components/helpers.ts)
> - [`src/app/dashboard/leads/components/types.ts`](../src/app/dashboard/leads/components/types.ts)
> - [`src/app/dashboard/leads/hooks/useLeadsData.ts`](../src/app/dashboard/leads/hooks/useLeadsData.ts)
> - [`src/app/dashboard/leads/components/LeadsKPIStrip.tsx`](../src/app/dashboard/leads/components/LeadsKPIStrip.tsx)

---

## 1. Status Taxonomy

Replaces the old "tracked / not tracked" binary with a real lead lifecycle.

### Enum ([`types.ts`](../src/app/dashboard/leads/components/types.ts): `OpportunityStatus`)

| Status | Badge color | Meaning |
|--------|-------------|---------|
| `new` | Blue | Just added, no actions taken |
| `audited` | Emerald | Analysis complete (both audit + design) |
| `pitched` | Indigo | Pitch generated, not yet sent |
| `in_pipeline` | Cyan | Added to outreach pipeline |
| `won` | Emerald (bold) | Closed/converted |
| `lost` | Red | Rejected/dead |
| `archived` | Gray | Manually hidden |

### Derivation logic ([`helpers.ts`](../src/app/dashboard/leads/components/helpers.ts): `deriveOpportunityStatus`)

```
1. pipeline_status === "won"       → "won"
2. pipeline_status === "lost"      → "lost"
3. pipeline row exists (not "new_lead") → "in_pipeline"
4. pitch exists                    → "pitched"
5. audited_at + design_analyzed_at → "audited"
6. default                         → "new"
```

Data sources:
- **Pipeline status**: fetched from `pipeline` table via [`useLeadsData`](../src/app/dashboard/leads/hooks/useLeadsData.ts)
- **Pitch existence**: fetched from `pitches` table (boolean map `business_id → true`)
- **Audit completeness**: `lead.audited_at !== null && lead.design_analyzed_at !== null`

### Status updates automatically based on user actions:
- Add via Discovery → status: `new`
- Audit completes → status: `audited` (if it was `new`)
- Pitch generated → status: `pitched` (on the detail page)
- Add to pipeline → status: `in_pipeline`
- Won/Lost/Archive set manually from pipeline status updates

---

## 2. Bulk Selection

### Checkbox column ([`LeadsTable.tsx`](../src/app/dashboard/leads/components/LeadsTable.tsx))

- Checkbox is the **first column** of the table
- State lives in `Set<opportunityId>` via `selectedIds` in [`page.tsx`](../src/app/dashboard/leads/page.tsx)
- **Persists across pagination** — selection carries over when changing pages
- Header row has a "select all on this page" checkbox

### Bulk action bar ([`page.tsx`](../src/app/dashboard/leads/page.tsx))

When selection is non-empty, an info-colored bar appears above the table:

```
{N} selected
[+ Pipeline] [Audit (N credits)]                     [× Clear]
```

- **"+ Pipeline"** — batch-adds all selected leads to pipeline via sequential POST calls to `/api/pipeline`
- **"Audit (N credits)"** — starts audits for all selected leads that have websites (sequential)
- Shows loading spinner during bulk operations
- **"× Clear"** — clears the selection

---

## 3. Cluster Grouping ([`LeadsTable.tsx`](../src/app/dashboard/leads/components/LeadsTable.tsx))

When the current filter+sort produces **>5 consecutive rows** with the same:
- **Industry** (`business_type`)
- **City** (`city`)
- **Score tier** (high ≥ 70 / medium 45–69 / low < 45)

They collapse into a single cluster header row:

```
▶ N in cluster · {industry} · {city} · scored ~{score-min}-{score-max}    Expand ▾
```

- Default: **collapsed** if cluster ≥ 8 rows, **expanded** otherwise
- Click to toggle expansion
- When expanded, shows all individual rows within the cluster

Handles the "bulk-added 20 Aalten real-estate agencies" case without spamming the view.

---

## 4. Row Structure ([`LeadsTable.tsx`](../src/app/dashboard/leads/components/LeadsTable.tsx))

### Columns (in order)

| Column | Width | Content |
|--------|-------|---------|
| [checkbox] | 40px | Multi-select checkbox |
| [score] | 56px | 40×40 `ScoreRing` with opportunity score |
| [business] | flex | **Line 1** (13px): business name (single line, ellipsis) |
| | | **Line 2** (10px tertiary): `{city} · {industry} · {rating}★ · {review_count}` |
| [site] | 80px | "None" / "Social" / "Platform" / "Has site" |
| [last audit] | 96px | Relative time: "Today", "Yesterday", "3d ago", or "—" |
| [status] | 112px | Colored pill badge per status taxonomy |
| [action] | 144px | Single context-aware button |

### Removed from rows
- Per-row phone number
- Duplicate "High Opportunity — N" text (score circle already carries this)

### Action cell — one context-aware button ([`LeadActionCell.tsx`](../src/app/dashboard/leads/components/LeadActionCell.tsx))

| Status | Button | Action |
|--------|--------|--------|
| `new` (has website) | **Audit** | Starts performance + design analysis |
| `new` (no website) | **View** | Opens detail page (no audit possible) |
| `audited` | **View** | Opens detail page |
| `pitched` | **Send** | Opens detail page with pitch tab |
| `in_pipeline` | **View** | Opens detail page |
| `won` / `lost` / `archived` | **View** | Opens detail page |

- "Re-analyse" removed from the row — moved to the detail page as a secondary action

### Site presence labels ([`types.ts`](../src/app/dashboard/leads/components/types.ts): `SITE_LABEL`)

| `website_status` | Label | Color |
|-----------------|-------|-------|
| `no_website` | None | Red |
| `social_only` | Social | Amber |
| `platform_only` | Platform | Indigo |
| `has_website` | Has site | Tertiary |
| `unknown` | — | Tertiary |

---

## 5. Metric Tiles ([`LeadsKPIStrip.tsx`](../src/app/dashboard/leads/components/LeadsKPIStrip.tsx))

| Tile | Value | Visual | Click action |
|------|-------|--------|-------------|
| **Un-audited** | `leads where audited_at === null` count | Thin warning-color left accent border (`border-l-[var(--score-mid)]`) | Filters table to unaudited leads only |
| **Total** | Total leads count | Neutral, no accent | Resets to all leads |
| **Ready to Pitch** | `flagged_for_outreach` count | Neutral | Filters to flagged leads |
| **In Pipeline** | `pipelineMap.size` | Neutral | Filters to pipeline leads |

- Clicking any tile updates the filter state to show that subset
- Active tile can be identified by the filter applied

---

## 6. Label Cleanup

| Before | After | Reason |
|--------|-------|--------|
| `"OPPORTUNITIES"` eyebrow above H1 | Removed | Redundant with sidebar nav label |
| `"← Back to Dashboard"` link | Removed | Opportunities is a primary nav item |
| `"New Search"` button | `"+ Find more"` | "Search" implied in-page search, but button navigates away |
