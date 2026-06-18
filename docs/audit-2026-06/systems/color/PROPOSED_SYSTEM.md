# Color — Proposed System
**Date:** 2026-06-18 · **Prompt 14 — Color Audit**
**Method:** Playwright evaluation of all elements across landing, login, pricing, privacy pages
**Total distinct colors found:** 27

---

## Executive Summary

**27 distinct colors** across 4 public pages. ⚠️ 27 colors found — above the 20-color target. Note: includes rgba opacity variants.

**Green coherence:** ⚠️ 9 green shades detected — may indicate green incoherence.

**Contrast:** ⚠️ 47 potential contrast issues — review recommended.

---

## Color System Design Tokens

These are the design tokens defined in [`globals.css`](src/app/globals.css). The audit checks how many of these are actually used vs. how many arbitrary colors appear.

### Backgrounds / Surface Hierarchy
| Token | Value | Computed RGB |
|-------|-------|-------------|
| `--bg-base` / `--color-bg-page` | `#0a0e12` | `rgb(10, 14, 18)` |
| `--bg-surface-1` / `--color-bg-surface` | `#12171e` | `rgb(18, 23, 30)` |
| `--bg-surface-2` / `--color-bg-elevated` | `#1a2028` | `rgb(26, 32, 40)` |
| `--bg-surface-3` | `#222b36` | `rgb(34, 43, 54)` |

### Text — Warm Ivory Family
| Token | Value | Computed RGB |
|-------|-------|-------------|
| `--text-primary` / `--color-text-primary` | `#f0ede8` | `rgb(240, 237, 232)` |
| `--text-secondary` / `--color-text-secondary` | `#b8b0a8` | `rgb(184, 176, 168)` |
| `--text-tertiary` / `--color-text-tertiary` | `#8a8278` | `rgb(138, 130, 120)` |
| `--text-muted` | `#3f3a35` | `rgb(63, 58, 53)` |

### Brand / Semantic
| Token | Value | Computed RGB |
|-------|-------|-------------|
| `--accent` / `--color-accent` | `#8A9777` | `rgb(138, 151, 119)` |
| `--color-info` | `#60a5fa` (blue) | `rgb(96, 165, 250)` |
| `--color-warning` | `#c4984a` (amber) | `rgb(196, 152, 74)` |
| `--color-danger` | `#c4665a` (red) | `rgb(196, 102, 90)` |
| `--color-success` | `#4a8f5a` (deep green) | `rgb(74, 143, 90)` |

---

## All Colors Found

| # | Color | Pages | Example Usage |
|---|-------|-------|--------------|
| 1 | `rgb(10, 14, 18)` (→ `--bg-base`) | landing, login, pricing, privacy | <DIV> "NearSitedHow it worksSample reportPricingFAQSign inGet start" o |
| 2 | `rgb(122, 159, 122)` (→ `--score-good`) | landing | <SPAN> "" on landing |
| 3 | `rgb(138, 130, 120)` (→ `--text-tertiary`) | landing, login, pricing, privacy | <LI> "How it works" on landing |
| 4 | `rgb(138, 151, 119)` (→ `--accent`) | landing, login, pricing, privacy | <BUTTON> "Get startedGet started free" on landing |
| 5 | `rgb(154, 196, 154)` | landing | <SPAN> "" on landing |
| 6 | `rgb(176, 192, 160)` | landing | <SPAN> "" on landing |
| 7 | `rgb(18, 23, 30)` (→ `--bg-surface-1`) | landing, login, pricing | <DIV> "Opportunities · DubaiSample85Marina Legal ConsultantsDubai M" o |
| 8 | `rgb(184, 176, 168)` (→ `--text-secondary`) | landing, login, pricing, privacy | <BUTTON> "Sign in" on landing |
| 9 | `rgb(196, 102, 90)` (→ `--color-danger`) | landing | <SPAN> "No Website" on landing |
| 10 | `rgb(196, 152, 74)` (→ `--color-warning`) | landing, pricing | <SPAN> "Social Only" on landing |
| 11 | `rgb(229, 231, 235)` | landing, login, pricing, privacy | <DIV> "NearSitedHow it worksSample reportPricingFAQSign inGet start" o |
| 12 | `rgb(240, 237, 232)` (→ `--text-primary`) | landing, login, pricing, privacy | <DIV> "NearSitedHow it worksSample reportPricingFAQSign inGet start" o |
| 13 | `rgb(255, 255, 255)` | landing, login, pricing | <BUTTON> "Get startedGet started free" on landing |
| 14 | `rgb(26, 32, 40)` (→ `--bg-surface-2`) | landing, login, pricing | <BUTTON> "See how agencies win" on landing |
| 15 | `rgb(74, 143, 90)` (→ `--color-success`) | landing | <SPAN> "Sample" on landing |
| 16 | `rgba(10, 14, 18, 0.7)` (→ `--bg-base`) | landing | <DIV> "" on landing |
| 17 | `rgba(138, 151, 119, 0.1)` (→ `--accent`) | landing | <SPAN> "Start finding website opportunities today" on landing |
| 18 | `rgba(138, 151, 119, 0.18)` (→ `--accent`) | landing | <SPAN> "" on landing |
| 19 | `rgba(138, 151, 119, 0.25)` (→ `--accent`) | landing | <SPAN> "Start finding website opportunities today" on landing |
| 20 | `rgba(138, 151, 119, 0.5)` (→ `--accent`) | landing | <SPAN> "" on landing |
| 21 | `rgba(196, 102, 90, 0.1)` (→ `--color-danger`) | landing | <DIV> "5 critical issues foundSlow mobile load time (LCP: 4.2s)High" o |
| 22 | `rgba(255, 255, 255, 0.04)` | landing | <SPAN> "" on landing |
| 23 | `rgba(255, 255, 255, 0.06)` | landing, login, pricing | <NAV> "NearSitedHow it worksSample reportPricingFAQSign inGet start" o |
| 24 | `rgba(255, 255, 255, 0.06) rgba(255, 255, 255, 0.06) rgba(255, 255, 255, 0.06) rgb(138, 151, 119)` | landing | <BLOCKQUOTE> "“I was spending 3 hours every week just finding business |
| 25 | `rgba(255, 255, 255, 0.08)` | landing | <SPAN> "" on landing |
| 26 | `rgba(255, 255, 255, 0.1)` | landing, login | <DIV> "Opportunities · DubaiSample85Marina Legal ConsultantsDubai M" o |
| 27 | `rgba(255, 255, 255, 0.35)` | landing | <svg> "" on landing |

---

## Green Coherence Analysis

⚠️ **9 green shades** found — potential green incoherence.

The design tokens define these green shades:
- `--accent` / `--color-accent`: `#8A9777` (sage green)
- `--color-success`: `#4a8f5a` (deep green)
- `--score-good`: `#7a9f7a` (score green)
- `--badge-green-text`: `#9ac49a` (badge text)
- `--status-success-text`: `#4ade80` (status success)
- `--pipeline-won`: `#4ade80` (pipeline won)

These are intentional — they serve distinct semantic purposes. However, the audit found additional green variants in rendered elements.

### Green shades in rendered elements:
- `rgb(122, 159, 122)` — seen on: landing
- `rgb(138, 151, 119)` — seen on: landing, login, pricing, privacy
- `rgb(154, 196, 154)` — seen on: landing
- `rgb(176, 192, 160)` — seen on: landing
- `rgb(74, 143, 90)` — seen on: landing
- `rgba(138, 151, 119, 0.1)` — seen on: landing
- `rgba(138, 151, 119, 0.18)` — seen on: landing
- `rgba(138, 151, 119, 0.25)` — seen on: landing
- `rgba(138, 151, 119, 0.5)` — seen on: landing

---

## Contrast Check

⚠️ **47 potential contrast issues:**

| Foreground | Background | Element | Page |
|------------|------------|---------|------|
| `rgb(255, 255, 255)` | `rgb(138, 151, 119)` | <BUTTON> "Get startedGet started free" | landing |
| `rgb(240, 237, 232)` | `rgba(138, 151, 119, 0.18)` | <SPAN> "" | landing |
| `rgb(240, 237, 232)` | `rgba(255, 255, 255, 0.04)` | <SPAN> "" | landing |
| `rgb(240, 237, 232)` | `rgba(255, 255, 255, 0.04)` | <SPAN> "" | landing |
| `rgb(240, 237, 232)` | `rgba(255, 255, 255, 0.04)` | <SPAN> "" | landing |
| `rgb(240, 237, 232)` | `rgba(255, 255, 255, 0.04)` | <SPAN> "" | landing |
| `rgb(240, 237, 232)` | `rgba(255, 255, 255, 0.04)` | <SPAN> "" | landing |
| `rgb(255, 255, 255)` | `rgb(138, 151, 119)` | <BUTTON> "Find your first opportunity" | landing |
| `rgb(74, 143, 90)` | `rgb(154, 196, 154)` | <SPAN> "" | landing |
| `rgb(255, 255, 255)` | `rgb(138, 151, 119)` | <BUTTON> "Copy pitch →" | landing |
| `rgb(138, 151, 119)` | `rgb(138, 151, 119)` | <SPAN> "" | landing |
| `rgb(240, 237, 232)` | `rgb(196, 102, 90)` | <SPAN> "" | landing |
| `rgb(240, 237, 232)` | `rgb(196, 152, 74)` | <SPAN> "" | landing |
| `rgb(240, 237, 232)` | `rgb(122, 159, 122)` | <SPAN> "" | landing |
| `rgb(255, 255, 255)` | `rgb(138, 151, 119)` | <BUTTON> "Find your first opportunity" | landing |
| `rgb(138, 151, 119)` | `rgb(138, 151, 119)` | <SPAN> "" | landing |
| `rgb(240, 237, 232)` | `rgb(196, 102, 90)` | <SPAN> "" | landing |
| `rgb(240, 237, 232)` | `rgb(196, 152, 74)` | <SPAN> "" | landing |
| `rgb(240, 237, 232)` | `rgb(176, 192, 160)` | <SPAN> "" | landing |
| `rgb(240, 237, 232)` | `rgb(138, 151, 119)` | <SPAN> "" | landing |

---

## Color Categorization

### Brand Colors
- **Accent (sage green):** `#8A9777` (`--accent`) — primary buttons, interactive states, links
- **Accent warm:** `#a09470` (`--accent-warm`) — decorative warmth

### Semantic Colors
- **Info (blue):** `#60a5fa` — in-progress states, informational badges
- **Warning (amber):** `#c4984a` — needs attention, stale data
- **Danger (red):** `#c4665a` — destructive actions, lost/failed, errors
- **Success (green):** `#4a8f5a` — completed, won, positive terminal states

### Text Colors
- **Primary:** `#f0ede8` — headings, important labels
- **Secondary:** `#b8b0a8` — body, supporting text
- **Tertiary:** `#8a8278` — metadata, timestamps
- **Muted:** `#3f3a35` — disabled, barely visible

### Background Colors (Surface Hierarchy)
- **Page:** `#0a0e12` (darkest)
- **Surface-1:** `#12171e` (card level)
- **Surface-2:** `#1a2028` (elevated)
- **Surface-3:** `#222b36` (modal/dropdown)

---

## Recommendations

1. **Reduce distinct colors from 27 to < 20 by consolidating opacity variants and removing unused Tailwind defaults.
2. **Ensure all colors derive from CSS custom properties** — no raw Tailwind color classes (e.g., `red-500`, `amber-500`) for semantic states.
3. **Use `--color-accent` consistently** for all interactive states — currently some buttons use Tailwind default border colors (`rgb(229, 231, 235)`).
4. **Review contrast issues flagged above.
5. Add a `--color-border-default` alias if `--color-border-subtle` is used in places that need guaranteed visibility.

---

*Raw data saved to `color-inventory.json` and per-page `colors-{page}.json`*
