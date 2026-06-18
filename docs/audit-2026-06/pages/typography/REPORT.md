# Typography Audit
**Date:** 2026-06-18 · **Auditor:** Claude Code (Prompt 13) · **Source analysis** (no Playwright)

---

## Executive Summary

Nearsited's typography works visually but has no systematic discipline beneath the surface. The Geist font is loaded correctly and used consistently. The `--text-hero` token is used with the correct Tailwind type-prefix syntax (`text-[length:var(--text-hero)]`). But below the hero, the type scale fragments into a mixture of CSS tokens, Tailwind utilities, and 12+ arbitrary `tracking-[x.xxem]` values that are standardized nowhere.

The most significant structural issue: **Switzer — the declared hero headline font — is not loaded anywhere in the application.** The landing page hero renders in Geist by default. Whether Switzer was intentionally dropped or accidentally forgotten is unclear, but it's absent from code while present in CLAUDE.md.

Letter-spacing proliferation is the single largest cleanliness debt: 12 unique `tracking-` values, none as CSS tokens, with values ranging from 0.04em to 0.3em across the app. No developer can pick a tracking value without guessing.

---

## Critical Issues

### C1 — Switzer font is not loaded
**Expected:** CLAUDE.md states "Switzer — hero headlines only, landing page only"

**Reality:** Zero `@import`, `@font-face`, CDN reference, or `next/font` call for Switzer anywhere in `src/`. [src/app/layout.tsx:3](src/app/layout.tsx#L3) loads only `Geist` and `Geist_Mono`. [src/components/landing/LandingHero.tsx:58](src/components/landing/LandingHero.tsx#L58) renders the hero H1 in the default `--font-sans` (Geist), not Switzer.

**Impact:** The hero headline typeface is effectively wrong — whether that matters depends on whether Switzer was ever intended. If the product owner decided Geist was fine for the hero, CLAUDE.md needs updating. If Switzer was intended, the font needs loading.

**To verify:** Check if Switzer was ever purchased/licensed or if the CLAUDE.md reference is aspirational.

### C2 — 12 unique letter-spacing values, zero as CSS tokens
No tracking values are defined in `globals.css`. Each component author picked an arbitrary em value. Current values found:

| Value | Files using it |
|---|---|
| `tracking-[0.04em]` | StatTile, Pill |
| `tracking-[0.08em]` | LegalPage |
| `tracking-[0.12em]` | LandingHero, OpportunityPreviewCard, SampleReportSection, LandingFooter |
| `tracking-[0.14em]` | WhyNearsitedSection |
| `tracking-[0.15em]` | DiscoverForm |
| `tracking-[0.18em]` | SectionLabel, Pricing, BrandStoryPanel, LandingFooter |
| `tracking-[0.2em]` | LandingHero, dashboard-client, LeadHeroSection, audit/page |
| `tracking-[0.24em]` | LandingHero, OpportunityPreviewCard |
| `tracking-[0.3em]` | OpportunityPreviewCard |
| `tracking-wide` | share-report-client |
| `tracking-wider` | LeadsTable, admin |
| `tracking-widest` | FilterPanel, sidebar-nav, admin |

There are effectively three conceptually different contexts for uppercase tracking (microlabels, section eyebrows, column headers), each requiring a slightly different value — but the actual values are not chosen consistently for any one context.

**Recommended:** Define 3 tokens in globals.css:
```css
--tracking-micro:  0.12em;   /* microlabels, field labels */
--tracking-eyebrow: 0.18em;  /* section eyebrows, SectionLabel */
--tracking-column: 0.06em;   /* table column headers */
```

---

## High Priority (fix within 2 weeks)

### H1 — `text-[0.7rem]` is a non-canonical size used in 3+ components
**Files:** [src/components/landing/LandingFooter.tsx:74,127,136,143](src/components/landing/LandingFooter.tsx#L74), [src/components/landing/Pricing.tsx:137](src/components/landing/Pricing.tsx#L137), [src/components/landing/SectionLabel.tsx:6](src/components/landing/SectionLabel.tsx#L6), [src/app/pricing/page.tsx:120](src/app/pricing/page.tsx#L120)

`0.7rem` = 11.2px. This is between `text-xs` (12px) and `text-[10px]` (10px). It's not in the CSS token scale, not a Tailwind standard, and slightly different from the `text-[11px]` used elsewhere (11px vs 11.2px). These should align to either `text-xs` or `text-[10px]`.

### H2 — `text-[0.65rem]` goes below standard floor
**File:** [src/components/landing/WhyNearsitedSection.tsx:95](src/components/landing/WhyNearsitedSection.tsx#L95)

```
text-[0.65rem] uppercase tracking-[0.14em]
```

`0.65rem` = 10.4px — fractionally above 10px floor but uses a non-standard arbitrary value. CLAUDE.md sets 10px as the floor. This should be `text-[10px]` or `text-xs`.

### H3 — Uppercase eyebrow in LeadHeroSection may violate Rule I
**File:** [src/app/dashboard/leads/[id]/components/LeadHeroSection.tsx:57](src/app/dashboard/leads/[id]/components/LeadHeroSection.tsx#L57)

```
<p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
  Opportunity Details
</p>
```

The Lead Detail page is under `/dashboard/leads` — the sidebar nav label is "Opportunities." "Opportunity Details" as an uppercase eyebrow on this page is borderline Rule I (no uppercase eyebrow that repeats the sidebar nav label). It's not identical (says "Details" not "Opportunities") but the proximity is close enough to audit. Combined with the Legacy `LeadHeroSection` being partially superseded by `LeadHeaderStrip`, this eyebrow may be dead code.

### H4 — `--text-display`, `--text-2xl`, `--text-xl`, `--text-lg` tokens are defined but largely bypassed
**File:** [src/app/globals.css:311-314](src/app/globals.css#L311)

The CSS token scale defines:
- `--text-display: 2.5rem`
- `--text-2xl: 1.5rem`
- `--text-xl: 1.25rem`
- `--text-lg: 1.125rem`

Actual app code uses Tailwind utilities (`text-xl`, `text-2xl`, `text-3xl`) at equivalent sizes. The CSS tokens exist but no code imports them via `text-[var(--text-display)]` etc. The token scale was defined without enforcing its use, resulting in a parallel implicit scale.

### H5 — `text-2xl font-bold sm:text-3xl` in share-report-client bypasses token
**File:** [src/app/share/[token]/share-report-client.tsx:179](src/app/share/[token]/share-report-client.tsx#L179)

The business name heading uses Tailwind utilities with a responsive override. This is not wrong per se, but should use the token (`text-[var(--text-2xl)]`) to participate in the scale.

### H6 — Mobile line-height spec not implemented
CLAUDE.md specifies:
```
Body: line-height 1.6 on mobile (1.55 desktop)
```
Neither `globals.css` nor any component sets these line-heights. Body text falls back to Tailwind's default (`leading-normal` = 1.5). This means mobile body text is slightly tighter than the spec intends.

---

## Medium Priority (fix when refactoring nearby)

### M1 — `tracking-[0.3em]` is extreme letter-spacing
**File:** [src/components/auth/OpportunityPreviewCard.tsx:193](src/components/auth/OpportunityPreviewCard.tsx#L193)

```
text-[10px] uppercase tracking-[0.24em]  ...  tracking-[0.3em]
```

0.3em tracking at 10px means each character has 3px of space added. This is approaching decorative territory and may impair readability for non-Latin scripts. Should align to the `--tracking-micro` token once defined.

### M2 — `sidebar-nav.tsx:12` uses `tracking-widest` (Tailwind = 0.1em)
**File:** [src/app/dashboard/sidebar-nav.tsx:12](src/app/dashboard/sidebar-nav.tsx#L12)

```
text-[10px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)]
```

Tailwind `tracking-widest` = `0.1em`. This section group label above the nav items uses a different tracking from the microlabels in `StatTile` (0.04em), `LandingHero` (0.12em), etc. Not canonicalized.

### M3 — `text-[clamp(1.5rem,4vw,2.75rem)]` is not a CSS token
**Files:** [src/app/dashboard/leads/[id]/components/LeadHeaderStrip.tsx:83](src/app/dashboard/leads/[id]/components/LeadHeaderStrip.tsx#L83), [src/app/dashboard/leads/[id]/components/LeadHeroSection.tsx:59](src/app/dashboard/leads/[id]/components/LeadHeroSection.tsx#L59)

This responsive clamp is hardcoded in two component files. It should be a token: `--text-page-title: clamp(1.5rem, 4vw, 2.75rem)`. Used consistently across the lead detail family.

### M4 — `text-[11px]` vs `text-[0.7rem]` (11.2px) inconsistency
Some microlabels use 11px, others 11.2px. Both are arbitrary. Standardize to `text-[11px]` (or `text-xs` at 12px if slightly larger is acceptable).

### M5 — `share-report-client.tsx:226,257` uses uppercase with emoji
**File:** [src/app/share/[token]/share-report-client.tsx:226](src/app/share/[token]/share-report-client.tsx#L226)

```
<p className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">📱 Mobile</p>
```

`text-transform: uppercase` applied to a string containing emoji. In most browsers this is harmless (emoji don't have case), but it's a semantic oddity. Also uses Tailwind `tracking-wide` (non-canonical).

---

## Low Priority / Nice-to-have

### L1 — `font-bold text-xl` in share-report-client could use tokens

### L2 — `text-[9px]` in admin scoring tool is below the 10px floor
**File:** [src/app/admin/scoring-audit/scoring-audit-client.tsx:245,265](src/app/admin/scoring-audit/scoring-audit-client.tsx#L245)

Admin-only, not user-facing. Acceptable risk but noted.

### L3 — `leading-[0.92]` is acceptable for display type but undocumented
**File:** [src/components/landing/LandingHero.tsx:58](src/components/landing/LandingHero.tsx#L58)

Intentionally tight leading for large hero type. Should have a brief comment explaining the intent.

### L4 — `text-2xs` referenced in CLAUDE.md but not confirmed in codebase
CLAUDE.md mentions a `text-2xs` size. The actual Tailwind config has no custom sizes (CSS variables only). This appears to be aspirational documentation.

---

## What's Actually Good

- **Geist is loaded correctly** via `next/font/google` with proper variable assignment to `--font-sans`.
- **`text-[length:var(--text-hero)]`** — correct use of Tailwind type-prefix to prevent length/color ambiguity. Explicitly noted in CLAUDE.md and followed correctly in LandingHero.
- **10px microlabel floor respected** across 95% of user-facing code. The violations are minor or admin-only.
- **`font-mono` applied correctly** to code/data values: audit URL display ([src/app/dashboard/audit/page.tsx:624](src/app/dashboard/audit/page.tsx#L624)), formula display in admin tool.
- **Geist Mono applied in SVG scorecard labels** via `fontFamily="var(--font-sans, Geist)"` — provides reliable fallback.
- **`-webkit-font-smoothing: antialiased`** applied to all form elements in globals.css — correct for dark backgrounds.
- **No Satoshi font** — the stale DESIGN_SYSTEM.md reference to "Satoshi" is not present in actual code. 
- **`prefers-reduced-motion` respects `animation-duration: 0.01ms`** for all elements — type animations won't distract users who prefer reduced motion.
- **All dashboard body text in Geist** — consistent, no font mixing in the main app.

---

## Quality Scorecard

| Criterion | Score | Notes |
|---|---|---|
| Primary font loading | 8/10 | Geist correct; Geist Mono correct |
| Hero font (Switzer) | 0/10 | Declared in CLAUDE.md, missing from code |
| CSS token adherence | 5/10 | Mix of tokens, Tailwind utilities, arbitrary values |
| Letter-spacing standardization | 2/10 | 12 unique values, zero CSS tokens |
| Uppercase microlabel discipline | 6/10 | Consistent pattern, tracking values chaotic |
| Size floor (10px minimum) | 8/10 | Mostly respected; admin violations minor |
| Non-standard arbitrary sizes | 5/10 | text-[0.7rem], text-[0.65rem] etc. |
| Line-height discipline | 4/10 | Mobile spec (1.6) not implemented in CSS |
| Responsive scale | 6/10 | Hero clamp correct; page-title clamp hardcoded |
| **Overall** | **5/10** | Functional but undisciplined; fragile at scale |
