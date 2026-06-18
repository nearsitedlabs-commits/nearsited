# Proposed Button System
**Date:** 2026-06-18 · **Prompt 12 — Button System Audit**
**Method:** Source analysis ([`Button.tsx`](src/components/ui/Button.tsx)) + Playwright capture of 75 buttons across 7 public pages

---

## Executive Summary

The `<Button>` component in [`src/components/ui/Button.tsx`](src/components/ui/Button.tsx) has a solid architectural foundation — correct hover gating, reduced-motion support, focus rings, and 44px touch targets. Two systemic problems undermine it:

1. **Secondary button border is invisible.** `--color-border-subtle` at 6% white opacity provides zero affordance. The Playwright capture confirms: secondary buttons render with `rgba(255,255,255,0.06)` border on `rgb(26,32,40)` background — effectively invisible.

2. **~55 inline button clones bypass the system.** Across dashboard pages, hand-rolled `inline-flex cursor-pointer border ...` patterns lack Framer motion, consistent hover gating, and use disparate styling.

The proposed system preserves the 4-variant architecture but fixes the border contrast, adds a destructive variant, formalizes the size system, and provides a migration map for inline clones.

---

## Variant Specifications

### 1. Primary Action Button
| Property | Spec | Current (Button.tsx) |
|----------|------|---------------------|
| Background | `--color-accent` (`#8A9777`) | ✅ Correct |
| Text color | White (`#ffffff`) | ✅ Correct |
| Border | None | ✅ Correct |
| Border radius | `--radius-sm` (6px) | ✅ Correct |
| Shadow | `--brand-shadow-xs` | ✅ Correct |
| Hover | `opacity-90` | ✅ `[@media(hover:hover)]:hover:opacity-90` |
| Active/press | `opacity-90` | ✅ `active:opacity-90` (via Framer whileTap: scale 0.98) |
| Disabled | `opacity-50`, `cursor-not-allowed` | ✅ Correct |
| Loading | Spinner replaces icon slot | ✅ Correct |
| **Constraint** | **At most 1 per page section** | ⚠️ Enforced by naming convention only — `PrimaryButton` alias exists but `<Button variant="primary">` bypasses it |
| Touch target | `min-h-[44px]` | ✅ Correct |

### 2. Secondary Action Button (FIXED)
| Property | Spec | Current (Button.tsx) | Problem |
|----------|------|---------------------|---------|
| Background | `--color-bg-elevated` (`#1a2028`) | ✅ `bg-[var(--color-bg-elevated)]` | — |
| Text color | `--color-text-secondary` | ✅ `text-[var(--color-text-secondary)]` | — |
| Border | `--color-border-strong` (`rgba(255,255,255,0.10)`) | ❌ `--color-border-subtle` (`rgba(255,255,255,0.06)`) | 6% opacity invisible at rest |
| Hover border | `--color-accent`/30 (`rgba(138,151,119,0.30)`) | ❌ `--color-border-strong` (10% white) | Hover should introduce accent tint |
| Hover text | `--color-text-primary` | ✅ Correct | — |
| Active bg | `brightness(1.1)` or `bg-[var(--color-bg-elevated)]` at 90% | ❌ `active:bg-[var(--color-bg-surface)]` | Press state goes **darker**, not brighter |
| Border radius | `--radius-sm` (6px) | ✅ Correct (but some instances use `--radius-md` 10px — see Inconsistencies) | Playwright shows both 6px and 10px |

**The recommended treatment:**

```tsx
secondary:
  "border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] " +
  "[@media(hover:hover)]:hover:border-[var(--color-accent)]/30 [@media(hover:hover)]:hover:bg-[var(--color-bg-elevated)]/90 [@media(hover:hover)]:hover:text-[var(--color-text-primary)] " +
  "active:bg-[var(--color-accent-tint)] " +  // subtle accent tint on press
  "focus-visible:border-[var(--color-accent)] ",
```

### 3. Ghost Button (text-only, low emphasis)
| Property | Spec | Current (Button.tsx) | Notes |
|----------|------|---------------------|-------|
| Background | Transparent | ✅ `bg-transparent` | — |
| Border | Transparent (no visible stroke) | ✅ `border border-transparent` | — |
| Text | `--color-text-tertiary` | ✅ `text-[var(--color-text-secondary)]` | Consider using tertiary for lower emphasis |
| Hover bg | `--color-bg-elevated` | ✅ Correct | — |
| Hover text | `--color-text-primary` | ✅ Correct | — |
| Focus visible | Accent border appears | ✅ `focus-visible:border-[var(--color-accent)]/50` | ✅ Correct |

**ALTERNATIVE PROPOSAL — Tonal ghost (recommended):** Replace the invisible transparent border with a hover-only background approach. Ghost buttons should have NO perceived box boundary until hover/focus:

```tsx
ghost:
  "bg-transparent text-[var(--color-text-tertiary)] " +
  "[@media(hover:hover)]:hover:bg-[var(--color-bg-elevated)] [@media(hover:hover)]:hover:text-[var(--color-text-primary)] " +
  "active:bg-[var(--color-bg-elevated)] " +
  "focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]/30 ",
```

### 4. Destructive Button (NEW)
Add a fifth variant for delete/remove/revoke actions. Currently these use inline Tailwind red (`hover:border-red-500/30 hover:text-red-400`) scattered across the codebase.

| Property | Spec |
|----------|------|
| Background | `--color-danger`/10 (`rgba(196,102,90,0.10)`) |
| Border | `--color-danger`/30 (`rgba(196,102,90,0.30)`) |
| Text | `--color-danger` (`#c4665a`) |
| Hover bg | `--color-danger`/20 |
| Hover border | `--color-danger`/50 |
| Active bg | `--color-danger`/25 |
| Focus ring | `--color-danger` |
| Loading | Same spinner pattern as primary |

```tsx
destructive:
  "border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 text-[var(--color-danger)] " +
  "[@media(hover:hover)]:hover:border-[var(--color-danger)]/50 [@media(hover:hover)]:hover:bg-[var(--color-danger)]/20 " +
  "active:bg-[var(--color-danger)]/25 " +
  "focus-visible:ring-2 focus-visible:ring-[var(--color-danger)] focus-visible:ring-offset-2 " +
  "focus-visible:ring-offset-[var(--color-bg-page)] ",
```

**Affected callsites** (migrate from inline Tailwind red):
- [`FilterPanel.tsx:187`](src/components/filters/FilterPanel.tsx#L187) — "Clear filters" hover
- [`AuditProgressPanel.tsx:51`](src/app/dashboard/audit/components/AuditProgressPanel.tsx#L51) — Cancel button hover
- [`audit/page.tsx:770,838`](src/app/dashboard/audit/page.tsx#L770) — Error banners (use `--color-danger` token)
- [`audit/page.tsx:845,875`](src/app/dashboard/audit/page.tsx#L845) — Warning banners (use `--color-warning` token)

### 5. Icon-Only Button (existing — keep)
| Property | Spec | Current (Button.tsx) | Notes |
|----------|------|---------------------|-------|
| Min size | `44×44px` | ✅ `min-h-[44px] min-w-[44px]` | WCAG AAA touch target |
| Padding | `p-2.5` | ✅ `p-2.5` | 10px comfortable |
| Background | Transparent | ✅ `bg-transparent` | — |
| Border | Transparent | ✅ `border border-transparent` | — |
| Text color | `--color-text-tertiary` | ✅ Correct | — |
| Hover bg | `--color-bg-elevated` | ✅ Correct | — |
| Accessible label | `sr-only` text + `aria-label` | ✅ `{children && <span className={cn(variant === "icon" && "sr-only")}>{children}</span>}` | ✅ Correct pattern |
| Focus visible | Accent border | ✅ `focus-visible:border-[var(--color-accent)]/50` | ✅ Correct |

---

## Size System

| Size | Current (Button.tsx) | Problem | Proposed |
|------|---------------------|---------|----------|
| **sm** | `px-3 py-1.5 text-xs min-h-[44px]` | `min-h-[44px]` same as base — no height distinction on mobile | `min-h-[36px] lg:min-h-[32px]` |
| **base** | `min-h-[44px] lg:min-h-[36px]` | No explicit padding — relies on default | `px-4 py-2.5 text-sm min-h-[44px] lg:min-h-[36px]` |
| **lg** | `px-6 py-3 text-base min-h-[44px]` | ✅ Correct | Keep as-is |

### Size token spec (single source of truth):

```tsx
const SIZE_STYLES: Record<ButtonSize, string> = {
  sm:   "px-3 py-1.5 text-xs min-h-[36px] lg:min-h-[32px] gap-1.5",
  base: "px-4 py-2.5 text-sm min-h-[44px] lg:min-h-[36px] gap-2",
  lg:   "px-6 py-3 text-base min-h-[44px] lg:min-h-[44px] gap-2.5",
};
```

---

## State System

### Hover
| Variant | Hover treatment | Gated? |
|---------|----------------|--------|
| Primary | `opacity-90` | ✅ `[@media(hover:hover)]` |
| Secondary | `border-[var(--color-accent)]/30` + `bg-[var(--color-bg-elevated)]/90` + `text-[var(--color-text-primary)]` | ✅ `[@media(hover:hover)]` |
| Ghost | `bg-[var(--color-bg-elevated)]` + `text-[var(--color-text-primary)]` | ✅ `[@media(hover:hover)]` |
| Destructive | `border-[var(--color-danger)]/50` + `bg-[var(--color-danger)]/20` | ✅ `[@media(hover:hover)]` |
| Icon-only | `bg-[var(--color-bg-elevated)]` + `text-[var(--color-text-primary)]` | ✅ `[@media(hover:hover)]` |

### Focus
All variants use `focus-visible:ring-2` with variant-appropriate ring color (accent for primary/secondary/ghost/icon, danger for destructive). Ring offset uses `--color-bg-page`.

### Active/Press
| Variant | Current | Problem | Proposed |
|---------|---------|---------|----------|
| Primary | `opacity-90` + whileTap `scale: 0.98` | ✅ Good | Keep |
| Secondary | `active:bg-[var(--color-bg-surface)]` | ❌ Goes darker | `active:bg-[var(--color-accent-tint)]` (subtle accent glow) |
| Ghost | `active:bg-[var(--color-bg-elevated)]` | ⚠️ Same as hover | `active:bg-[var(--color-bg-elevated)]/80` (slightly darker) |
| Destructive | None | N/A | `active:bg-[var(--color-danger)]/25` |
| Icon-only | `active:bg-[var(--color-bg-elevated)]` | ⚠️ Same as hover | Keep (44×44 tap area absorbs it) |

### Disabled
All variants: `opacity-50`, `cursor-not-allowed`, `pointer-events-none`. ✅ Correct.

### Loading
Spinner replaces icon slot. `aria-busy={loading || undefined}` for screen readers. ✅ Correct.

---

## Playwright Findings — Key Data Points

### 75 buttons across 7 public pages

| Page | Buttons | Notable |
|------|---------|---------|
| Landing | 52 | Heaviest — CTA, FAQ accordions, pitch samples, pricing tier buttons |
| Login | 4 | Submit, Google OAuth, password toggle, "Back to sign in" link |
| Signup | 4 | Submit, Google OAuth, password toggle, sign-in link |
| Pricing | 11 | Tier CTAs, toggle (monthly/yearly), FAQ accordions |
| Privacy | 0 | Pure text page — navigation via layout only |
| Terms | 0 | Pure text page — navigation via layout only |
| Reset password | 4 | Submit, password toggle (×2), back-to-login link |

### Real computed style values (Playwright captures)

| Variant | BG Color | Border Color | Border Radius | Text Color | Font Size |
|---------|----------|-------------|---------------|------------|-----------|
| **Primary** | `rgb(138, 151, 119)` | `rgb(229, 231, 235)` (Tailwind default) | `6px` | `rgb(255, 255, 255)` | 14–16px |
| **Secondary** | `rgb(26, 32, 40)` | `rgba(255, 255, 255, 0.06)` | `6px` (some 10px) | `rgb(184, 176, 168)` | 14–16px |
| **Ghost** | transparent | transparent | `6px` | `rgb(184, 176, 168)` | 14px |
| **Icon-only** | transparent | `rgb(229, 231, 235)` (Tailwind default) | `6px` | `rgb(138, 151, 119)` | — |
| **Unknown** | mixed | `rgb(229, 231, 235)` | `0px` (inline/FAQ items) | `rgb(240, 237, 232)` | 14–16px |

### Inconsistencies found
1. **Primary buttons** have 2 different border-radius values (6px and 10px) — some `<a>` elements styled as buttons use `rounded-[var(--radius-md)]` instead of `--radius-sm`
2. **Secondary buttons** have 2 different border-radius values (6px and 10px) — the sample report cards and some pricing buttons use `--radius-md`
3. **Unknown category** (34 elements) includes FAQ accordion items `<button>` with `border: 0px` — these are semantic `<button>` elements for accordion interaction, not visual buttons. They should be excluded from button inventory or categorized as "accordion-trigger"

---

## Migration Map

### Phase 1 — Fix the canonical component (estimated: 1 hour)
| File | Change | Impact |
|------|--------|--------|
| [`Button.tsx:29`](src/components/ui/Button.tsx#L29) | `secondary`: change `border-[var(--color-border-subtle)]` → `border-[var(--color-border-strong)]` | All secondary buttons get visible border |
| [`Button.tsx:31`](src/components/ui/Button.tsx#L31) | `secondary` hover: change border + add accent tint | Hover feels intentional, not just brighter |
| [`Button.tsx:31`](src/components/ui/Button.tsx#L31) | `secondary` active: `active:bg-[var(--color-bg-surface)]` → `active:bg-[var(--color-accent-tint)]` | Press state brightens instead of darkening |
| [`Button.tsx:23-43`](src/components/ui/Button.tsx) | Add `destructive` variant | New semantic variant |
| [`Button.tsx:47`](src/components/ui/Button.tsx#L47) | Fix `sm` size — remove redundant `min-h-[44px]` | Proper size distinction |
| [`Button.tsx`](src/components/ui/Button.tsx) | Explicit `base` size padding | Consistency with sm/lg |

### Phase 2 — Fix inline clones in dashboard pages (estimated: 2-3 hours)
| File | Buttons | Action |
|------|---------|--------|
| [`dashboard/pitches/page.tsx`](src/app/dashboard/pitches/page.tsx) | 8 | Replace with `<SecondaryButton>`, `<GhostButton>` |
| [`dashboard/leads/[id]/components/LeadHeaderStrip.tsx`](src/app/dashboard/leads/[id]/components/LeadHeaderStrip.tsx) | 4 | Replace with `<Button variant="icon">` |
| [`dashboard/leads/[id]/components/PitchCard.tsx`](src/app/dashboard/leads/[id]/components/PitchCard.tsx) | 3 | Replace with `<SecondaryButton>`, `<GhostButton>` |
| [`dashboard/settings/page.tsx`](src/app/dashboard/settings/page.tsx) | 5 | Replace with `<Button>` variants |
| [`dashboard/audit/page.tsx`](src/app/dashboard/audit/page.tsx) | 2 + error banners | Replace + migrate to `--color-danger`/`--color-warning` tokens |
| [`dashboard/audit/components/ReviewCompleteActions.tsx`](src/app/dashboard/audit/components/ReviewCompleteActions.tsx) | 2 | Replace with `<Button>` variants |
| [`dashboard/audit/components/AuditForm.tsx`](src/app/dashboard/audit/components/AuditForm.tsx) | 2 | Replace with `<Button>` variants |
| [`dashboard/discover/page.tsx`](src/app/dashboard/discover/page.tsx) | 1 | Replace with `<Button variant="icon">` |
| [`dashboard/pipeline/page.tsx`](src/app/dashboard/pipeline/page.tsx) | 1 | Replace with `<SecondaryButton>` |

### Phase 3 — Fix border-radius violations (estimated: 30 min)
| File | Current | Should be |
|------|---------|-----------|
| [`legal/LegalPage.tsx:130`](src/components/legal/LegalPage.tsx#L130) | `rounded-full` | `rounded-[var(--radius-sm)]` |
| [`auth/OpportunityPreviewCard.tsx:145`](src/components/auth/OpportunityPreviewCard.tsx#L145) | `rounded-[20px]` | `rounded-[var(--radius-md)]` |

### Phase 4 — Add destructive variant callsites (estimated: 30 min)
| File | Current hover | Should use |
|------|--------------|------------|
| [`filters/FilterPanel.tsx:187`](src/components/filters/FilterPanel.tsx#L187) | `hover:border-red-500/30 hover:text-red-400` | `<DestructiveButton>` or tokenized classes |
| [`audit/components/AuditProgressPanel.tsx:51`](src/app/dashboard/audit/components/AuditProgressPanel.tsx#L51) | `hover:border-red-500/40 hover:text-red-400` | `<DestructiveButton>` or tokenized classes |
| [`dashboard/sign-out-button.tsx:21`](src/app/dashboard/sign-out-button.tsx#L21) | Inline styled icon button | `<Button variant="icon">` |
| [`dashboard/sign-out-button.tsx:32`](src/app/dashboard/sign-out-button.tsx#L32) | Inline styled text button | `<GhostButton>` or `<DestructiveButton>` |

---

## Enforcement

1. **ESLint rule** (future): Ban `inline-flex cursor-pointer border border-\[var` pattern — should use `<Button>` component
2. **Code review checklist**: Every `<button>` or `[role="button"]` in a PR must be a `<Button>` variant or have an explicit exception
3. **Named aliases**: Encourage `PrimaryButton`, `SecondaryButton`, `GhostButton` over `<Button variant="...">` to enforce the one-primary-per-section rule
4. **Radius compliance**: No `rounded-full`, `rounded-xl`, `rounded-2xl`, `rounded-3xl`, or arbitrary `rounded-[Xpx]` — only `--radius-sm` (6px) and `--radius-md` (10px) allowed

---

## Visual Outcome After Migration

| Variant | Visual appearance | Affordance level |
|---------|------------------|-----------------|
| Primary | Solid sage green, white text, shadow | **High** — unmistakable CTA |
| Secondary | Subtle bordered box with elevated bg, accent-tinted hover | **Medium** — clearly interactive |
| Ghost | Text-only, bg appears on hover | **Low** — intentionally subtle |
| Destructive | Red-tinted border + bg, red text | **High** — caution signal |
| Icon-only | 44×44px clean icon, bg appears on hover | **Medium** — standard icon button |

The 6%-opacity invisible border is replaced with 10%-opacity (visible) at rest and accent-tinted on hover. This alone resolves the product owner's #1 flagged issue.
