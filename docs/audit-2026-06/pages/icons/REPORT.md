# Icons Audit
**Date:** 2026-06-18 · **Auditor:** Claude Code (Prompt 15) · **Source analysis** (no Playwright)

---

## Executive Summary

Icon discipline is one of the stronger areas in Nearsited. The entire application uses a single library (`lucide-react`) with no mixing of other icon systems. `aria-hidden="true"` is applied correctly on the majority of decorative contexts. Functional icons (button affordances, status indicators, navigation) are used consistently with proper labels.

The primary violation of CLAUDE.md Rule B ("No decorative icons") is in the `<StatsRow>` component: four icons serve as purely visual label decorators on data tiles, carrying no semantic meaning and performing no function. This is a flagrant Rule B violation in a shared component used across all three lead-detail workflows. A secondary issue is two inline SVG chevron icons in the landing page that bypass Lucide entirely.

---

## Critical Issues

### C1 — StatsRow uses 4 decorative icons on metric tiles (Rule B violation)
**File:** [src/app/dashboard/leads/[id]/components/StatsRow.tsx:42,54,70,89](src/app/dashboard/leads/[id]/components/StatsRow.tsx#L42)

```tsx
{ icon: TrendingUp, label: "Opportunity Score", ... },
{ icon: DollarSign, label: "Est. Project Value", ... },
{ icon: MessageSquare, label: "Review Velocity (30d)", ... },
{ icon: Building2, label: "Local Competition", ... },
```

At render (line 89):
```tsx
<Icon className="h-3.5 w-3.5 text-[var(--color-text-tertiary)]" />
```

None of these icons perform a function. `TrendingUp` next to "Opportunity Score" doesn't tell the user anything they can act on. `DollarSign` next to "Est. Project Value" duplicates what the label already says. `MessageSquare` next to "Review Velocity" is thematically wrong (reviews aren't messages). `Building2` next to "Local Competition" is generic.

CLAUDE.md Rule B: "Icons appear only when they perform a function: button affordance, status indicator, or navigation. When in doubt, remove."

These icons have no `aria-hidden="true"`, no `aria-label`, and no functional purpose. They add visual noise without adding meaning. The `StatsRow` component is used across all three lead-detail workflows (NDP, Social, Website) so this violation appears on every lead.

**Fix:** Remove the `icon` field from the stats data object. The label text already communicates what each tile shows.

### C2 — Inline SVG chevrons in SampleReportSection bypass Lucide
**File:** [src/components/landing/SampleReportSection.tsx:102](src/components/landing/SampleReportSection.tsx#L102), [line 314](src/components/landing/SampleReportSection.tsx#L314)

```tsx
<svg className="h-3 w-3 transition-transform group-open:rotate-90" fill="currentColor" viewBox="0 0 24 24">
  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10..." clipRule="evenodd" />
</svg>
```

This is a `ChevronRight` icon hardcoded as an inline SVG path — when Lucide's `<ChevronRight className="h-3 w-3 transition-transform group-open:rotate-90" aria-hidden="true" />` is available and identical. Inline SVGs:
- Won't follow any future Lucide stroke-width changes
- Are harder to read and maintain
- Have no `aria-hidden` (this SVG has no ARIA attribute at all)

**Fix:** Replace with `<ChevronRight className="h-3 w-3 transition-transform group-open:rotate-90" aria-hidden="true" />`.

---

## High Priority (fix within 2 weeks)

### H1 — Auth panel landing icons lack `aria-hidden`
**File:** [src/components/auth/BrandStoryPanel.tsx:3](src/components/auth/BrandStoryPanel.tsx)

`Search, BarChart3, Mail, ListFilter, Check` imported from lucide-react and used as feature illustration icons in the signup/login panel. These are decorative in context (showing product features) but the icon elements don't have `aria-hidden="true"`. A screen reader encountering these gets no meaningful label and may read them as empty elements.

### H2 — DiscoverForm input prefix icons lack `aria-hidden`
**File:** [src/app/dashboard/discover/components/DiscoverForm.tsx:75,89](src/app/dashboard/discover/components/DiscoverForm.tsx#L75)

```tsx
<MapPin className="pointer-events-none absolute left-3.5 top-1/2 z-10 size-4 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
<Building2 className="pointer-events-none absolute left-3.5 top-1/2 z-10 size-4 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
```

These are input prefix icons for "City" and "Business Type" fields. While they have semantic value (location context), they have no `aria-hidden="true"`. The adjacent `<label>` already communicates the field type; the icon should be hidden from screen readers to avoid duplication.

### H3 — `ExternalLink` icons inside link buttons need `aria-hidden`
Multiple files render:
```tsx
<ExternalLink className="h-3.5 w-3.5" />
```
without `aria-hidden="true"` inside link/button elements that have visible text. The icon is redundant to the text label. Add `aria-hidden="true"` to all icon-inside-text-button usages where the parent has a meaningful text label.

Files affected: [LeadHeaderStrip.tsx](src/app/dashboard/leads/[id]/components/LeadHeaderStrip.tsx), [LeadHeroSection.tsx](src/app/dashboard/leads/[id]/components/LeadHeroSection.tsx), [LeadOutreachSection.tsx](src/app/dashboard/leads/[id]/components/LeadOutreachSection.tsx), [PitchCard.tsx](src/app/dashboard/leads/[id]/components/PitchCard.tsx).

### H4 — `Sparkles` icon in AIQuotaBanner has no aria-hidden
**File:** [src/app/dashboard/leads/[id]/components/AIQuotaBanner.tsx:97](src/app/dashboard/leads/[id]/components/AIQuotaBanner.tsx#L97)

```tsx
<Sparkles className="h-3 w-3" /> Use lighter model
```

The `Sparkles` icon is a visual accent next to the text "Use lighter model". The button's label is the text; the icon is decorative here. Add `aria-hidden="true"`.

### H5 — Landing section icons may violate Rule B spirit in dashboard-adjacent components
**Files:** [src/components/auth/BrandStoryPanel.tsx](src/components/auth/BrandStoryPanel.tsx), [src/components/landing/HowItWorksSection.tsx](src/components/landing/HowItWorksSection.tsx)

`Search, BarChart3, Mail, ListFilter` in `BrandStoryPanel` are used as step/feature illustration icons on the signup page — this is a marketing illustration context, not a pure data-display context. Similarly `Search, Target, Mail, TrendingUp` in HowItWorksSection represent workflow steps.

These are borderline — they're communicating a category/step identity, not pure decoration. But they push close to Rule B's edge. At minimum, all should have `aria-hidden="true"` since their meaning is conveyed by adjacent text.

---

## Medium Priority (fix when refactoring nearby)

### M1 — `Zap` icon in LeadsMobileCards may be ambiguous
**File:** [src/app/dashboard/leads/components/LeadsMobileCards.tsx:311](src/app/dashboard/leads/components/LeadsMobileCards.tsx#L311)

```tsx
<Zap className="h-4 w-4" />
```

Inside a "Quick Audit" button — the `Zap` icon is a button affordance for "fast action", which is functional. However, `Zap` is not obviously a "quick audit" icon to a new user. `Search` or `Sparkles` might be more semantically clear. This is a design clarity issue, not an accessibility issue.

### M2 — `TrendingUp` used for both "Add to Pipeline" button and "Opportunity Score" stat tile
**Files:** [LeadHeaderStrip.tsx:142](src/app/dashboard/leads/[id]/components/LeadHeaderStrip.tsx#L142) and [StatsRow.tsx:42](src/app/dashboard/leads/[id]/components/StatsRow.tsx#L42)

The same icon (`TrendingUp`) appears in two semantically different contexts on the same page:
1. As a button affordance for "Add to Pipeline" action
2. As a decorative label icon for the "Opportunity Score" stat

This creates icon meaning ambiguity — the user has to infer different meanings for the same visual. If the StatsRow icon is kept (despite C1 recommendation to remove it), use a different icon.

### M3 — `Info` icon tooltip affordance has no aria-label
**File:** [src/app/dashboard/discover/components/DiscoverForm.tsx:111](src/app/dashboard/discover/components/DiscoverForm.tsx#L111)

```tsx
<Info className="size-3 cursor-help opacity-60" />
```

This is a tooltip trigger. While it has `cursor-help`, it has no `aria-label="More information"` or similar. Keyboard users won't know this element reveals a tooltip, and screen readers will encounter an unlabeled element.

### M4 — `OpportunityCard.tsx` uses `TrendingUp` and `ArrowUp` in unclear contexts
**File:** [src/components/ui/OpportunityCard.tsx:3](src/components/ui/OpportunityCard.tsx)

Imports `MapPin, ExternalLink, Zap, TrendingUp, ArrowUp`. The `Zap` and `TrendingUp` appear to be used decoratively or as category indicators. Verify each icon performs a function or remove.

---

## Low Priority / Nice-to-have

### L1 — `ChevronDown` on collapsible elements has no aria-expanded reflection
Multiple files use `<ChevronDown className="h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}">` for accordion/collapse toggles. While the visual rotation is correct, none pair this with `aria-expanded` on the trigger button.

### L2 — `RefreshCw` vs `RotateCcw` — inconsistent refresh icons
`RefreshCw` is used in some places (LeadHeroSection, LeadOutreachSection, PitchCard), `RotateCcw` in others (FilterPanel, AIQuotaBanner, AuditForm). Both mean "refresh/retry". Standardize on one.

### L3 — CLAUDE.md mentions "decorative icons on metric tiles" as a known issue (Rule B)
The existing BASELINE.md §6 already flags "Decorative icons on metric tiles." StatsRow confirms this persists. It's not new — it's a known unresolved issue that should now be tracked to resolution.

### L4 — `EllipsisVertical` vs `MoreHorizontal` for overflow menus
`ActionMenu.tsx` uses `MoreHorizontal` (⋯ horizontal). `pitches/page.tsx:6` imports `EllipsisVertical`. If both are used for "more actions" overflow in different parts of the UI, standardize on `MoreHorizontal` (the canonical Radix DropdownMenu trigger icon per ActionMenu.tsx).

---

## What's Actually Good

- **Single icon library** — `lucide-react` used exclusively. Zero instances of `react-icons`, `heroicons`, or arbitrary SVG imports for UI icons.
- **Google OAuth SVG is justified** — the Google brand logo is not in Lucide and must be inline SVG. Both auth pages use `aria-hidden="true"` on the Google SVG icon.
- **Sidebar nav icons** — `aria-hidden="true"` at [sidebar-nav.tsx:32](src/app/dashboard/sidebar-nav.tsx#L32), correct since the nav item label provides the accessible name.
- **`LeadAffordances.tsx`** — `aria-label` on every icon button (`"Open in Maps"`, `"Call ${phone}"`, `"Open ${name} website"`) ✅
- **`ActionMenu.tsx`** — `aria-label="More actions"` on the `MoreHorizontal` trigger ✅
- **`Button.tsx variant="icon"`** — wraps children in `<span className="sr-only">` so icon buttons always have accessible text ✅
- **`ScoreCircle`** — `role="img" aria-label="Score: ${clamped}"` or `"Score not calculated"` ✅
- **Mobile nav icons** — `aria-hidden="true"` on icon, accessible label on `<nav aria-label="Mobile navigation">` and individual items ✅
- **`CookieConsent`** — `X` icon button has `aria-label="Dismiss cookie notice"` ✅
- **`AuthCard`** — error dismiss has `aria-label="Dismiss error"` ✅
- **`Loader2`** icon used consistently for all async loading states — never `animate-bounce` or non-standard spinners.

---

## Quality Scorecard

| Criterion | Score | Notes |
|---|---|---|
| Single icon library | 10/10 | Lucide only; no mixing |
| Rule B compliance | 5/10 | StatsRow violation; landing icons borderline |
| aria-hidden discipline | 7/10 | Good on nav/button icons; missing on some embedded icons |
| Icon-only button labels | 8/10 | LeadAffordances, ActionMenu excellent; a few gaps |
| Semantic icon choice | 7/10 | TrendingUp/Zap ambiguity; RefreshCw/RotateCcw split |
| Inline SVG avoidance | 8/10 | 2 inline SVG chevrons in landing; otherwise clean |
| Consistent spinner usage | 9/10 | Loader2 used everywhere for async states |
| **Overall** | **7.5/10** | Strong foundation; StatsRow is the main offender |
