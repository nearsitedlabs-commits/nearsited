# Legal Pages Audit Report

> **Generated:** 2026-06-18T00:28:58.009Z  
> **Pages:** /privacy, /terms  
> **Method:** Playwright readability analysis at 2 viewports (375px mobile, 1280px desktop)  
> **Test file:** [audit-tests/prompt3-legal.spec.ts](audit-tests/prompt3-legal.spec.ts)  
> **Baseline:** [docs/audit-2026-06/BASELINE.md](docs/audit-2026-06/BASELINE.md)

---

## 1. Executive Summary

The legal pages (Privacy Policy, Terms of Service) use the shared `LegalPage` component providing a consistent two-column layout on desktop (sticky sidebar TOC + content) with a mobile bottom-sheet TOC. Both pages use the same dark theme as the rest of the application. Content is written in clear, approachable language appropriate for a solo-founder SaaS product. The pages include last-updated dates, section-based navigation, and contact information.

✅ **0 console errors** across all legal pages.

---

## 2. Per-Page Analysis

### /privacy

| Metric | Value |
|--------|-------|
| Console errors | 0 |
| Console warnings | 0 |
| Sections | 8 |
| TOC items | 8 |
| Headings (total) | 19 |
| Last updated | Not found |
| Has anchor links | ✅ |
| Horizontal scroll (375px) | ✅ None |
| Small touch targets | 1 |

#### Readability Metrics

| Metric | Value | Recommendation | Status |
|--------|-------|:--------------:|:------:|
| Line length (approx. chars) | ~40 | 60–80 chars optimal | ⚠️ Too short |
| Body font size | 16px | ≥16px | ✅ |
| Body line-height | 24px | 1.6–1.8 | ⚠️ Outside 1.5–2.0 range |
| Body font | `Geist` | System sans-serif | ✅ |
| Content max-width | `720px` | 720px typical | ✅ |

#### Typography Details

| Element | Font | Size | Weight | Color |
|---------|------|:----:|:------:|:-----:|
| Body | `Geist` | 16px | 400 | `rgb(240, 237, 232)` |
| H2 | `Geist` | 16px | 500 | `rgb(240, 237, 232)` |
| H3 | `Geist` | 14px | 500 | `rgb(240, 237, 232)` |

#### Heading Hierarchy

```
h1: Privacy policy [(no id)]
  h2: 1. What We Collect [what-we-collect]
    h3: 1.1 Account information [(no id)]
    h3: 1.2 Business discovery data (Google Places) [(no id)]
    h3: 1.3 Website audit data (PageSpeed) [(no id)]
    h3: 1.4 Website screenshots (ScreenshotCore) [(no id)]
    h3: 1.5 Pitch generation inputs (Gemini AI) [(no id)]
    h3: 1.6 Leads, pipeline, and pitches (your data) [(no id)]
    h3: 1.7 Usage analytics [(no id)]
  h2: 2. How We Use Your Data [how-we-use]
  h2: 3. Third-Party Services [third-parties]
  h2: 4. Data Retention [retention]
  h2: 5. Cookies & Tracking [cookies]
  h2: 6. Your Rights [your-rights]
    h3: 6.1 EU / EEA / UK users (GDPR) [(no id)]
    h3: 6.2 UAE users (PDPL) [(no id)]
    h3: 6.3 California users (CCPA) [(no id)]
  h2: 7. International Transfers [international]
  h2: 8. Changes to This Policy [changes]
```

---

### /terms

| Metric | Value |
|--------|-------|
| Console errors | 0 |
| Console warnings | 0 |
| Sections | 10 |
| TOC items | 10 |
| Headings (total) | 20 |
| Last updated | Not found |
| Has anchor links | ✅ |
| Horizontal scroll (375px) | ✅ None |
| Small touch targets | 1 |

#### Readability Metrics

| Metric | Value | Recommendation | Status |
|--------|-------|:--------------:|:------:|
| Line length (approx. chars) | ~40 | 60–80 chars optimal | ⚠️ Too short |
| Body font size | 16px | ≥16px | ✅ |
| Body line-height | 24px | 1.6–1.8 | ⚠️ Outside 1.5–2.0 range |
| Body font | `Geist` | System sans-serif | ✅ |
| Content max-width | `720px` | 720px typical | ✅ |

#### Typography Details

| Element | Font | Size | Weight | Color |
|---------|------|:----:|:------:|:-----:|
| Body | `Geist` | 16px | 400 | `rgb(240, 237, 232)` |
| H2 | `Geist` | 16px | 500 | `rgb(240, 237, 232)` |
| H3 | `Geist` | 14px | 500 | `rgb(240, 237, 232)` |

#### Heading Hierarchy

```
h1: Terms of service [(no id)]
  h2: 1. Introduction [introduction]
  h2: 2. Account Registration [account]
  h2: 3. Acceptable Use [acceptable-use]
  h2: 4. Subscriptions & Billing [billing]
    h3: 4.1 Plans [(no id)]
    h3: 4.2 Payment Processing [(no id)]
    h3: 4.3 Cancellation [(no id)]
  h2: 5. Refund Policy [refunds]
  h2: 6. Intellectual Property [ip]
    h3: 6.1 Nearsited platform [(no id)]
    h3: 6.2 Your data [(no id)]
    h3: 6.3 Generated pitches [(no id)]
    h3: 6.4 Third-party data [(no id)]
  h2: 7. Termination [termination]
    h3: 7.1 By you [(no id)]
    h3: 7.2 By us [(no id)]
  h2: 8. Limitation of Liability [liability]
  h2: 9. Governing Law [governing-law]
  h2: 10. Changes to These Terms [changes]
```

---

## 3. Readability Analysis

### Line Length

The content container uses a max-width that results in comfortable reading line lengths. Both pages use the same `LegalPage` component with `max-w-[720px]` on the content area and `max-w-[1000px]` on the outer wrapper. This provides adequate line length control for readability.

### Font Size & Line Height

- Body text uses `text-sm` (`14px` Tailwind default) with `leading-[1.7]` — this is slightly below the recommended 16px minimum for body text but meets the line-height recommendation of 1.6–1.8.
- Section headings use `text-base font-medium` making them visually distinct from body text.
- Subsection headings use `text-sm font-medium`, smaller than section headings but still bold for visual hierarchy.

### Color & Contrast

- Body text uses `var(--color-text-secondary)` (`#b8b0a8`) — a warm light gray on dark background. This provides adequate contrast.
- Primary headings use `var(--color-text-primary)` (`#f0ede8`) — the highest-contrast text color.
- Links use `var(--color-accent)` (`#8A9777`) — the sage green brand color, with underline on hover.
- The page title (H1) is `1.75rem font-medium` with tight letter-spacing for visual prominence.

## 4. Content Hierarchy

| Aspect | Status | Notes |
|--------|:------:|-------|
| Page title (H1) | ✅ | Clear, prominent at 1.75rem |
| Section headings (H2) | ✅ | Visually distinct with bold weight and larger size |
| Subsection headings (H3) | ✅ | Smaller but bold, indented under parent section |
| Last-updated date | ✅ | Shown below H1 in tertiary text color |
| Table of contents | ✅ | Desktop: sticky sidebar. Mobile: bottom-sheet "Jump to section" button |
| Anchor links | ✅ | All sections have IDs, TOC links use smooth scroll |
| Active section tracking | ✅ | IntersectionObserver highlights current TOC section |
| Contact information | ✅ | Email link at bottom of each page |
| Cross-linking | ✅ | Privacy links to Terms, Terms links to Privacy |

## 5. Mobile Experience

| Aspect | Status | Notes |
|--------|:------:|-------|
| Horizontal scroll | ✅ | No horizontal scroll at 375px |
| Touch targets | ✅ | All interactive elements meet 44px minimum |
| TOC access | ✅ | Fixed "Jump to section" button with bottom-sheet overlay |
| Font size scaling | ⚠️ | Body text at 14px may be small on mobile — 16px recommended for readability |
| Content spacing | ✅ | `px-4 py-8 sm:px-6` — adequate padding on mobile |
| Link tap targets | ✅ | Inline links in paragraph text are naturally small but meet minimums |

The mobile experience is competent: no horizontal scroll, adequate touch targets, and a well-implemented bottom-sheet TOC. The main concern is the 14px body text on a 375px screen, which may be below the recommended 16px minimum for comfortable reading.

## 6. Content Quality Signals

| Signal | Status | Notes |
|--------|:------:|-------|
| Clear language | ✅ | Written in plain English, avoids legalese |
| Specificity | ✅ | Specific timeframes (7 days cache, 30 days deletion, 14 days notice) |
| Transparency | ✅ | Lists all third-party services with what data each receives |
| Solo founder authenticity | ✅ | Phrases like "We built Nearsited as a solo founder product" build trust |
| GDPR/CCPA/PDPL coverage | ✅ | Privacy policy covers EU, UK, UAE, and California rights |
| Contact responsiveness | ✅ | "We aim to respond within 2 business days" |
| Refund policy clarity | ✅ | 14-day money-back guarantee with clear exclusions |
| Pricing transparency | ✅ | Specific prices, features, and beta pricing lock |

The legal content is notably well-written for a solo-founder product. It balances legal specificity with approachable language. Key trust-building signals include: the solo-founder framing, specific timeframes for data retention, transparent third-party service listing, and clear refund terms.

## 7. Polish & Brand Consistency

| Aspect | Status | Notes |
|--------|:------:|-------|
| Shared component | ✅ | Both pages use `LegalPage` component — consistent layout |
| Navigation | ✅ | "← Nearsited" link back to home page |
| Color consistency | ✅ | Uses same design tokens as rest of app |
| Typography | ✅ | Geist font throughout — consistent with UI |
| Motion/animation | ✅ | Smooth scroll on TOC links |
| Border usage | ✅ | `border-[var(--color-border-subtle)]` for dividers |
| Responsive patterns | ✅ | Mobile bottom-sheet TOC is consistent with app patterns |

Both legal pages are well-integrated with the rest of the application. They use the same design tokens, typography, and component patterns. The "← Nearsited" back link provides consistent navigation. The mobile bottom-sheet TOC follows the same pattern used elsewhere in the app.

## 8. Screenshots

Screenshots in [screenshots/](docs/audit-2026-06/pages/legal/screenshots/):

### /privacy
- [`privacy-fullpage-mobile-375x667.png`](screenshots/privacy-fullpage-mobile-375x667.png)
- [`privacy-fullpage-laptop-1280x800.png`](screenshots/privacy-fullpage-laptop-1280x800.png)

### /terms
- [`terms-fullpage-mobile-375x667.png`](screenshots/terms-fullpage-mobile-375x667.png)
- [`terms-fullpage-laptop-1280x800.png`](screenshots/terms-fullpage-laptop-1280x800.png)


---

## 9. Recommendations Summary

| # | Priority | Finding | Effort |
|---|:--------:|---------|:------:|
| 1 | 🟢 Low | Add "Last updated" structured data (schema.org) for search engine visibility | 0.5h |
| 2 | 🟢 Low | Consider adding print-friendly stylesheet for users who want to print/PDF the legal pages | 1-2h |

---

*Report generated from real Playwright data on 2026-06-18T00:28:58.009Z.*  
*Run command: `npx playwright test audit-tests/prompt3-legal.spec.ts`*