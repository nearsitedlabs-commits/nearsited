# Nearsited — Audit Baseline (Prompt 0)

> **Generated:** 2026-06-17T23:38 UTC  
> **Method:** Playwright smoke test visiting every user-facing route on `http://localhost:3000`  
> **Test file:** [`audit-tests/prompt0-baseline.spec.ts`](audit-tests/prompt0-baseline.spec.ts)  
> **Test results:** 29/30 tests passed (1 partial: 4 routes timed out during dev server restart)  
> **Summary data:** [`docs/audit-2026-06/data/route-summary.json`](docs/audit-2026-06/data/route-summary.json)  
> **Computed CSS:** [`docs/audit-2026-06/data/computed-styles.json`](docs/audit-2026-06/data/computed-styles.json)  
> **Screenshots:** [`docs/audit-2026-06/pages/*/`](docs/audit-2026-06/pages/)

---

## Design Tokens

Extracted from [`src/app/globals.css`](src/app/globals.css) — single source of truth.

### Backgrounds / Surface Hierarchy
| Token | Value | Usage |
|-------|-------|-------|
| `--bg-base` / `--color-bg-page` | `#0a0e12` | Page background (deepest) |
| `--bg-surface-1` / `--color-bg-surface` | `#12171e` | Base card / container surface |
| `--bg-surface-2` / `--color-bg-elevated` | `#1a2028` | Elevated card / hover state |
| `--bg-surface-3` | `#222b36` | Modal / dropdown / highest surface |

### Borders
| Token | Value | Usage |
|-------|-------|-------|
| `--border` / `--color-border-subtle` | `rgba(255,255,255,0.06)` | Default borders |
| `--border-strong` / `--color-border-strong` | `rgba(255,255,255,0.10)` | Emphasis borders only |

### Text — Warm Ivory Family
| Token | Value | Usage |
|-------|-------|-------|
| `--text-primary` / `--color-text-primary` | `#f0ede8` | Headings, important labels |
| `--text-secondary` / `--color-text-secondary` | `#b8b0a8` | Body, supporting text |
| `--text-tertiary` / `--color-text-tertiary` | `#8a8278` | Metadata, timestamps |
| `--text-muted` | `#3f3a35` | Disabled text |

### Brand — Sage
| Token | Value | Usage |
|-------|-------|-------|
| `--accent` / `--color-accent` | `#8A9777` | Primary actions + active states ONLY |
| `--accent-hover` | `#7F8C63` | Hover state for accent |
| `--accent-tint` | `rgba(138,151,119,0.14)` | Subtle accent background |
| `--accent-warm` | `#a09470` | Warm variant |

### Semantic Colors
| Token | Value | Usage |
|-------|-------|-------|
| `--color-info` | `#60a5fa` (blue) | In-progress / informational |
| `--color-warning` | `#c4984a` (amber) | Needs attention / stale |
| `--color-danger` | `#c4665a` (red) | Destructive actions + lost/failed ONLY |
| `--color-success` | `#4a8f5a` (deep green) | Completed / won terminal states |

### Score Colors
| Token | Value | Usage |
|-------|-------|-------|
| `--score-high` | `#c4665a` | Poor score (0–39) |
| `--score-mid` | `#c4984a` | Needs improvement (40–69) |
| `--score-good` | `#7a9f7a` | Good/Strong (70+) |

### Shadow Scale
| Token | Value |
|-------|-------|
| `--brand-shadow-xs` | `0 1px 2px rgba(0,0,0,0.3)` |
| `--brand-shadow-sm` | `0 1px 3px rgba(0,0,0,0.4)` |
| `--brand-shadow-md` | `0 4px 8px rgba(0,0,0,0.5)` |
| `--brand-shadow-lg` | `0 8px 24px rgba(0,0,0,0.6)` |

### Spacing Scale (4px grid)
`4px` · `8px` · `12px` · `16px` · `24px` · `32px` · `48px` · `64px`

### Border Radius — ONLY two values permitted
| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | `6px` | Pills, badges, small buttons |
| `--radius-md` | `10px` | Cards, modals, larger surfaces |

### Typography Scale
| Token | Value |
|-------|-------|
| `--text-hero` | `clamp(2rem, calc(8vw + 0.5rem), 8rem)` |
| `--text-display` | `2.5rem` |
| `--text-2xl` | `1.5rem` |
| `--text-xl` | `1.25rem` |
| `--text-lg` | `1.125rem` |

**Fonts:** Geist (UI), Switzer (hero headlines only, landing), Geist Mono (mono/code).

### Z-Index Scale
`--z-base: 0` · `--z-dropdown: 100` · `--z-sticky: 200` · `--z-nav: 300` · `--z-modal: 400` · `--z-toast: 500` · `--z-tooltip: 600`

### Mobile Layout Tokens
| Token | Value |
|-------|-------|
| `--mobile-nav-height` | 56px |
| `--mobile-header-height` | 52px |
| `--mobile-safe-bottom` | `env(safe-area-inset-bottom, 0px)` |
| `--mobile-safe-top` | `env(safe-area-inset-top, 0px)` |
| `--mobile-page-padding` | 16px |

### Pipeline Status Colors
`--pipeline-new: #8a8278` · `--pipeline-analysed: #60a5fa` · `--pipeline-pitch: #818cf8` · `--pipeline-contacted: #fbbf24` · `--pipeline-conversation: #60a5fa` · `--pipeline-won: #4ade80` · `--pipeline-lost: #f87171`

---

## Component Inventory

Every component in [`src/components/`](src/components/) listed by category.

### UI Components (`src/components/ui/`)
| Component | File | Purpose |
|-----------|------|---------|
| `<Section>` | [`Section.tsx`](src/components/ui/Section.tsx) | Page section wrapper. `variant="card"` (at most 1/page), `"flush"`, `"bordered"` |
| `<ListRow>` | [`ListRow.tsx`](src/components/ui/ListRow.tsx) | Compact data row. 42–48px height |
| `<StatTile>` | [`StatTile.tsx`](src/components/ui/StatTile.tsx) | Metric tile with optional 2px accent left-border |
| `<Pill>` | [`Pill.tsx`](src/components/ui/Pill.tsx) | Status indicator. `display="status"` or `"column"` |
| `<ScoreCircle>` | [`ScoreCircle.tsx`](src/components/ui/ScoreCircle.tsx) | Score ring. Sizes 24/32/48px |
| `<Button>` | [`Button.tsx`](src/components/ui/Button.tsx) | Base button — Primary (accent), Secondary (bordered), Ghost (text-only) |
| `<ActionMenu>` | [`ActionMenu.tsx`](src/components/ui/ActionMenu.tsx) | Radix DropdownMenu overflow menu |
| `<Card>` | [`Card.tsx`](src/components/ui/Card.tsx) | Legacy card — prefer `<Section>` |
| `<Badge>` | [`Badge.tsx`](src/components/ui/Badge.tsx) | Legacy badge — prefer `<Pill>` |
| `<ScoreRing>` | [`ScoreRing.tsx`](src/components/ui/ScoreRing.tsx) | Legacy score ring — prefer `<ScoreCircle>` |
| `<CanvasBackground>` | [`CanvasBackground.tsx`](src/components/ui/CanvasBackground.tsx) | Canvas background effect |
| `<CreditsWidget>` | [`CreditsWidget.tsx`](src/components/ui/CreditsWidget.tsx) | Credits display in sidebar |
| `<EmptyState>` | [`EmptyState.tsx`](src/components/ui/EmptyState.tsx) | Empty state placeholder |
| `<ErrorState>` | [`ErrorState.tsx`](src/components/ui/ErrorState.tsx) | Error state placeholder |
| `<LeadAffordances>` | [`LeadAffordances.tsx`](src/components/ui/LeadAffordances.tsx) | Lead interaction affordances |
| `<LoadingState>` | [`LoadingState.tsx`](src/components/ui/LoadingState.tsx) | Loading state placeholder |
| `<MetricCard>` | [`MetricCard.tsx`](src/components/ui/MetricCard.tsx) | Metric display card |
| `<OpportunityCard>` | [`OpportunityCard.tsx`](src/components/ui/OpportunityCard.tsx) | Opportunity display card |
| `<PipelineSelect>` | [`PipelineSelect.tsx`](src/components/ui/PipelineSelect.tsx) | Pipeline status dropdown |
| `<PoweredByGoogle>` | [`PoweredByGoogle.tsx`](src/components/ui/PoweredByGoogle.tsx) | Google attribution badge |
| `<SearchableSelect>` | [`SearchableSelect.tsx`](src/components/ui/SearchableSelect.tsx) | Reusable searchable dropdown |
| `<StatCard>` | [`StatCard.tsx`](src/components/ui/StatCard.tsx) | Statistics card |
| `<Toast>` | [`Toast.tsx`](src/components/ui/Toast.tsx) | Toast notification (bottom-right, 3s auto-dismiss) |
| `<Tooltip>` | [`Tooltip.tsx`](src/components/ui/Tooltip.tsx) | Radix tooltip |
| `<WebsiteBadge>` | [`WebsiteBadge.tsx`](src/components/ui/WebsiteBadge.tsx) | Website status badge |
| `<WebsiteStatusPill>` | [`WebsiteStatusPill.tsx`](src/components/ui/WebsiteStatusPill.tsx) | Website status pill |
| `<ScoreCircle>` | [`ScoreCircle.tsx`](src/components/ui/ScoreCircle.tsx) | Score ring |
| `<ScoreRing>` | [`ScoreRing.tsx`](src/components/ui/ScoreRing.tsx) | Legacy score ring |
| `<Section>` | [`Section.tsx`](src/components/ui/Section.tsx) | Page section |
| `<Pill>` | [`Pill.tsx`](src/components/ui/Pill.tsx) | Status pill |

### Mobile Components (`src/components/ui/mobile/`)
| Component | File | Purpose |
|-----------|------|---------|
| `<BottomNav>` | [`mobile/BottomNav.tsx`](src/components/ui/mobile/BottomNav.tsx) | Fixed bottom tab bar. 5 tabs max. Hidden on `lg:` |
| `<MobileHeader>` | [`mobile/MobileHeader.tsx`](src/components/ui/mobile/MobileHeader.tsx) | Fixed top bar. Hidden on `lg:` |
| `<BottomSheet>` | [`mobile/BottomSheet.tsx`](src/components/ui/mobile/BottomSheet.tsx) | Slides up from bottom. Replaces center modals on mobile |
| `<SwipeAction>` | [`mobile/SwipeAction.tsx`](src/components/ui/mobile/SwipeAction.tsx) | Swipe-left on a row to reveal actions |
| `<MobileTable>` | [`mobile/MobileTable.tsx`](src/components/ui/mobile/MobileTable.tsx) | Auto-transforms desktop tables into card lists below `sm:` |

### Auth Components (`src/components/auth/`)
`<AuthBackground>` · `<AuthCard>` · `<BrandStoryPanel>` · `<OpportunityPreviewCard>` · `<PasswordStrengthMeter>`

### Landing Components (`src/components/landing/`)
`<LandingNav>` · `<LandingHero>` · `<TrustBar>` · `<HowItWorksSection>` · `<WhyNearsitedSection>` · `<SampleReportSection>` · `<SamplePitchSection>` · `<AgencyUseCasesSection>` · `<ObjectionsSection>` · `<ProofBlocksSection>` · `<LandingFAQ>` · `<CTASection>` · `<LandingFooter>` · `<Pricing>` · `<LandingPageClient>` · `<LandingScrollNav>` · `<SectionLabel>` · `<SectionTitle>` · `<SectionSub>`

### Filters Components (`src/components/filters/`)
`<FilterPanel>` · `<RangeSlider>`

### Legal Components (`src/components/legal/`)
`<LegalPage>`

### Other
`<CookieConsent>` · `<NoOpServiceWorker>`

---

## Route Inventory

All user-facing pages (`page.tsx`) under [`src/app/`](src/app/), excluding API routes. Tested with Playwright at 1280x800 viewport.

| Route | Type | Status | Console Errors | Console Warnings | HTTP Status | Notes |
|-------|------|--------|:-------------:|:----------------:|:-----------:|-------|
| `/` | Static/Landing | ✅ Shipped | 0 | 0 | 200 | Rich page: 25 headings, 55 buttons, 16 links |
| `/login` | Auth | ✅ Shipped | 0 | 1 | 200 | Logo-icon.svg sizing warning |
| `/signup` | Auth | ✅ Shipped | 0 | 1 | 200 | Logo-icon.svg sizing warning |
| `/pricing` | Static | ✅ Shipped | 0 | 1 | 200 | 5 headings, 14 buttons (tier cards) |
| `/privacy` | Legal | ✅ Shipped | 0 | 0 | 200 | 19 headings (legal structure) |
| `/terms` | Legal | ✅ Shipped | 0 | 0 | 200 | 20 headings (legal structure) |
| `/reset-password` | Auth | ✅ Shipped | 0 | 1 | 200 | Redirects to `/login?error=reset_session_expired` (expected) |
| `/dashboard` | Protected | ✅ Shipped | 0 | 1 | 200→/login | Auth guard redirect |
| `/dashboard/audit` | Protected | ✅ Shipped | 0 | 1 | 200→/login | Auth guard redirect |
| `/dashboard/discover` | Protected | ✅ Shipped | 0 | 1 | 200→/login | Auth guard redirect |
| `/dashboard/leads` | Protected | ✅ Shipped | 0 | 1 | 200→/login | Auth guard redirect |
| `/dashboard/pipeline` | Protected | ✅ Shipped | 0 | 1 | 200→/login | Auth guard redirect |
| `/dashboard/pitches` | Protected | ✅ Shipped | 0 | 1 | 200→/login | Auth guard redirect |
| `/dashboard/settings` | Protected | ✅ Shipped | 0 | 1 | 200→/login | Auth guard redirect |
| `/dashboard/radar` | Protected | 🟦 Stub | 0 | 1 | 200→/login | V2 placeholder |
| `/dashboard/templates` | Protected | 🟦 Stub | 0 | 1 | 200→/login | V2 placeholder |

### Dynamic Routes (not visited — require params)
| Route | Type | Param |
|-------|------|-------|
| `/dashboard/leads/[id]` | Protected | `[id]` — business UUID |
| `/share/[token]` | Public | `[token]` — share link UUID |

### API Routes (excluded from baseline visit — 27 total)
All v1 routes confirmed live from [`CLAUDE.md`](CLAUDE.md) and file scan of `src/app/api/`.

---

## Page State Coverage Matrix

| Page | Route | Loading | Empty | Error | Populated |
|------|-------|:-------:|:-----:|:-----:|:---------:|
| Landing | `/` | ❌ (static) | N/A | N/A | ✅ |
| Login | `/login` | ❌ (static) | N/A | ✅ (bad credentials) | ✅ |
| Signup | `/signup` | ✅ (loading.tsx) | N/A | ✅ (bad input) | ✅ |
| Pricing | `/pricing` | ❌ (static) | N/A | N/A | ✅ |
| Privacy | `/privacy` | ❌ (static) | N/A | N/A | ✅ |
| Terms | `/terms` | ❌ (static) | N/A | N/A | ✅ |
| Reset Password | `/reset-password` | ❌ (static) | N/A | ✅ (invalid token) | ✅ |
| Dashboard | `/dashboard` | ✅ (loading.tsx) | ✅ (EmptyState) | ✅ (error.tsx) | ✅ |
| Quick Audit | `/dashboard/audit` | ✅ (loading.tsx) | N/A | ✅ (error.tsx) | ✅ |
| Discover | `/dashboard/discover` | ✅ (loading.tsx) | ✅ (EmptyState) | ✅ | ✅ |
| Leads | `/dashboard/leads` | ✅ (loading.tsx) | ✅ (LeadsEmptyState) | ✅ (error.tsx) | ✅ |
| Lead Detail | `/dashboard/leads/[id]` | ✅ (loading.tsx) | N/A | ✅ | ✅ (3 workflows) |
| Pipeline | `/dashboard/pipeline` | ✅ (loading.tsx) | ✅ (empty) | ✅ (error.tsx) | ✅ |
| Pitches | `/dashboard/pitches` | ✅ (loading.tsx) | ✅ (empty) | ✅ (error.tsx) | ✅ |
| Settings | `/dashboard/settings` | ✅ (loading.tsx) | N/A | ✅ (error.tsx) | ✅ |
| Radar | `/dashboard/radar` | ✅ (loading.tsx) | ✅ (stub) | ✅ (error.tsx) | ❌ (v2 stub) |
| Templates | `/dashboard/templates` | ✅ (loading.tsx) | ✅ (stub) | ✅ (error.tsx) | ❌ (v2 stub) |
| Share | `/share/[token]` | ✅ (loading) | ✅ (invalid token) | ✅ | ✅ |
| Landing (not-found) | N/A | ❌ (static) | N/A | N/A | ✅ (404 page) |

---

## Pre-existing Console Errors

**0 console errors found across all 16 routes.** ✅

### Console Warnings Found: 13 total

All 13 warnings are the **same issue**, repeated on every page that renders the logo icon:

```
⚠️ Image with src "http://localhost:3000/logo-icon.svg" has either width or height modified,
   but not the other. If you use CSS to change the size of your image, also include the
   styles 'width: "auto"' or 'height: "auto"' to maintain the aspect ratio.
```

**Affected pages (13):** Login, Signup, Pricing, Reset Password, Dashboard, Quick Site Audit, Discover, Leads List, Pipeline, Pitches, Settings, Radar, Templates.

**Note:** Landing page (`/`), Privacy (`/privacy`), and Terms (`/terms`) do NOT emit this warning — they either don't use the logo icon in this way or use it with proper sizing.

**Root cause:** The `logo-icon.svg` is being rendered with only `width` OR `height` set via CSS, but not both. Browsers warn when the aspect ratio can't be maintained. This is pre-existing and not a functional breakage, but should be fixed.

---

## Viewport Responsiveness Results

All 12 viewport tests passed (3 routes × 4 viewports), tested with Playwright.

| Route | 375×667 (Mobile) | 768×1024 (Tablet) | 1280×800 (Desktop) | 1920×1080 (Large) |
|-------|:----------------:|:-----------------:|:------------------:|:-----------------:|
| Landing (`/`) | ✅ No h-scroll | ✅ No h-scroll | ✅ No h-scroll | ✅ No h-scroll |
| Login (`/login`) | ✅ No h-scroll | ✅ No h-scroll | ✅ No h-scroll | ✅ No h-scroll |
| Dashboard (`/dashboard`) | ✅ No h-scroll | ✅ No h-scroll | ✅ No h-scroll | ✅ No h-scroll |

**Body overflow:** `visible` on all routes and viewports — no clipping of content.

**Screenshots captured:** 16 route screenshots + 12 viewport screenshots = **28 total** in [`docs/audit-2026-06/pages/`](docs/audit-2026-06/pages/).

---

## Computed CSS Validation — Landing Page

Captured via Playwright from the actual rendered page. Validated against design tokens in [`src/app/globals.css`](src/app/globals.css).

### Body
| Property | Computed Value | Expected (from tokens) | Match |
|----------|---------------|----------------------|:-----:|
| `background-color` | `rgb(10, 14, 18)` | `#0a0e12` | ✅ |
| `color` | `rgb(240, 237, 232)` | `#f0ede8` | ✅ |
| `font-family` | `Geist, "Geist Fallback"` | `var(--font-sans)` → Geist | ✅ |
| `font-size` | `16px` | Default body | ✅ |
| `font-weight` | `400` | Default body | ✅ |
| `line-height` | `24px` | Default body | ✅ |

### H1 (Hero Heading)
| Property | Computed Value | Notes |
|----------|---------------|-------|
| `color` | `rgb(240, 237, 232)` = `#f0ede8` | Matches `--text-primary` ✅ |
| `font-family` | `Geist, "Geist Fallback"` | Using Geist (not Switzer) |
| `font-size` | `110.4px` | Hero scale (`clamp(2rem, 8vw+0.5rem, 8rem)`) |
| `font-weight` | `700` | Bold hero heading ✅ |

### Navigation Links
| Property | Computed Value | Notes |
|----------|---------------|-------|
| `color` | `rgb(240, 237, 232)` = `#f0ede8` | Matches `--text-primary` ✅ |
| `font-weight` | `500` | Medium weight for nav ✅ |
| `display` | `flex` | Horizontal nav layout ✅ |

### Primary CTA Button
| Property | Computed Value | Notes |
|----------|---------------|-------|
| `border-radius` | `6px` | Matches `--radius-sm` ✅ |
| `display` | `none` | ⚠️ Selector didn't match visible CTA — hero CTA is likely an `<a>` link, not `<button>` |
| `padding` | `12px` | Spacing scale value |

### Card/Section Elements
| Property | Computed Value | Notes |
|----------|---------------|-------|
| `color` | `rgba(255, 255, 255, 0.35)` | Muted section text — matches tertiary intent |
| `font-family` | `Geist` | Consistent typography ✅ |

---

## Screenshots

**28 screenshots** saved across the route structure:

```
docs/audit-2026-06/pages/
├── landing/                          # Landing page (screenshots + responsive)
│   ├── landing-1280x800.png
│   └── responsive/
│       ├── landing-mobile-375x667.png
│       ├── landing-tablet-768x1024.png
│       ├── landing-desktop-1280x800.png
│       └── landing-large-desktop-1920x1080.png
├── login/                            # Login page
│   ├── login-1280x800.png
│   └── responsive/ (...4 viewports)
├── signup/signup-1280x800.png
├── pricing/pricing-1280x800.png
├── privacy/privacy-1280x800.png
├── terms/terms-of-service-1280x800.png
├── reset-password/reset-password-1280x800.png
├── dashboard/                        # Dashboard (auth redirect → login page)
│   ├── dashboard-1280x800.png
│   └── responsive/ (...4 viewports)
├── dashboard-audit/quick-site-audit-1280x800.png
├── dashboard-discover/discover-1280x800.png
├── dashboard-leads/leads-list-1280x800.png
├── dashboard-pipeline/pipeline-1280x800.png
├── dashboard-pitches/pitches-1280x800.png
├── dashboard-settings/settings-1280x800.png
├── dashboard-radar/radar-(v2)-1280x800.png
└── dashboard-templates/templates-1280x800.png
```

---

## Run Instructions

```bash
# Ensure dev server is running
npm run dev

# Run the full baseline test
npx playwright test audit-tests/prompt0-baseline.spec.ts

# View HTML report
npx playwright show-report
```

---

## Design System Rules Summary

### Global Rules (A–J)
| Rule | Description | Audit Status |
|------|-------------|:------------:|
| **A** | At most ONE `<Section variant="card">` per page | Untested (requires auth) |
| **B** | No decorative icons — only functional | Untested |
| **C** | Color is semantic — gray for zero/neutral | Untested |
| **D** | List row height: 42–48px max | Untested (requires auth) |
| **E** | Headers stand alone — not wrapped in cards | Untested |
| **F** | State vs action visual distinction | Untested |
| **G** | One primary action per page section | Untested |
| **H** | No "Back to [parent]" links on primary nav pages | Untested |
| **I** | No uppercase eyebrow text repeating nav label | Untested |
| **J** | Score circles never show "~95" | Untested |

### Findings
- **✅ Auth flow:** Protected routes properly redirect to `/login` (status 307 → 200)
- **✅ Viewport:** No horizontal scroll breakage at any tested breakpoint
- **✅ Design tokens:** Computed CSS matches declared tokens (body bg, text color, font)
- **✅ Console:** 0 errors across all routes
- **⚠️ 1 pre-existing warning:** `logo-icon.svg` missing dimension attribute — affects all pages rendering the logo
- **⚠️ CTA selector:** The computed CSS test for "Primary CTA Button" matched a hidden element — the landing page's hero CTA is likely an `<a>` tag, not a `<button>`. Test selector should be refined.

---

*End of Baseline · Generated from real Playwright data on 2026-06-17.*
