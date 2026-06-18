# Icons — Proposed System
**Date:** 2026-06-18 · **Prompt 15 — Icon Audit**
**Method:** Playwright capture of all SVG/icon elements across landing, login, signup, pricing pages
**Total icons found:** 93

---

## Executive Summary

✅ All 93 icons are lucide-react (rendered as SVG). No mixed sources detected.

⚠️ 4 icons missing `aria-hidden` — may be announced by screen readers unnecessarily.

⚠️ Icons use 4 different dimension sets — consider standardizing.

**Functional vs decorative:** 4 functional (interactive or labelled), 89 decorative (presentational only).

---

## Library Analysis

| Source | Count | Percentage |
|--------|-------|------------|
| lucide-react | 87 | 93.5% |
| Raw SVG (non-lucide) | 6 | 6.5% |

⚠️ **Conclusion:** Some icons are raw SVG — consider migrating to lucide-react.

---

## Size Consistency

| Dimension Set | Count |
|--------------|-------|
| `24x24` | 87 |
| `32x32` | 3 |
| `16pxx16px` | 2 |
| `12pxx12px` | 1 |

### Recommendation
Standardize icon sizes to:
- **16×16px** — Inline with text (badges, indicators)
- **20×20px** — Default icon size
- **24×24px** — Button icons, standalone
- **32×32px** — Large indicators, avatar placeholders

---

## Accessibility (aria-hidden)

| State | Count | Assessment |
|-------|-------|------------|
| `aria-hidden="true"` | 89 | ✅ Properly hidden from screen readers |
| `aria-hidden="false"` | 0 | ⚠️ Explicitly exposed — ensure they have accessible labels |
| Missing `aria-hidden` | 4 | ⚠️ May be announced unnecessarily |

### Rules
- **Decorative icons** (purely visual, no interactive function): MUST have `aria-hidden="true"`
- **Functional icons** (buttons, links, toggles): MUST have accessible text (`aria-label`, `sr-only` companion, or visible label)
- **Icon buttons**: MUST have `aria-label` describing the action


## Per-Page Breakdown

| Page | Total | Lucide | Non-lucide SVG | Functional | Decorative | Missing aria-hidden |
|------|-------|--------|---------------|------------|------------|-------------------|
| landing | 72 | 68 | 4 | 4 | 68 | 4 |
| login | 3 | 2 | 1 | 0 | 3 | 0 |
| signup | 4 | 3 | 1 | 0 | 4 | 0 |
| pricing | 14 | 14 | 0 | 0 | 14 | 0 |

---

## Icon Details

### landing

| # | Tag | Classes | Width | Height | Color | aria-hidden | Role | Adjacent Text |
|---|-----|---------|-------|--------|-------|-------------|------|---------------|
| 1 | `svg` | `lucide lucide-menu h-5 w-5` | `24` | `24` | `rgb(184, 176, 168)` | `true` | `(none)` | (none) |
| 2 | `svg` | `lucide lucide-house` | `24` | `24` | `rgb(138, 151, 119)` | `true` | `(none)` | (none) |
| 3 | `svg` | `lucide lucide-book-open` | `24` | `24` | `rgba(255, 255, 255, 0.35)` | `true` | `(none)` | (none) |
| 4 | `svg` | `lucide lucide-sparkles` | `24` | `24` | `rgba(255, 255, 255, 0.35)` | `true` | `(none)` | (none) |
| 5 | `svg` | `lucide lucide-file-text` | `24` | `24` | `rgba(255, 255, 255, 0.35)` | `true` | `(none)` | (none) |
| 6 | `svg` | `lucide lucide-briefcase` | `24` | `24` | `rgba(255, 255, 255, 0.35)` | `true` | `(none)` | (none) |
| 7 | `svg` | `lucide lucide-credit-card` | `24` | `24` | `rgba(255, 255, 255, 0.35)` | `true` | `(none)` | (none) |
| 8 | `svg` | `lucide lucide-search h-4 w-4` | `24` | `24` | `rgb(255, 255, 255)` | `true` | `(none)` | (none) |
| 9 | `svg` | `lucide lucide-external-link h-4 w-4` | `24` | `24` | `rgb(184, 176, 168)` | `true` | `(none)` | (none) |
| 10 | `svg` | `lucide lucide-check h-3.5 w-3.5 text-[var(--color-accent)]` | `24` | `24` | `rgb(138, 151, 119)` | `true` | `(none)` | No credit card |
| 11 | `svg` | `lucide lucide-check h-3.5 w-3.5 text-[var(--color-accent)]` | `24` | `24` | `rgb(138, 151, 119)` | `true` | `(none)` | 10 free analyses |
| 12 | `svg` | `lucide lucide-check h-3.5 w-3.5 text-[var(--color-accent)]` | `24` | `24` | `rgb(138, 151, 119)` | `true` | `(none)` | Cancel anytime |
| 13 | `svg` | `flex-shrink-0` | `32` | `32` | `rgb(240, 237, 232)` | `(missing)` | `(none)` | 85Marina Legal ConsultantsDubai Marina · LegalNo W |
| 14 | `svg` | `flex-shrink-0` | `32` | `32` | `rgb(240, 237, 232)` | `(missing)` | `(none)` | 72Blue Wave RestaurantJBR · Food & BeverageSocial  |
| 15 | `svg` | `flex-shrink-0` | `32` | `32` | `rgb(240, 237, 232)` | `(missing)` | `(none)` | 72Bright Smile DentalJumeirah · HealthcareWeak Web |
| 16 | `svg` | `lucide lucide-message-square h-3 w-3 text-[var(--color-accen` | `24` | `24` | `rgb(138, 151, 119)` | `true` | `(none)` | AI pitch · ready to send |
| 17 | `svg` | `lucide lucide-search h-3.5 w-3.5` | `24` | `24` | `rgb(138, 151, 119)` | `true` | `(none)` | (none) |
| 18 | `svg` | `lucide lucide-target h-3.5 w-3.5` | `24` | `24` | `rgb(138, 151, 119)` | `true` | `(none)` | (none) |
| 19 | `svg` | `lucide lucide-mail h-3.5 w-3.5` | `24` | `24` | `rgb(138, 151, 119)` | `true` | `(none)` | (none) |
| 20 | `svg` | `lucide lucide-trending-up h-3.5 w-3.5` | `24` | `24` | `rgb(138, 151, 119)` | `true` | `(none)` | (none) |
| 21 | `svg` | `lucide lucide-info h-4 w-4` | `24` | `24` | `rgb(138, 151, 119)` | `true` | `(none)` | (none) |
| 22 | `svg` | `lucide lucide-search h-4 w-4` | `24` | `24` | `rgb(255, 255, 255)` | `true` | `(none)` | (none) |
| 23 | `svg` | `lucide lucide-triangle-alert h-4 w-4 text-[var(--score-high)` | `24` | `24` | `rgb(196, 102, 90)` | `true` | `(none)` | (none) |
| 24 | `svg` | `lucide lucide-zap h-4 w-4 text-[var(--color-accent)]` | `24` | `24` | `rgb(138, 151, 119)` | `true` | `(none)` | (none) |
| 25 | `svg` | `lucide lucide-check mt-0.5 h-4 w-4 shrink-0 text-[var(--colo` | `24` | `24` | `rgb(138, 151, 119)` | `true` | `(none)` | Finds businesses with no website, social-only, and |
| 26 | `svg` | `lucide lucide-check mt-0.5 h-4 w-4 shrink-0 text-[var(--colo` | `24` | `24` | `rgb(138, 151, 119)` | `true` | `(none)` | Surfaces weak websites ranked by opportunity score |
| 27 | `svg` | `lucide lucide-check mt-0.5 h-4 w-4 shrink-0 text-[var(--colo` | `24` | `24` | `rgb(138, 151, 119)` | `true` | `(none)` | Every lead gets an estimated score instantly. Anal |
| 28 | `svg` | `lucide lucide-check mt-0.5 h-4 w-4 shrink-0 text-[var(--colo` | `24` | `24` | `rgb(138, 151, 119)` | `true` | `(none)` | Pitch angle changes completely per lead type. Not  |
| 29 | `svg` | `lucide lucide-check mt-0.5 h-4 w-4 shrink-0 text-[var(--colo` | `24` | `24` | `rgb(138, 151, 119)` | `true` | `(none)` | Generates evidence-based pitches citing real audit |
| 30 | `svg` | `lucide lucide-check mt-0.5 h-4 w-4 shrink-0 text-[var(--colo` | `24` | `24` | `rgb(138, 151, 119)` | `true` | `(none)` | Built-in pipeline to track every lead from discove |
| 31 | `svg` | `lucide lucide-check mt-0.5 h-4 w-4 shrink-0 text-[var(--colo` | `24` | `24` | `rgb(138, 151, 119)` | `true` | `(none)` | From search to pitch-ready lead in under 2 minutes |
| 32 | `svg` | `lucide lucide-triangle-alert h-4 w-4 text-[var(--score-high)` | `24` | `24` | `rgb(196, 102, 90)` | `true` | `(none)` | 5 critical issues found |
| 33 | `svg` | `h-3 w-3 transition-transform group-open:rotate-90` | `12px` | `12px` | `rgb(138, 130, 120)` | `(missing)` | `(none)` | Technical Analysis |
| 34 | `svg` | `lucide lucide-zap mt-0.5 h-4 w-4 shrink-0 text-[var(--color-` | `24` | `24` | `rgb(138, 151, 119)` | `true` | `(none)` | Angle adapts to the opportunity type: new build, s |
| 35 | `svg` | `lucide lucide-file-text mt-0.5 h-4 w-4 shrink-0 text-[var(--` | `24` | `24` | `rgb(138, 151, 119)` | `true` | `(none)` | Adjustable tone: professional, friendly, or luxury |
| 36 | `svg` | `lucide lucide-trending-up mt-0.5 h-4 w-4 shrink-0 text-[var(` | `24` | `24` | `rgb(138, 151, 119)` | `true` | `(none)` | Cites real data: performance scores, missing featu |
| 37 | `svg` | `lucide lucide-message-square h-4 w-4 text-[var(--color-accen` | `24` | `24` | `rgb(138, 151, 119)` | `true` | `(none)` | Sample pitch |
| 38 | `svg` | `lucide lucide-users h-4.5 w-4.5` | `24` | `24` | `rgb(138, 151, 119)` | `true` | `(none)` | (none) |
| 39 | `svg` | `lucide lucide-building2 lucide-building-2 h-4.5 w-4.5` | `24` | `24` | `rgb(138, 151, 119)` | `true` | `(none)` | (none) |
| 40 | `svg` | `lucide lucide-palette h-4.5 w-4.5` | `24` | `24` | `rgb(138, 151, 119)` | `true` | `(none)` | (none) |
| 41 | `svg` | `lucide lucide-trending-up h-4.5 w-4.5` | `24` | `24` | `rgb(138, 151, 119)` | `true` | `(none)` | (none) |
| 42 | `svg` | `lucide lucide-chevron-down h-4 w-4 shrink-0 text-[var(--colo` | `24` | `24` | `rgb(138, 130, 120)` | `true` | `(none)` | I already have enough clients. |
| 43 | `svg` | `lucide lucide-chevron-down h-4 w-4 shrink-0 text-[var(--colo` | `24` | `24` | `rgb(138, 130, 120)` | `true` | `(none)` | Isn't this just another tool I'll never use? |
| 44 | `svg` | `lucide lucide-chevron-down h-4 w-4 shrink-0 text-[var(--colo` | `24` | `24` | `rgb(138, 130, 120)` | `true` | `(none)` | I can find leads myself on Google Maps. |
| 45 | `svg` | `lucide lucide-chevron-down h-4 w-4 shrink-0 text-[var(--colo` | `24` | `24` | `rgb(138, 130, 120)` | `true` | `(none)` | The local businesses I'd pitch don't rank on Googl |
| 46 | `svg` | `lucide lucide-chevron-down h-4 w-4 shrink-0 text-[var(--colo` | `24` | `24` | `rgb(138, 130, 120)` | `true` | `(none)` | I don't do cold outreach. |
| 47 | `svg` | `lucide lucide-chevron-down h-4 w-4 shrink-0 text-[var(--colo` | `24` | `24` | `rgb(138, 130, 120)` | `true` | `(none)` | I already use Apollo or Hunter for prospecting. |
| 48 | `svg` | `lucide lucide-chevron-down h-4 w-4 shrink-0 text-[var(--colo` | `24` | `24` | `rgb(138, 130, 120)` | `true` | `(none)` | How does Nearsited help me win more website projec |
| 49 | `svg` | `lucide lucide-chevron-down h-4 w-4 shrink-0 text-[var(--colo` | `24` | `24` | `rgb(138, 130, 120)` | `true` | `(none)` | What kind of businesses does Nearsited find? |
| 50 | `svg` | `lucide lucide-chevron-down h-4 w-4 shrink-0 text-[var(--colo` | `24` | `24` | `rgb(138, 130, 120)` | `true` | `(none)` | How accurate is the opportunity score? |
| 51 | `svg` | `lucide lucide-chevron-down h-4 w-4 shrink-0 text-[var(--colo` | `24` | `24` | `rgb(138, 130, 120)` | `true` | `(none)` | Do I need technical skills to use it? |
| 52 | `svg` | `lucide lucide-chevron-down h-4 w-4 shrink-0 text-[var(--colo` | `24` | `24` | `rgb(138, 130, 120)` | `true` | `(none)` | What if there are no good opportunities in my city |
| 53 | `svg` | `lucide lucide-chevron-down h-4 w-4 shrink-0 text-[var(--colo` | `24` | `24` | `rgb(138, 130, 120)` | `true` | `(none)` | How is this different from cold email tools? |
| 54 | `svg` | `lucide lucide-chevron-down h-4 w-4 shrink-0 text-[var(--colo` | `24` | `24` | `rgb(138, 130, 120)` | `true` | `(none)` | How current is the business data? Are these busine |
| 55 | `svg` | `lucide lucide-chevron-down h-4 w-4 shrink-0 text-[var(--colo` | `24` | `24` | `rgb(138, 130, 120)` | `true` | `(none)` | Which cities and countries does Nearsited cover? |
| 56 | `svg` | `lucide lucide-check mt-0.5 h-4 w-4 shrink-0 text-[var(--colo` | `24` | `24` | `rgb(138, 151, 119)` | `true` | `(none)` | 50 opportunity analyses per month |
| 57 | `svg` | `lucide lucide-check mt-0.5 h-4 w-4 shrink-0 text-[var(--colo` | `24` | `24` | `rgb(138, 151, 119)` | `true` | `(none)` | 3 city searches per month |
| 58 | `svg` | `lucide lucide-check mt-0.5 h-4 w-4 shrink-0 text-[var(--colo` | `24` | `24` | `rgb(138, 151, 119)` | `true` | `(none)` | Email pitch generation |
| 59 | `svg` | `lucide lucide-check mt-0.5 h-4 w-4 shrink-0 text-[var(--colo` | `24` | `24` | `rgb(138, 151, 119)` | `true` | `(none)` | Pipeline tracking |
| 60 | `svg` | `lucide lucide-check mt-0.5 h-4 w-4 shrink-0 text-[var(--colo` | `24` | `24` | `rgb(138, 151, 119)` | `true` | `(none)` | 200 opportunity analyses per month |
| 61 | `svg` | `lucide lucide-check mt-0.5 h-4 w-4 shrink-0 text-[var(--colo` | `24` | `24` | `rgb(138, 151, 119)` | `true` | `(none)` | 10 city searches per month |
| 62 | `svg` | `lucide lucide-check mt-0.5 h-4 w-4 shrink-0 text-[var(--colo` | `24` | `24` | `rgb(138, 151, 119)` | `true` | `(none)` | Email + WhatsApp pitch generation |
| 63 | `svg` | `lucide lucide-check mt-0.5 h-4 w-4 shrink-0 text-[var(--colo` | `24` | `24` | `rgb(138, 151, 119)` | `true` | `(none)` | White-label shareable reports |
| 64 | `svg` | `lucide lucide-check mt-0.5 h-4 w-4 shrink-0 text-[var(--colo` | `24` | `24` | `rgb(138, 151, 119)` | `true` | `(none)` | Priority support |
| 65 | `svg` | `lucide lucide-check h-3.5 w-3.5 shrink-0 text-[var(--color-a` | `24` | `24` | `rgb(138, 151, 119)` | `true` | `(none)` | All 4 opportunity types: no website, social, platf |
| 66 | `svg` | `lucide lucide-check h-3.5 w-3.5 shrink-0 text-[var(--color-a` | `24` | `24` | `rgb(138, 151, 119)` | `true` | `(none)` | Unlimited AI pitch generation |
| 67 | `svg` | `lucide lucide-check h-3.5 w-3.5 shrink-0 text-[var(--color-a` | `24` | `24` | `rgb(138, 151, 119)` | `true` | `(none)` | Unlimited pipeline management |
| 68 | `svg` | `lucide lucide-check h-3.5 w-3.5 shrink-0 text-[var(--color-a` | `24` | `24` | `rgb(138, 151, 119)` | `true` | `(none)` | PDF audit exports |
| 69 | `svg` | `lucide lucide-search h-4 w-4` | `24` | `24` | `rgb(255, 255, 255)` | `true` | `(none)` | (none) |
| 70 | `svg` | `lucide lucide-check h-3.5 w-3.5 text-[var(--color-accent)]` | `24` | `24` | `rgb(138, 151, 119)` | `true` | `(none)` | No credit card |
| 71 | `svg` | `lucide lucide-check h-3.5 w-3.5 text-[var(--color-accent)]` | `24` | `24` | `rgb(138, 151, 119)` | `true` | `(none)` | 10 free analyses |
| 72 | `svg` | `lucide lucide-check h-3.5 w-3.5 text-[var(--color-accent)]` | `24` | `24` | `rgb(138, 151, 119)` | `true` | `(none)` | Cancel anytime |

### login

| # | Tag | Classes | Width | Height | Color | aria-hidden | Role | Adjacent Text |
|---|-----|---------|-------|--------|-------|-------------|------|---------------|
| 1 | `svg` | `lucide lucide-chevron-right h-3.5 w-3.5 shrink-0 text-[var(-` | `24` | `24` | `rgb(240, 237, 232)` | `true` | `(none)` | NearSitedSign in |
| 2 | `svg` | `h-4 w-4 shrink-0` | `16px` | `16px` | `rgb(184, 176, 168)` | `true` | `(none)` | Continue with Google |
| 3 | `svg` | `lucide lucide-eye h-4 w-4` | `24` | `24` | `rgb(138, 130, 120)` | `true` | `(none)` | (none) |

### signup

| # | Tag | Classes | Width | Height | Color | aria-hidden | Role | Adjacent Text |
|---|-----|---------|-------|--------|-------|-------------|------|---------------|
| 1 | `svg` | `lucide lucide-chevron-right h-3.5 w-3.5 shrink-0 text-[var(-` | `24` | `24` | `rgb(240, 237, 232)` | `true` | `(none)` | NearSitedCreate account |
| 2 | `svg` | `h-4 w-4 shrink-0` | `16px` | `16px` | `rgb(184, 176, 168)` | `true` | `(none)` | Continue with Google |
| 3 | `svg` | `lucide lucide-eye h-4 w-4` | `24` | `24` | `rgb(138, 130, 120)` | `true` | `(none)` | (none) |
| 4 | `svg` | `lucide lucide-eye h-4 w-4` | `24` | `24` | `rgb(138, 130, 120)` | `true` | `(none)` | (none) |

### pricing

| # | Tag | Classes | Width | Height | Color | aria-hidden | Role | Adjacent Text |
|---|-----|---------|-------|--------|-------|-------------|------|---------------|
| 1 | `svg` | `lucide lucide-check mt-0.5 h-4 w-4 shrink-0 text-[var(--colo` | `24` | `24` | `rgb(138, 151, 119)` | `true` | `(none)` | 50 opportunity analyses per month |
| 2 | `svg` | `lucide lucide-check mt-0.5 h-4 w-4 shrink-0 text-[var(--colo` | `24` | `24` | `rgb(138, 151, 119)` | `true` | `(none)` | 3 city searches per month |
| 3 | `svg` | `lucide lucide-check mt-0.5 h-4 w-4 shrink-0 text-[var(--colo` | `24` | `24` | `rgb(138, 151, 119)` | `true` | `(none)` | Email pitch generation |
| 4 | `svg` | `lucide lucide-check mt-0.5 h-4 w-4 shrink-0 text-[var(--colo` | `24` | `24` | `rgb(138, 151, 119)` | `true` | `(none)` | Pipeline tracking |
| 5 | `svg` | `lucide lucide-check mt-0.5 h-4 w-4 shrink-0 text-[var(--colo` | `24` | `24` | `rgb(138, 151, 119)` | `true` | `(none)` | 200 opportunity analyses per month |
| 6 | `svg` | `lucide lucide-check mt-0.5 h-4 w-4 shrink-0 text-[var(--colo` | `24` | `24` | `rgb(138, 151, 119)` | `true` | `(none)` | 10 city searches per month |
| 7 | `svg` | `lucide lucide-check mt-0.5 h-4 w-4 shrink-0 text-[var(--colo` | `24` | `24` | `rgb(138, 151, 119)` | `true` | `(none)` | Email + WhatsApp pitch generation |
| 8 | `svg` | `lucide lucide-check mt-0.5 h-4 w-4 shrink-0 text-[var(--colo` | `24` | `24` | `rgb(138, 151, 119)` | `true` | `(none)` | White-label shareable reports |
| 9 | `svg` | `lucide lucide-check mt-0.5 h-4 w-4 shrink-0 text-[var(--colo` | `24` | `24` | `rgb(138, 151, 119)` | `true` | `(none)` | Priority support |
| 10 | `svg` | `lucide lucide-check h-3.5 w-3.5 shrink-0 text-[var(--color-a` | `24` | `24` | `rgb(138, 151, 119)` | `true` | `(none)` | All 4 opportunity types: no website, social, platf |
| 11 | `svg` | `lucide lucide-check h-3.5 w-3.5 shrink-0 text-[var(--color-a` | `24` | `24` | `rgb(138, 151, 119)` | `true` | `(none)` | Unlimited AI pitch generation |
| 12 | `svg` | `lucide lucide-check h-3.5 w-3.5 shrink-0 text-[var(--color-a` | `24` | `24` | `rgb(138, 151, 119)` | `true` | `(none)` | Unlimited pipeline management |
| 13 | `svg` | `lucide lucide-check h-3.5 w-3.5 shrink-0 text-[var(--color-a` | `24` | `24` | `rgb(138, 151, 119)` | `true` | `(none)` | PDF audit exports |
| 14 | `svg` | `lucide lucide-search h-4 w-4` | `24` | `24` | `rgb(255, 255, 255)` | `true` | `(none)` | (none) |

---

## Recommendations

1. **Add `aria-hidden="true"` to 4 decorative icons that lack it.
2. **Reduce icon dimension variants from 4 to 3-4 standard sizes.
3. **Functional icons** that serve as interactive elements (buttons, links) must have `aria-label` or `sr-only` text.
4. **Decorative icons** should always be wrapped with `aria-hidden="true"`.
5. **Consistent color** — use `currentColor` on SVG fills to inherit from parent text color, rather than hardcoded stroke/fill values.
6. **Icon documentation** — create an icon usage guide in the design system docs specifying which icon set and sizes to use for each context.

---

*Raw data saved to `icon-inventory.json` and per-page `icons-{page}.json`*
