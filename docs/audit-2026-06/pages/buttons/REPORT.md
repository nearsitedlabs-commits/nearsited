# Button System Audit
**Date:** 2026-06-18 · **Auditor:** Claude Code (Prompt 12) · **Source analysis** (no Playwright)

---

## Executive Summary

The `<Button>` component in [src/components/ui/Button.tsx](src/components/ui/Button.tsx) is architecturally sound — correct hover gating, reduced-motion support, focus rings, and 44px touch targets. The systemic problem is adoption: **~55 interactive elements across 25+ files bypass the component entirely**, using hand-rolled `inline-flex cursor-pointer border border-[var(--color-border-subtle)]` patterns. These clones lack Framer motion, have inconsistent hover gating, and inherit the same ghost border problem as the canonical secondary variant.

The **secondary button's 6%-opacity border** (`--color-border-subtle` = `rgba(255,255,255,0.06)`) is the product owner's flagged #1 issue. On the dark navy surface (#0a0e12), this renders as an essentially invisible boundary. The hover upgrade to `--color-border-strong` (10% white) is marginally better but still fails as a button affordance.

---

## Critical Issues

### C1 — Secondary variant border is functionally invisible
**File:** [src/components/ui/Button.tsx:29](src/components/ui/Button.tsx#L29)

```
border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)]
```

`--color-border-subtle` = `rgba(255,255,255,0.06)` on `#12171e` (elevated bg) on `#0a0e12` (page bg). The border provides effectively zero visual distinction. A user has to rely entirely on background color difference between `--color-bg-elevated` and `--color-bg-page` — a subtlety easily missed.

Hover state upgrades to `--color-border-strong` (10% white) — still failing as a button affordance. For a bordered button to read as a button, the border needs to be visible at rest: at minimum 15–20% opacity, ideally the accent color at reduced opacity.

**Fix:** Change secondary default border to `rgba(255,255,255,0.16)` or `var(--color-accent)/25`. Update all ~55 inline clones to match.

### C2 — Active/press state regresses to darker surface
**File:** [src/components/ui/Button.tsx:31](src/components/ui/Button.tsx#L31)

```
active:bg-[var(--color-bg-surface)]
```

On press, the secondary button goes from `--color-bg-elevated` (#1a2028) to `--color-bg-surface` (#12171e) — darker, not lighter. This is counterintuitive: pressing something should feel like it activates (brightens/reacts), not disappears into the background. The primary button correctly uses `active:opacity-90` for a press signal.

**Fix:** Change to `active:bg-[var(--color-bg-elevated)]/70` or add a subtle brightness change.

### C3 — ~55 inline button clones bypass `<Button>`
A grep for `inline-flex cursor-pointer.*border.*border-\[var` finds 55+ instances across 25+ files. Each clone:

- **Does not use Framer whileTap** — no press feedback on touch
- **Does not use `useReducedMotion()`** — motion skips reduced-motion preference  
- **Inconsistent focus rings** — Button.tsx uses `focus-visible:ring-2 ring-[var(--color-accent)]`; clones vary
- **Mixed touch-hover behavior** — many clones don't use `[@media(hover:hover)]` prefix

Key files with the most inline buttons:
| File | Count |
|---|---|
| [src/app/dashboard/pitches/page.tsx](src/app/dashboard/pitches/page.tsx) | 8 |
| [src/app/dashboard/leads/[id]/components/LeadHeaderStrip.tsx](src/app/dashboard/leads/[id]/components/LeadHeaderStrip.tsx) | 4 |
| [src/app/dashboard/leads/[id]/components/LeadHeroSection.tsx](src/app/dashboard/leads/[id]/components/LeadHeroSection.tsx) | 5 |
| [src/app/dashboard/settings/page.tsx](src/app/dashboard/settings/page.tsx) | 5 |
| [src/app/dashboard/leads/[id]/components/PitchCard.tsx](src/app/dashboard/leads/[id]/components/PitchCard.tsx) | 3 |
| [src/app/dashboard/audit/page.tsx](src/app/dashboard/audit/page.tsx) | 2 |
| [src/app/dashboard/audit/components/ReviewCompleteActions.tsx](src/app/dashboard/audit/components/ReviewCompleteActions.tsx) | 2 |

---

## High Priority (fix within 2 weeks)

### H1 — sign-out-button.tsx is entirely hand-crafted
**File:** [src/app/dashboard/sign-out-button.tsx:21,32](src/app/dashboard/sign-out-button.tsx#L21-L32)

Two buttons with manual inline styling. Neither uses `<Button>`. The icon button (line 21) should be `<Button variant="icon">` and the text button (line 32) should be `<SecondaryButton>` or `<GhostButton>`.

### H2 — `rounded-full` border-radius violation in LegalPage
**File:** [src/components/legal/LegalPage.tsx:130](src/components/legal/LegalPage.tsx#L130)

```
rounded-full border border-[var(--color-border-subtle)]
```

The "back" button uses `rounded-full` — violates the two-radius-only rule (`--radius-sm` 6px, `--radius-md` 10px). Should use `rounded-[var(--radius-sm)]`.

### H3 — CookieConsent button has unguarded hover on mobile
**File:** [src/components/CookieConsent.tsx:80](src/components/CookieConsent.tsx#L80)

```
hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text-primary)]
```

Plain `hover:` prefix (not `[@media(hover:hover)]`). The globals.css override at line 247 does cover these specific classes as a fallback, but the correct fix is to use Button component or add `[@media(hover:hover)]` prefix.

### H4 — FilterPanel uses Tailwind red for clear-filters button hover
**File:** [src/components/filters/FilterPanel.tsx:187](src/components/filters/FilterPanel.tsx#L187)

```
hover:border-red-500/30 hover:text-red-400
```

Hardcoded Tailwind colors instead of `var(--color-danger)`. This button's hover state will not follow any future token changes.

### H5 — AuditProgressPanel cancel button uses Tailwind red
**File:** [src/app/dashboard/audit/components/AuditProgressPanel.tsx:51](src/app/dashboard/audit/components/AuditProgressPanel.tsx#L51)

```
hover:border-red-500/40 hover:text-red-400
```

Same issue — should be `hover:border-[var(--color-danger)]/40 hover:text-[var(--color-danger)]`.

### H6 — Pitches page mixes border-subtle and border-strong on same page
**File:** [src/app/dashboard/pitches/page.tsx:330](src/app/dashboard/pitches/page.tsx#L330) vs lines 387–602

Line 330 uses `border-[var(--color-border-strong)]` while the remaining 7 buttons use `border-[var(--color-border-subtle)]`. Same page, different button affordance strength, no visual reason for the distinction.

### H7 — Unguarded hover on inline buttons across audit/discover/pipeline pages

The following inline buttons use plain `hover:border-[var(--color-accent)]/40 hover:text-[var(--color-accent)]` **without** `[@media(hover:hover)]` prefix. The globals.css override doesn't cover these accent-colored hover classes, so they sticky-hover on touch:

- [src/app/dashboard/audit/page.tsx:742,895](src/app/dashboard/audit/page.tsx#L742)
- [src/app/dashboard/pipeline/page.tsx:251](src/app/dashboard/pipeline/page.tsx#L251)
- [src/app/dashboard/audit/components/AuditForm.tsx:77,85](src/app/dashboard/audit/components/AuditForm.tsx#L77)
- [src/app/dashboard/audit/components/ReviewCompleteActions.tsx:364,401](src/app/dashboard/audit/components/ReviewCompleteActions.tsx#L364)

---

## Medium Priority (fix when refactoring nearby)

### M1 — Named semantic aliases (`PrimaryButton`, `SecondaryButton`, `GhostButton`) rarely used
The aliases exist to enforce the one-primary-per-section rule and improve readability. Almost all callsites use `<Button variant="...">` instead. The discipline they're meant to provide is lost.

### M2 — `DiscoverForm.tsx:165` icon button not using `<Button variant="icon">`
A manually crafted `h-11 w-11` icon square that duplicates the icon variant's behavior without the motion, focus ring, or accessibility attributes.

### M3 — `PipelineSelect.tsx:22` — inline button for a UI component
The pipeline dropdown trigger is hand-crafted with ghost border. As a component that ships to every lead detail page, it should use the Button component's secondary or icon variant.

### M4 — `OpportunityPreviewCard.tsx:145` has `rounded-[20px]`
**File:** [src/components/auth/OpportunityPreviewCard.tsx:145](src/components/auth/OpportunityPreviewCard.tsx#L145)

```
rounded-[20px] border border-[var(--color-border-subtle)]
```

`20px` is not an allowed radius. Should be `--radius-md` (10px).

### M5 — Multiple primaries per section (landing)
`AgencyUseCasesSection.tsx:80,86` renders two `<Button variant="primary">` in the same viewport section across consecutive use cases. CLAUDE.md allows "at most ONCE per page section." The iterative rendering means every tab/section break has a primary — technically each is a separate section, but the visual density of primary sage-green buttons degrades their hierarchy signal.

---

## Low Priority / Nice-to-have

### L1 — Loading state pattern not available on inline buttons
The canonical `<Button loading>` prop renders a spinner automatically. Inline buttons that need loading state must implement their own, creating visual divergence.

### L2 — `aria-disabled={isDisabled || undefined}` is confusing to read
The `|| undefined` is correct (avoids `aria-disabled="false"`) but is a non-obvious pattern. A comment would help future contributors understand the intent.

### L3 — No `size="sm"` vs `size="base"` visual check
`SIZE_STYLES.sm` sets `min-h-[44px]` (same as base) — there's no visual size difference between sm and base on mobile. The only differences are padding and text size. This may cause confusion when choosing size props.

---

## What's Actually Good

- **Framer motion integration** with `useReducedMotion()` — best-practice implementation. Touch has whileTap; reduced-motion has none.
- **`[@media(hover:hover)]` on every hover state** in Button.tsx — correctly prevents sticky hover on touch screens.
- **`aria-busy={loading || undefined}`** — correct for screen reader feedback during async operations.
- **Focus ring implementation** — `focus-visible:outline-none focus-visible:ring-2 ring-[var(--color-accent)] ring-offset-2 ring-offset-[var(--color-bg-page)]` is correctly scoped to keyboard navigation only and uses the design token.
- **`disabled:pointer-events-none`** prevents double-click issues on slow operations.
- **Icon variant** correctly sets `min-h-[44px] min-w-[44px]` with `sr-only` text for accessibility.
- **`forwardRef` + `displayName`** on all exports — correct for component library usage.

---

## Quality Scorecard

| Criterion | Score | Notes |
|---|---|---|
| Component architecture | 8/10 | Solid 4-variant design, clean separation |
| Secondary border contrast | 2/10 | 6% white opacity is functionally invisible |
| Hover state UX (press feedback) | 5/10 | Primary good; secondary active state regresses |
| Component adoption rate | 3/10 | ~55 inline clones bypass the system |
| Hover gating for touch | 6/10 | Button.tsx correct; inline buttons mixed |
| Accessibility (focus ring) | 8/10 | Correct implementation in canonical component |
| Touch target compliance | 7/10 | 44px base on mobile in canonical; inline mixed |
| Radius compliance | 7/10 | Mostly correct; rounded-full and rounded-[20px] violations |
| Reduced motion | 9/10 | Well implemented via useReducedMotion() |
| **Overall** | **6/10** | Good foundation, systemic adoption failure |
