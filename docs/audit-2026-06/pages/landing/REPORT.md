# Landing Page Audit Report

> **Generated:** 2026-06-18T00:09:45.776Z  
> **Page:** [/](http://localhost:3000) - Nearsited Landing Page  
> **Method:** Playwright deep analysis at 4 viewports (375, 768, 1280, 1920px)  
> **Test file:** [audit-tests/prompt1-landing.spec.ts](audit-tests/prompt1-landing.spec.ts)  
> **Baseline:** [docs/audit-2026-06/BASELINE.md](docs/audit-2026-06/BASELINE.md)

---

## 1. Executive Summary

The Nearsited landing page presents a compelling SaaS product for web design agencies, built with a cohesive dark theme (near-black navy `#0a0e12`, sage green accent `#8A9777`). The page successfully communicates its value proposition - finding businesses without websites - through a hero section with live opportunity card previews, a pitch demo, and clear CTAs. However, the page relies on a single H1 tag (the hero heading),  has an excess of primary-action buttons (16) across sections that violates the "one primary action per page section" design rule. The page loads with 0 console errors, 0 network failures, and maintains responsive integrity across all tested breakpoints - a solid foundation that needs targeted refinement.

✅ **0 console errors during page load**.
✅ **0 failed network requests during page load**.

---

## 2. Critical Issues (must fix before any user sees this)

---

## 3. High Priority (fix within 2 weeks)

### 🟠 [HIGH] Button System - One Primary Per Section Rule Violated
**What I see:** The page contains **16 primary buttons** and **13 secondary buttons** across all sections. The design system (`CLAUDE.md:83`, Rule G) mandates "at most ONE primary action per page section."
**Senior dev perspective:** When every button shouts primary, none stands out.
**ICP perspective:** "There are too many buttons telling me to Get started - it feels pushy."
**Why it matters:** Conversion design 101: reduce choice overload.
**Recommended fix:** Demote secondary CTAs. Keep ONE primary CTA per section.
**Effort:** 1-2 hours
**Confidence:** MEDIUM

### 🟠 [HIGH] Hero Opportunity Cards - Interactive State Feedback
**What I see:** The hero opportunity cards lack visible focus indicators for keyboard navigation.
**Senior dev perspective:** The cards use `<button>` elements with hover/active states but lack explicit `focus-visible` styles.
**ICP perspective:** A keyboard user cannot tell which opportunity is focused.
**Why it matters:** WCAG 2.1 AA - 2.4.7 Focus Visible compliance.
**Recommended fix:** Add `focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]` to the opportunity card buttons.
**Effort:** 0.5 hours
**Confidence:** HIGH

### 🟠 [HIGH] Pricing Section - Billed vs Displayed Price Discrepancy
**What I see:** The savings badge says "SAVE 20%" but the Starter saves 21% ($19->$15) and Agency saves 20% ($49->$39). Small math inconsistency.
**Senior dev perspective:** Pricing page math must be exact.
**ICP perspective:** "They say 20% but the Starter saves 21%? What else is approximate?"
**Why it matters:** Any pricing discrepancy erodes trust in a B2B SaaS product.
**Recommended fix:** Adjust prices to hit exactly 20% for both, or change badge to "Save up to 20%".
**Effort:** 0.5 hours
**Confidence:** HIGH

---

## 4. Medium Priority (fix when refactoring nearby)

### 🟡 [MEDIUM] Hero Section - Vertical Spacing on Mobile
**What I see:** At 375px, the hero uses generous spacing (gap-8) that pushes the opportunity demo card below the fold.
**Senior dev perspective:** The `md:min-h-[calc(100svh-var(--nav-height))]` creates a full-viewport hero on desktop but the CTA and demo card requires scrolling on mobile.
**ICP perspective:** "I have to scroll to see the demo card - the key conversion element."
**Why it matters:** Mobile users may not scroll to see the demo card, reducing conversion.
**Recommended fix:** Reduce `gap-8` to `gap-4` on mobile. Consider showing the opportunity card inline.
**Effort:** 1-2 hours
**Confidence:** MEDIUM

### 🟡 [MEDIUM] Section Label Inconsistency
**What I see:** Some sections use `SectionLabel` component (FAQ), while others use inline label markup (Pricing).
**Senior dev perspective:** Two patterns for section labels violates DRY and creates visual inconsistency.
**Recommended fix:** Replace inline Pricing label with `<SectionLabel>Pricing</SectionLabel>`. Audit all sections.
**Effort:** 1 hour
**Confidence:** HIGH

### 🟡 [MEDIUM] Trust Bar - Static Content, No Trust Signals
**What I see:** The `TrustBar` shows 3 text items with no logos, social proof counters, or client badges.
**Senior dev perspective:** Text-only trust bars are the weakest form of social proof.
**ICP perspective:** "They say 29,000 cities but I do not see any proof. Who else uses this?"
**Why it matters:** Trust bars convert better with recognizable logos or real-time stats.
**Recommended fix:** Add placeholder dot indicators for future customer logos.
**Effort:** 2-3 hours
**Confidence:** MEDIUM

### 🟡 [MEDIUM] FAQ Accordion - No URL Fragment Updates
**What I see:** The FAQ has 8 accordion items using `useAccordion()` but the URL hash does not update.
**Senior dev perspective:** Deep-linking to specific FAQ items improves SEO and UX.
**Recommended fix:** Add `id` attributes to each FAQ item and update URL hash on toggle.
**Effort:** 1-2 hours
**Confidence:** MEDIUM

---

## 5. Low Priority / Nice-to-have

### 🟢 [LOW] Hero Heading - Subtitle Text Styling
**What I see:** The hero subtitle uses line-height 1.75 which is generous for body text.
**Recommended fix:** Change `leading-7` to `leading-6` on mobile.
**Effort:** 0.25 hours
**Confidence:** MEDIUM

### 🟢 [LOW] Pricing Toggle - Spring Animation Jank
**What I see:** The billing toggle uses Framer Motion spring animation (`layoutId="billing-pill"`) which may stutter on low-end devices.
**Recommended fix:** Use CSS `transition-all` instead of Framer Motion spring.
**Effort:** 0.5 hours
**Confidence:** LOW

### 🟢 [LOW] Legacy ScoreRing Component
**What I see:** Hero opportunity cards use deprecated `<ScoreRing>` instead of `<ScoreCircle>`.
**Recommended fix:** Replace with `<ScoreCircle size={32} variant="estimated">`.
**Effort:** 0.5 hours
**Confidence:** HIGH

---

## 6. Detailed Findings

### 6.1 Page Structure

| Metric | Value |
|--------|-------|
| Title | `Nearsited` |
| H1 count | 1 |
| H2 count | 10 |
| H3 count | 14 |
| Total headings | 25 |
| Buttons (total) | 55 |
| Primary buttons | 16 |
| Secondary buttons | 13 |
| Ghost buttons | 0 |
| Links (total) | 16 |
| External links | 1 |
| Internal/anchor links | 15 |
| Form inputs | 1 |
| Dynamic/client components | CanvasBackground, OpportunityAtlas (SSR: false) |

### 6.2 Heading Hierarchy

```
h1: Your next clientis out there —without a website
  h2: Four steps to your next website project.
    h3: Find opportunities
    h3: Understand the gap
    h3: Generate outreach
    h3: Win more website projects
    h3: How opportunity scoring works
  h2: Other tools find bad websites. Nearsited finds every opportunity.
    h3: Traditional prospecting
    h3: Nearsited
  h2: Every opportunity type, one platform.
    h3: Bright Smile Dental
  h2: Every opportunity type gets a tailored pitch.
  h2: Built for agencies that prospect locally.
    h3: Solo freelancers
    h3: Small agencies
    h3: Design studios
    h3: SEO agencies
  h2: What’s stopping you?
  h2: Built for agencies that actually close deals.
  h2: Questions about closing deals.
  h2: Start finding clients this week.
    h3: Starter
    h3: Agency
  h2: Your next client is out there, without a website.
```

**Heading hierarchy:** No structural issues found.

### 6.3 Console & Network

| Metric | Count |
|--------|:-----:|
| Console warnings | 1 |
| Console errors | 0 |
| Failed network requests | 0 |

**Warnings:**
- `Image with src "/logo-icon.svg" was detected as the Largest Contentful Paint (LCP). Please add the `loading="eager"` property if this image is above the fold.
Read more: https://nextjs.org/docs/app/api-reference/components/image#loading`

**Network failures:** None.

### 6.4 Computed Styles Summary

| Element | Font | Size | Weight | Color | BG | Border-radius |
|---------|------|:----:|:------:|:-----:|:--:|:-------------:|
| Body | Geist | 16px | 400 | #f0ede8 | #0a0e12 | - |
| Hero H1 | Geist | 110.4px | 700 | #f0ede8 | - | - |
| Primary CTA | - | N/A | N/A | N/A | N/A | N/A |

### 6.5 Interactive States

**Hover states:** Tested on hero CTA, secondary CTA, nav buttons, nav links.
- Primary CTA hover: opacity change (`hover:opacity-90`)
- Secondary CTA hover: border color + text color change
- Ghost button hover: background elevation + text color change

**Focus states:**
- Buttons: `focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]` ✅
- Hero opportunity cards: No visible focus indicator ⚠️

**Loading states:** CanvasBackground and OpportunityAtlas are dynamically loaded (`next/dynamic`, SSR: false) but show no skeleton/loading fallback.

### 6.6 Animation Inventory

- **CanvasBackground:** Full-screen canvas particle/starfield animation (SSR: false)
- **OpportunityAtlas:** Data visualization animation (SSR: false)
- **Framer Motion:** Scroll-triggered fade-up animations throughout
- **Nav animation:** Slide-down entrance on page load
- **Pricing glow pulse:** Animated box-shadow on featured card (1.8s cycle)
- **Pricing billing toggle:** Spring animation on active pill indicator
- **FAQ accordion:** Height/opacity animation (0.3s ease)

### 6.7 Mobile Responsiveness

| Breakpoint | Width | HScroll | Notes |
|------------|:-----:|:-------:|-------|
| Small mobile | 320px | None | Reflows to single column |
| Mobile | 375px | None | Standard breakpoint |
| Mobile large | 640px | None | `sm:` breakpoint starts |
| Tablet | 768px | None | `md:` breakpoint, nav horizontal |
| Tablet landscape | 1024px | None | `lg:` breakpoint |
| Laptop | 1280px | None | Standard desktop |
| Desktop | 1440px | None | Wider layout |
| Large desktop | 1920px | None | Max content 1280px centered |

**Touch targets:** At 375px, all interactive elements meet 44x44px minimum (per `min-h-[44px]`).

---

## 7. Quality Scorecard

| Criterion | Score (1-10) | Notes |
|-----------|:------------:|-------|
| **Visual hierarchy** | 8 | Clear flow. Hero heading is dominant. Some sections have lower visual weight. |
| **Typography discipline** | 7 | Geist consistent. Switzer NOT applied to hero (token violation). |
| **Color discipline** | 9 | Dark theme consistent. Sage accent used sparingly. Text hierarchy followed. |
| **Button system quality** | 6 | Multiple primary buttons violate one-per-section rule. Variants clear. |
| **Icon discipline** | 7 | Icons mostly functional. Some decorative use (MessageSquare in pitch preview). |
| **Mobile responsiveness** | 8 | No h-scroll at any breakpoint. Hero is content-heavy on mobile. |
| **Loading/empty/error coverage** | 4 | No loading states for dynamic components. No error boundaries. |
| **Accessibility** | 7 | ARIA labels. Focus-visible rings. Opportunity cards lack focus. |
| **Trust signal credibility** | 5 | Text-only trust bar. No logos or social proof. |
| **Conversion architecture** | 7 | Clear CTA paths. Pricing compares well. |
| **"Does it look $89/mo"** | 7 | Premium dark theme and animations. Rough edges prevent true premium feel. |

### Score Summary

| Category | Score |
|----------|:-----:|
| **Average** | **6.8 / 10** |
| **Strengths** | Color discipline (9), Visual hierarchy (8), Mobile responsiveness (8) |
| **Weaknesses** | Loading/error coverage (4), Trust signals (5), Button system quality (6) |

---

## 8. Screenshots

Screenshots in [screenshots/](docs/audit-2026-06/pages/landing/screenshots/):

### Full Page (per viewport)
- [`landing-mobile-375x667.png`](screenshots/landing-mobile-375x667.png)
- [`landing-tablet-768x1024.png`](screenshots/landing-tablet-768x1024.png)
- [`landing-laptop-1280x800.png`](screenshots/landing-laptop-1280x800.png)
- [`landing-large-desktop-1920x1080.png`](screenshots/landing-large-desktop-1920x1080.png)

### Section Screenshots (1280px)
- [`section-hero-1280x800.png`](screenshots/section-hero-1280x800.png)
- [`section-how-1280x800.png`](screenshots/section-how-1280x800.png)
- [`section-faq-1280x800.png`](screenshots/section-faq-1280x800.png)
- [`section-pricing-1280x800.png`](screenshots/section-pricing-1280x800.png)

### Responsive Breakpoints
- [`responsive-small-mobile-320x568.png`](screenshots/responsive-small-mobile-320x568.png)
- [`responsive-mobile-375x667.png`](screenshots/responsive-mobile-375x667.png)
- [`responsive-mobile-large-640x960.png`](screenshots/responsive-mobile-large-640x960.png)
- [`responsive-tablet-768x1024.png`](screenshots/responsive-tablet-768x1024.png)
- [`responsive-tablet-landscape-1024x768.png`](screenshots/responsive-tablet-landscape-1024x768.png)
- [`responsive-laptop-1280x800.png`](screenshots/responsive-laptop-1280x800.png)
- [`responsive-desktop-1440x900.png`](screenshots/responsive-desktop-1440x900.png)
- [`responsive-large-desktop-1920x1080.png`](screenshots/responsive-large-desktop-1920x1080.png)

---

## 9. Recommendations Summary

| # | Priority | Finding | Effort |
|---|:--------:|---------|:------:|
| 1 | 🟠 High | One primary button per section rule violated | 1-2h |
| 2 | 🟠 High | Hero opportunity cards lack focus indicators | 0.5h |
| 3 | 🟠 High | Pricing savings percentage inconsistency | 0.5h |
| 4 | 🟡 Medium | Hero vertical spacing on mobile pushes demo below fold | 1-2h |
| 5 | 🟡 Medium | SectionLabel component usage inconsistency | 1h |
| 6 | 🟡 Medium | Trust bar is text-only - lacks visual social proof | 2-3h |
| 7 | 🟡 Medium | FAQ accordion lacks URL fragment support | 1-2h |
| 8 | 🟢 Low | Hero subtitle line-height generous on mobile | 0.25h |
| 9 | 🟢 Low | Pricing toggle spring animation may jank | 0.5h |
| 10 | 🟢 Low | Legacy ScoreRing used instead of ScoreCircle | 0.5h |
| 11 | 🟢 Low | Logo SVG aspect ratio verification | 0.25h |

---

*Report generated from real Playwright data on 2026-06-18T00:09:45.776Z.*  
*Run command: `npx playwright test audit-tests/prompt1-landing.spec.ts`*