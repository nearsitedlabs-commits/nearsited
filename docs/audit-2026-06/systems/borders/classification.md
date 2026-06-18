# Border Classification
**Date:** 2026-06-18 · **Method:** Playwright capture of all public pages
**Total bordered elements:** 137 across 7 pages

---

## Summary Counts

| Classification | Count | Percentage |
|---------------|-------|------------|
| **Functional** | 38 | 28% |
| **Ambiguous** | 15 | 11% |
| **Decorative** | 82 | 60% |
| **Ghost** | 2 | 1% |
| **Total** | 137 | 100% |

## Border Token Coverage

| Color | Count |
|-------|-------|
| `rgba(255, 255, 255, 0.06)` | 96 |
| `rgb(229, 231, 235)` | 12 |
| `rgba(255, 255, 255, 0.1)` | 7 |
| `rgba(255, 255, 255, 0.08)` | 5 |
| `rgb(138, 151, 119)` | 5 |
| `rgb(240, 237, 232)` | 4 |
| `rgba(0, 0, 0, 0)` | 2 |
| `rgb(196, 152, 74)` | 2 |
| `rgba(138, 151, 119, 0.5)` | 1 |
| `rgb(196, 102, 90)` | 1 |
| `rgba(255, 255, 255, 0.06) rgba(255, 255, 255, 0.06) rgba(255` | 1 |
| `rgba(138, 151, 119, 0.25)` | 1 |

## Per-Page Breakdown

### landing (/)

**Total:** 99 · **Functional:** 24 · **Decorative:** 61 · **Ambiguous:** 13 · **Ghost:** 1

| # | Tag | Classification | Reason | Border Width | Border Color | Radius | BG |
|---|-----|----------------|--------|-------------|--------------|--------|----|
| 1 | `BUTTON` | ghost | Ghost button — transparent border (no visible affordance) | `1px` | `rgba(0, 0, 0, 0)` | `6px` | `rgba(0, 0, 0, 0)` |
| 2 | `DIV` | decorative | Perimeter border on element with background (bg provides definition) | `1px` | `rgba(255, 255, 255, 0.06)` | `10px` | `rgba(10, 14, 18, 0.7)` |
| 3 | `SPAN` | functional | Pill/badge/chip border | `1px` | `rgba(138, 151, 119, 0.5)` | `9999px` | `rgba(138, 151, 119, 0.18)` |
| 4 | `SPAN` | functional | Pill/badge/chip border | `1px` | `rgba(255, 255, 255, 0.08)` | `9999px` | `rgba(255, 255, 255, 0.04)` |
| 5 | `SPAN` | functional | Pill/badge/chip border | `1px` | `rgba(255, 255, 255, 0.08)` | `9999px` | `rgba(255, 255, 255, 0.04)` |
| 6 | `SPAN` | functional | Pill/badge/chip border | `1px` | `rgba(255, 255, 255, 0.08)` | `9999px` | `rgba(255, 255, 255, 0.04)` |
| 7 | `SPAN` | functional | Pill/badge/chip border | `1px` | `rgba(255, 255, 255, 0.08)` | `9999px` | `rgba(255, 255, 255, 0.04)` |
| 8 | `SPAN` | functional | Pill/badge/chip border | `1px` | `rgba(255, 255, 255, 0.08)` | `9999px` | `rgba(255, 255, 255, 0.04)` |
| 9 | `BUTTON` | ambiguous | Secondary button — border is affordance but too subtle (6% white) | `1px` | `rgba(255, 255, 255, 0.06)` | `6px` | `rgb(26, 32, 40)` |
| 10 | `DIV` | decorative | Perimeter border on element with background (bg provides definition) | `1px` | `rgba(255, 255, 255, 0.1)` | `10px` | `rgb(18, 23, 30)` |
| 11 | `SPAN` | functional | Button interactive affordance | `1px` | `rgb(229, 231, 235)` | `6px` | `rgba(0, 0, 0, 0)` |
| 12 | `BUTTON` | functional | Button interactive affordance | `1px` | `rgb(229, 231, 235)` | `10px` | `rgba(0, 0, 0, 0)` |
| 13 | `SPAN` | functional | Button interactive affordance | `1px` | `rgb(196, 102, 90)` | `6px` | `rgba(0, 0, 0, 0)` |
| 14 | `BUTTON` | ambiguous | Secondary button — border is affordance but too subtle (6% white) | `1px` | `rgba(255, 255, 255, 0.06)` | `10px` | `rgb(26, 32, 40)` |
| 15 | `SPAN` | functional | Button interactive affordance | `1px` | `rgb(196, 152, 74)` | `6px` | `rgba(0, 0, 0, 0)` |
| 16 | `BUTTON` | ambiguous | Secondary button — border is affordance but too subtle (6% white) | `1px` | `rgba(255, 255, 255, 0.06)` | `10px` | `rgb(26, 32, 40)` |
| 17 | `SPAN` | functional | Button interactive affordance | `1px` | `rgb(196, 152, 74)` | `6px` | `rgba(0, 0, 0, 0)` |
| 18 | `DIV` | decorative | Perimeter border on element with background (bg provides definition) | `1px` | `rgba(255, 255, 255, 0.06)` | `10px` | `rgb(26, 32, 40)` |
| 19 | `DIV` | decorative | Unclassified border | `1px 0px 0px` | `rgba(255, 255, 255, 0.06)` | `0px` | `rgba(0, 0, 0, 0)` |
| 20 | `DIV` | decorative | Perimeter border on element with background (bg provides definition) | `1px 0px` | `rgba(255, 255, 255, 0.06)` | `0px` | `rgb(18, 23, 30)` |
| 21 | `SECTION` | decorative | Unclassified border | `1px 0px 0px` | `rgba(255, 255, 255, 0.06)` | `0px` | `rgba(0, 0, 0, 0)` |
| 22 | `DIV` | decorative | Unclassified border | `1px 0px 0px` | `rgba(255, 255, 255, 0.06)` | `0px` | `rgba(0, 0, 0, 0)` |
| 23 | `DIV` | decorative | Unclassified border | `1px 0px 0px` | `rgba(255, 255, 255, 0.06)` | `0px` | `rgba(0, 0, 0, 0)` |
| 24 | `DIV` | decorative | Unclassified border | `1px 0px 0px` | `rgba(255, 255, 255, 0.06)` | `0px` | `rgba(0, 0, 0, 0)` |
| 25 | `DIV` | decorative | Perimeter border on element with background (bg provides definition) | `1px` | `rgba(255, 255, 255, 0.06)` | `10px` | `rgb(26, 32, 40)` |
| 26 | `DIV` | decorative | Perimeter border on element with background (bg provides definition) | `1px` | `rgba(255, 255, 255, 0.06)` | `6px` | `rgb(18, 23, 30)` |
| 27 | `DIV` | decorative | Perimeter border on element with background (bg provides definition) | `1px` | `rgba(255, 255, 255, 0.06)` | `6px` | `rgb(18, 23, 30)` |
| 28 | `DIV` | decorative | Perimeter border on element with background (bg provides definition) | `1px` | `rgba(255, 255, 255, 0.06)` | `6px` | `rgb(18, 23, 30)` |
| 29 | `SECTION` | decorative | Perimeter border on element with background (bg provides definition) | `1px 0px 0px` | `rgba(255, 255, 255, 0.06)` | `0px` | `rgb(18, 23, 30)` |
| 30 | `DIV` | decorative | Unclassified border | `1px` | `rgba(255, 255, 255, 0.06)` | `10px` | `rgba(0, 0, 0, 0)` |
| 31 | `DIV` | decorative | Perimeter border on element with background (bg provides definition) | `1px` | `rgba(255, 255, 255, 0.06)` | `10px` | `rgb(26, 32, 40)` |
| 32 | `DIV` | decorative | Unclassified border | `1px` | `rgb(240, 237, 232)` | `6px` | `rgba(0, 0, 0, 0)` |
| 33 | `DIV` | decorative | Unclassified border | `1px` | `rgb(240, 237, 232)` | `6px` | `rgba(0, 0, 0, 0)` |
| 34 | `DIV` | decorative | Unclassified border | `1px` | `rgb(240, 237, 232)` | `6px` | `rgba(0, 0, 0, 0)` |
| 35 | `DIV` | decorative | Unclassified border | `1px` | `rgb(240, 237, 232)` | `6px` | `rgba(0, 0, 0, 0)` |
| 36 | `SECTION` | decorative | Unclassified border | `1px 0px 0px` | `rgba(255, 255, 255, 0.06)` | `0px` | `rgba(0, 0, 0, 0)` |
| 37 | `BUTTON` | functional | Button interactive affordance | `1px` | `rgb(138, 151, 119)` | `6px` | `rgba(0, 0, 0, 0)` |
| 38 | `BUTTON` | ambiguous | Secondary button — border is affordance but too subtle (6% white) | `1px` | `rgba(255, 255, 255, 0.06)` | `6px` | `rgb(18, 23, 30)` |
| 39 | `BUTTON` | ambiguous | Secondary button — border is affordance but too subtle (6% white) | `1px` | `rgba(255, 255, 255, 0.06)` | `6px` | `rgb(18, 23, 30)` |
| 40 | `BUTTON` | ambiguous | Secondary button — border is affordance but too subtle (6% white) | `1px` | `rgba(255, 255, 255, 0.06)` | `6px` | `rgb(18, 23, 30)` |
| ... | (59 more) | ... | ... | ... | ... | ... | ... |

### login (/login)

**Total:** 5 · **Functional:** 3 · **Decorative:** 2 · **Ambiguous:** 0 · **Ghost:** 0

| # | Tag | Classification | Reason | Border Width | Border Color | Radius | BG |
|---|-----|----------------|--------|-------------|--------------|--------|----|
| 1 | `DIV` | decorative | Perimeter border on element with background (bg provides definition) | `1px` | `rgba(255, 255, 255, 0.06)` | `10px` | `rgb(18, 23, 30)` |
| 2 | `BUTTON` | functional | Button interactive affordance | `1px` | `rgba(255, 255, 255, 0.1)` | `6px` | `rgb(26, 32, 40)` |
| 3 | `SPAN` | decorative | Unclassified border | `1px 0px 0px` | `rgba(255, 255, 255, 0.06)` | `0px` | `rgba(0, 0, 0, 0)` |
| 4 | `INPUT` | functional | Form input affordance | `1px` | `rgb(138, 151, 119)` | `6px` | `rgb(26, 32, 40)` |
| 5 | `INPUT` | functional | Form input affordance | `1px` | `rgba(255, 255, 255, 0.06)` | `6px` | `rgb(26, 32, 40)` |

### signup (/signup)

**Total:** 7 · **Functional:** 5 · **Decorative:** 2 · **Ambiguous:** 0 · **Ghost:** 0

| # | Tag | Classification | Reason | Border Width | Border Color | Radius | BG |
|---|-----|----------------|--------|-------------|--------------|--------|----|
| 1 | `DIV` | decorative | Perimeter border on element with background (bg provides definition) | `1px` | `rgba(255, 255, 255, 0.06)` | `10px` | `rgb(18, 23, 30)` |
| 2 | `BUTTON` | functional | Button interactive affordance | `1px` | `rgba(255, 255, 255, 0.1)` | `6px` | `rgb(26, 32, 40)` |
| 3 | `SPAN` | decorative | Unclassified border | `1px 0px 0px` | `rgba(255, 255, 255, 0.06)` | `0px` | `rgba(0, 0, 0, 0)` |
| 4 | `INPUT` | functional | Form input affordance | `1px` | `rgb(138, 151, 119)` | `6px` | `rgb(26, 32, 40)` |
| 5 | `INPUT` | functional | Form input affordance | `1px` | `rgba(255, 255, 255, 0.06)` | `6px` | `rgb(26, 32, 40)` |
| 6 | `INPUT` | functional | Form input affordance | `1px` | `rgba(255, 255, 255, 0.06)` | `6px` | `rgb(26, 32, 40)` |
| 7 | `INPUT` | functional | Form input affordance | `1px` | `rgba(255, 255, 255, 0.06)` | `6px` | `rgb(26, 32, 40)` |

### pricing (/pricing)

**Total:** 16 · **Functional:** 3 · **Decorative:** 10 · **Ambiguous:** 2 · **Ghost:** 1

| # | Tag | Classification | Reason | Border Width | Border Color | Radius | BG |
|---|-----|----------------|--------|-------------|--------------|--------|----|
| 1 | `BUTTON` | ghost | Ghost button — transparent border (no visible affordance) | `1px` | `rgba(0, 0, 0, 0)` | `6px` | `rgba(0, 0, 0, 0)` |
| 2 | `DIV` | functional | Pill/badge/chip border | `1px` | `rgba(255, 255, 255, 0.06)` | `9999px` | `rgb(26, 32, 40)` |
| 3 | `DIV` | decorative | Perimeter border on element with background (bg provides definition) | `1px` | `rgba(255, 255, 255, 0.06)` | `10px` | `rgb(18, 23, 30)` |
| 4 | `BUTTON` | ambiguous | Secondary button — border is affordance but too subtle (6% white) | `1px` | `rgba(255, 255, 255, 0.06)` | `6px` | `rgb(26, 32, 40)` |
| 5 | `DIV` | functional | Button interactive affordance | `1px` | `rgb(229, 231, 235)` | `10px` | `rgb(18, 23, 30)` |
| 6 | `SPAN` | functional | Button interactive affordance | `1px` | `rgb(229, 231, 235)` | `6px` | `rgba(0, 0, 0, 0)` |
| 7 | `DIV` | decorative | Perimeter border on element with background (bg provides definition) | `1px` | `rgba(255, 255, 255, 0.06)` | `10px` | `rgb(26, 32, 40)` |
| 8 | `SECTION` | decorative | Unclassified border | `1px 0px 0px` | `rgba(255, 255, 255, 0.06)` | `0px` | `rgba(0, 0, 0, 0)` |
| 9 | `DIV` | decorative | Perimeter border on element with background (bg provides definition) | `1px` | `rgba(255, 255, 255, 0.06)` | `10px` | `rgb(18, 23, 30)` |
| 10 | `DIV` | decorative | Perimeter border on element with background (bg provides definition) | `1px` | `rgba(255, 255, 255, 0.06)` | `10px` | `rgb(18, 23, 30)` |
| 11 | `DIV` | decorative | Perimeter border on element with background (bg provides definition) | `1px` | `rgba(255, 255, 255, 0.06)` | `10px` | `rgb(18, 23, 30)` |
| 12 | `SECTION` | decorative | Perimeter border on element with background (bg provides definition) | `1px 0px 0px` | `rgba(255, 255, 255, 0.06)` | `0px` | `rgb(18, 23, 30)` |
| 13 | `DIV` | decorative | Perimeter border on element with background (bg provides definition) | `1px` | `rgba(255, 255, 255, 0.06)` | `10px` | `rgb(26, 32, 40)` |
| 14 | `SECTION` | decorative | Unclassified border | `1px 0px 0px` | `rgba(255, 255, 255, 0.06)` | `0px` | `rgba(0, 0, 0, 0)` |
| 15 | `BUTTON` | ambiguous | Secondary button — border is affordance but too subtle (6% white) | `1px` | `rgba(255, 255, 255, 0.06)` | `6px` | `rgb(26, 32, 40)` |
| 16 | `FOOTER` | decorative | Unclassified border | `1px 0px 0px` | `rgba(255, 255, 255, 0.06)` | `0px` | `rgba(0, 0, 0, 0)` |

### privacy (/privacy)

**Total:** 3 · **Functional:** 0 · **Decorative:** 3 · **Ambiguous:** 0 · **Ghost:** 0

| # | Tag | Classification | Reason | Border Width | Border Color | Radius | BG |
|---|-----|----------------|--------|-------------|--------------|--------|----|
| 1 | `TR` | decorative | Unclassified border | `1px 0px 0px` | `rgba(255, 255, 255, 0.06)` | `0px` | `rgba(0, 0, 0, 0)` |
| 2 | `DIV` | decorative | Unclassified border | `1px 0px 0px` | `rgba(255, 255, 255, 0.06)` | `0px` | `rgba(0, 0, 0, 0)` |
| 3 | `DIV` | decorative | Unclassified border | `1px 0px 0px` | `rgba(255, 255, 255, 0.06)` | `0px` | `rgba(0, 0, 0, 0)` |

### terms (/terms)

**Total:** 2 · **Functional:** 0 · **Decorative:** 2 · **Ambiguous:** 0 · **Ghost:** 0

| # | Tag | Classification | Reason | Border Width | Border Color | Radius | BG |
|---|-----|----------------|--------|-------------|--------------|--------|----|
| 1 | `DIV` | decorative | Unclassified border | `1px 0px 0px` | `rgba(255, 255, 255, 0.06)` | `0px` | `rgba(0, 0, 0, 0)` |
| 2 | `DIV` | decorative | Unclassified border | `1px 0px 0px` | `rgba(255, 255, 255, 0.06)` | `0px` | `rgba(0, 0, 0, 0)` |

### reset-password (/reset-password)

**Total:** 5 · **Functional:** 3 · **Decorative:** 2 · **Ambiguous:** 0 · **Ghost:** 0

| # | Tag | Classification | Reason | Border Width | Border Color | Radius | BG |
|---|-----|----------------|--------|-------------|--------------|--------|----|
| 1 | `DIV` | decorative | Perimeter border on element with background (bg provides definition) | `1px` | `rgba(255, 255, 255, 0.06)` | `10px` | `rgb(18, 23, 30)` |
| 2 | `BUTTON` | functional | Button interactive affordance | `1px` | `rgba(255, 255, 255, 0.1)` | `6px` | `rgb(26, 32, 40)` |
| 3 | `SPAN` | decorative | Unclassified border | `1px 0px 0px` | `rgba(255, 255, 255, 0.06)` | `0px` | `rgba(0, 0, 0, 0)` |
| 4 | `INPUT` | functional | Form input affordance | `1px` | `rgb(138, 151, 119)` | `6px` | `rgb(26, 32, 40)` |
| 5 | `INPUT` | functional | Form input affordance | `1px` | `rgba(255, 255, 255, 0.06)` | `6px` | `rgb(26, 32, 40)` |


## Key Findings

1. **Decorative borders:** 82 elements (60%) have borders that are purely decorative — perimeter strokes on surfaced containers that already have tonal background definition.
2. **Functional borders:** 38 elements (28%) have borders serving a purpose (input affordance, semantic status, selection, error states, layout separators).
3. **Ambiguous (secondary button borders):** 15 elements (11%) are secondary buttons where the border IS the main affordance but is too subtle at 6% white opacity.
4. **Ghost button transparent borders:** 2 elements (1%) are ghost buttons with transparent borders that render as invisible.
5. **Token inconsistency:** 12 unique border color values found — some using CSS variables, some using Tailwind raw colors, some using opacity variants.
6. **Radius discipline:** 4 unique border-radius values found (should be only 2: `--radius-sm` 6px and `--radius-md` 10px).
