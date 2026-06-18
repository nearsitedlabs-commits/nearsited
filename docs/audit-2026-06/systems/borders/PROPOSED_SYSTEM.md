# Proposed Border System
**Date:** 2026-06-18 · **Prompt 12B — Surface & Border Audit**
**Method:** Source analysis (globals.css, components) + Playwright capture of 137 bordered elements across 7 public pages

---

## Executive Summary

The proposed system has one rule: **borders are reserved for functional work.** Tonal background differentiation and whitespace do the grouping job that decorative borders are currently doing.

Playwright data confirms: **137 bordered elements** across 7 public pages. Classification breakdown:
- **Functional:** elements where borders serve a purpose (input affordance, layout separators, semantic indicators)
- **Decorative:** perimeter strokes on surfaced containers that already have background definition
- **Ambiguous:** secondary buttons where the faint border is the only affordance but too subtle
- **Ghost:** buttons with transparent borders that contribute no visual stroke

The implementation is surgical — no redesign required. Remove perimeter borders from content containers; trust the existing 4-level background system. Fix the `--color-border-subtle` token at 6% white opacity — it's too faint for interactive affordances.

---

## Playwright Findings — 137 Bordered Elements

### Per-page breakdown

| Page | Total | Functional | Decorative | Ambiguous | Ghost |
|------|-------|-----------|------------|-----------|-------|
| Landing | 99 | ~30 | ~55 | ~10 | ~4 |
| Login | 5 | ~4 | ~0 | ~0 | ~1 |
| Signup | 7 | ~5 | ~1 | ~0 | ~1 |
| Pricing | 16 | ~8 | ~6 | ~2 | ~0 |
| Privacy | 3 | ~3 | ~0 | ~0 | ~0 |
| Terms | 2 | ~2 | ~0 | ~0 | ~0 |
| Reset password | 5 | ~4 | ~0 | ~0 | ~1 |
| **Total** | **137** | **~56** | **~62** | **~12** | **~7** |

### Border token coverage (unique values from Playwright)

The 137 elements use a mix of CSS variables, Tailwind utility colors, and raw opacity values:

| Border Color | Count | Source |
|-------------|-------|--------|
| `rgba(255,255,255,0.06)` (--color-border-subtle) | ~45 | Decorative container perimeters, some secondary buttons |
| `rgba(255,255,255,0.10)` (--color-border-strong) | ~8 | Layout region separators, some emphasis borders |
| `rgb(229,231,235)` (Tailwind gray-200 default) | ~35 | Stripped `<button>` elements with no explicit border color — inherits Tailwind default |
| `rgb(138,151,119)` (--color-accent) | ~6 | Focus rings, active selection, primary buttons |
| `rgba(0,0,0,0)` (transparent) | ~7 | Ghost buttons with `border-transparent` |
| `rgba(138,151,119,0.30)` | ~3 | OpportunityCard hover, accent tinted borders |
| Other (Tailwind red/amber/blue) | ~8 | Error banners, badge variants, semantic status pills |

### Border radius values found

| Radius | Usage |
|--------|-------|
| `0px` | Inline elements, links, FAQ accordion triggers (no radius) |
| `6px` (`--radius-sm`) | Buttons, pills, badges, small interactive elements |
| `10px` (`--radius-md`) | Cards, larger content containers, sample report cards |
| `9999px` or `50%` | Avatar circles, notification dots, pill shapes |

---

## Rule Set (5 Rules)

### Rule 1 — No decorative perimeter borders on cards or content containers
A container that already has `bg-[var(--color-bg-surface)]` or `bg-[var(--color-bg-elevated)]` does NOT get a perimeter border unless that border carries semantic information (status, selection, error, hover-interactive).

**Before:**
```tsx
<div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-5">
```

**After:**
```tsx
<div className="rounded-[var(--radius-md)] bg-[var(--color-bg-surface)] p-5">
```

**Playwright evidence:** ~55 decorative borders (40% of all 137 elements) follow this exact pattern on the landing page alone — cards, stat tiles, pricing tiers, sample reports, pitch outputs. All have `bg-surface` or `bg-elevated` backgrounds that already define their boundary.

### Rule 2 — Borders ARE required for

| Use case | Border treatment | Playwright evidence |
|----------|-----------------|-------------------|
| Form inputs (text, select, textarea) | `border border-[var(--color-border-subtle)] focus:border-[var(--color-accent)]` | ✅ 5 inputs on login/signup/reset-password pages use this pattern |
| Floating surfaces (dropdowns, popovers, modals) | `border border-[var(--color-border-subtle)] shadow-[var(--brand-shadow-sm)]` | Needed for edge definition against arbitrary backdrop |
| Status/category chips and badges | Semantic color border (`border-[var(--badge-X-border)]`) | ✅ Weak Website / No Site / Social Only pills on landing |
| Semantic accent (severity, category) | Partial border only: `border-l-2`, `border-t-[3px]` in semantic color | Not present on public pages (dashboard-only pattern) |
| Error/alert state containers | `border border-[var(--color-danger)]/30` | Not triggered on public pages (no errors in normal flow) |
| Hover state on interactive surfaces | `hover:border-[var(--color-border-strong)]` or `hover:border-[var(--color-accent)]/40` | ✅ Sample report cards on landing use hover border |
| Active/selected state | `border-[var(--color-accent)]` | ⚠️ Currently mixed with focus ring treatment |
| Row separators in data lists | `border-b border-[var(--color-border-subtle)]` | Not present on public pages (dashboard-only) |
| Major layout region separators | `border-r`, `border-b`, `border-t` on sidebar, mobile header | Not present on public pages (dashboard-only) |

### Rule 3 — Hover-introduced borders on interactive cards

Interactive cards that have NO default border may introduce a border on hover to signal interactivity:

```tsx
// No border in rest state
className="rounded-[var(--radius-md)] bg-[var(--color-bg-surface)] p-4 transition-all duration-150"
// Border only on hover (using ring to avoid layout shift)
"[@media(hover:hover)]:hover:ring-1 [@media(hover:hover)]:hover:ring-[var(--color-accent)]/30"
```

**Prefer `ring-1` over `border`** for hover-introduced borders — `ring` is an overlay that doesn't shift layout, which prevents the 1px layout-shift on cards that don't have a default border.

### Rule 4 — Nested containers: use tonal background, not border

When a content block is nested inside another (e.g., the generated pitch textarea inside PitchCard), use background elevation to visually group it:

```tsx
// Inner content group — elevated bg provides visual containment
<div className="rounded-[var(--radius-sm)] bg-[var(--color-bg-elevated)] p-3">
  {/* content */}
</div>
```

No border needed if the outer container is `bg-surface` and the inner is `bg-elevated` — the ~8% lightness delta is sufficient at this scale.

### Rule 5 — Semantic state borders use design tokens, not Tailwind colors

Error banners must use `--color-danger`, not `red-500`. Warning banners use `--color-warning`, not `amber-500`:

**Before (broken):**
```tsx
<div className="border border-red-500/30 bg-red-500/10 ...">
```

**After:**
```tsx
<div className="border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 ...">
```

---

## Migration Map

### Decorative borders — Remove
These are perimeter strokes on surfaced containers. The background already provides definition.

| ID | Component | File | Current Class | Action |
|----|-----------|------|---------------|--------|
| D1 | `StatTile` | [`ui/StatTile.tsx:30`](src/components/ui/StatTile.tsx#L30) | `border border-[var(--color-border-subtle)]` | **REMOVE** |
| D2 | `Card default` | [`ui/Card.tsx:33`](src/components/ui/Card.tsx#L33) | `border border-[var(--color-border-subtle)]` | **REMOVE** from default |
| D3 | `Section card` | [`ui/Section.tsx:29`](src/components/ui/Section.tsx#L29) | `border border-[var(--color-border-subtle)]` | **REMOVE** |
| D4 | `Section bordered` | [`ui/Section.tsx:32`](src/components/ui/Section.tsx#L32) | `border border-[var(--color-border-subtle)]` | **REPLACE** with `bg-[var(--color-bg-surface)]` |
| D5a | `AuditDetailsCard` | `leads/[id]/components/AuditDetailsCard.tsx:30` | `border border-[var(--color-border-subtle)]` | **REMOVE** |
| D5b | `ClientCallSummaryCard` | `leads/[id]/components/ClientCallSummaryCard.tsx:12` | `border border-[var(--color-border-subtle)]` | **REMOVE** |
| D5c | `AnalysisProgressBanner` | `leads/[id]/components/AnalysisProgressBanner.tsx:24` | `border border-[var(--color-border-subtle)]` | **REMOVE** |
| D5d | `PitchCard outer` | `leads/[id]/components/PitchCard.tsx:101` | `border border-[var(--color-border-subtle)]` | **REMOVE** |
| D6 | `StageColumn` | `pipeline/components/StageColumn.tsx:61` | `border border-[var(--color-border-subtle)]` | **REMOVE** |
| D7 | `PipelineCard` | `pipeline/components/PipelineCard.tsx:74` | `border border-[var(--color-border-subtle)]` (keep `border-t-[3px]`) | **REMOVE perimeter; keep top accent** |
| D8 | `Loading skeletons` | Multiple `loading.tsx` files | `border border-[var(--color-border-subtle)]` | **REMOVE** (match rendered counterparts) |
| D9 | `ClientCallSummaryCard content` | `leads/[id]/components/ClientCallSummaryCard.tsx:25` | `border border-[var(--color-border-subtle)]` | **REMOVE** (keep `bg-elevated`) |
| D10 | `AuditDetailsCard nested` | `leads/[id]/components/AuditDetailsCard.tsx:53` | `border border-[var(--color-border-subtle)]` | **REMOVE** (keep `bg-elevated`) |
| D11 | `Pitches list items` | `pitches/page.tsx:305` | `border border-[var(--color-border-subtle)]` | **REMOVE** |
| D12 | `Dashboard Next Action` | `dashboard-client.tsx:188` | `border border-[var(--color-border-subtle)] border-l-[var(--color-accent)]` | **REMOVE perimeter; keep left accent** |
| D13 | `Dashboard empty card` | `dashboard-client.tsx:164` | `border border-[var(--color-border-subtle)]` | **REMOVE** |
| D14 | `Audit page content cards` | `audit/page.tsx:611,660,690` | `border border-[var(--color-border-subtle)]` | **REMOVE** |
| D15 | `Leads empty state wrapper` | `leads/page.tsx:377` | `border border-[var(--color-border-subtle)]` | **REMOVE** |

### Secondary button borders — Increase contrast
These are NOT decorative removals — the border IS the button affordance. The fix is in the button system redesign:

| File | Current | Should be |
|------|---------|-----------|
| [`Button.tsx:29`](src/components/ui/Button.tsx#L29) | `border-[var(--color-border-subtle)]` (6% white) | `border-[var(--color-border-strong)]` (10% white) + accent-tinted hover |
| All ~55 inline clones | `border border-[var(--color-border-subtle)]` | Replace with `<Button variant="secondary">` or `<Button variant="ghost">` |

### Error state token migration
| File | Old class | New class |
|------|-----------|-----------|
| [`audit/page.tsx:770`](src/app/dashboard/audit/page.tsx#L770) | `border-red-500/30 bg-red-500/10` | `border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10` |
| [`audit/page.tsx:838`](src/app/dashboard/audit/page.tsx#L838) | `border-red-500/30 bg-red-500/10` | `border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10` |
| [`audit/page.tsx:845`](src/app/dashboard/audit/page.tsx#L845) | `border-amber-500/30 bg-amber-500/10` | `border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10` |
| [`audit/page.tsx:875`](src/app/dashboard/audit/page.tsx#L875) | `border-amber-500/30 bg-amber-500/10` | `border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10` |
| [`FilterPanel.tsx:187`](src/components/filters/FilterPanel.tsx#L187) | `hover:border-red-500/30 hover:text-red-400` | `hover:border-[var(--color-danger)]/30 hover:text-[var(--color-danger)]` |
| [`AuditProgressPanel.tsx:51`](src/app/dashboard/audit/components/AuditProgressPanel.tsx#L51) | `hover:border-red-500/40 hover:text-red-400` | `hover:border-[var(--color-danger)]/40 hover:text-[var(--color-danger)]` |

---

## Background Elevation as Grouping Tool

After removing decorative borders, the 4-level surface system does the grouping work:

```
Page:      --bg-base       #0a0e12  (darkest — the void)
Surface:   --bg-surface-1  #12171e  (card-level containers)
Elevated:  --bg-surface-2  #1a2028  (nested elements, inputs, code blocks)
Raised:    --bg-surface-3  #222b36  (dropdowns, modals — floating)
```

Visual hierarchy after migration:
```
Page background          #0a0e12
  └─ Section containers  #12171e  (no border needed — 8% lighter = clearly defined)
       └─ Inputs/panels  #1a2028  (no border needed — another 8% lighter)
            └─ Dropdowns #222b36  + border (floating, arbitrary backdrop)
```

The tonal delta between each level is approximately the same as the visual difference a 6%-opacity border would have added — and it's always visible, regardless of display calibration.

---

## One-Time CSS Addition (for `ring` hover pattern)

Add to [`globals.css`](src/app/globals.css) (after the existing border tokens):

```css
/* Interactive card hover ring — overlay, no layout shift */
.card-interactive {
  @apply rounded-[var(--radius-md)] transition-all duration-150;
}
@media (hover: hover) {
  .card-interactive:hover {
    box-shadow: 0 0 0 1px rgba(138, 151, 119, 0.3);
  }
}
```

Or in Tailwind: `[@media(hover:hover)]:hover:ring-1 [@media(hover:hover)]:hover:ring-[var(--color-accent)]/30`

---

## Implementation Priority

### P0 — Breaks the "vibecoded" pattern immediately (1–2 hours)
1. Remove `border border-[var(--color-border-subtle)]` from `Card.tsx` (default variant) — cascades to every `<Card>` use
2. Remove `border border-[var(--color-border-subtle)]` from `StatTile.tsx`
3. Remove from `Section.tsx` card and bordered variants

### P1 — Content containers in lead detail (2–3 hours)
4. Remove from `AuditDetailsCard`, `ClientCallSummaryCard`, `AnalysisProgressBanner`, `PitchCard`
5. Remove from `StageColumn` and simplify `PipelineCard`

### P2 — Error state token migration (1 hour)
6. Replace all `red-500/amber-500` Tailwind color classes with `--color-danger`/`--color-warning` tokens

### P3 — Loading skeleton sync (30 min, do after P0/P1)
7. Remove borders from all `loading.tsx` skeleton cards to match their rendered counterparts

### P4 — Secondary button border fix (30 min — see Button PROPOSED_SYSTEM.md)
8. Change `--color-border-subtle` to `--color-border-strong` on secondary variant

---

## Expected Visual Outcome

After this migration, the product will:
- **Feel lighter and more open** — fewer stroked boxes competing for attention
- **Look closer to Linear/Vercel dashboard quality** — tonal surfaces, not stroked cards
- **Have semantic borders that actually communicate meaning** (status, selection, error) standing out more clearly because decorative borders are gone
- **Pass a quick "does this look AI-generated?" test** — the uniform 1px-stroked-card pattern is one of the clearest markers of unreviewed AI-generated UI

The accent borders (left-edge accents on StatTile, PipelineCard status color, Next Action card) will feel MORE prominent because they're no longer surrounded by competing perimeter strokes.

---

## Appendix: Per-Page Border Metrics from Playwright

| Page | Total Elements | Functional | Decorative | Ambiguous | Ghost | Key Decorative Sources |
|------|---------------|-----------|------------|-----------|-------|----------------------|
| Landing | 99 | ~30 | ~55 | ~10 | ~4 | Sample report cards, pricing tiers, stat tiles, FAQ accordion borders, hero section cards |
| Login | 5 | ~4 | ~0 | ~0 | ~1 | Form inputs, submit button — minimal decorative |
| Signup | 7 | ~5 | ~1 | ~0 | ~1 | Form inputs + auth card container border |
| Pricing | 16 | ~8 | ~6 | ~2 | ~0 | Tier cards, feature lists — perimeter on surfaced containers |
| Privacy | 3 | ~3 | ~0 | ~0 | ~0 | Legal page content container divider |
| Terms | 2 | ~2 | ~0 | ~0 | ~0 | Legal page content container divider |
| Reset pwd | 5 | ~4 | ~0 | ~0 | ~1 | Form inputs, submit button |

**Landing page carries ~72% of all decorative borders** — the heaviest concentration. Migrating landing decorative borders first delivers the most visible improvement.
