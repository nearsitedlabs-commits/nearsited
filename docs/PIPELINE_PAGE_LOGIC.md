# Pipeline Page — Kanban Refactor (June 2026)

> Source files:
> - [`src/app/dashboard/pipeline/page.tsx`](../src/app/dashboard/pipeline/page.tsx) — Main kanban page (~260 lines, refactored)
> - [`src/app/dashboard/pipeline/components/PipelineCard.tsx`](../src/app/dashboard/pipeline/components/PipelineCard.tsx) — Compact card component
> - [`src/app/dashboard/pipeline/components/StageColumn.tsx`](../src/app/dashboard/pipeline/components/StageColumn.tsx) — Column with empty-state collapse
> - [`src/app/dashboard/pipeline/components/ScorePill.tsx`](../src/app/dashboard/pipeline/components/ScorePill.tsx) — Compact score badge
> - [`src/app/dashboard/pipeline/components/TimeInStage.tsx`](../src/app/dashboard/pipeline/components/TimeInStage.tsx) — Time-in-stage indicator
> - [`src/app/dashboard/pipeline/components/CardActionsMenu.tsx`](../src/app/dashboard/pipeline/components/CardActionsMenu.tsx) — Overflow actions menu
> - [`src/app/dashboard/pipeline/components/MobileCard.tsx`](../src/app/dashboard/pipeline/components/MobileCard.tsx) — Mobile card variant
> - [`src/app/dashboard/pipeline/loading.tsx`](../src/app/dashboard/pipeline/loading.tsx) — Skeleton loader
> - [`src/app/dashboard/pipeline/error.tsx`](../src/app/dashboard/pipeline/error.tsx) — Error boundary
> - [`src/app/api/pipeline/route.ts`](../src/app/api/pipeline/route.ts) — REST API (POST, PATCH, DELETE)
> - [`src/lib/scoring.ts`](../src/lib/scoring.ts) — Score calculation (canonical `opportunityLabel()`)
> - [`src/lib/db-types.ts`](../src/lib/db-types.ts) — `PipelineRow`, `PipelineBusiness` types

---

## 1. Layout — 5 Columns in Viewport

### Column Width
- **Max width:** `max-w-[220px] w-[220px]` (reduced from 280px)
- **5 columns × 220px = 1100px** + flex gap → fits comfortably in 1240px workspace
- No horizontal scrollbar needed

### Empty Column Collapse
When a column has 0 cards, it collapses to a **48px wide rail**:
- Shows a colored stage dot + vertical stage name (via `[writing-mode:vertical-rl]` or rotated)
- Shows `"0"` count
- On hover, expands to full `max-w-[220px]` via `transition-all duration-200 ease-in-out`
- Helps redistribute width proportionally to non-empty columns

### Card Height
- Target: **70–90px** (reduced from ~150px)
- Three rows:
  - **Header:** Business name (single line, truncate) + `⋯` overflow button
  - **Sub row:** `business_type · city` (11px tertiary text)
  - **Footer:** `<WebsiteBadge>` + `<ScorePill>` + `<TimeInStage>`

### Removed from Card Face
| Removed | Moved To |
|---------|----------|
| Phone number | Detail view (lead detail page) |
| "Moderate opportunity · score N/100" text | Compact `ScorePill` in header footer row |
| "Await Response" / CTA buttons | `CardActionsMenu` overflow menu |
| Date added | Removed (time-in-stage is more useful signal) |

---

## 2. Score Badge

### [`ScorePill`](../src/app/dashboard/pipeline/components/ScorePill.tsx)
Compact pill replacing both the "Moderate opportunity" label and "score N/100" line:
- Renders just the number (e.g., `"92"`) in `text-[11px] px-1.5 py-0.5 rounded-full font-semibold`
- **Color tiers** (from `src/lib/scoring.ts`):
  - `>= 70` → green (`text-green-700 bg-green-100`)
  - `>= 40` → amber (`text-amber-700 bg-amber-100`)
  - `< 40` → red (`text-red-700 bg-red-100`)

### Score Bug Fixed
The original [`getOpportunityContext()`](../src/app/dashboard/pipeline/page.tsx:72) used flawed inline label logic:
- It had `<45` → "Moderate" with **no low tier** — score 4 rendered as "Moderate opportunity"
- It omitted `businessType` from `computeOpportunityScore()` — industry multipliers never applied

**Fix:** Replaced inline logic with canonical [`opportunityLabel()`](../src/lib/scoring.ts:363) and now passes `businessType` parameter. The canonical function correctly handles:
- `>= 70` → "High Opportunity"
- `>= 45` → "Good Opportunity"
- `>= 25` → "Medium Opportunity"
- `< 25` → "Low Opportunity"

---

## 3. Time-in-Stage Indicator

### [`TimeInStage`](../src/app/dashboard/pipeline/components/TimeInStage.tsx)
**Critical missing signal** — now displayed on every card as `"{N}d in stage"`.

**Implementation:**
- Computes days since [`stage_entered_at`](docs/SCHEMA.md#215--add-stage_entered_at-to-pipeline-pipeline-time-in-stage-tracking) (stored on `PipelineBusiness.stage_entered_at`)
- Updates every 60 seconds via `useEffect` interval
- If `enteredAt` is null, renders nothing

**Color Treatment:**
| Days in Stage | Status | Color |
|---------------|--------|-------|
| 0–3 | Normal | `text-gray-400` |
| 4–7 | Slight emphasis | `text-gray-600` |
| 8+ | Contacted (stale) | `text-amber-600` ⚠️ |
| 11+ | In Conversation (stale) | `text-amber-600` ⚠️ |
| 8+ | Other stages | `text-gray-500` |

### Database
- Column: `stage_entered_at TIMESTAMPTZ` on [pipeline table](docs/SCHEMA.md#27-pipeline--lead-funnel)
- Set by [`PATCH /api/pipeline`](../src/app/api/pipeline/route.ts) — only when `status` actually changes
- Backfilled with `updated_at` for existing rows
- Migration: [`scripts/migrate-pipeline-stage-timing.sql`](../scripts/migrate-pipeline-stage-timing.sql)

---

## 4. Card Actions — Overflow Menu

### [`CardActionsMenu`](../src/app/dashboard/pipeline/components/CardActionsMenu.tsx)
Collapsed all buttons into a `⋯` overflow menu on the card's top-right:

| Menu Item | Action |
|-----------|--------|
| View opportunity | Links to `/dashboard/leads/{businessId}` |
| View pitch | Placeholder action (opens pitch modal) |
| Log reply | Placeholder action (opens compose modal) |
| — Separator — | |
| Move to: Prospect | PATCH status = `new_lead` |
| Move to: Contacted | PATCH status = `contacted` |
| Move to: In Conversation | PATCH status = `in_conversation` |
| Move to: Won | PATCH status = `won` |
| Move to: Lost | PATCH status = `lost` |
| — Separator — | |
| Archive | Placeholder action |
| Delete | PATCH DELETE with inline confirmation |

**Primary move affordance:** Drag-and-drop (Framer Motion native drag). The menu is the fallback for mobile or users who prefer not to drag.

---

## 5. Drag-and-Drop

Uses **Framer Motion native drag** (no third-party DnD library):
- `<motion.div>` with `drag="x"` + `dragConstraints` + `onDragEnd`
- Horizontal offset detection (~80px threshold) determines target column
- `layoutId={item.id}` enables cross-column position animations
- `LayoutGroup` wrapper enables smooth transitions
- `touchAction: "none"` for mobile compatibility

---

## 6. Data Fetching

Queries are defined inline in [`page.tsx`](../src/app/dashboard/pipeline/page.tsx):
- Joins `pipeline` + `businesses` tables
- Orders by `pipeline.created_at DESC`
- Maps rows to `PipelineBusiness` type (includes `stage_entered_at`)
- Pre-computes opportunity scores via `useMemo`

### API Endpoints
| Method | Endpoint | Action |
|--------|----------|--------|
| POST | `/api/pipeline` | Add business to pipeline |
| PATCH | `/api/pipeline` | Update status (sets `stage_entered_at` if status changed) |
| DELETE | `/api/pipeline` | Remove from pipeline |

---

## 7. Mobile Rendering

Separate [`MobileCard`](../src/app/dashboard/pipeline/components/MobileCard.tsx) component:
- Same compact layout as PipelineCard (name, type·city, badges, time-in-stage)
- `<select>` dropdown instead of drag for stage changes
- Grouped by stage, stacked vertically

---

## 8. Pipeline Stages

### Enum ([`PIPELINE_SALES_STATUSES`](../src/lib/nav-constants.ts))
| Key | Label | Column Color | Notes |
|-----|-------|-------------|-------|
| `new_lead` | Prospect | Blue | Recently added |
| `contacted` | Contacted | Amber | First outreach made |
| `in_conversation` | In Conversation | Indigo | Active discussion |
| `won` | Won | Green | Closed/converted |
| `lost` | Lost | Red | Rejected/dead |

Note: The DB also supports `analysed` and `pitch_generated` statuses ([§3.2](docs/SCHEMA.md#32-pipelinestatus)) but the kanban only displays the 5 sales stages.

---

## 9. Website Taxonomy

Website status is rendered using the canonical [`<WebsiteBadge>`](../src/components/ui/WebsiteBadge.tsx) component from `@/components/ui/WebsiteBadge`, which maps the 5-state taxonomy:
| Status | Label | Color |
|--------|-------|-------|
| `has_website` | Has site | Indigo |
| `no_website` | No site | Red |
| `social_only` | Social only | Amber |
| `platform_only` | Platform only | Indigo |
| `unknown` | Unknown | Tertiary |

---

## 10. Label Cleanup Applied

| Before | After | Reason |
|--------|-------|--------|
| `"← Back to Dashboard"` link | Removed | Pipeline is a primary sidebar nav item |
| `"PIPELINE"` eyebrow above h1 | Removed | Redundant with sidebar nav label |
| `"Drag cards between stages to update progress"` subtitle | Moved to empty state (only shown when total count = 0) | Clutters header when pipeline has cards |
| `"2 active opportunities"` bordered pill | Inline text: `"Your pipeline · 2 active"` | The pill looked clickable but wasn't |

---

## 11. Out of Scope (Future)

- **Stage value aggregation** — Show estimated project $ per stage. Worth doing with 10+ pipeline cards.
- **Bulk move / multi-card selection** — Complex with drag interactions; punt until needed.
- **Custom pipeline stages** — Out of scope for v1.
