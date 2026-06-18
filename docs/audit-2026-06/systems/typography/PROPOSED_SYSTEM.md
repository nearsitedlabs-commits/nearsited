# Typography — Proposed System
**Date:** 2026-06-18 · **Prompt 13 — Typography Audit**
**Method:** Playwright computed-style capture across landing, login, pricing, privacy pages
**Total text elements captured:** 578

---

## Executive Summary

The typography system currently uses **21 distinct font sizes** (⚠️ 21 font sizes — above the 8-10 target) and **4 distinct font weights** (⚠️ 4 font weights — above the 3-target).
Heading order is **inconsistent** (1 issues found).
Body text uses **10 different font sizes**.
Letter-spacing: 17 distinct values found — 9 may need review.

---

## Font Family Usage

- `Geist, "Geist Fallback"`

---

## Font Size Scale

**21 distinct sizes found.**

Scale:   9px,   9.6px,   10px,   10.4px,   11px,   11.2px,   12px,   13px,   14px,   15px,   16px,   18px,   20px,   22px,   28px,   30px,   38.4px,   40px,   44.8px,   51.2px,   110.4px

### Distribution by frequency

| Size | Frequency | % |
|------|-----------|---|
| `14px` | 335 | 58.0% |
| `16px` | 102 | 17.6% |
| `12px` | 41 | 7.1% |
| `11.2px` | 14 | 2.4% |
| `11px` | 14 | 2.4% |
| `15px` | 12 | 2.1% |
| `20px` | 10 | 1.7% |
| `44.8px` | 8 | 1.4% |
| `13px` | 8 | 1.4% |
| `30px` | 7 | 1.2% |
| `10px` | 6 | 1.0% |
| `40px` | 4 | 0.7% |
| `38.4px` | 4 | 0.7% |
| `9px` | 3 | 0.5% |
| `110.4px` | 2 | 0.3% |
| `9.6px` | 2 | 0.3% |
| `28px` | 2 | 0.3% |
| `22px` | 1 | 0.2% |
| `18px` | 1 | 0.2% |
| `10.4px` | 1 | 0.2% |

### Recommended Scale (8-10 steps)

| Step | Token | Size | Use |
|------|-------|------|-----|
| -2 | `--text-xs` | 10px/0.625rem | Microcopy, metadata, timestamps |
| -1 | `--text-sm` | 12px/0.75rem | Labels, captions, secondary body |
| 0  | `--text-base` | 14px/0.875rem | Body text (mobile) |
| 1  | `--text-body` | 16px/1rem | Body text (desktop) |
| 2  | `--text-lg` | 18px/1.125rem | Large body, section subheadings |
| 3  | `--text-xl` | 20px/1.25rem | Small headings |
| 4  | `--text-2xl` | 24px/1.5rem | Section headings |
| 5  | `--text-display` | 40px/2.5rem | Display headings |
| 6  | `--text-hero` | clamp(2rem, 8vw+0.5rem, 8rem) | Hero H1 only |

---

## Font Weight Usage

**4 distinct weights found.** Target: 3 max (400/500/700 or 400/600/700).

| Weight | Count |
|--------|-------|
| `500` | 199 |
| `400` | 353 |
| `700` | 14 |
| `600` | 12 |

### Recommended Weights

| Token | Weight | Use |
|-------|--------|-----|
| `--fw-regular` | 400 | Body text, most UI |
| `--fw-medium` | 500 | Navigation, buttons, labels |
| `--fw-bold` | 700 | Headings, hero |

---

## Heading Order

**Total headings:** 50

### Per-page heading structure

| Page | h1 | h2 | h3 | h4 | h5 | h6 | Order Issues |
|------|----|----|----|----|----|----|-------------|
| landing | 1 | 10 | 14 | 0 | 0 | 0 | ✅ |
| login | 1 | 0 | 0 | 0 | 0 | 0 | ✅ |
| pricing | 0 | 3 | 2 | 0 | 0 | 0 | ⚠️ |
| privacy | 1 | 8 | 10 | 0 | 0 | 0 | ✅ |

### Issues

- ⚠️ pricing: Heading level skipped from h0 to h2 ("Start finding clients this week.")

### Full heading outline

**landing:**

- h1 "Your next clientis out there —without a website" (110.4px, 700)
  - h2 "Four steps to your next website project." (44.8px, 500)
    - h3 "Find opportunities" (15px, 500)
    - h3 "Understand the gap" (15px, 500)
    - h3 "Generate outreach" (15px, 500)
    - h3 "Win more website projects" (15px, 500)
    - h3 "How opportunity scoring works" (14px, 600)
  - h2 "Other tools find bad websites. Nearsited finds every opportu" (44.8px, 500)
    - h3 "Traditional prospecting" (16px, 500)
    - h3 "Nearsited" (16px, 500)
  - h2 "Every opportunity type, one platform." (44.8px, 500)
    - h3 "Bright Smile Dental" (20px, 500)
  - h2 "Every opportunity type gets a tailored pitch." (44.8px, 500)
  - h2 "Built for agencies that prospect locally." (44.8px, 500)
    - h3 "Solo freelancers" (15px, 500)
    - h3 "Small agencies" (15px, 500)
    - h3 "Design studios" (15px, 500)
    - h3 "SEO agencies" (15px, 500)
  - h2 "What’s stopping you?" (44.8px, 500)
  - h2 "Built for agencies that actually close deals." (44.8px, 500)
  - h2 "Questions about closing deals." (44.8px, 500)
  - h2 "Start finding clients this week." (38.4px, 500)
    - h3 "Starter" (20px, 500)
    - h3 "Agency" (20px, 500)
  - h2 "Your next client is out there, without a website." (51.2px, 500)

**login:**

- h1 "Welcome back." (28px, 500)

**pricing:**

  - h2 "Start finding clients this week." (38.4px, 500)
    - h3 "Starter" (20px, 500)
    - h3 "Agency" (20px, 500)
  - h2 "What is a credit?" (38.4px, 500)
  - h2 "See if there are opportunities in your city." (38.4px, 500)

**privacy:**

- h1 "Privacy policy" (28px, 500)
  - h2 "1. What We Collect" (16px, 500)
    - h3 "1.1 Account information" (14px, 500)
    - h3 "1.2 Business discovery data (Google Places)" (14px, 500)
    - h3 "1.3 Website audit data (PageSpeed)" (14px, 500)
    - h3 "1.4 Website screenshots (ScreenshotCore)" (14px, 500)
    - h3 "1.5 Pitch generation inputs (Gemini AI)" (14px, 500)
    - h3 "1.6 Leads, pipeline, and pitches (your data)" (14px, 500)
    - h3 "1.7 Usage analytics" (14px, 500)
  - h2 "2. How We Use Your Data" (16px, 500)
  - h2 "3. Third-Party Services" (16px, 500)
  - h2 "4. Data Retention" (16px, 500)
  - h2 "5. Cookies & Tracking" (16px, 500)
  - h2 "6. Your Rights" (16px, 500)
    - h3 "6.1 EU / EEA / UK users (GDPR)" (14px, 500)
    - h3 "6.2 UAE users (PDPL)" (14px, 500)
    - h3 "6.3 California users (CCPA)" (14px, 500)
  - h2 "7. International Transfers" (16px, 500)
  - h2 "8. Changes to This Policy" (16px, 500)

---

## Body Text Consistency

| Metric | Value |
|--------|-------|
| Body elements (p) | 133 |
| Distinct font sizes | 18px, 10px, 14px, 12px, 16px, 10.4px, 11px, 20px, 30px, 11.2px |
| Distinct line heights | 32px, 15px, 20px, 16px, 28px, 12px, 10px, 24px, 15.6px, 16.5px, 36px, 16.8px, 22.75px, 23.8px |

### Assessment

⚠️ Body text uses 10 different sizes — consider consolidating.

---

## Button & Link Text Consistency

| Metric | Value |
|--------|-------|
| Button/link elements | 101 |
| Distinct font sizes | 16px, 14px, 12px, 13px |
| Distinct font weights | 500, 400 |

---

## Letter-Spacing Analysis

17 distinct non-normal letter-spacing values found.

| Value | Frequency | Assessment |
|-------|-----------|------------|
| `2.016px` | 13 | ⚠️ Unusual value — verify intent |
| `-0.896px` | 8 | ⚠️ Unusual value — verify intent |
| `-0.75px` | 7 | ⚠️ Unusual value — verify intent |
| `1.32px` | 5 | ✅ Likely intentional |
| `-1.6px` | 4 | ⚠️ Unusual value — verify intent |
| `-0.768px` | 4 | ⚠️ Unusual value — verify intent |
| `-4.416px` | 2 | ⚠️ Unusual value — verify intent |
| `0.24px` | 2 | ✅ Likely intentional |
| `0.32px` | 2 | ✅ Likely intentional |
| `0.44px` | 1 | ✅ Likely intentional |
| `1.2px` | 1 | ✅ Likely intentional |
| `1.872px` | 1 | ✅ Likely intentional |
| `-1.536px` | 1 | ⚠️ Unusual value — verify intent |
| `1.344px` | 1 | ✅ Likely intentional |
| `-0.84px` | 1 | ⚠️ Unusual value — verify intent |
| `0.8px` | 1 | ✅ Likely intentional |
| `-0.56px` | 1 | ⚠️ Unusual value — verify intent |


---

## Recommendations

1. **Consolidate font sizes** to 8-10 steps (proposed scale above). Currently 21 sizes.
2. **Consolidate font weights** to 3 (400/500/700). Currently 4 weights.
3. **Fix heading order skips:  Heading level skipped from h0 to h2 ("Start finding clients this week.")
4. **Standardize body text to a single font size (14px mobile, 16px desktop).
5. Register font-size tokens in [`globals.css`](src/app/globals.css) under `:root` for all scale steps — currently only hero, display, 2xl, xl, lg are defined.

---

*Raw data saved to `typography-inventory.json` and per-page `typography-{page}.json`*
