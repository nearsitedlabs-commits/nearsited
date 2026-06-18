# Color Audit
**Date:** 2026-06-18 · **Auditor:** Claude Code (Prompt 14) · **Source analysis** (no Playwright)

---

## Executive Summary

Nearsited's color architecture is more disciplined than the button or typography systems — no raw hex values appear in user-facing TSX files, and the CSS variable system is comprehensive. The fundamental problem is **too many color families for the same semantic concepts**, particularly for "positive/green" states where four distinct hex values serve similar meanings, creating visual incoherence even though each is technically mapped to a token.

The most pressing practical issue is the "three greens" problem: a won lead, a good score, and a success toast each render different shades of green within the same product. A secondary issue is that the `--color-success` semantic token (`#4a8f5a`) is darker and more muted than the `--pipeline-won` token (`#4ade80`), despite both being declared as "won/completed" states — they visually contradict each other.

---

## Critical Issues

### C1 — Four distinct green shades for "positive" states
**Source:** [src/app/globals.css](src/app/globals.css)

| Token | Hex | Declared use |
|---|---|---|
| `--color-success` | `#4a8f5a` | "completed / won terminal positive states" |
| `--score-good` | `#7a9f7a` | Score ≥70 (Good) |
| `--status-success-text` | `#4ade80` | Status pill "successful" |
| `--pipeline-won` | `#4ade80` | Pipeline "won" stage |
| `--badge-green-text` | `#9ac49a` | Badge green variant |

This means:
- A won pipeline lead: `#4ade80` (bright, neon-adjacent)
- A score ring at 75: `#7a9f7a` (sage, muted)
- A success state banner: `#4a8f5a` (dark forest green)
- A success toast: uses `--score-good` (#7a9f7a) via [src/components/ui/Toast.tsx:19](src/components/ui/Toast.tsx#L19)
- A green data badge: `#9ac49a` (lightest of all)

The product's won/success vocabulary is incoherent: bright neon green in the pipeline, dark forest green in banners, muted sage in score rings, all for nominally the same semantic meaning.

**Root cause:** The `--color-success` family was defined for "terminal positive" UX states, while `--score-good` was tuned for score display specifically, and `--pipeline-won`/`--status-success-text` used a brighter green from a different color family. No one converged them.

**Recommended consolidation:**
- **Score rings** → keep `--score-good` (#7a9f7a) as the score-specific green (it's perceptually calibrated against score-mid and score-high)
- **Pipeline won, status pills, success toasts** → converge to one value; `#4ade80` is too bright for a dark professional product — recommend `#6ab07a` or similar
- **`--color-success`** → alias to the converged value

### C2 — `StatCard` mixes color families for positive/negative deltas
**File:** [src/components/ui/StatCard.tsx:63-64](src/components/ui/StatCard.tsx#L63)

```tsx
isPositive && "text-[var(--color-success)]",   // #4a8f5a — dark forest green
isNegative && "text-[var(--score-high)]",      // #c4665a — score red (matches --color-danger)
```

The positive delta uses `--color-success` (#4a8f5a) while every score display uses `--score-good` (#7a9f7a). These two appear together on the dashboard stat cards — the "change" number and nearby score rings are visibly different greens within the same component. One semantic context, two different colors.

**Fix:** Use `text-[var(--score-good)]` for positive delta, or align `--color-success` to `--score-good`.

---

## High Priority (fix within 2 weeks)

### H1 — `error.tsx` files across all routes use Tailwind `red-500/10` instead of design token
**Files:** [src/app/dashboard/error.tsx:21](src/app/dashboard/error.tsx#L21), [src/app/dashboard/leads/error.tsx:21](src/app/dashboard/leads/error.tsx#L21), [src/app/dashboard/pitches/error.tsx:21](src/app/dashboard/pitches/error.tsx#L21), [src/app/dashboard/pipeline/error.tsx:21](src/app/dashboard/pipeline/error.tsx#L21), [src/app/dashboard/settings/error.tsx:21](src/app/dashboard/settings/error.tsx#L21), [src/app/dashboard/radar/error.tsx:21](src/app/dashboard/radar/error.tsx#L21), [src/app/dashboard/templates/error.tsx:21](src/app/dashboard/templates/error.tsx#L21)

All 7 error boundary fallbacks share identical markup:
```tsx
<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
```

Tailwind `red-500` (≈ `#ef4444`) vs design token `--color-danger` (#c4665a) — different hues. The error icon color is off-brand. Should be `bg-[var(--color-danger)]/10`.

### H2 — `FilterPanel.tsx` cancel button uses Tailwind red for hover
**File:** [src/components/filters/FilterPanel.tsx:187](src/components/filters/FilterPanel.tsx#L187)

```tsx
hover:border-red-500/30 hover:text-red-400
```

Should be `hover:border-[var(--color-danger)]/30 hover:text-[var(--color-danger)]`.

### H3 — `AuditProgressPanel.tsx` cancel button uses Tailwind red
**File:** [src/app/dashboard/audit/components/AuditProgressPanel.tsx:51](src/app/dashboard/audit/components/AuditProgressPanel.tsx#L51)

```tsx
hover:border-red-500/40 hover:text-red-400
```

Same issue as H2. Should use `--color-danger`.

### H4 — Token proliferation: 4-family redundancy inflates cognitive load
**File:** [src/app/globals.css](src/app/globals.css)

Four parallel token families serve the same palette:
1. **Raw vars**: `--bg-base`, `--accent`, `--score-good`, `--pipeline-won`
2. **Semantic tokens**: `--color-bg-page`, `--color-accent`, `--color-success`
3. **Badge tokens**: `--badge-green-bg`, `--badge-green-text` etc.
4. **Status tokens**: `--status-success-text`, `--status-info-text` etc.

A developer adding a new component must choose between family 2, 3, or 4 for the same semantic concept. The `--badge-*` tokens duplicate the `--status-*` tokens at slightly different opacities. The correct long-term fix is to merge families 3 and 4, and alias everything in family 1 (raw) to family 2 (semantic).

Short-term: add a comment block in globals.css explaining which family to use in each context.

### H5 — `--pipeline-won` (#4ade80 bright green) vs `--color-success` (#4a8f5a deep green) coexist for the same life event
A lead marked "Won" in the pipeline shows `--pipeline-won` (#4ade80, Tailwind green-400-equivalent). A success toast or action confirmation uses `--color-success` (#4a8f5a, muted forest). Within the lead detail page, a user can see both simultaneously. The product says "won" in two very different greens.

---

## Medium Priority (fix when refactoring nearby)

### M1 — `--color-success` (#4a8f5a) and `--score-good` (#7a9f7a) never converge
`--color-success` is declared as "completed / won terminal positive states" — which includes scores ≥85 ("Strong"). But scores use `--score-good` for the 70–84 range and `--score-good` again for ≥85 range (per scoring.ts:86-89, both use `--score-good`). The "Strong" score ring should theoretically use `--color-success` to signal terminal success, but it uses `--score-good`. Naming vs. usage are misaligned.

### M2 — `Toast.tsx` uses `--score-good` for success variant, not `--color-success`
**File:** [src/components/ui/Toast.tsx:19](src/components/ui/Toast.tsx#L19)

```tsx
bg: "bg-[var(--score-good)]",
```

The Toast success state uses the score-display green rather than the UX-state green. If `--color-success` is ever updated (e.g., to match pipeline-won), the success toast won't follow.

### M3 — Admin tool uses Tailwind colors extensively
**File:** [src/app/admin/scoring-audit/scoring-audit-client.tsx](src/app/admin/scoring-audit/scoring-audit-client.tsx)

`bg-red-500/20`, `text-red-400`, `bg-amber-500/20`, `text-amber-400`, `bg-blue-500/20`, `text-blue-400` — hardcoded throughout. Admin-only so lower impact, but if a design system update happens, this file won't follow.

### M4 — `LeadOutreachSection.tsx:94` uses raw `--score-good` token directly
**File:** [src/app/dashboard/leads/[id]/components/LeadOutreachSection.tsx:94](src/app/dashboard/leads/[id]/components/LeadOutreachSection.tsx#L94)

```tsx
hasContact ? "bg-[var(--score-good)]" : "bg-[var(--text-tertiary)]"
```

A contact-available indicator dot uses a score color (`--score-good`) rather than a status color (`--status-success-text`). Conceptually wrong family — availability is a status, not a score.

### M5 — Dashboard pipeline funnel zero-value color not confirmed (Rule C risk)
**File:** [src/app/dashboard/dashboard-client.tsx](src/app/dashboard/dashboard-client.tsx)

The pipeline funnel renders stage counts with pipeline-status colors. The code at lines 309+ renders `border-b border-[var(--color-border-subtle)]` rows, but the color assigned to each count was not visible in search results. If "Won: 0" renders in `--pipeline-won` (bright green), it violates Rule C ("Won = 0 is gray, not green"). Requires runtime verification.

### M6 — `WhyNearsitedSection.tsx:114` uses inline `style={{ background: item.color }}`
**File:** [src/components/landing/WhyNearsitedSection.tsx:114](src/components/landing/WhyNearsitedSection.tsx#L114)

```tsx
<span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: item.color }} />
```

Where `item.color` is set inline as `"var(--score-high)"` or `"var(--score-mid)"`. Inline style for a color that exists in the token system is unnecessary — should use Tailwind classes `bg-[var(--score-high)]` etc.

### M7 — `SampleReportSection.tsx` uses inline style for score color
**File:** [src/components/landing/SampleReportSection.tsx:115](src/components/landing/SampleReportSection.tsx#L115)

```tsx
style={{ color: item.score < 40 ? "var(--score-high)" : item.score < 55 ? "var(--score-mid)" : "var(--score-good)" }}
```

The threshold values here (`< 40`, `< 55`) differ from `scoring.ts` thresholds (0–39 Poor, 40–69 NeedsImprovement, 70–84 Good, 85+ Strong). The sample report section uses different breakpoints than the real scoring system — a silent divergence.

---

## Low Priority / Nice-to-have

### L1 — `--border` and `--color-border-subtle` are duplicated
Both are `rgba(255,255,255,0.06)` — same value under two names. Same for `--border-strong` and `--color-border-strong`. The raw vars should be aliased to semantic tokens, not duplicated.

### L2 — `--pipeline-pitch: #818cf8` token is orphaned
`pitch_generated` was removed from the canonical pipeline enum. The `--pipeline-pitch` CSS token still exists in globals.css and is never used. Should be removed to avoid confusion.

### L3 — `--accent-warm: #a09470` is defined but use is unclear
`--accent-warm` appears in globals.css but was not found in any component. Either document its intended use case or remove it.

### L4 — `OpportunityPreviewCard.tsx:60,89,117` uses `"var(--score-good)"` as a data object field
**File:** [src/components/auth/OpportunityPreviewCard.tsx:60](src/components/auth/OpportunityPreviewCard.tsx#L60)

```tsx
scoreColor: "var(--score-good)",
```

Storing CSS variable strings as data object fields is fragile — if the variable is renamed, there's no TypeScript error. Should use the `scoreColorClasses()` utility from `scoring.ts` instead.

---

## What's Actually Good

- **No raw hex values in user-facing TSX** — grep for `#[0-9a-fA-F]{3,6}` in `src/app/*.tsx` returns zero matches. Every color is tokenized in user-facing code.
- **`--color-danger` is consistent** — form validation errors, destructive action hover states, and error banners all use the same token. The auth pages, pipeline confirmation modals, and reset-password form are aligned.
- **`--color-accent` is correctly gated** — used only for primary actions and active nav state, not decoratively. The discipline around sage green is better than any other color.
- **`--color-info` properly used** — in-progress analysis states (AnalysisProgressBanner, AIQuotaBanner) use `--color-info` / `--status-info-text` consistently.
- **`--status-info-text` IS properly defined** — referenced in LeadHeroSection and social-opportunity-page; confirmed in globals.css:144. Not an undefined variable.
- **Score coloring via `scoring.ts`** — all dynamic score colors route through `scoreColorClasses()` in `src/lib/scoring.ts`, which returns the canonical `--score-*` classes. Single source of truth for score-specific color logic.
- **Pipeline status colors are self-contained** — the `--pipeline-*` tokens and tints are defined once and referenced via `ui-constants.ts`. No pipelines-status color is hardcoded outside this system.
- **`--color-danger` and `--score-high` happen to share the same hex** (#c4665a) — red/danger is internally consistent even if named differently.
- **`--color-warning` and `--score-mid` share the same hex** (#c4984a) — amber/warning is internally consistent.
- **Semantic comments in globals.css** are clear and accurate for the danger/warning/success/info family.
- **Auth form validation** correctly uses `--color-danger`/60 for border tint and `--color-danger` for text — good proportional use of opacity modifiers.

---

## Quality Scorecard

| Criterion | Score | Notes |
|---|---|---|
| No raw hex in user-facing code | 9/10 | Clean; only admin tool has Tailwind colors |
| Green family coherence | 2/10 | 4 shades of green for "positive" — biggest issue |
| Red/amber coherence | 8/10 | Danger/score-high and warning/score-mid aligned |
| Token family proliferation | 3/10 | 4 families (raw, semantic, badge, status) — redundant |
| Semantic token discipline | 6/10 | Good intent; execution mixed (StatCard mixes families) |
| Pipeline vs semantic alignment | 4/10 | Won = #4ade80 vs success = #4a8f5a — incoherent |
| Zero-value rule (Rule C) | 6/10 | Mostly correct; pipeline funnel unverified |
| Error state token discipline | 5/10 | All error.tsx files use Tailwind red-500, not --color-danger |
| Color usage documentation | 7/10 | Globals.css comments are clear and accurate |
| **Overall** | **5.5/10** | Well-intentioned; semantic coherence needs green consolidation |
