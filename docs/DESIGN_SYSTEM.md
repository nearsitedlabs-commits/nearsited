# Nearsited Design System

> **Version:** 2.1 · **Updated:** June 2026
> **Status:** ✅ Approved — official design direction (confirmed dark theme, sage accent)

---

## Table of Contents

1. [Brand Identity](#1-brand-identity)
2. [Visual Inspiration](#2-visual-inspiration)
3. [Design Principles](#3-design-principles)
4. [Product-Marketing Continuity](#4-product-marketing-continuity)
5. [Typography](#5-typography)
6. [Color System](#6-color-system)
7. [Spacing Scale](#7-spacing-scale)
8. [Border Radius Scale](#8-border-radius-scale)
9. [Shadow Scale](#9-shadow-scale)
10. [Motion Guidelines](#10-motion-guidelines)
11. [Component Standards](#11-component-standards)
12. [Table Standards](#12-table-standards)
13. [Form Standards](#13-form-standards)
14. [Button Standards](#14-button-standards)
15. [Loading States](#15-loading-states)
16. [Empty States](#16-empty-states)
17. [Terminology](#17-terminology)

---

## 1. Brand Identity

### 1.1 Core Belief

> **"The best opportunities are not hidden. They are overlooked."**

Nearsited is built on a single insight: agencies don't need more prospecting — they need better noticing. The product, the marketing, and every interaction should reinforce this philosophy.

### 1.2 Brand Voice

| Attribute | Description |
|-----------|-------------|
| **Confident** | Speaks with authority, not hype |
| **Precise** | Every word earns its place |
| **Editorial** | Clarity over cleverness |
| **Calm** | No urgency, no pressure — just signal |
| **Observant** | The tone of someone who notices what others miss |

### 1.3 Personality

Nearsited is the design-obsessed engineer on the team. It values craft, thinks in systems, and communicates with precision. It would rather say nothing than say something vague.

---

## 2. Visual Inspiration

### 2.1 Primary References

| Brand | What to Emulate |
|-------|-----------------|
| **Linear** | Information density, typographic hierarchy, functional color use, clean data presentation |
| **Raycast** | Command-surface UX, keyboard-first philosophy, premium simplicity |
| **Arc Browser** | Editorial layout, sidebar-as-command-center, spatial navigation |
| **Vercel** | Geometric sans typography, dark theme execution, component-driven UI |

### 2.2 Secondary Reference

| Brand | What to Emulate |
|-------|-----------------|
| **Stripe** | Documentation tone, data visualization clarity, payment-flow simplicity |

### 2.3 Avoid

| Style | Reason |
|-------|--------|
| Cyberpunk | Too aggressive, undermines trust |
| Glassmorphism | Reduces readability, trend-driven |
| Neumorphism | Low contrast, impractical for data |
| Startup illustrations | Overused, adds noise |
| Excessive gradients | Competes with content hierarchy |

---

## 3. Design Principles

### 3.1 Product First

Show the product before the features. Every section of the landing page should demonstrate Nearsited in action — opportunity scores, lead tables, pipeline stages — before explaining what it does. The product IS the marketing.

### 3.2 Information Density

Optimize for agency workflows. Data tables, score rings, and pipeline stages should communicate maximum signal per square pixel. Sparse layouts waste the user's most valuable resource: attention.

- Dense data tables with sortable columns
- Compact metric cards showing value + label only
- No decorative illustration padding
- Every element must earn its space

### 3.3 Premium Simplicity

Less decoration. Better hierarchy.

- Minimal borders, generous whitespace within cards
- Typography as the primary differentiator
- Color used functionally, not decoratively
- One visual focal point per view (the accent color)

### 3.4 Functional Motion

Motion must communicate state, not decorate.

- Page transitions → communicate navigation
- Skeleton loading → communicate progress
- Hover states → communicate interactivity
- Toast → communicate completion
- No decorative entrance animations on content

### 3.5 Consistency

The landing page and the SaaS dashboard must feel like a single product ecosystem.

- Same typography stack
- Same color palette
- Same component geometry (radii, spacing, shadows)
- Same tone of voice
- The dashboard is the landing page product demo, live

---

## 4. Product-Marketing Continuity

### 4.1 Core Principle

The landing page is **not a separate website**. The landing page is the marketing layer of the product.

Nearsited has one frontend, one design system, one component library. The landing page and the SaaS dashboard differ only in intent — one educates, the other enables — but they share every visual and structural foundation.

### 4.2 Rules

**Rule 1: Identical Design Tokens**

The landing page uses the exact same:
- Colors (backgrounds, surfaces, accent, text, borders)
- Typography (Geist for UI, Switzer for hero headlines only)
- Border radii (buttons, cards, inputs, badges, modals)
- Shadows (xs, sm, md, lg)
- Card styles (border, background, padding, radius, shadow)
- Button styles (primary, secondary, ghost, icon)

**No custom landing-page-only tokens.** If a token exists only for the landing page, it shouldn't exist.

**Rule 2: Real Product Screenshots Only**

All product imagery on the landing page must come directly from the application:
- No fake mockups with invented data
- No illustrated interface depictions
- Screenshots show actual Nearsited screens with real UI components
- If a feature is shown, it must exist in the product

Exception: The hero card may show sample/representative data to demonstrate the product's purpose, but must use the actual component markup (e.g. `<ScoreRing>`, `<WebsiteBadge>`).

**Rule 3: Shared Component Library**

Landing page cards, buttons, badges, and data displays must be built using the same components used inside the SaaS:
- `Button` from `components/ui/Button.tsx`
- `Card` from `components/ui/Card.tsx`
- `Badge` from `components/ui/Badge.tsx`
- `ScoreRing` from `components/ui/ScoreRing.tsx`
- `WebsiteBadge` from `components/ui/WebsiteBadge.tsx`
- `Table` from `components/ui/Table.tsx`

If a component exists in the SaaS component library, the landing page should reuse it — never inline a duplicate.

**Rule 4: Component-First, Not Page-First**

When building a new landing section, start by identifying which existing SaaS components can compose the section. Only create new components when no existing one fits.

```
✅ Good:  PricingSection composed of <Card> + <Badge> + <Button>
❌ Bad:  PricingSection with its own card markup, border styles, button styles
```

**Rule 5: The "First Screen" Feel**

The landing page should feel like "the first screen of the product" rather than "a separate marketing website":

- Navigation should feel like it could be the dashboard sidebar collapsed
- Layout width should match the product (`max-w-7xl` centered)
- Scrolling should feel continuous — as if the user is scrolling down through product screens
- No distinct "marketing mode" vs "app mode" switch

### 4.3 Implementation Pattern

```tsx
// Landing page component using SaaS primitives
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ScoreRing } from "@/components/ui/ScoreRing";

export function Hero() {
  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left: marketing copy */}
          <div>
            <Badge color="indigo" dot>
              Find businesses that need websites
            </Badge>
            <h1 className="mt-6 font-display text-hero">
              Find what others <em>overlook.</em>
            </h1>
          </div>

          {/* Right: live product demo using real components */}
          <Card variant="interactive" padding="lg">
            <ScoreRing score={41} />
            <WebsiteBadge status="has_website" />
            <Button variant="primary">View Opportunity</Button>
          </Card>
        </div>
      </div>
    </section>
  );
}
```

### 4.4 What This Eliminates

| ❌ Old Pattern | ✅ New Pattern |
|---------------|---------------|
| Landing page with its own CSS variables | Single `globals.css` for both landing + dashboard |
| Landing page with custom button styles | Shared `Button` component |
| Landing page with custom card markup | Shared `Card` component |
| Fake mockup screenshots | Live components with real data |
| "Marketing mode" vs "App mode" | One product, one design system |
| Orphaned landing components (`components/landing/*`) | Landing sections composed from `components/ui/*` |

---

## 5. Typography

### 5.1 Font Stack

| Role | Font | Weights | Use Case |
|------|------|---------|----------|
| **Primary UI** | **Geist** (via @fontsource/geist-sans) | 300, 400, 500, 600 | Dashboards, tables, forms, navigation, product interfaces, body text — **everything** |
| **Display** | **Switzer** (via @fontsource or CDN) | 400, 500, 600 | **Hero headlines only** on the landing page. Never in the dashboard. |
| **Mono** | **Geist Mono** (already installed) | 400, 500 | Code, metrics, data values, coordinates |

### 5.2 Font Usage Rules

1. **Geist is the default.** Every text element uses Geist unless explicitly overridden.
2. **Switzer is for hero headlines only.** Never use Switzer inside the dashboard, data tables, cards, or any product UI.
3. **No serif fonts.** Instrument Serif, Playfair Display, Newsreader, and all serif/editorial fonts are removed. The product is a modern SaaS, not a magazine.
4. **Numbers in data tables** — Geist medium (500) weight for readability.
5. **Score rings / metric values** — Geist medium, not bold.
6. **Never use italic for body text** — only for editorial emphasis in marketing headlines.
7. **Tracking (letter-spacing)** — `0.02em` for uppercase labels, `-0.02em` for large headlines.

### 5.3 Type Scale

```css
/* Marketing (Switzer — hero only) */
--text-hero:    clamp(3.5rem, 5.5vw, 5.8rem);  /* Hero H1 — Switzer */
--text-display: 2.5rem;                          /* Section headings — Geist */

/* Product UI (Geist) */
--text-2xl: 1.5rem;    /* Page titles */
--text-xl:  1.25rem;   /* Card headings */
--text-lg:  1.125rem;  /* Section subtitles */
--text-base: 1rem;     /* Body */
--text-sm:  0.875rem;  /* Navigation, buttons */
--text-xs:  0.75rem;   /* Labels, metadata */
--text-2xs: 0.6875rem; /* Badges, timestamps */
```

---

## 6. Color System

### 6.1 Philosophy

Nearsited uses a restrained, muted palette inspired by Linear and Vercel. No neon, no bright colors. Every color serves a functional purpose. The sage green accent is used once per view as a focal point — never more.

### 6.2 Semantic Tokens

```css
:root {
  /* Backgrounds — near-black navy foundation */
  --bg-base:       #0a0e12;  /* Page background */
  --bg-surface:    #12171e;  /* Cards, tables, containers */
  --bg-elevated:   #1a2028;  /* Hover states, elevated surfaces */

  /* Borders — ultra-subtle */
  --border:        rgba(255,255,255,0.06);
  --border-strong: rgba(255,255,255,0.10);

  /* Text — soft white family */
  --text-primary:  #f0ede8;  /* Primary copy — headings, body */
  --text-secondary:#b8b0a8;  /* Secondary copy — subdued body */
  --text-tertiary: #7a7268;  /* Muted — labels, metadata */
  --text-muted:    #3f3a35;  /* Very muted — placeholders */

  /* Brand — Sage */
  --accent:        #8A9777;  /* Primary CTA, active nav, key metrics */
  --accent-hover:  #7F8C63;  /* Hover state for accent elements */
  --accent-tint:   rgba(138,151,119,0.14);  /* Subtle background tint */

  /* Feedback — muted, non-neon */
  --success:       #7a9f7a;  /* Positive states, score ≥70 */
  --success-tint:  rgba(122,159,122,0.10);
  --warning:       #c4984a;  /* Score 40-69, needs improvement */
  --warning-tint:  rgba(196,152,74,0.10);
  --error:         #c4665a;  /* Score <40, errors */
  --error-tint:    rgba(196,102,90,0.10);

  /* Shadows — dark-tinted, minimal */
  --shadow-xs: 0 1px 2px rgba(0,0,0,0.3);
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.4);
  --shadow-md: 0 4px 8px rgba(0,0,0,0.5);
  --shadow-lg: 0 8px 24px rgba(0,0,0,0.6);
}
```

### 6.3 Badge Semantic Colors

```css
--badge-green-bg:    rgba(122,159,122,0.12);  /* Opportunity Found */
--badge-green-border:rgba(122,159,122,0.30);
--badge-green-text:  #9ac49a;

--badge-red-bg:      rgba(196,102,90,0.12);   /* Website Opportunity */
--badge-red-border:  rgba(196,102,90,0.30);
--badge-red-text:    #d49080;

--badge-amber-bg:    rgba(196,152,74,0.12);   /* Social Presence */
--badge-amber-border:rgba(196,152,74,0.30);
--badge-amber-text:  #d4b870;

--badge-indigo-bg:   rgba(138,151,119,0.10);   /* Platform Presence (uses accent tone) */
--badge-indigo-border:rgba(138,151,119,0.25);
--badge-indigo-text: #b0c0a0;
```

### 6.4 Color Usage Rules

1. **Accent (sage green `#8A9777`)** — Use **once per view** as a focal point. Primary CTAs, active navigation, key metrics.
2. **Success (muted green)** — Score rings ≥70, positive badges, completion states.
3. **Warning (muted amber)** — Scores 40–69, "Needs Improvement" badges.
4. **Error (muted red)** — Scores <40, errors, "Website Opportunity" badges.
5. **Never** use raw hex colors inline — always reference CSS variables.
6. **Never** use bright/neon variants of any color — the palette is intentionally muted.
7. **Pipeline status colors** must use the CSS pipeline variables (`--pipeline-*`) defined in globals.css, not Tailwind arbitrary values.

---

## 6. Spacing Scale

```css
--space-1:  0.25rem;  /* 4px  */
--space-2:  0.5rem;   /* 8px  */
--space-3:  0.75rem;  /* 12px */
--space-4:  1rem;     /* 16px */
--space-5:  1.25rem;  /* 20px */
--space-6:  1.5rem;   /* 24px */
--space-8:  2rem;     /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
```

### Spacing Rules
- **Card padding:** `p-5` (1.25rem) or `p-6` (1.5rem) — never `p-4` or smaller
- **Stat card padding:** `p-5` minimum
- **Table cell padding:** `px-4 py-3`
- **Section gap:** `space-y-6` (1.5rem) between sections
- **Button padding:** `px-4 py-2` (default), `px-5 py-2.5` (large)
- **List gap:** `space-y-3` (0.75rem) between items
- **Page padding:** `px-6 py-8` (dashboard), `py-12` or `py-16` (marketing sections)

---

## 7. Border Radius Scale

```css
--radius-sm:  0.375rem;  /* 6px  — small tags */
--radius-md:  0.5rem;    /* 8px  — inputs, buttons */
--radius-lg:  0.75rem;   /* 12px — cards */
--radius-xl:  0.875rem;  /* 14px — dialogs, larger surfaces */
--radius-2xl: 1rem;      /* 16px — modals */
--radius-full: 9999px;   /* pills, badges */
```

### Radius Rules
- **Buttons:** `rounded-lg` (0.75rem) — consistent across ALL pages
- **Cards:** `rounded-xl` (0.875rem) — **never** `rounded-2xl` for cards
- **Inputs:** `rounded-lg` (0.75rem)
- **Badges/pills:** `rounded-full`
- **Modals:** `rounded-2xl` (1rem)

---

## 8. Shadow Scale

```css
--shadow-xs: 0 1px 2px rgba(0,0,0,0.3);     /* subtle depth */
--shadow-sm: 0 1px 3px rgba(0,0,0,0.4);     /* cards resting */
--shadow-md: 0 4px 8px rgba(0,0,0,0.5);     /* elevated cards, dialogs */
--shadow-lg: 0 8px 24px rgba(0,0,0,0.6);    /* modals, toasts */
```

### Shadow Rules
- **Cards at rest:** `shadow-[var(--shadow-sm)]`
- **Cards on hover:** `shadow-[var(--shadow-md)]` — **no transform, no translate**
- **Modals/dialogs:** `shadow-[var(--shadow-lg)]`
- **Buttons:** `shadow-[var(--shadow-xs)]` (rest), `shadow-[var(--shadow-sm)]` (hover)
- **Never** use hardcoded shadow values — always reference CSS variables.
- **Never** use `hover:-translate-y-1` or `hover:scale-[1.02]` on cards or buttons — shadow only.

---

## 9. Motion Guidelines

### 9.1 Durations

| Interaction | Duration | Easing | Purpose |
|------------|----------|--------|---------|
| Hover states | 150ms | ease-out | Communicates interactivity |
| Color/bg transitions | 150ms | ease-out | Smooth state changes |
| Panel slides | 250ms | ease-out | Navigation communication |
| Modals appear | 200ms | ease-out | Entry communication |
| Page transitions | 200ms | ease-out | Navigation communication |
| Skeleton shimmer | 1.5s | ease-in-out infinite | Loading communication |

### 9.2 Functional Motion Rules

1. **No decorative entrance animations.** Content should appear, not parade in.
2. **Staggered animations** — use only in discover results where items arrive progressively via streaming.
3. **Toast** — fade-up + scale (160ms) for completion feedback.
4. **Reduced motion** — always respected via `prefers-reduced-motion`.

### 9.3 Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

✅ Already implemented in `globals.css`.

---

## 10. Component Standards

### 10.1 Layout

```
DashboardLayout (sidebar w-60 fixed | main flex-1)
└── main (bg-[var(--bg-base)])
    └── div.max-w-7xl.mx-auto.px-6.py-8
        ├── PageHeader           Satoshi, page title + subtitle + optional action
        ├── StatsRow             4-6 column grid of metric cards
        └── ContentArea          table / detail panel / form
```

### 10.2 Cards

- Background: `bg-[var(--bg-surface)]`
- Border: `border border-[var(--border)]`
- Radius: `rounded-xl`
- Padding: `p-5` or `p-6` (never `p-4`)
- Shadow: `shadow-[var(--shadow-sm)]`
- Hover: `shadow-[var(--shadow-md)]` (when interactive) — **color/shadow only, no transform**

### 10.3 Badges / Pills

- Radius: `rounded-full`
- Padding: `px-2.5 py-0.5`
- Font: `text-xs font-medium` — Geist
- Style: Inline-flex with rgba background + border

### 10.4 Score Rings

- Size: 44px default (SVG viewBox `0 0 44 44`)
- Empty state: Ghost ring with em-dash
- Scored: Colored ring using `--score-*` vars
- Score text: Geist medium (500), not serif

### 10.5 Toast Notifications

- Position: `fixed bottom-6 right-6`
- Background: `bg-[var(--bg-surface)]`
- Border: `border border-[var(--border)]`
- Shadow: `shadow-[var(--shadow-lg)]`
- Duration: 3s auto-dismiss
- Animation: Framer Motion fade-up (160ms)

### 10.6 Stat Cards

- Structure: Icon container (rounded, tinted) + large value + small label
- Padding: `p-5` minimum
- Value font: Satoshi medium, 1.875rem (`text-3xl`)
- Label font: Geist, `text-xs` or `text-[11px]`
- No hover effect unless interactive
- Stub/future cards: `opacity-40 border-dashed`

### 10.7 Page Header

- Subtitle: `text-[10px] uppercase tracking-[0.2em] font-medium text-[var(--text-tertiary)]`
- Title: Geist, `text-2xl` (1.5rem), `font-normal` (not serif)
- Action: Optional right-aligned button group

### 10.8 Empty States

- Centered layout, `py-20`
- Icon in `bg-[var(--bg-elevated)]` rounded container
- Title: Geist, `text-xl`, `text-[var(--text-primary)]`
- Description: `text-xs text-[var(--text-tertiary)]`
- Action button to relevant flow

---

## 11. Table Standards

### 11.1 Structure

- Container: `overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]`
- Header row: `border-b border-[var(--border)] bg-[var(--bg-elevated)]`
- Header cells: `px-4 py-3 text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]`
- Body rows: `border-b border-[var(--border)]` (last row no border)
- Body cells: `px-4 py-3 text-sm text-[var(--text-secondary)]`
- Row hover: `hover:bg-[var(--bg-elevated)]`

### 11.2 Sorting & Interaction

- Sortable columns: Click header to sort (asc → desc → none)
- Row click: Navigate to detail view or select for inline preview
- Lens focus: `.lens-focus` overlay on rows for premium feel

### 11.3 Empty State

- Colspan full, centered
- `py-12 text-center text-sm text-[var(--text-tertiary)]`
- Action link to relevant page

### 11.4 Implementation

Use `@tanstack/react-table` for:
- Sortable columns
- Column visibility toggle
- Pagination state
- Row selection

---

## 12. Form Standards

### 12.1 Input Fields

- Background: `bg-[var(--bg-elevated)]`
- Border: `border border-[var(--border)]`
- Radius: `rounded-lg`
- Padding: `py-2.5 px-4`
- Text: `text-sm text-[var(--text-primary)]` — Geist
- Placeholder: `placeholder:text-[var(--text-tertiary)]`
- Focus: `focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-tint)]`
- Transition: `transition-colors duration-150`
- Error: `border-[var(--badge-red-border)]` + `focus:ring-[var(--error-tint)]`

### 12.2 Selects

- Same as inputs, with `appearance-none` + custom chevron
- Use `@radix-ui/react-select` for accessible custom selects

### 12.3 Labels

- Font: `text-xs font-medium` — Geist
- Color: `text-[var(--text-tertiary)]`
- Margin: `mb-1.5`

---

## 13. Button Standards

### 13.1 Primary

- Background: `bg-[var(--accent)]`
- Text: `text-white`
- Hover: `hover:bg-[var(--accent-hover)]`
- Radius: `rounded-lg`
- Padding: `px-4 py-2.5`
- Font: `text-sm font-medium` — Geist
- Shadow: `shadow-[var(--shadow-xs)]`
- **No transform on hover** — color change only

### 13.2 Secondary

- Border: `border border-[var(--border)]`
- Background: `bg-[var(--bg-elevated)]`
- Text: `text-[var(--text-secondary)]`
- Hover: `hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]`

### 13.3 Ghost

- Border: `border border-transparent`
- Background: `bg-transparent`
- Text: `text-[var(--text-secondary)]`
- Hover: `hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]`

### 13.4 Icon Buttons

- Padding: `p-2`
- Radius: `rounded-lg`
- Same hover patterns as ghost
- Fixed icon size: `h-4 w-4`

### 13.5 Disabled

- `opacity-50 cursor-not-allowed`

---

## 14. Loading States

### 14.1 Skeleton Components

Use consistent skeleton variants:
- `RowSkeleton` — table rows (52px height)
- `CardSkeleton` — stat cards (128px height)
- `PageSkeleton` — full page layout

All skeletons: `animate-pulse bg-[var(--bg-elevated)]` with matching border radius.

### 14.2 Spinners

- Small inline: `h-3 w-3 animate-spin` (SVG circle)
- Button loading: spinner icon + disabled state
- Full-page: centered spinner with "Loading..." text

### 14.3 States

Every data-fetching view must handle three states consistently:
1. **Loading** — Skeleton matching the content shape
2. **Empty** — EmptyState with icon, title, description, action
3. **Error** — Error message with retry action

---

## 15. Empty States

### 15.1 No Data

- Centered layout, `py-20`
- Icon in `bg-[var(--bg-elevated)]` container
- Title: Geist, `text-xl`, `text-[var(--text-primary)]`
- Description: `text-xs text-[var(--text-tertiary)]`
- Action button to relevant flow

### 15.2 No Results (Search/Filter)

- Same as no data
- Include "Clear filters" or alternative suggestion

---

## 16. Terminology

Standardised terminology across the entire product (landing + dashboard).

### 16.1 Opportunity (Replaces "Audit")

| ❌ Old Term | ✅ New Term |
|------------|-------------|
| Audit | Opportunity |
| AI Audit | Opportunity Analysis |
| Audit Score | Opportunity Score |
| Run Audit | Analyse Opportunity |
| Audit Page | Opportunity Analysis |
| Performance Audit | Performance Analysis |

### 16.2 Pipeline

| ❌ Old Term | ✅ New Term |
|------------|-------------|
| Pipeline Stage | Pipeline Stage (unchanged) |
| Lead Status | Pipeline Status |

### 16.3 Lead Naming

| ❌ Old Term | ✅ New Term |
|------------|-------------|
| Leads Analysed | Opportunities Spotted |
| Leads | Opportunities (in navigation) |
| Lead Detail | Opportunity Detail |

### 16.4 Atlas Language

| ❌ Old Term | ✅ New Term |
|------------|-------------|
| Results | Observations |
| Found X businesses | X opportunities spotted |
| Search | Discover |

### 16.5 Product-Wide Vocabulary

```
discover     → find opportunities
score        → measure potential
analyse      → evaluate website quality
pitch        → generate outreach
pipeline     → track progress
dashboard    → overview
settings     → workspace
```

---

## Anti-Patterns

### ❌ DO NOT Use

| Anti-Pattern | Why | Instead |
|-------------|-----|---------|
| `transform: scale()` or `translateY()` on hover | Causes layout shift, feels janky | Change shadow or color only |
| Amber as a primary action colour | Ambiguous meaning | Use deep violet accent |
| `bg-white/10` or white-tinted surfaces | Invisible against dark bg | Use `--bg-elevated` |
| Hardcoded hex values | Breaks design system consistency | Always reference CSS variables |
| Emojis as icons | Unprofessional, inconsistent | Use Lucide React icons |
| Glassmorphism on main content | Reduces readability | Solid surfaces with subtle borders |
| Neon or bright accent colors | Contradicts premium simplicity | Muted deep violet palette |
| Serif fonts in dashboard | Reduces scanability (violates §4.2 rule 3) | Geist everywhere in product UI |
| Decorative entrance animations | Wastes user time, feels slow | Functional motion only (§9.2) |
| Startup-style illustrations | Adds noise without signal | Show product UI instead |
| `$ grep` in Windows PowerShell | Doesn't work | Use `Select-String` |
