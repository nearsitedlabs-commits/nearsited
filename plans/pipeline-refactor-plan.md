# Pipeline Page Refactoring Plan

## Summary of Key Adaptations

### What changed from the original prompt to our codebase

| Prompt Concept | Our Reality | Adaptation |
|---|---|---|
| `react-beautiful-dnd` / dnd-kit | Framer Motion native `drag` prop on `motion.div` | Keep Framer Motion drag; it's already working with `LayoutGroup` + `AnimatePresence` |
| 5 stages: `new_lead`, `contacted`, `in_conversation`, `won`, `lost` | Same 5 sales stages. Also `analysed` exists in DB but is hidden from user-facing dropdowns | No change needed — `PIPELINE_SALES_STATUSES` in [`ui-constants.ts`](src/lib/ui-constants.ts:26) is already the right set |
| Website taxonomy: "has_website" / "no_website" (2-state) | 5-state: `has_website`, `no_website`, `social_only`, `platform_only`, `unknown` in [`db-types.ts`](src/lib/db-types.ts:12) | Use 5-state everywhere — DB already stores it correctly |
| Inline old-style badges in pipeline | `OPPORTUNITY_BADGES` in [`page.tsx:55`](src/app/dashboard/pipeline/page.tsx:55) with "Has Website" / "No Website" labels | Replace with canonical [`WebsiteBadge`](src/components/ui/WebsiteBadge.tsx) component |
| Score display text: "High opportunity · score 76/100" | Inline `getOpportunityContext()` at [`page.tsx:72`](src/app/dashboard/pipeline/page.tsx:72) with its own label thresholds | Replace with compact score pill using [`opportunityLabel()`](src/lib/scoring.ts:363) / [`opportunityBadgeVariant()`](src/lib/scoring.ts:374) |
| `stage_entered_at` exists in DB | **Does not exist** — only `created_at` and `updated_at` in [`PipelineRow`](src/lib/db-types.ts:142) | Add column + migration + backfill |
| "Back to Dashboard" link | Present at [`page.tsx:417`](src/app/dashboard/pipeline/page.tsx:417) | Remove |
| "PIPELINE" eyebrow | Present at [`page.tsx:427`](src/app/dashboard/pipeline/page.tsx:427) | Remove |
| X active opportunities badge | Present at [`page.tsx:436`](src/app/dashboard/pipeline/page.tsx:436) | Demote to inline text |

### What stayed the same

- Framer Motion drag-and-drop with `LayoutGroup` — no migration needed
- Same 5 sales stages throughout
- Supabase client + optimistic updates via `PATCH /api/pipeline`
- Mobile `MobileCard` + `<select>` dropdown pattern (keep, but update to match new card fields)
- `detectLeadWorkflow()` in [`lead-types.ts`](src/lib/lead-types.ts) for workflow classification
- `blendQualityForOpportunity()` + `computeOpportunityScore()` in [`scoring.ts`](src/lib/scoring.ts) — these are correct

---

## File-by-File Breakdown

### Files to Modify

| # | File | Change |
|---|---|---|
| 1 | `src/app/dashboard/pipeline/page.tsx` | Major refactor: extract components, fix score labels, remove phone/context/CTA, add overflow menu, label cleanup |
| 2 | `src/lib/scoring.ts` | Add `opportunityBadgeColor()` that returns CSS color string for score pill, fix `getOpportunityContext()` duplication (remove inline version) |
| 3 | `src/lib/__tests__/scoring.test.ts` | Add test assertions: score 4 → "Low Opportunity", score 50 → "Good Opportunity", score 80 → "High Opportunity" |
| 4 | `src/app/dashboard/dashboard-client.tsx` | Replace inline `OPPORTUNITY_TYPE_BADGES` with `WebsiteBadge` component |
| 5 | `src/app/api/pipeline/route.ts` | Add `stage_entered_at` to PATCH update when status changes |
| 6 | `src/lib/db-types.ts` | Add `stage_entered_at: string` to `PipelineRow` interface |
| 7 | `src/lib/validation.ts` | Add `stage_entered_at` to `pipelinePatchSchema` (optional, backend sets it) |

### Files to Create

| # | File | Purpose |
|---|---|---|
| 8 | `src/app/dashboard/pipeline/components/StageColumn.tsx` | Extracted column component with collapse/expand behavior |
| 9 | `src/app/dashboard/pipeline/components/PipelineCard.tsx` | Extracted card component with compact layout |
| 10 | `src/app/dashboard/pipeline/components/CardActionsMenu.tsx` | Overflow menu with all actions |
| 11 | `src/app/dashboard/pipeline/components/ScorePill.tsx` | Compact score badge displaying just the number with tier color |
| 12 | `src/app/dashboard/pipeline/components/TimeInStage.tsx` | "{N}d in stage" display with color treatment |
| 13 | `src/app/dashboard/pipeline/components/MobileCard.tsx` | Extracted from inline in page.tsx (currently lines 138-171) |
| 14 | `src/app/dashboard/pipeline/components/EmptyPipelineState.tsx` | Extracted empty state (currently lines 444-487) |
| 15 | `scripts/migrate-pipeline-stage-timing.sql` | SQL migration to add and backfill `stage_entered_at` |

### Files to Delete

_None — the extract-and-import pattern keeps the original file functional_

---

## Implementation Order

The order is designed so that each step's output feeds into the next, with DB changes happening early enough that everything else can depend on them.

```
Step 1: Score Bug Fix (scoring.ts + tests)
    │
    ▼
Step 2: DB Migration (stage_entered_at)
    │
    ▼
Step 3: API Update (pipeline/route.ts)
    │
    ▼
Step 4: Website Taxonomy Fix (dashboard-client.tsx)
    │
    ▼
Step 5: Component Extraction (new files)
    │
    ▼
Step 6: Pipeline Layout Refactor (page.tsx + new components)
    │
    ▼
Step 7: Label Cleanup (page.tsx header)
    │
    ▼
Step 8: Tests & Verification
```

---

## Step 1: Score Bug Fix 🔴 HIGH PRIORITY

### Root Cause Analysis

The [`getOpportunityContext()`](src/app/dashboard/pipeline/page.tsx:72) function in the pipeline page has **its own inline label threshold logic** that differs from the canonical [`opportunityLabel()`](src/lib/scoring.ts:363) function in `scoring.ts`:

```typescript
// page.tsx line 80 — INLINE (BUGGY)
const label = opp >= 70 ? "High opportunity"
             : opp >= 45 ? "Good opportunity"
             : "Moderate opportunity";  // ← BUG: should be "Medium/Low Opportunity"

// scoring.ts line 363 — CANONICAL (CORRECT)
export function opportunityLabel(opportunityScore: number): string {
  if (opportunityScore >= 70) return 'High Opportunity';
  if (opportunityScore >= 45) return 'Good Opportunity';
  if (opportunityScore >= 25) return 'Medium Opportunity';
  return 'Low Opportunity';
}
```

**Impact**: Score 4 displays "Moderate opportunity" instead of "Low Opportunity". Score 24 displays "Moderate opportunity" when it should be "Medium Opportunity". The inline code also **omits** the `<25 "Low Opportunity"` tier entirely.

**Secondary bug**: `getOpportunityContext()` calls `computeOpportunityScore()` without passing `businessType`, so **industry multipliers are never applied** to pipeline card scores.

### Changes

#### [`src/lib/scoring.ts`](src/lib/scoring.ts)
- Add `opportunityBadgeColor(score: number): string` — returns the CSS color variable string for score pill background (maps green/amber/indigo/red → CSS vars)
- Add `opportunityTierLabel(score: number): string` — returns short tier text: "High", "Good", "Medium", "Low" (used in compact pill)

#### [`src/lib/__tests__/scoring.test.ts`](src/lib/__tests__/scoring.test.ts)
Add test block:

```typescript
describe("opportunityLabel edge cases", () => {
  it('returns "Low Opportunity" for score 4', () => {
    expect(opportunityLabel(4)).toBe("Low Opportunity");
  });
  it('returns "Good Opportunity" for score 50', () => {
    expect(opportunityLabel(50)).toBe("Good Opportunity");
  });
  it('returns "High Opportunity" for score 80', () => {
    expect(opportunityLabel(80)).toBe("High Opportunity");
  });
});
```

**Note**: Score 50 → "Good Opportunity" (50 >= 45 threshold), not "Medium". The task description's "medium" for score 50 refers to the badge color tier (amber = medium priority), not the label text.

#### [`src/app/dashboard/pipeline/page.tsx`](src/app/dashboard/pipeline/page.tsx)
- Remove `getOpportunityContext()` function entirely (lines 72-87)
- Where it was called (line 286-288), replace with call to `opportunityLabel(oppScore)` for the compact pill (Step 4 covers the replacement)

---

## Step 2: DB Migration — `stage_entered_at`

### Create [`scripts/migrate-pipeline-stage-timing.sql`](scripts/migrate-pipeline-stage-timing.sql)

```sql
-- Migration: Add stage_entered_at to pipeline table
-- Tracks when a lead entered its current pipeline stage for time-in-stage display.

ALTER TABLE pipeline
  ADD COLUMN IF NOT EXISTS stage_entered_at TIMESTAMPTZ;

-- Backfill: set stage_entered_at = updated_at for existing rows
UPDATE pipeline
  SET stage_entered_at = updated_at
  WHERE stage_entered_at IS NULL;

-- Make it NOT NULL after backfill
ALTER TABLE pipeline
  ALTER COLUMN stage_entered_at SET NOT NULL;
```

### Update [`src/lib/db-types.ts`](src/lib/db-types.ts)

Add `stage_entered_at: string` to [`PipelineRow`](src/lib/db-types.ts:142) interface:

```typescript
export interface PipelineRow {
  id: string;
  business_id: string;
  user_id: string;
  status: PipelineStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  stage_entered_at: string;  // ← ADD
}
```

### Update [`src/app/dashboard/pipeline/page.tsx`](src/app/dashboard/pipeline/page.tsx)

Add `stage_entered_at` to the local `PipelineBusiness` type and the query:

```typescript
// In the query string (line 91-97)
const PIPELINE_QUERY = `
  id, status, created_at, stage_entered_at,  // ← add stage_entered_at
  businesses:business_id (...)
`;

// In mapPipelineRow (line 99-118)
stage_entered_at: (row.stage_entered_at as string) ?? row.created_at as string,  // fallback to created_at
```

---

## Step 3: API Update — `stage_entered_at` in PATCH

### [`src/app/api/pipeline/route.ts`](src/app/api/pipeline/route.ts)

In the [`PATCH` handler](src/app/api/pipeline/route.ts:160), modify the update to set `stage_entered_at` only when status actually changes:

```typescript
// Before the update, fetch current status to compare
const { data: currentRow } = await supabase
  .from("pipeline")
  .select("status")
  .eq(matchField, matchValue)
  .eq("user_id", user.id)
  .single();

const statusChanged = currentRow && currentRow.status !== status;
const now = new Date().toISOString();

const updatePayload: Record<string, unknown> = {
  status,
  updated_at: now,
};
if (statusChanged) {
  updatePayload.stage_entered_at = now;
}

const { data: updatedRows, error: updateError } = await supabase
  .from("pipeline")
  .update(updatePayload)
  .eq(matchField, matchValue)
  .eq("user_id", user.id)
  .select("id");
```

Also update the INSERT in the upsert path (line 228) to include `stage_entered_at: now`.

---

## Step 4: Website Taxonomy Fix 🔴 HIGH PRIORITY

### Problem

Three different badge label sets exist for the same taxonomy:

| Location | `has_website` | `no_website` | `social_only` | `platform_only` | `unknown` |
|---|---|---|---|---|---|
| [`page.tsx:55`](src/app/dashboard/pipeline/page.tsx:55) `OPPORTUNITY_BADGES` | "Has Website" | "No Website" | "Social Only" | "Platform Only" | "Unknown" |
| [`dashboard-client.tsx:61`](src/app/dashboard/dashboard-client.tsx:61) `OPPORTUNITY_TYPE_BADGES` | "Weak Website" | "No Website" | "Social Only" | "Platform Only" | "Unknown" |
| [`WebsiteBadge.tsx:3`](src/components/ui/WebsiteBadge.tsx:3) **CANONICAL** | "Has site" | "No site" | "Social only" | "Platform only" | "Unknown" |

### Changes

#### [`src/app/dashboard/pipeline/page.tsx`](src/app/dashboard/pipeline/page.tsx)

1. Remove `OPPORTUNITY_BADGES` constant (lines 55-61)
2. Import `WebsiteBadge` from `@/components/ui/WebsiteBadge`
3. Replace inline badge span (lines 273-279) with:

```tsx
<WebsiteBadge status={item.website_status} />
```

4. Also replace in `MobileCard` (line 147) similarly.

#### [`src/app/dashboard/dashboard-client.tsx`](src/app/dashboard/dashboard-client.tsx)

1. Remove `OPPORTUNITY_TYPE_BADGES` constant (lines 61-67)
2. Import `WebsiteBadge` from `@/components/ui/WebsiteBadge`
3. Replace the badge reference at line 286:

```tsx
// Before:
{badge?.label ?? "Unknown"}
// After:
<WebsiteBadge status={lead.website_status} />
```

---

## Step 5: Component Extraction

### [`src/app/dashboard/pipeline/components/PipelineCard.tsx`](src/app/dashboard/pipeline/components/PipelineCard.tsx)

**Purpose**: Standalone compact card rendered inside StageColumn's `motion.div`.

**Props**:
```typescript
type PipelineCardProps = {
  item: PipelineBusiness;
  isDragging: boolean;
  onDragStart: (id: string) => void;
  onDragEnd: (id: string, stage: string) => void;
  onCardClick: (id: string) => void;
};
```

**Layout** (compact, ~80px height):

```
┌─────────────────────────────────┐
│ Business Name               ┆ 92│  ← name (truncated), ScorePill (right)
│ Type · City              ┆ 3d  │  ← type·city, TimeInStage (right)
│ [Has site]                    │  ← WebsiteBadge
└─────────────────────────────────┘
```

**Key changes from current card**:
- Remove phone line (currently lines 260-269)
- Remove `getOpportunityContext()` text (currently lines 286-288)
- Remove CTA button footer (currently lines 291-300)
- Remove date display (move to TimeInStage)
- Compact padding: `p-2` instead of `p-3`
- ScorePill on the right edge

**Drag behavior**: Keep existing Framer Motion `drag` props as-is — this is the critical interaction.

### [`src/app/dashboard/pipeline/components/StageColumn.tsx`](src/app/dashboard/pipeline/components/StageColumn.tsx)

**Purpose**: Column with collapse/expand behavior.

**Props**:
```typescript
type StageColumnProps = {
  stage: string;
  items: PipelineBusiness[];
  draggingId: string | null;
  onDragStart: (id: string) => void;
  onDragEnd: (id: string, stage: string) => void;
  onCardClick: (id: string) => void;
};
```

**States**:
1. **Empty + collapsed** (items.length === 0): Render as 48px-wide vertical rail showing stage name rotated and count "0"
2. **Empty + hovered** (items.length === 0, on hover): Expand to full column width with "Drop a card here" placeholder
3. **Has items** (items.length > 0): Full column at `max-w-[220px]`

**Layout** (expanded):
```
┌────── w-[220px] max-w-[220px] ──┐
│ PROSPECT                     [3] │  ← header with AnimatedCount
├───────────────────────────────────┤
│                                   │
│  ┌──── PipelineCard ──────┐      │
│  │ ...                    │      │
│  └────────────────────────┘      │
│  ┌──── PipelineCard ──────┐      │
│  │ ...                    │      │
│  └────────────────────────┘      │
│                                   │
└───────────────────────────────────┘
```

### [`src/app/dashboard/pipeline/components/CardActionsMenu.tsx`](src/app/dashboard/pipeline/components/CardActionsMenu.tsx)

**Purpose**: Overflow menu triggered by `⋯` button on each card.

**Menu items**:
- "View opportunity" → `/dashboard/leads/${id}`
- "View pitch" → `/dashboard/pitches?businessId=${id}`
- "Log reply" → opens inline form or modal
- Divider
- "Move to → Prospect" / "Move to → Contacted" / etc. (only show stages different from current)
- "Archive" → PATCH status to `archived` (or DELETE)
- "Delete" → DELETE with confirmation

**Implementation**: Use a simple absolute-positioned dropdown with `onClickOutside` to close. Avoid full libraries — a `<div>` with `position: absolute` and `onBlur` or a ref-based click-outside handler.

### [`src/app/dashboard/pipeline/components/ScorePill.tsx`](src/app/dashboard/pipeline/components/ScorePill.tsx)

**Purpose**: Compact score badge — just the number with tier-colored background.

```tsx
type ScorePillProps = {
  score: number;  // opportunity score 0-100
};

// Renders: [92] with green bg for >=70, amber for >=45, indigo for >=25, red for <25
// Sized: h-6 w-8, text-[10px] font-semibold
```

**Color mapping** (matching `opportunityBadgeVariant()` in [`scoring.ts:374`](src/lib/scoring.ts:374)):
- >= 70 → green (`bg-[var(--badge-green-bg)] text-[var(--badge-green-text)] border-[var(--badge-green-border)]`)
- >= 45 → amber
- >= 25 → indigo
- < 25 → red

### [`src/app/dashboard/pipeline/components/TimeInStage.tsx`](src/app/dashboard/pipeline/components/TimeInStage.tsx)

**Purpose**: Display "{N}d in stage" with color treatment based on age and stage.

```typescript
type TimeInStageProps = {
  stageEnteredAt: string;
  currentStage: string;
};
```

**Color rules**:
| Days | Color | Notes |
|---|---|---|
| 0-3 | `text-[var(--text-tertiary)]` | Fresh — subtle gray |
| 4-7 | `text-[var(--text-secondary)]` | Normal — secondary emphasis |
| 8+ (contacted) | `text-[var(--status-warning-text)]` | Stale in early stage — amber |
| 11+ (in_conversation) | `text-[var(--status-warning-text)]` | Stale in conversation — amber |

### [`src/app/dashboard/pipeline/components/MobileCard.tsx`](src/app/dashboard/pipeline/components/MobileCard.tsx)

**Purpose**: Extracted from inline at [page.tsx:138](src/app/dashboard/pipeline/page.tsx:138). Same compact layout as PipelineCard but with `<select>` dropdown for status change and "View" link.

### [`src/app/dashboard/pipeline/components/EmptyPipelineState.tsx`](src/app/dashboard/pipeline/components/EmptyPipelineState.tsx)

**Purpose**: Extracted empty state from [page.tsx:444](src/app/dashboard/pipeline/page.tsx:444). No logic changes.

---

## Step 6: Pipeline Layout Refactoring

### [`src/app/dashboard/pipeline/page.tsx`](src/app/dashboard/pipeline/page.tsx)

**After extraction**, the page component simplifies to:

```typescript
import { StageColumn } from "./components/StageColumn";
import { MobileCard } from "./components/MobileCard";
import { EmptyPipelineState } from "./components/EmptyPipelineState";

export default function PipelinePage() {
  // ... state/handlers (same as current lines 311-370)

  // ── Render ──
  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <div className="mx-auto max-w-[1600px] px-6 py-8">
        {/* Header (simplified — see Step 7) */}

        {items.length === 0 ? (
          <EmptyPipelineState />
        ) : (
          <>
            {/* Mobile */}
            <div className="lg:hidden space-y-6">
              {STAGES.filter((s) => (grouped[s] ?? []).length > 0).map((stage) => (
                <div key={stage}>
                  <p className={`mb-2 ... ${STAGE_TEXT_COLORS[stage]}`}>
                    {STAGE_LABELS[stage]} · {(grouped[stage] ?? []).length}
                  </p>
                  <div className="space-y-2">
                    {(grouped[stage] ?? []).map((item) => (
                      <MobileCard key={item.pipeline_id} item={item} onStatusChange={handleStatusChange} />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop kanban */}
            <div className="hidden lg:block">
              <LayoutGroup>
                <div className="flex gap-4 overflow-x-auto pb-4">
                  {STAGES.map((stage) => (
                    <StageColumn
                      key={stage}
                      stage={stage}
                      items={grouped[stage] ?? []}
                      draggingId={draggingId}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      onCardClick={handleCardClick}
                    />
                  ))}
                </div>
              </LayoutGroup>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
```

### Column width change

**From**: `w-[280px]` on the column div (line 195)
**To**: `w-[220px] max-w-[220px]` on StageColumn wrapper, with collapse behavior for empty columns

### Card visual changes

**Current height**: ~150px (name + type·city + phone + badge row + context text + CTA footer)
**Target height**: ~70-90px (name + type·city + WebsiteBadge row, ScorePill + TimeInStage on right)

---

## Step 7: Label Cleanup

### Remove "← Back to Dashboard" link

Delete lines 417-422 from [`page.tsx`](src/app/dashboard/pipeline/page.tsx):
```tsx
{/* DELETE */}
<Link href="/dashboard" ...>
  <ArrowLeft className="h-4 w-4" /> Back to Dashboard
</Link>
```

Also remove the `ArrowLeft` import from `lucide-react` if no longer used.

### Remove "PIPELINE" eyebrow

Delete line 427 from [`page.tsx`](src/app/dashboard/pipeline/page.tsx):
```tsx
{/* DELETE */}
<p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Pipeline</p>
```

### Make subtitle dismissible or move to empty state

The subtitle "Drag cards between stages to update progress" (line 429-434) should be:
- Kept **only** in the empty state as a helpful hint
- Added with a dismiss button (`localStorage` persisted) or shown only on first visit

Simplest approach: show it only when `items.length > 0` and add a small "×" dismiss button. Use `localStorage` key `pipeline_hint_dismissed`.

### Demote "X active opportunities" badge

Replace the pill badge (line 436-438) with inline text:

```tsx
{/* Before */}
<span className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface-2)] px-4 py-2 text-sm text-[var(--text-secondary)]">
  {items.length} active {items.length === 1 ? "opportunity" : "opportunities"}
</span>

{/* After */}
<p className="text-xs text-[var(--text-tertiary)]">
  {items.length} active {items.length === 1 ? "opportunity" : "opportunities"}
</p>
```

---

## Step 8: Tests & Verification

### New test file: [`src/app/dashboard/pipeline/__tests__/PipelineCard.test.tsx`](src/app/dashboard/pipeline/__tests__/PipelineCard.test.tsx) _(optional — if time permits)_

### Verification checklist

| Check | How |
|---|---|
| Score 4 displays "Low Opportunity" | Run `npx vitest run src/lib/__tests__/scoring.test.ts` |
| Score 50 displays "Good Opportunity" | Same test |
| Score 80 displays "High Opportunity" | Same test |
| WebsiteBadge shows correct labels | Visual check in browser |
| stage_entered_at is set on status change | Run migration, PATCH an item, check DB |
| Column collapses when empty | Hover over empty column rail |
| Cards are ~80px tall | Visual check + browser devtools |
| Drag-and-drop still works | Manual test |
| Overflow menu opens/closes | Manual test |
| Mobile view works | Responsive mode in browser devtools |
| Migration runs without error | Run SQL script against local DB |

---

## Risk Areas

| Risk | Severity | Mitigation |
|---|---|---|
| **Drag-and-drop breaks** after extracting card to separate component | 🔴 High | Keep the Framer Motion `drag`, `layout`, `AnimatePresence` wrapper inside StageColumn, not PipelineCard. The `motion.div` with drag props stays in StageColumn's map render |
| **Column collapse causes layout shift** | 🟡 Medium | Use `AnimatePresence` + `layout` on the column for smooth transitions. Start with `w-[48px]` and animate to `w-[220px]` on hover |
| **stage_entered_at migration fails on prod** | 🟡 Medium | Ensure `IF NOT EXISTS` guard. Backfill with `updated_at` first, then set `NOT NULL`. Test on a copy first |
| **Overflow menu accessibility** | 🟢 Low | Use semantic `<button>` elements, `aria-haspopup`, `aria-expanded`. Close on Escape key |
| **MobileCard falls behind desktop refactor** | 🟡 Medium | Extract MobileCard early (before StageColumn) so its interface is stable |
| **Time-in-stage calculation with timezone** | 🟢 Low | Use UTC consistently. `stage_entered_at` is already TIMESTAMPTZ in Postgres. Calculate diff in browser using `Date.now()` |

---

## Dependency Graph

```
scoring.ts fix  ──────┐
                      ├──→ scoring.test.ts assertions
                      │
db-types.ts update ───┤
                      ├──→ migration script
                      │
pipeline/route.ts ────┘
                      │
WebsiteBadge fix  ────┤
                      ├──→ dashboard-client.tsx update
                      │
                      ├──→ page.tsx (remove OPPORTUNITY_BADGES inline)
                      │
Component extract ────┤
                      ├──→ StageColumn.tsx (new)
                      ├──→ PipelineCard.tsx (new)
                      ├──→ ScorePill.tsx (new)
                      ├──→ TimeInStage.tsx (new)
                      ├──→ CardActionsMenu.tsx (new)
                      ├──→ MobileCard.tsx (extract from page.tsx)
                      └──→ EmptyPipelineState.tsx (extract from page.tsx)
```

**Parallelizable work**:
- Steps 1 (scoring fix), 2 (migration), and 4 (WebsiteBadge) are independent and can be done in parallel
- Steps 3 (API update) depends on Step 2 (DB migration)
- Step 6 (component extraction) depends on Steps 1, 4 (cleaner to extract with fixes already applied)
- Step 7 (label cleanup) is independent and can be done anytime
- Step 8 (tests) is last

---

## Appendix: Key Imports After Refactoring

### [`page.tsx`](src/app/dashboard/pipeline/page.tsx) final imports

```typescript
"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence, LayoutGroup } from "@/lib/motion";
import { Search } from "lucide-react";
import type { WebsiteStatus } from "@/lib/db-types";
import { PIPELINE_SALES_STATUSES, PIPELINE_LABELS } from "@/lib/ui-constants";
import { detectLeadWorkflow } from "@/lib/lead-types";
import { blendQualityForOpportunity, computeOpportunityScore } from "@/lib/scoring";
import { StageColumn } from "./components/StageColumn";
import { MobileCard } from "./components/MobileCard";
import { EmptyPipelineState } from "./components/EmptyPipelineState";
```

### New component imports

- `PipelineCard` imports: `WebsiteBadge`, `ScorePill`, `TimeInStage`, `CardActionsMenu`, framer-motion `motion`, `Link` from next
- `StageColumn` imports: `AnimatedCount` (extracted from page.tsx), `PipelineCard`, `AnimatePresence`, `LayoutGroup`
