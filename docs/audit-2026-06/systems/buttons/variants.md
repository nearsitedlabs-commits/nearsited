# Button System — Variants Analysis
**Date:** 2026-06-18 · **Method:** Playwright capture of all public pages
**Total buttons found:** 75 across 7 pages

---

## Summary

| Variant | Count | Pages | Dominant BG | Dominant Border | Hover BG | Focus |
|---------|-------|-------|-------------|-----------------|----------|-------|
| unknown | 34 | landing, login, signup, pricing, reset-password | `rgba(0, 0, 0, 0)` | `rgb(229, 231, 235)` | `rgba(0, 0, 0, 0)` | `rgb(240, 237, 232)` |
| ghost | 2 | landing, pricing | `rgba(0, 0, 0, 0)` | `rgba(0, 0, 0, 0)` | `rgba(0, 0, 0, 0)` | `rgb(184, 176, 168)` |
| primary | 21 | landing, login, signup, pricing, reset-password | `rgb(138, 151, 119)` | `rgb(229, 231, 235)` | `rgb(138, 151, 119)` | `rgb(255, 255, 255)` |
| secondary | 12 | landing, pricing | `rgb(26, 32, 40)` | `rgba(255, 255, 255, 0.06)` | `rgb(26, 32, 40)` | `rgb(184, 176, 168)` |
| icon-only | 4 | login, signup, reset-password | `rgba(0, 0, 0, 0)` | `rgb(229, 231, 235)` | `rgba(0, 0, 0, 0)` | `rgb(138, 151, 119)` |
| tertiary/link | 2 | login, reset-password | `rgba(0, 0, 0, 0)` | `rgb(229, 231, 235)` | `rgba(0, 0, 0, 0)` | `rgb(138, 151, 119)` |

## Inconsistencies Found

- ⚠️ **unknown**: 3 different bg colors (rgba(0, 0, 0, 0), rgb(18, 23, 30), rgb(26, 32, 40))
- ⚠️ **unknown**: 3 different border colors
- ⚠️ **unknown**: 3 different border-radius values (0px, 6px, 9999px)
- ⚠️ **unknown**: 2 different font-sizes (16px, 14px)
- ⚠️ **primary**: 2 different bg colors (rgb(138, 151, 119), rgba(0, 0, 0, 0))
- ⚠️ **primary**: 2 different border colors
- ⚠️ **primary**: 2 different border-radius values (6px, 10px)
- ⚠️ **primary**: 3 different font-sizes (16px, 12px, 14px)
- ⚠️ **secondary**: 2 different border-radius values (6px, 10px)
- ⚠️ **secondary**: 2 different font-sizes (16px, 14px)

## Per-Page Breakdown

### landing (/)

**Total buttons:** 52

| # | Tag | Text | Type | Role | Semantic Role | Action | BG Color | Border | Radius |
|---|-----|------|------|------|---------------|--------|----------|--------|--------|
| 1 | `a` | NearSited | `` | - | unknown |  | `rgba(0, 0, 0, 0)` | `rgb(229, 231, 235)` | `0px` |
| 2 | `button` | Sign in | `` | - | ghost |  | `rgba(0, 0, 0, 0)` | `rgba(0, 0, 0, 0)` | `6px` |
| 3 | `button` | Get startedGet started free | `` | - | primary |  | `rgb(138, 151, 119)` | `rgb(229, 231, 235)` | `6px` |
| 4 | `button` | (icon) | `` | - | unknown |  | `rgba(0, 0, 0, 0)` | `rgb(229, 231, 235)` | `0px` |
| 5 | `button` | (icon) | `` | - | unknown |  | `rgba(0, 0, 0, 0)` | `rgb(229, 231, 235)` | `0px` |
| 6 | `button` | (icon) | `` | - | unknown |  | `rgba(0, 0, 0, 0)` | `rgb(229, 231, 235)` | `0px` |
| 7 | `button` | (icon) | `` | - | unknown |  | `rgba(0, 0, 0, 0)` | `rgb(229, 231, 235)` | `0px` |
| 8 | `button` | (icon) | `` | - | unknown |  | `rgba(0, 0, 0, 0)` | `rgb(229, 231, 235)` | `0px` |
| 9 | `button` | (icon) | `` | - | unknown |  | `rgba(0, 0, 0, 0)` | `rgb(229, 231, 235)` | `0px` |
| 10 | `button` | Find your first opportunity | `` | - | primary |  | `rgb(138, 151, 119)` | `rgb(229, 231, 235)` | `6px` |
| 11 | `button` | See how agencies win | `` | - | secondary |  | `rgb(26, 32, 40)` | `rgba(255, 255, 255, 0.06)` | `6px` |
| 12 | `button` | 85Marina Legal ConsultantsDubai Marina · LegalNo W | `button` | - | primary |  | `rgba(0, 0, 0, 0)` | `rgb(229, 231, 235)` | `10px` |
| 13 | `button` | 72Blue Wave RestaurantJBR · Food & BeverageSocial  | `button` | - | secondary |  | `rgb(26, 32, 40)` | `rgba(255, 255, 255, 0.06)` | `10px` |
| 14 | `button` | 72Bright Smile DentalJumeirah · HealthcareWeak Web | `button` | - | secondary |  | `rgb(26, 32, 40)` | `rgba(255, 255, 255, 0.06)` | `10px` |
| 15 | `button` | Copy pitch → | `` | - | primary |  | `rgb(138, 151, 119)` | `rgb(229, 231, 235)` | `6px` |
| 16 | `button` | Find your first opportunity | `` | - | primary |  | `rgb(138, 151, 119)` | `rgb(229, 231, 235)` | `6px` |
| 17 | `button` | Weak Website | `` | - | primary |  | `rgba(0, 0, 0, 0)` | `rgb(138, 151, 119)` | `6px` |
| 18 | `button` | No site | `` | - | unknown |  | `rgb(18, 23, 30)` | `rgba(255, 255, 255, 0.06)` | `6px` |
| 19 | `button` | Social Only | `` | - | unknown |  | `rgb(18, 23, 30)` | `rgba(255, 255, 255, 0.06)` | `6px` |
| 20 | `button` | Platform Only | `` | - | unknown |  | `rgb(18, 23, 30)` | `rgba(255, 255, 255, 0.06)` | `6px` |
| 21 | `button` | Try it now → | `` | - | primary |  | `rgb(138, 151, 119)` | `rgb(229, 231, 235)` | `6px` |
| 22 | `button` | Weak Website | `` | - | primary |  | `rgba(0, 0, 0, 0)` | `rgb(138, 151, 119)` | `6px` |
| 23 | `button` | No Website | `` | - | secondary |  | `rgb(26, 32, 40)` | `rgba(255, 255, 255, 0.06)` | `6px` |
| 24 | `button` | Social Only | `` | - | secondary |  | `rgb(26, 32, 40)` | `rgba(255, 255, 255, 0.06)` | `6px` |
| 25 | `button` | Platform Only | `` | - | secondary |  | `rgb(26, 32, 40)` | `rgba(255, 255, 255, 0.06)` | `6px` |
| 26 | `button` | Tone: Professional | `` | - | secondary |  | `rgb(26, 32, 40)` | `rgba(255, 255, 255, 0.06)` | `6px` |
| 27 | `button` | Regenerate | `` | - | secondary |  | `rgb(26, 32, 40)` | `rgba(255, 255, 255, 0.06)` | `6px` |
| 28 | `button` | Copy pitch → | `` | - | primary |  | `rgb(138, 151, 119)` | `rgb(229, 231, 235)` | `6px` |
| 29 | `button` | Start finding clients → | `` | - | primary |  | `rgb(138, 151, 119)` | `rgb(229, 231, 235)` | `6px` |
| 30 | `button` | I already have enough clients. | `` | - | unknown |  | `rgba(0, 0, 0, 0)` | `rgb(229, 231, 235)` | `0px` |
| 31 | `button` | Isn't this just another tool I'll never use? | `` | - | unknown |  | `rgba(0, 0, 0, 0)` | `rgb(229, 231, 235)` | `0px` |
| 32 | `button` | I can find leads myself on Google Maps. | `` | - | unknown |  | `rgba(0, 0, 0, 0)` | `rgb(229, 231, 235)` | `0px` |
| 33 | `button` | The local businesses I'd pitch don't rank on Googl | `` | - | unknown |  | `rgba(0, 0, 0, 0)` | `rgb(229, 231, 235)` | `0px` |
| 34 | `button` | I don't do cold outreach. | `` | - | unknown |  | `rgba(0, 0, 0, 0)` | `rgb(229, 231, 235)` | `0px` |
| 35 | `button` | I already use Apollo or Hunter for prospecting. | `` | - | unknown |  | `rgba(0, 0, 0, 0)` | `rgb(229, 231, 235)` | `0px` |
| 36 | `button` | Try Nearsited free → | `` | - | primary |  | `rgb(138, 151, 119)` | `rgb(229, 231, 235)` | `6px` |
| 37 | `button` | Start free → | `` | - | primary |  | `rgb(138, 151, 119)` | `rgb(229, 231, 235)` | `6px` |
| 38 | `button` | How does Nearsited help me win more website projec | `` | - | unknown |  | `rgba(0, 0, 0, 0)` | `rgb(229, 231, 235)` | `0px` |
| 39 | `button` | What kind of businesses does Nearsited find? | `` | - | unknown |  | `rgba(0, 0, 0, 0)` | `rgb(229, 231, 235)` | `0px` |
| 40 | `button` | How accurate is the opportunity score? | `` | - | unknown |  | `rgba(0, 0, 0, 0)` | `rgb(229, 231, 235)` | `0px` |
| 41 | `button` | Do I need technical skills to use it? | `` | - | unknown |  | `rgba(0, 0, 0, 0)` | `rgb(229, 231, 235)` | `0px` |
| 42 | `button` | What if there are no good opportunities in my city | `` | - | unknown |  | `rgba(0, 0, 0, 0)` | `rgb(229, 231, 235)` | `0px` |
| 43 | `button` | How is this different from cold email tools? | `` | - | unknown |  | `rgba(0, 0, 0, 0)` | `rgb(229, 231, 235)` | `0px` |
| 44 | `button` | How current is the business data? Are these busine | `` | - | unknown |  | `rgba(0, 0, 0, 0)` | `rgb(229, 231, 235)` | `0px` |
| 45 | `button` | Which cities and countries does Nearsited cover? | `` | - | unknown |  | `rgba(0, 0, 0, 0)` | `rgb(229, 231, 235)` | `0px` |
| 46 | `button` | Monthly | `` | - | unknown |  | `rgba(0, 0, 0, 0)` | `rgb(229, 231, 235)` | `9999px` |
| 47 | `button` | AnnualSAVE 20% | `` | - | unknown |  | `rgba(0, 0, 0, 0)` | `rgb(229, 231, 235)` | `9999px` |
| 48 | `button` | Get started → | `` | - | secondary |  | `rgb(26, 32, 40)` | `rgba(255, 255, 255, 0.06)` | `6px` |
| 49 | `button` | Get started → | `` | - | primary |  | `rgb(138, 151, 119)` | `rgb(229, 231, 235)` | `6px` |
| 50 | `button` | Find your first opportunity | `` | - | primary |  | `rgb(138, 151, 119)` | `rgb(229, 231, 235)` | `6px` |
| 51 | `button` | Sign in | `` | - | secondary |  | `rgb(26, 32, 40)` | `rgba(255, 255, 255, 0.06)` | `6px` |
| 52 | `button` | Subscribe | `submit` | - | primary |  | `rgb(138, 151, 119)` | `rgb(229, 231, 235)` | `6px` |

### login (/login)

**Total buttons:** 4

| # | Tag | Text | Type | Role | Semantic Role | Action | BG Color | Border | Radius |
|---|-----|------|------|------|---------------|--------|----------|--------|--------|
| 1 | `button` | Continue with Google | `button` | - | unknown |  | `rgb(26, 32, 40)` | `rgba(255, 255, 255, 0.1)` | `6px` |
| 2 | `button` | (icon) | `button` | - | icon-only |  | `rgba(0, 0, 0, 0)` | `rgb(229, 231, 235)` | `0px` |
| 3 | `button` | Forgot password? | `button` | - | tertiary/link |  | `rgba(0, 0, 0, 0)` | `rgb(229, 231, 235)` | `0px` |
| 4 | `button` | Sign in | `submit` | - | primary |  | `rgb(138, 151, 119)` | `rgb(229, 231, 235)` | `6px` |

### signup (/signup)

**Total buttons:** 4

| # | Tag | Text | Type | Role | Semantic Role | Action | BG Color | Border | Radius |
|---|-----|------|------|------|---------------|--------|----------|--------|--------|
| 1 | `button` | Continue with Google | `button` | - | unknown |  | `rgb(26, 32, 40)` | `rgba(255, 255, 255, 0.1)` | `6px` |
| 2 | `button` | (icon) | `button` | - | icon-only |  | `rgba(0, 0, 0, 0)` | `rgb(229, 231, 235)` | `0px` |
| 3 | `button` | (icon) | `button` | - | icon-only |  | `rgba(0, 0, 0, 0)` | `rgb(229, 231, 235)` | `0px` |
| 4 | `button` | Sign up | `submit` | - | primary |  | `rgb(138, 151, 119)` | `rgb(229, 231, 235)` | `6px` |

### pricing (/pricing)

**Total buttons:** 11

| # | Tag | Text | Type | Role | Semantic Role | Action | BG Color | Border | Radius |
|---|-----|------|------|------|---------------|--------|----------|--------|--------|
| 1 | `button` | NearSited | `` | - | unknown |  | `rgba(0, 0, 0, 0)` | `rgb(229, 231, 235)` | `0px` |
| 2 | `button` | Sign in | `` | - | ghost |  | `rgba(0, 0, 0, 0)` | `rgba(0, 0, 0, 0)` | `6px` |
| 3 | `button` | Start free trial | `` | - | primary |  | `rgb(138, 151, 119)` | `rgb(229, 231, 235)` | `6px` |
| 4 | `button` | Monthly | `` | - | unknown |  | `rgba(0, 0, 0, 0)` | `rgb(229, 231, 235)` | `9999px` |
| 5 | `button` | AnnualSAVE 20% | `` | - | unknown |  | `rgba(0, 0, 0, 0)` | `rgb(229, 231, 235)` | `9999px` |
| 6 | `button` | Get started → | `` | - | secondary |  | `rgb(26, 32, 40)` | `rgba(255, 255, 255, 0.06)` | `6px` |
| 7 | `button` | Get started → | `` | - | primary |  | `rgb(138, 151, 119)` | `rgb(229, 231, 235)` | `6px` |
| 8 | `button` | Try it free for 14 days | `` | - | primary |  | `rgb(138, 151, 119)` | `rgb(229, 231, 235)` | `6px` |
| 9 | `button` | Sign in | `` | - | secondary |  | `rgb(26, 32, 40)` | `rgba(255, 255, 255, 0.06)` | `6px` |
| 10 | `button` | Home | `` | - | unknown |  | `rgba(0, 0, 0, 0)` | `rgb(229, 231, 235)` | `0px` |
| 11 | `button` | Pricing | `` | - | unknown |  | `rgba(0, 0, 0, 0)` | `rgb(229, 231, 235)` | `0px` |

### privacy (/privacy)

**Total buttons:** 0

| # | Tag | Text | Type | Role | Semantic Role | Action | BG Color | Border | Radius |
|---|-----|------|------|------|---------------|--------|----------|--------|--------|

### terms (/terms)

**Total buttons:** 0

| # | Tag | Text | Type | Role | Semantic Role | Action | BG Color | Border | Radius |
|---|-----|------|------|------|---------------|--------|----------|--------|--------|

### reset-password (/reset-password)

**Total buttons:** 4

| # | Tag | Text | Type | Role | Semantic Role | Action | BG Color | Border | Radius |
|---|-----|------|------|------|---------------|--------|----------|--------|--------|
| 1 | `button` | Continue with Google | `button` | - | unknown |  | `rgb(26, 32, 40)` | `rgba(255, 255, 255, 0.1)` | `6px` |
| 2 | `button` | (icon) | `button` | - | icon-only |  | `rgba(0, 0, 0, 0)` | `rgb(229, 231, 235)` | `0px` |
| 3 | `button` | Forgot password? | `button` | - | tertiary/link |  | `rgba(0, 0, 0, 0)` | `rgb(229, 231, 235)` | `0px` |
| 4 | `button` | Sign in | `submit` | - | primary |  | `rgb(138, 151, 119)` | `rgb(229, 231, 235)` | `6px` |

