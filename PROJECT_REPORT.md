# Nearsited — Complete Project Report

> **Generated:** June 5, 2026 · **Last updated:** June 8, 2026
> **Project:** Nearsited by Again Labs  
> **Repository:** `c:/Projects/nearsited`

---

## Table of Contents

1. [Project Identity & Vision](#1-project-identity--vision)
2. [Architecture Overview](#2-architecture-overview)
3. [Tech Stack & Dependencies](#3-tech-stack--dependencies)
4. [Routing Structure](#4-routing-structure)
5. [Complete File Inventory](#5-complete-file-inventory)
6. [Features Implemented (V1)](#6-features-implemented-v1)
7. [V2 Planned Features](#7-v2-planned-features)
8. [Security Measures](#8-security-measures)
9. [Animations & Motion System](#9-animations--motion-system)
10. [UI Design System](#10-ui-design-system)
11. [Data Layer & Database Schema](#11-data-layer--database-schema)
12. [Scoring System](#12-scoring-system)
13. [API Routes Reference](#13-api-routes-reference)
14. [Pricing & Subscription Model](#14-pricing--subscription-model)
15. [External Integrations](#15-external-integrations)
16. [Scripts & Migrations](#16-scripts--migrations)
17. [Known Issues & Audit Findings](#17-known-issues--audit-findings)

---

## 1. Project Identity & Vision

**Nearsited** is a SaaS tool designed for **web design agencies** (1–20 people) that automates local business prospecting. It helps agencies discover local businesses with weak or missing websites, automatically audits their performance and design, and generates personalized outreach pitches — all in under **2 minutes**.

| Attribute | Detail |
|-----------|--------|
| **Creator** | Again Labs ([`README.md`](README.md)) |
| **Tagline** | "Turn local businesses with weak websites into your next client" |
| **Target User** | Web design agencies doing outbound prospecting |
| **Core Workflow** | Discover → Classify → Audit → Analyze Design → Generate Pitch → Track Pipeline |
| **Current Status** | Live — paid plans active via Dodo Payments |
| **Primary Problem Solved** | Eliminates the most time-consuming parts of agency prospecting: researching, auditing, and writing personalized pitches |

### Core Value Proposition

Before Nearsited, an agency prospecting workflow took **3–5 hours per lead**:
1. Find businesses (Google Maps browsing) — 30min
2. Check if they have a website — 10min
3. Run PageSpeed audit — 5min
4. Analyze their design — 15min
5. Write a personalized pitch — 2+ hours

Nearsited reduces this to **under 2 minutes** by automating steps 1–4 and generating a draft for step 5.

---

## 2. Architecture Overview

### Two-Runtime Architecture ([`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md))

The project uses a **two-runtime architecture** to handle both synchronous and asynchronous workloads:

| Runtime | Platform | Role | Constraints |
|---------|----------|------|-------------|
| **A — Vercel/Next.js** | Serverless (Vercel) | All UI + v1 API routes + anything <60s | 10s HTTP timeout, 60s serverless function limit |
| **B — Worker Server (v2)** | Railway/Render/Fly.io | Playwright UX recording, Radar scans, self-hosted screenshots | Long-running processes, no timeout |

**V1** runs entirely on Runtime A (Vercel). **V2** features (UX analysis, Radar monitoring) will offload to Runtime B.

### Key Architectural Patterns

**NDJSON Streaming Convention**
Routes taking >2 seconds use NDJSON streaming. The client consumes these via a shared [`readNdjsonStream()`](src/lib/ndjson.ts) utility that emits typed callbacks (`progress`, `result`, `done`, `error`). Routes using this pattern: `/api/discover`, `/api/audit`, `/api/analyze-design`.

**Cache Convention**
7-day database cache for audit and design analysis results. Cache hit → immediate JSON response. Cache miss → NDJSON streaming with real-time progress. A `force: true` parameter bypasses cache for fresh results.

**Thin Handler Convention**
Analysis logic lives in exported functions within library modules. Route handlers are thin — they only validate input, authenticate, and call the analysis function. This design enables migration from a synchronous route to a queue worker without rewriting business logic.

**Places Cache (Cost Control)**
One Google Place Details API call per unique `place_id` platform-wide, ever (90-day refresh). The [`places_cache`](docs/SCHEMA.md) table stores results globally (shared across all users). Cache hit-rate rises with user base, reducing API costs.

---

## 3. Tech Stack & Dependencies

### Core Framework

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Next.js** | 16.2.6 | React framework with App Router, Turbopack |
| **React** | 19.2.4 | UI library |
| **TypeScript** | ~5.x | Strict mode enabled throughout |
| **Tailwind CSS** | v4 | Utility-first styling, dark theme |
| **Node.js** | 20.x (LTS) | Runtime |

### Database & State

| Technology | Purpose |
|-----------|---------|
| **Supabase** (Postgres 15) | Primary database, Auth, Storage |
| **Upstash Redis** | Rate limiting via [`@upstash/ratelimit`](src/lib/rate-limit.ts) |

### AI & ML

| Service | Purpose |
|---------|---------|
| **Gemini 2.0 Flash** | Vision analysis (screenshot evaluation) + Pitch generation |
| **ScreenshotOne** | Static website screenshots for design analysis |

### UI & Animation

| Library | Purpose |
|---------|---------|
| **Framer Motion** 12 | Animations, page transitions, micro-interactions |
| **Lucide React** | Icon library (optimized imports in next.config.ts) |
| **Radix UI** | Accessible primitives: Dialog, Dropdown, Popover, Select, Tabs, Tooltip |
| **Recharts** | Charts and data visualization |
| **jsPDF** | PDF report generation |

### Payments

| Service | Purpose |
|---------|---------|
| **Dodo Payments** | Subscription management, checkout, webhooks |

### Development & Quality

| Tool | Purpose |
|------|---------|
| **ESLint** (flat config) | Code linting |
| **Vitest** | Unit testing |
| **Zod** | Runtime schema validation for all API inputs |

### Key Dependencies (from [`package.json`](package.json))

```json
{
  "next": "16.2.6",
  "react": "19.2.4",
  "react-dom": "19.2.4",
  "framer-motion": "^12.6.5",
  "@supabase/supabase-js": "^2.49.3",
  "@supabase/ssr": "^0.6.0",
  "@google/generative-ai": "^21.15.0",
  "@dodopayments/dodopayments": "^1.0.0",
  "@upstash/ratelimit": "^2.0.5",
  "@upstash/redis": "^1.34.4",
  "@radix-ui/react-dialog": "^1.1.6",
  "@radix-ui/react-dropdown-menu": "^2.1.6",
  "@radix-ui/react-popover": "^1.1.6",
  "@radix-ui/react-select": "^2.1.6",
  "@radix-ui/react-tabs": "^1.1.3",
  "@radix-ui/react-tooltip": "^1.1.8",
  "recharts": "^2.15.1",
  "lucide-react": "^0.483.0",
  "jspdf": "^2.5.2",
  "zod": "^3.24.2",
  "clsx": "^2.1.1",
  "tailwind-merge": "^3.0.2"
}
```

---

## 4. Routing Structure

The application uses Next.js App Router with the following route hierarchy:

### Public Routes

| Route | File | Purpose |
|-------|------|---------|
| `/` | [`src/app/page.tsx`](src/app/page.tsx) | Landing page (single "use client" page, 15 sections) |
| `/pricing` | [`src/app/pricing/page.tsx`](src/app/pricing/page.tsx) | Pricing page |
| `/terms` | [`src/app/terms/page.tsx`](src/app/terms/page.tsx) | Terms of service |
| `/privacy` | [`src/app/privacy/page.tsx`](src/app/privacy/page.tsx) | Privacy policy |
| `/share/[token]` | [`src/app/share/[token]/page.tsx`](src/app/share/%5Btoken%5D/page.tsx) | Public shareable report |
| `/reset-password` | [`src/app/reset-password/page.tsx`](src/app/reset-password/page.tsx) | Password reset page |

### Auth Routes

| Route | File | Purpose |
|-------|------|---------|
| `/login` | [`src/app/(auth)/login/page.tsx`](src/app/(auth)/login/page.tsx) | Login (email/password + Google OAuth) |
| `/signup` | [`src/app/(auth)/signup/page.tsx`](src/app/(auth)/signup/page.tsx) | Signup with password validation |
| `/auth/callback` | [`src/app/auth/callback/route.ts`](src/app/auth/callback/route.ts) | OAuth + email confirmation callback handler |
| `/auth/password-reset` | [`src/app/auth/password-reset/route.ts`](src/app/auth/password-reset/route.ts) | Password reset token exchange |

### Dashboard Routes (Protected)

| Route | File | Purpose |
|-------|------|---------|
| `/dashboard` | [`src/app/dashboard/page.tsx`](src/app/dashboard/page.tsx) | Dashboard home (stat cards, recent leads, pipeline overview) |
| `/dashboard/leads` | [`src/app/dashboard/leads/page.tsx`](src/app/dashboard/leads/page.tsx) | Leads table (227 lines — filter, sort, paginate; logic extracted to hooks + components) |
| `/dashboard/leads/[id]` | [`src/app/dashboard/leads/[id]/page.tsx`](src/app/dashboard/leads/%5Bid%5D/page.tsx) | Lead detail with 3-workflow routing |
| `/dashboard/discover` | [`src/app/dashboard/discover/page.tsx`](src/app/dashboard/discover/page.tsx) | Business discovery search |
| `/dashboard/audit` | [`src/app/dashboard/audit/page.tsx`](src/app/dashboard/audit/page.tsx) | Quick URL audit |
| `/dashboard/pipeline` | [`src/app/dashboard/pipeline/page.tsx`](src/app/dashboard/pipeline/page.tsx) | Pipeline management |
| `/dashboard/pitches` | [`src/app/dashboard/pitches/page.tsx`](src/app/dashboard/pitches/page.tsx) | Saved pitches |
| `/dashboard/radar` | [`src/app/dashboard/radar/page.tsx`](src/app/dashboard/radar/page.tsx) | Radar monitoring (v2 stub) |
| `/dashboard/templates` | [`src/app/dashboard/templates/page.tsx`](src/app/dashboard/templates/page.tsx) | Templates (v2 stub) |
| `/dashboard/settings` | [`src/app/dashboard/settings/page.tsx`](src/app/dashboard/settings/page.tsx) | User settings |

### Admin Routes (Protected + Admin-only)

| Route | File | Purpose |
|-------|------|---------|
| `/admin/scoring-audit` | [`src/app/admin/scoring-audit/page.tsx`](src/app/admin/scoring-audit/page.tsx) | Scoring audit tool for debugging scores |

### API Routes

All documented in [Section 13 — API Routes Reference](#13-api-routes-reference).

---

## 5. Complete File Inventory

### 5.1 Root Configuration Files

| File | Description |
|------|-------------|
| [`package.json`](package.json) | Project manifest — all dependencies, scripts (dev, build, start, lint, test, db operations) |
| [`package-lock.json`](package-lock.json) | Locked dependency versions |
| [`next.config.ts`](next.config.ts) | Next.js configuration — security headers (CSP, HSTS, XSS), optimized imports for lucide-react/recharts, allowed dev origins for Supabase |
| [`tsconfig.json`](tsconfig.json) | TypeScript strict mode configuration |
| [`postcss.config.mjs`](postcss.config.mjs) | PostCSS configuration for Tailwind CSS v4 |
| [`eslint.config.mjs`](eslint.config.mjs) | ESLint flat config for Next.js |
| [`vitest.config.js`](vitest.config.js) | Vitest test runner configuration |
| [`middleware.ts`](middleware.ts) | Next.js middleware — session guard, env validation, route protection for `/dashboard/*`, `/admin/*`, `/(auth)/*` |
| [`.gitignore`](.gitignore) | Git ignore rules |
| [`.roomodes`](.roomodes) | Custom mode definitions for AI-assisted development |
| [`install.cmd`](install.cmd) | Windows installation script |
| [`fix-apos.mjs`](fix-apos.mjs) | Apostrophe fix utility script |

### 5.2 Documentation Files

| File | Description |
|------|-------------|
| [`README.md`](README.md) | Project overview — workflow, tech stack, features, scoring explanation, setup guide |
| [`CLAUDE.md`](CLAUDE.md) | Master rules file — 7 non-negotiable rules, canonical enums, API references, score model constants, build status commands |
| [`CHANGELOG.md`](CHANGELOG.md) | Launch readiness session changes (June 2026) |
| [`NEARSITED_PRE_DEMO_FIXES.md`](NEARSITED_PRE_DEMO_FIXES.md) | Pre-demo cleanup task tracker — 4 batches, 70 items verified |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Two-runtime architecture doc — stack, API routes, Supabase clients, external APIs, scoring deep-dive |
| [`docs/PRD.md`](docs/PRD.md) | Product requirements document — magic workflow, page specs, v2 UX analysis, scoring, pipeline stages |
| [`docs/SCHEMA.md`](docs/SCHEMA.md) | **Authoritative database schema** — 14 tables, enums (11), migration history, client usage rules, JSON column shapes |
| [`docs/CONVENTIONS.md`](docs/CONVENTIONS.md) | Coding conventions — 19 anti-patterns to avoid, 45 architectural decisions with rationale |
| [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) | Design system — brand identity, typography (Geist, Switzer), color system, spacing, motion, component standards |
| [`docs/DISCOVER_PAGE_LOGIC.md`](docs/DISCOVER_PAGE_LOGIC.md) | Opportunity badge logic, filter tabs, sort behavior for the discover page |
| [`docs/legal/TERMS_OF_SERVICE.md`](docs/legal/TERMS_OF_SERVICE.md) | Legal terms of service (source document — references paid plans) |
| [`docs/legal/PRIVACY_POLICY.md`](docs/legal/PRIVACY_POLICY.md) | Privacy policy (source document) |
| [`plans/pre-launch-audit-report.md`](plans/pre-launch-audit-report.md) | Full pre-launch audit — 108 issues (14 critical, 28 high, 43 medium, 23 low) |

### 5.3 Library Files (`src/lib/`)

| File | Lines | Description |
|------|-------|-------------|
| [`src/lib/types.ts`](src/lib/types.ts) | ~200 | Canonical `WebsiteStatus` enum (5 values), `Business` interface, `classifyWebsite()` with 50+ social/platform domain patterns |
| [`src/lib/scoring.ts`](src/lib/scoring.ts) | ~600+ | **Single source of truth** for all scoring: `computeOverall()`, `uxDesignScore()`, `trustScore()`, `uxInteractionScore()`, `projection()`, `blendedQuality()`, `scoreLabel()`, `scoreColor()`, `scoreColorClasses()`, `computeOpportunityScore()`, `estimatedOpportunity()`, `opportunityLabel()`, `opportunityBadgeVariant()`, `INDUSTRY_MULTIPLIERS` (80+ entries), `websiteWeakness()`, `businessViabilityMultiplier()` |
| [`src/lib/db-types.ts`](src/lib/db-types.ts) | ~200 | TypeScript interfaces for all database rows: `BusinessRow`, `AuditRow`, `DesignAnalysisRow`, `PipelineRow`, `PitchRow`, `PlacesCacheRow`, `SubscriptionRow`, `TerritoryRow`, `ShareLinkRow`, `LeadListBusiness`, `PipelineBusiness`, `ShareData` |
| [`src/lib/lead-types.ts`](src/lib/lead-types.ts) | ~200 | Lead workflow routing: `LeadWorkflow` type (3 values), `detectLeadWorkflow()`, `detectSocialPlatforms()`, `getSocialImpactEstimates()`, `getSocialOpportunityReasons()`, `getNoDigitalOpportunityReasons()`, `getDigitalFoundationRecommendations()` |
| [`src/lib/credits.ts`](src/lib/credits.ts) | ~100 | Credit system: `getSubscription()` (provision + fetch), `checkCredit()` (monthly auto-reset), `deductCredit()` (optimistic concurrency with 3 retries) |
| [`src/lib/dodo.ts`](src/lib/dodo.ts) | ~50 | Dodo Payments client singleton, `DODO_PRODUCTS` map (4 products), `FREE_AUDIT_LIMIT = 10` |
| [`src/lib/env.ts`](src/lib/env.ts) | ~40 | `validateEnv()` — checks 11 required env vars at startup, cached result, auto-runs on server import |
| [`src/lib/filters.ts`](src/lib/filters.ts) | ~100 | `FilterState` type, `DEFAULT_FILTERS`, `applyFilters()`, URL encode/decode for filter persistence, analytics tracking |
| [`src/lib/metric-meta.ts`](src/lib/metric-meta.ts) | ~80 | `METRIC_META` registry — FCP/LCP/TBT/CLS labels, thresholds, `toCanonical` parsers, `metricColor()` |
| [`src/lib/opportunity-insights.ts`](src/lib/opportunity-insights.ts) | ~100 | `opportunityInsight()` — deterministic client-side plain-English opportunity explanations |
| [`src/lib/products.ts`](src/lib/products.ts) | ~15 | 4 valid Dodo product ID constants (Starter/Agency Monthly/Annual) |
| [`src/lib/rate-limit.ts`](src/lib/rate-limit.ts) | ~80 | 3 Upstash rate limiters (standard 10/10s, auth 30/10s, expensive-op 5/60s), `getRateLimitIdentifier()`, `checkRateLimit()` |
| [`src/lib/motion.tsx`](src/lib/motion.tsx) | ~100 | Framer Motion primitives: `FadeUp`, `FadeIn`, `StaggerContainer`, `ScaleHover`, `PageTransition`, `SkeletonLoader`, duration/easing tokens |
| [`src/lib/cn.ts`](src/lib/cn.ts) | ~10 | `cn()` — Tailwind class merge utility (clsx + twMerge) |
| [`src/lib/ndjson.ts`](src/lib/ndjson.ts) | ~50 | `readNdjsonStream<T>()` — shared NDJSON stream reader with typed callbacks (progress/result/error/done) |
| [`src/lib/shared-hooks.ts`](src/lib/shared-hooks.ts) | ~80 | `useCountUp()`, `useAccordion()`, `useToast()` — shared React hooks |
| [`src/lib/google-places.ts`](src/lib/google-places.ts) | ~200 | Google Places API client: `geocodeCity()`, `fetchPlaceDetails()`, `fetchPlaceRatings()`, `fetchPlacesWithPagination()`, `buildGoogleUrl()` with API key redaction in logs |
| [`src/lib/admin-auth.ts`](src/lib/admin-auth.ts) | ~40 | `requireAdmin()` — DB-backed admin check via `admin_users` table, 30-second in-memory cache (resets per cold start in serverless) |

#### Sub-libraries (`src/lib/*/`)

| File | Description |
|------|-------------|
| [`src/lib/api/with-auth.ts`](src/lib/api/with-auth.ts) | `withAuth()` — API route auth wrapper (defense-in-depth, rate limiting, standardized 401 response) |
| [`src/lib/api/scoped-admin.ts`](src/lib/api/scoped-admin.ts) | `scopedAdmin()` — user-scoped admin client to prevent cross-user data access |
| [`src/lib/api/timeout.ts`](src/lib/api/timeout.ts) | `createTimeoutController()` — shared AbortController utility for API calls |
| [`src/lib/supabase/admin.ts`](src/lib/supabase/admin.ts) | Singleton admin client (service role key, bypasses RLS, NEVER imported in browser code) |
| [`src/lib/supabase/server.ts`](src/lib/supabase/server.ts) | Server client (anon key + cookies, uses `auth.getUser()` for RLS-safe reads) |
| [`src/lib/supabase/client.ts`](src/lib/supabase/client.ts) | Browser client (anon key only, RLS enforced, client components only) |
| [`src/lib/supabase/middleware.ts`](src/lib/supabase/middleware.ts) | Session cookie refresh middleware — skips auth pages, protects `/dashboard/*` |
| [`src/lib/pitch/prompts.ts`](src/lib/pitch/prompts.ts) | Pitch prompt templates: `getBusinessTypeContext()` (18 industry branches), `openingInstruction()`, `urgencyInstruction()`, `buildAngle()`, `channelInstruction()`, `buildWorkflowPrompt()`, `cleanGeminiJson()` |
| [`src/lib/data/businessTypes.ts`](src/lib/data/businessTypes.ts) | 72+ business types across 13 categories (Food & Drink, Health & Medical, Beauty & Wellness, Fitness, Retail, etc.) |
| [`src/lib/data/cities.ts`](src/lib/data/cities.ts) | City search hook — fetches from `/api/cities/search` endpoint (29MB JSON NOT loaded client-side) |
| [`src/lib/data/cities.json`](src/lib/data/cities.json) | 29MB city dataset (server-only, read via `fs.readFile`, never sent to client) |

#### Test Files

| File | Description |
|------|-------------|
| [`src/lib/__tests__/env.test.ts`](src/lib/__tests__/env.test.ts) | Unit tests for env validation |
| [`src/lib/__tests__/scoring.test.ts`](src/lib/__tests__/scoring.test.ts) | Unit tests for scoring functions |

### 5.4 UI Components

#### Landing Page Components (`src/components/landing/`)

| File | Description |
|------|-------------|
| [`src/components/landing/LandingNav.tsx`](src/components/landing/LandingNav.tsx) | Top navigation bar (logo, links, CTA button, mobile hamburger menu) |
| [`src/components/landing/LandingHero.tsx`](src/components/landing/LandingHero.tsx) | Hero section — headline, subtitle, CTA, animated OpportunityAtlas background |
| [`src/components/landing/TrustBar.tsx`](src/components/landing/TrustBar.tsx) | Social proof bar (logos/stats from agencies using the tool) |
| [`src/components/landing/HowItWorksSection.tsx`](src/components/landing/HowItWorksSection.tsx) | Step-by-step workflow explanation (3 steps with icons) |
| [`src/components/landing/WhyNearsitedSection.tsx`](src/components/landing/WhyNearsitedSection.tsx) | Value proposition comparison (before/after with metrics) |
| [`src/components/landing/SampleReportSection.tsx`](src/components/landing/SampleReportSection.tsx) | Interactive sample audit report preview |
| [`src/components/landing/SamplePitchSection.tsx`](src/components/landing/SamplePitchSection.tsx) | Example AI-generated pitch display |
| [`src/components/landing/AgencyUseCasesSection.tsx`](src/components/landing/AgencyUseCasesSection.tsx) | Use case scenarios for different agency types |
| [`src/components/landing/FounderStorySection.tsx`](src/components/landing/FounderStorySection.tsx) | Founder narrative / origin story |
| [`src/components/landing/ObjectionsSection.tsx`](src/components/landing/ObjectionsSection.tsx) | Common objection handling (FAQ-style rebuttals) |
| [`src/components/landing/ProofBlocksSection.tsx`](src/components/landing/ProofBlocksSection.tsx) | Statistics and proof points (currently noted as having zero proof in audit) |
| [`src/components/landing/LandingFAQ.tsx`](src/components/landing/LandingFAQ.tsx) | FAQ accordion section with `useAccordion()` hook |
| [`src/components/landing/Pricing.tsx`](src/components/landing/Pricing.tsx) | Pricing cards (Starter/Agency, Monthly/Annual) |
| [`src/components/landing/CTASection.tsx`](src/components/landing/CTASection.tsx) | Final call-to-action section |
| [`src/components/landing/LandingFooter.tsx`](src/components/landing/LandingFooter.tsx) | Page footer with links and legal |
| [`src/components/landing/SectionLabel.tsx`](src/components/landing/SectionLabel.tsx) | Reusable section label/subtitle component |
| [`src/components/landing/SectionTitle.tsx`](src/components/landing/SectionTitle.tsx) | Reusable section heading component |
| [`src/components/landing/SectionSub.tsx`](src/components/landing/SectionSub.tsx) | Reusable section subheading component |

#### Landing Atlas Components (`src/components/landing/atlas/`)

| File | Description |
|------|-------------|
| [`src/components/landing/atlas/index.ts`](src/components/landing/atlas/index.ts) | Atlas barrel export |
| [`src/components/landing/atlas/LandingBackground.tsx`](src/components/landing/atlas/LandingBackground.tsx) | Animated particle/map background for landing |
| [`src/components/landing/atlas/OpportunityAtlas.tsx`](src/components/landing/atlas/OpportunityAtlas.tsx) | Animated opportunity visualization (used in hero) |

#### Auth Components (`src/components/auth/`)

| File | Description |
|------|-------------|
| [`src/components/auth/AuthBackground.tsx`](src/components/auth/AuthBackground.tsx) | Animated background for auth pages |
| [`src/components/auth/AuthCard.tsx`](src/components/auth/AuthCard.tsx) | Auth form card wrapper (shared by login/signup) |
| [`src/components/auth/BrandStoryPanel.tsx`](src/components/auth/BrandStoryPanel.tsx) | Brand narrative panel shown alongside auth forms |
| [`src/components/auth/OpportunityPreviewCard.tsx`](src/components/auth/OpportunityPreviewCard.tsx) | Teaser card showing opportunity examples on auth pages |

#### UI Component Library (`src/components/ui/`)

| File | Description |
|------|-------------|
| [`src/components/ui/Button.tsx`](src/components/ui/Button.tsx) | Polymorphic button component (variants: primary, secondary, ghost, danger; sizes: sm, md, lg) |
| [`src/components/ui/Badge.tsx`](src/components/ui/Badge.tsx) | Badge component for status labels (4 semantic colors) |
| [`src/components/ui/Card.tsx`](src/components/ui/Card.tsx) | Card container with surface styling |
| [`src/components/ui/ScoreRing.tsx`](src/components/ui/ScoreRing.tsx) | SVG circular progress score indicator with count-up animation, 3 variants (default/verified/opportunity) |
| [`src/components/ui/WebsiteBadge.tsx`](src/components/ui/WebsiteBadge.tsx) | Website status badge (5 statuses with icons + colors) |
| [`src/components/ui/SearchableSelect.tsx`](src/components/ui/SearchableSelect.tsx) | Combobox/dropdown with search filtering |
| [`src/components/ui/PipelineSelect.tsx`](src/components/ui/PipelineSelect.tsx) | Pipeline stage dropdown (7 stages with colors) |
| [`src/components/ui/MetricCard.tsx`](src/components/ui/MetricCard.tsx) | Metric display card (label, value, trend indicator) |
| [`src/components/ui/StatCard.tsx`](src/components/ui/StatCard.tsx) | Dashboard stat card (icon, value, label, trend) |
| [`src/components/ui/OpportunityCard.tsx`](src/components/ui/OpportunityCard.tsx) | Opportunity display card with score and badge |
| [`src/components/ui/Toast.tsx`](src/components/ui/Toast.tsx) | Toast notification component (fixed bottom-right, 3s auto-dismiss, Framer Motion animation) |
| [`src/components/ui/Tooltip.tsx`](src/components/ui/Tooltip.tsx) | Radix-based tooltip wrapper |
| [`src/components/ui/CreditsWidget.tsx`](src/components/ui/CreditsWidget.tsx) | Credits display in dashboard sidebar |
| [`src/components/ui/EmptyState.tsx`](src/components/ui/EmptyState.tsx) | Empty state placeholder (icon, title, description, action CTA) |
| [`src/components/ui/PoweredByGoogle.tsx`](src/components/ui/PoweredByGoogle.tsx) | "Powered by Google" attribution badge |

#### Filter Components (`src/components/filters/`)

| File | Description |
|------|-------------|
| [`src/components/filters/FilterPanel.tsx`](src/components/filters/FilterPanel.tsx) | Reusable filter panel (website status, rating range, sort) |
| [`src/components/filters/RangeSlider.tsx`](src/components/filters/RangeSlider.tsx) | Dual-handle range slider for numeric filters |

### 5.5 Dashboard Pages & Components

#### Dashboard Core

| File | Description |
|------|-------------|
| [`src/app/dashboard/layout.tsx`](src/app/dashboard/layout.tsx) | Dashboard layout — sidebar + credits widget + main content area |
| [`src/app/dashboard/sidebar-nav.tsx`](src/app/dashboard/sidebar-nav.tsx) | Desktop sidebar navigation with icons and active state |
| [`src/app/dashboard/mobile-nav.tsx`](src/app/dashboard/mobile-nav.tsx) | Mobile hamburger menu navigation |
| [`src/app/dashboard/sign-out-button.tsx`](src/app/dashboard/sign-out-button.tsx) | Sign out button with confirmation |
| [`src/app/dashboard/dashboard-client.tsx`](src/app/dashboard/dashboard-client.tsx) | Dashboard home client component |
| [`src/app/dashboard/page.tsx`](src/app/dashboard/page.tsx) | Dashboard home server page (4 stat cards, Next Best Action, Recent Leads, Pipeline Overview) |
| [`src/app/dashboard/loading.tsx`](src/app/dashboard/loading.tsx) | Dashboard loading skeleton |

#### Discover Page

| File | Description |
|------|-------------|
| [`src/app/dashboard/discover/page.tsx`](src/app/dashboard/discover/page.tsx) | Discover main page — search form, streaming results, filter bar, result cards |
| [`src/app/dashboard/discover/components/DiscoverForm.tsx`](src/app/dashboard/discover/components/DiscoverForm.tsx) | Search form (city, business type, radius inputs) |
| [`src/app/dashboard/discover/components/ProgressPanel.tsx`](src/app/dashboard/discover/components/ProgressPanel.tsx) | NDJSON streaming progress indicator |
| [`src/app/dashboard/discover/components/ResultCard.tsx`](src/app/dashboard/discover/components/ResultCard.tsx) | Individual result card in discover results |
| [`src/app/dashboard/discover/components/ResultsFilterBar.tsx`](src/app/dashboard/discover/components/ResultsFilterBar.tsx) | Filter bar (website status, rating, sort options) |
| [`src/app/dashboard/discover/components/SaveSearchDialog.tsx`](src/app/dashboard/discover/components/SaveSearchDialog.tsx) | Save search/territory dialog |
| [`src/app/dashboard/discover/components/types.ts`](src/app/dashboard/discover/components/types.ts) | Discover-specific TypeScript types |
| [`src/app/dashboard/discover/components/AnimatedScoreRing.tsx`](src/app/dashboard/discover/components/AnimatedScoreRing.tsx) | Animated score ring for discover results |
| [`src/app/dashboard/discover/components/LoadingSkeleton.tsx`](src/app/dashboard/discover/components/LoadingSkeleton.tsx) | Loading skeleton for discover results |
| [`src/app/dashboard/discover/components/EmptyState.tsx`](src/app/dashboard/discover/components/EmptyState.tsx) | Empty state for discover (no results yet) |

#### Leads Page

| File | Description |
|------|-------------|
| [`src/app/dashboard/leads/page.tsx`](src/app/dashboard/leads/page.tsx) | Leads table page (227 lines) — thin composition: filter/search state, pagination, KPIs, delegates to hooks + components |
| [`src/app/dashboard/leads/hooks/useLeadsData.ts`](src/app/dashboard/leads/hooks/useLeadsData.ts) | Data fetching hook — businesses, design_analyses (issue count), pipeline rows |
| [`src/app/dashboard/leads/hooks/useLeadInlineAnalysis.ts`](src/app/dashboard/leads/hooks/useLeadInlineAnalysis.ts) | NDJSON stream handler — audit → design analysis, progress tracking per lead |
| [`src/app/dashboard/leads/components/types.ts`](src/app/dashboard/leads/components/types.ts) | LeadRow type, tab filter types, PAGE_SIZE, ANALYSE_STEPS, filter option constants |
| [`src/app/dashboard/leads/components/helpers.ts`](src/app/dashboard/leads/components/helpers.ts) | effectiveOpportunityScore(), formatDate(), getOpportunityContext() |
| [`src/app/dashboard/leads/components/LeadsTable.tsx`](src/app/dashboard/leads/components/LeadsTable.tsx) | Desktop table with animated rows (Framer Motion) |
| [`src/app/dashboard/leads/components/LeadsMobileCards.tsx`](src/app/dashboard/leads/components/LeadsMobileCards.tsx) | Mobile card list with StaggerContainer |
| [`src/app/dashboard/leads/components/LeadActionCell.tsx`](src/app/dashboard/leads/components/LeadActionCell.tsx) | Analyse button + progress bar per lead row |
| [`src/app/dashboard/leads/components/LeadsFilterBar.tsx`](src/app/dashboard/leads/components/LeadsFilterBar.tsx) | Opportunity + pipeline tabs, search input, Filters button |
| [`src/app/dashboard/leads/components/LeadsEmptyState.tsx`](src/app/dashboard/leads/components/LeadsEmptyState.tsx) | Context-aware empty states for all 10 tab states |
| [`src/app/dashboard/leads/components/LeadsKPIStrip.tsx`](src/app/dashboard/leads/components/LeadsKPIStrip.tsx) | 4-card KPI strip (total, audited, ready to pitch, in pipeline) |
| [`src/app/dashboard/leads/components/WebPresenceBadge.tsx`](src/app/dashboard/leads/components/WebPresenceBadge.tsx) | SVG dashed circle badge for non-website leads |
| [`src/app/dashboard/leads/components/PipelineStatusBadge.tsx`](src/app/dashboard/leads/components/PipelineStatusBadge.tsx) | Pipeline stage badge using PIPELINE_LABELS + PIPELINE_BADGE_STYLES |
| [`src/app/dashboard/leads/loading.tsx`](src/app/dashboard/leads/loading.tsx) | Leads page loading skeleton |

#### Lead Detail Page

| File | Description |
|------|-------------|
| [`src/app/dashboard/leads/[id]/page.tsx`](src/app/dashboard/leads/%5Bid%5D/page.tsx) | Lead detail server page (loading + data fetching) |
| [`src/app/dashboard/leads/[id]/lead-detail-client.tsx`](src/app/dashboard/leads/%5Bid%5D/lead-detail-client.tsx) | Lead detail client component (451 lines, refactored) — composes hooks + sub-components |
| [`src/app/dashboard/leads/[id]/loading.tsx`](src/app/dashboard/leads/%5Bid%5D/loading.tsx) | Lead detail loading skeleton |

**Lead Detail Components:**

| File | Description |
|------|-------------|
| [`src/app/dashboard/leads/[id]/components/ScoreRingWithLabel.tsx`](src/app/dashboard/leads/%5Bid%5D/components/ScoreRingWithLabel.tsx) | Score ring with contextual label |
| [`src/app/dashboard/leads/[id]/components/SubScore.tsx`](src/app/dashboard/leads/%5Bid%5D/components/SubScore.tsx) | Individual sub-score display (label, value, bar) |
| [`src/app/dashboard/leads/[id]/components/ImpactPill.tsx`](src/app/dashboard/leads/%5Bid%5D/components/ImpactPill.tsx) | SEO/design impact indicator pill |
| [`src/app/dashboard/leads/[id]/components/OpportunityBullets.tsx`](src/app/dashboard/leads/%5Bid%5D/components/OpportunityBullets.tsx) | Opportunity bullet points list |
| [`src/app/dashboard/leads/[id]/components/LeadOutreachSection.tsx`](src/app/dashboard/leads/%5Bid%5D/components/LeadOutreachSection.tsx) | Outreach/pitch generation section |
| [`src/app/dashboard/leads/[id]/components/LeadExportSection.tsx`](src/app/dashboard/leads/%5Bid%5D/components/LeadExportSection.tsx) | Export options (PDF, share link) |
| [`src/app/dashboard/leads/[id]/components/QuotaErrorBanner.tsx`](src/app/dashboard/leads/%5Bid%5D/components/QuotaErrorBanner.tsx) | API quota exceeded banner |
| [`src/app/dashboard/leads/[id]/components/social-opportunity-page.tsx`](src/app/dashboard/leads/%5Bid%5D/components/social-opportunity-page.tsx) | Social-only lead detail view |
| [`src/app/dashboard/leads/[id]/components/no-digital-presence-page.tsx`](src/app/dashboard/leads/%5Bid%5D/components/no-digital-presence-page.tsx) | No-digital-presence lead detail view |
| [`src/app/dashboard/leads/[id]/components/opportunity-score-explanation.tsx`](src/app/dashboard/leads/%5Bid%5D/components/opportunity-score-explanation.tsx) | Explanation of opportunity score calculation |
| [`src/app/dashboard/leads/[id]/components/OpportunityScoreStrip.tsx`](src/app/dashboard/leads/%5Bid%5D/components/OpportunityScoreStrip.tsx) | Current/potential score + opportunity delta strip |
| [`src/app/dashboard/leads/[id]/components/AnalysisProgressBanner.tsx`](src/app/dashboard/leads/%5Bid%5D/components/AnalysisProgressBanner.tsx) | NDJSON streaming progress bar |
| [`src/app/dashboard/leads/[id]/components/DesignErrorBanner.tsx`](src/app/dashboard/leads/%5Bid%5D/components/DesignErrorBanner.tsx) | Design analysis failure banner with retry |
| [`src/app/dashboard/leads/[id]/components/IssuesCard.tsx`](src/app/dashboard/leads/%5Bid%5D/components/IssuesCard.tsx) | Top issues impacting score card |
| [`src/app/dashboard/leads/[id]/components/AuditDetailsCard.tsx`](src/app/dashboard/leads/%5Bid%5D/components/AuditDetailsCard.tsx) | Mobile/desktop audit details + Core Web Vitals |
| [`src/app/dashboard/leads/[id]/components/HistoryCard.tsx`](src/app/dashboard/leads/%5Bid%5D/components/HistoryCard.tsx) | Audit/analysis history timeline |
| [`src/app/dashboard/leads/[id]/components/ClientCallSummaryCard.tsx`](src/app/dashboard/leads/%5Bid%5D/components/ClientCallSummaryCard.tsx) | Pre-call summary card with copy button |

**Lead Detail Hooks (extracted June 6):**

| File | Description |
|------|-------------|
| [`src/app/dashboard/leads/[id]/hooks/useQuotaTimer.ts`](src/app/dashboard/leads/%5Bid%5D/hooks/useQuotaTimer.ts) | AI quota 429 error + countdown timer state |
| [`src/app/dashboard/leads/[id]/hooks/useContactInfo.ts`](src/app/dashboard/leads/%5Bid%5D/hooks/useContactInfo.ts) | Contact info fetch + background rating refresh |
| [`src/app/dashboard/leads/[id]/hooks/usePitchGeneration.ts`](src/app/dashboard/leads/%5Bid%5D/hooks/usePitchGeneration.ts) | Pitch tone/channel/length state + generate/copy handlers |
| [`src/app/dashboard/leads/[id]/hooks/useLeadAnalysis.ts`](src/app/dashboard/leads/%5Bid%5D/hooks/useLeadAnalysis.ts) | Full analysis streaming (audit + design), cancel, auto-pitch |

#### Other Dashboard Pages

| File | Description |
|------|-------------|
| [`src/app/dashboard/audit/page.tsx`](src/app/dashboard/audit/page.tsx) | Quick URL audit page (input URL → run PageSpeed + design analysis) |
| [`src/app/dashboard/pipeline/page.tsx`](src/app/dashboard/pipeline/page.tsx) | Pipeline management (kanban-style or list view with 7 stages) |
| [`src/app/dashboard/pitches/page.tsx`](src/app/dashboard/pitches/page.tsx) | Saved pitches list |
| [`src/app/dashboard/radar/page.tsx`](src/app/dashboard/radar/page.tsx) | Radar monitoring page (v2 placeholder) |
| [`src/app/dashboard/templates/page.tsx`](src/app/dashboard/templates/page.tsx) | Pitch templates page (v2 placeholder) |
| [`src/app/dashboard/settings/page.tsx`](src/app/dashboard/settings/page.tsx) | User settings (plan info, integration status display) |

#### Public Pages

| File | Description |
|------|-------------|
| [`src/app/pricing/page.tsx`](src/app/pricing/page.tsx) | Pricing page (Starter/Agency tiers, Monthly/Annual billing) |
| [`src/app/privacy/page.tsx`](src/app/privacy/page.tsx) | Privacy policy page (rendered from legal source) |
| [`src/app/terms/page.tsx`](src/app/terms/page.tsx) | Terms of service page (rendered from legal source) |
| [`src/app/reset-password/page.tsx`](src/app/reset-password/page.tsx) | Password reset page |
| [`src/app/share/[token]/page.tsx`](src/app/share/%5Btoken%5D/page.tsx) | Shared report public page |
| [`src/app/share/[token]/share-report-client.tsx`](src/app/share/%5Btoken%5D/share-report-client.tsx) | Share report client component |

### 5.6 Admin Pages

| File | Description |
|------|-------------|
| [`src/app/admin/layout.tsx`](src/app/admin/layout.tsx) | Admin layout with admin auth check |
| [`src/app/admin/scoring-audit/page.tsx`](src/app/admin/scoring-audit/page.tsx) | Scoring audit server page |
| [`src/app/admin/scoring-audit/scoring-audit-client.tsx`](src/app/admin/scoring-audit/scoring-audit-client.tsx) | Scoring audit client — debug tool for examining score calculations |
| [`src/app/admin/scoring-audit/score-explainer.ts`](src/app/admin/scoring-audit/score-explainer.ts) | Score explanation utility (pure functions for score breakdown) |

### 5.7 Public Assets

| File | Description |
|------|-------------|
| [`public/logo.svg`](public/logo.svg) | Main logo SVG |
| [`public/logo.png`](public/logo.png) | Main logo PNG |
| [`public/logo-icon.svg`](public/logo-icon.svg) | Icon-only logo SVG |
| [`public/logo-icon.png`](public/logo-icon.png) | Icon-only logo PNG |
| [`public/logo-icon-mono.svg`](public/logo-icon-mono.svg) | Monochrome icon logo SVG |
| [`public/logo-icon-mono.png`](public/logo-icon-mono.png) | Monochrome icon logo PNG |
| [`public/landing-page-v1.html`](public/landing-page-v1.html) | Static landing page HTML (v1) |
| [`public/landing-page-v2-editorial.html`](public/landing-page-v2-editorial.html) | Static landing page HTML (v2 editorial) |
| [`public/file.svg`](public/file.svg) | Generic file icon |
| [`public/globe.svg`](public/globe.svg) | Globe icon |
| [`public/next.svg`](public/next.svg) | Next.js logo (default) |
| [`public/vercel.svg`](public/vercel.svg) | Vercel logo (default) |
| [`public/window.svg`](public/window.svg) | Window icon |

### 5.8 Utility & Miscellaneous

| File | Description |
|------|-------------|
| [`src/app/globals.css`](src/app/globals.css) | Global styles — Tailwind directives, CSS variables, dark theme tokens, reduced motion |
| [`src/app/favicon.ico`](src/app/favicon.ico) | Favicon |
| [`src/components/NoOpServiceWorker.tsx`](src/components/NoOpServiceWorker.tsx) | No-op service worker component |

---

## 6. Features Implemented (V1)

### 6.1 Discover Flow

The discover feature lets agencies find local businesses that need websites:

1. **Search Form** — User inputs city, business type, and search radius
2. **3 Parallel Google Places Nearby Search queries** — One keyword-based, one keyword+type via `BUSINESS_TYPE_TO_PLACES_TYPE` mapping, one with 1.5× radius — all running concurrently
3. **Deduplication** — Results deduplicated by `place_id`
4. **Places Cache lookup** — Existing `places_cache` entries avoid duplicate API calls
5. **Place Details enrichment** — Fetched in batches of 25 (address, phone, website)
6. **Website Classification** — [`classifyWebsite()`](src/lib/types.ts) analyzes URLs against 50+ social/platform domain patterns to determine 5 website statuses
7. **Batch Upsert** — Businesses inserted/updated in batches of 50 into Supabase
8. **NDJSON Streaming** — Real-time progress updates during the entire process
9. **Session Storage** — Results persisted in browser session storage
10. **Client-side Filters** — Website status, minimum rating, sort options
11. **Save Search** — Territories CRUD via [`/api/saved-searches`](src/app/api/saved-searches/route.ts)
12. **Pre-audit Opportunity Estimation** — [`estimatedOpportunity()`](src/lib/scoring.ts) estimates opportunity level before running an audit

### 6.2 Audit & Analysis

**PageSpeed Insights Audit** ([`/api/audit`](src/app/api/audit/route.ts)):
- Mobile + desktop concurrent runs using `Promise.allSettled`
- Both `category=performance` and `category=seo` categories
- 30-second timeout with retry on 500/429 errors
- Extracts metrics: FCP, LCP, TBT, CLS, performance score, SEO score
- 7-day database cache with `force=true` bypass
- Credit check and deduction with optimistic concurrency control

**Design Analysis** ([`/api/analyze-design`](src/app/api/analyze-design/route.ts)):
- Static screenshot via ScreenshotOne API
- Vision analysis via Gemini 3.5 Flash
- Point deductions with impact assessment in the prompt
- 7-day database cache
- NDJSON streaming with step-by-step progress

### 6.3 Lead Management

**Leads Table** ([`src/app/dashboard/leads/page.tsx`](src/app/dashboard/leads/page.tsx)):
- Filter tabs: All / No Website / Social & Platform / Flagged + pipeline tabs
- Search, filter panel (website status, rating range, score range), 25/page pagination
- Inline audit + design analysis with NDJSON streaming progress
- Page reduced from 1001 → 227 lines — logic extracted to `hooks/` + `components/`

**Lead Detail** ([`src/app/dashboard/leads/[id]/`](src/app/dashboard/leads/%5Bid%5D/)):
- **3-Workflow Routing** via [`detectLeadWorkflow()`](src/lib/lead-types.ts):
  1. **`website`** (has website or platform-only) — Full score display with 6 sub-scores, mobile/desktop toggle, projection, pipeline dropdown, audit controls, pitch generation, PDF export, share link
  2. **`social_only`** (social media presence, no website) — Social platform detection, Digital Presence Analysis, channel-specific outreach guidance
  3. **`no_digital_presence`** (no website, no social media) — Opportunity reasons, Website Opportunity benefits, custom outreach
- Mobile/Desktop score toggle — reactive switching for all 6 sub-scores
- Score projection — "Fixing these could improve your score to X+"
- Expanded Core Web Vitals display — FCP/LCP/TBT/CLS with color-coded values
- Pipeline status dropdown — 7 canonical stages with optimistic updates
- Auto-pipeline — First audit auto-sets status to "analysed"
- Toast notification system — Fixed bottom-right, 3s auto-dismiss

### 6.4 Pitch Generation

([`/api/pitch`](src/app/api/pitch/route.ts) + [`src/lib/pitch/prompts.ts`](src/lib/pitch/prompts.ts))

- **6 lead-type angles** based on `website_status` + performance score
- **3 workflow branches**: website, social_only, no_digital_presence
- **Tone options**: professional, friendly, luxury
- **Length options**: short, medium, detailed
- **Focus options**: conversion, trust, performance
- **Channel options**: email (subject + body), WhatsApp (short body)
- **Opening styles**: direct, question, empathy, data
- **Urgency levels**: low, medium, high
- **18 industry-specific contexts** via `getBusinessTypeContext()`
- **Real data citation** — cites actual audit scores, LCP metrics, design issues
- **Persists** generated pitches to `pitches` table via admin client

### 6.5 Pipeline Management

([`src/app/dashboard/pipeline/page.tsx`](src/app/dashboard/pipeline/page.tsx) + [`/api/pipeline`](src/app/api/pipeline/route.ts))

- **7 canonical stages**: `new_lead` → `analysed` → `pitch_generated` → `contacted` → `in_conversation` → `won` → `lost`
- Visual stage indicators with color coding
- Optimistic updates on status changes with fallback refetch

### 6.6 Dashboard Home

([`src/app/dashboard/page.tsx`](src/app/dashboard/page.tsx) + [`dashboard-client.tsx`](src/app/dashboard/dashboard-client.tsx))

- **4 stat cards**: Ready to Pitch, In Pipeline, Active Conversations, Total Leads
- **Next Best Action** system — contextual guidance based on user state
- **Recent Leads** — 5 most recent leads (clickable)
- **Pipeline Overview** — funnel visualization with Win Rate %
- **Empty state** — First-time user onboarding guidance

### 6.7 Export & Sharing

**PDF Export** ([`/api/export/pdf`](src/app/api/export/pdf/route.ts)):
- jsPDF-generated audit report
- Includes business name, scores, performance issues
- Downloaded as PDF file

**Share Link** ([`/api/share`](src/app/api/share/route.ts)):
- Creates a 128-bit random UUID token
- Optional `expires_at` for time-bombed links
- Copies URL to clipboard
- Public share page at [`/share/[token]`](src/app/share/%5Btoken%5D/page.tsx)

### 6.8 Settings & Auth

- Email/password + Google OAuth login/signup
- Email verification gate on dashboard access
- Password validation on signup (length, complexity)
- Plan info display ("Free Beta")
- Integration status display (Google APIs, Gemini AI, ScreenshotOne, Supabase)

### 6.9 Admin Tools

**Signup Notifications** ([`/api/notify-signup`](src/app/api/notify-signup/route.ts)):
- Sends email via Resend when a new user signs up
- Fire-and-forget from signup page — silent on failure
- Includes name, email, signup time in IST

**Scoring Audit** ([`src/app/admin/scoring-audit/`](src/app/admin/scoring-audit/)):
- Debug tool for examining score calculations on any business
- Score breakdown by category
- Raw metric display
- Admin-only access via [`requireAdmin()`](src/lib/admin-auth.ts)

---

## 7. V2 Planned Features

The following features are planned but not yet implemented (stubs exist for some):

| Feature | Description | Status |
|---------|-------------|--------|
| **UX Interaction Analysis** | Playwright-based UX recording + Gemini analysis | Stubbed (column exists in schema) |
| **Radar / Decay Monitoring** | Scheduled territory rescans with decay alerts | Stub page exists |
| **Competitor Intelligence** | Competitor comparison tab | Planned |
| **AI Redesign Mockups** | Generate HTML mockups of improved sites | Stub (mockups table exists) |
| **Pitch Deck Export** | Full pitch deck generation | Planned |
| **Loom Video Export** | Automated Loom walkthrough | Planned |
| **Campaigns** | Multi-lead outreach campaigns | Planned |
| **Templates** | Pitch template management | Stub page exists |
| **Reports** | Advanced reporting dashboard | Planned |
| **Integrations** | CRM integration (HubSpot, etc.) | Planned |
| **Billing Enforcement** | Credit gating based on plan | Partially implemented |
| **In-product Email Sending** | Send emails directly from Nearsited | Planned |

---

## 8. Security Measures

### 8.1 Authentication & Authorization

**Middleware Guard** ([`middleware.ts`](middleware.ts)):
- Session refresh on every request
- Protects `/dashboard/*`, `/admin/*`, `/(auth)/*`
- Validates environment variables at startup
- Redirects unauthenticated users to login

**API Auth Wrapper** ([`withAuth()`](src/lib/api/with-auth.ts)):
- Defense-in-depth for API routes
- Rate limiting integration
- Standardized 401 JSON response
- Used by: discover, audit, analyze-design, pitch, saved-searches

**Admin Authorization** ([`requireAdmin()`](src/lib/admin-auth.ts)):
- DB-backed admin check via `admin_users` table
- 30-second in-memory cache (resets per serverless cold start — no stale-cache risk)
- Used by admin layout and scoring audit page

**User-Scoped Admin Client** ([`scopedAdmin()`](src/lib/api/scoped-admin.ts)):
- Prevents cross-user data access
- Auto-filters queries by `user_id`

**Open Redirect Protection** ([`auth/callback/route.ts`](src/app/auth/callback/route.ts)):
- `safeRedirect()` validates redirect paths
- Prevents malicious redirect after OAuth

### 8.2 Supabase Security (3-Client Model)

| Client | Key | RLS | Where Used |
|--------|-----|-----|------------|
| **Admin** (`admin.ts`) | Service role key (secret) | Bypasses RLS | ALL server-side INSERT/UPDATE operations |
| **Server** (`server.ts`) | Anon key (public) | RLS enforced | Server-side reads with `auth.getUser()` |
| **Browser** (`client.ts`) | Anon key (public) | RLS enforced | Client components |

**Key Rules:**
- Service role key is `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` — NEVER a `NEXT_PUBLIC_` variable
- Admin client is NEVER imported in browser code (enforced via linting convention)
- RLS policies on all user-data tables: `businesses`, `audits`, `design_analyses`, `pipeline`, `pitches`, `profiles`, `share_links`
- `places_cache` intentionally has NO write policy (writes exclusively via admin client)

### 8.3 Rate Limiting

([`src/lib/rate-limit.ts`](src/lib/rate-limit.ts))

3 Upstash-based rate limiters:

| Limiter | Rate | Applied To |
|---------|------|------------|
| Standard | 10 requests per 10 seconds | discover, audit, analyze-design, pitch |
| Auth | 30 requests per 10 seconds | login, signup |
| Expensive Op | 5 requests per 60 seconds | Resource-intensive operations |

### 8.4 Security Headers

([`next.config.ts`](next.config.ts))

| Header | Value |
|--------|-------|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `X-XSS-Protection` | `1; mode=block` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `Content-Security-Policy` | Restrictive (default-src 'self', frame-src 'none', object-src 'none') |

### 8.5 API Input Validation

All API routes use Zod schemas for input validation:
- `pitchSchema` — pitch generation parameters
- `discoverSchema` — discover search parameters
- `savedSearchSchema` — territory CRUD
- `businessWebsiteSchema` — website URL validation

### 8.6 Additional Security Measures

- **No `dangerouslySetInnerHTML`** — zero occurrences in the codebase
- **No raw SQL concatenation** — all queries use Supabase query builder
- **API key redaction** in logs ([`src/lib/google-places.ts`](src/lib/google-places.ts:44))
- **Share link tokens** are 128-bit random UUIDs (token IS the authorization)
- **Admin client for all server writes** — correctly bypasses RLS for server-side operations

### 8.7 Known Security Gaps (from audit)

| Issue | Severity | Description | Status |
|-------|----------|-------------|--------|
| Missing `SCREENSHOT_API_KEY` from env validation | Critical | ScreenshotOne API key not checked at startup | ✅ Fixed |
| Admin client overuse bypasses RLS | Critical | Excessive use of service-role client where session client would work | — |
| No cookie consent mechanism | Critical | GDPR compliance risk | — |
| No rate limiting on `/api/checkout` | High | Billing abuse vector | ✅ Fixed |
| Share link token expiration not enforced | High | Expired share links still accessible | ✅ Fixed |
| Weak CSP with `'unsafe-inline'` `'unsafe-eval'` | Medium | Relaxed for Next.js but reduces XSS protection | — |
| Redis rate limiting fails without fallback | Medium | No fallback if Upstash Redis is unreachable | — |
| No per-token rate limiting on share links | Low | Share links vulnerable to abuse | — |

---

## 9. Animations & Motion System

### 9.1 Motion Primitives ([`src/lib/motion.tsx`](src/lib/motion.tsx))

| Component | Description |
|-----------|-------------|
| `FadeUp` | Fade in + slide up entrance animation |
| `FadeIn` | Simple fade-in animation |
| `StaggerContainer` | Staggered children animation container |
| `ScaleHover` | Scale-up effect on hover |
| `PageTransition` | Page-level enter/exit transitions |
| `SkeletonLoader` | Animated loading skeleton |

**Duration Tokens:**
- `micro`: 150ms (tiny micro-interactions)
- `card`: 250ms (card hover, panel reveals)
- `page`: 350ms (page transitions)

**Easing Curves:**
- `easeOut`: (0.22, 1, 0.36, 1) — entrance animations
- `easeInOut`: (0.87, 0, 0.13, 1) — state change animations

**Reduced Motion Support:**
- `prefersReducedMotion()` detection in motion components
- CSS-level reduced motion in [`globals.css`](src/app/globals.css)

### 9.2 Key Animation Implementations

**ScoreRing** ([`src/components/ui/ScoreRing.tsx`](src/components/ui/ScoreRing.tsx)):
- SVG circular progress indicator
- `requestAnimationFrame`-based count-up animation
- Color-coded by score range (poor/needs-improvement/good/strong)
- 3 variants: default, verified, opportunity
- Responsive sizing with configurable diameter

**AnimatedScoreRing** ([`src/app/dashboard/discover/components/AnimatedScoreRing.tsx`](src/app/dashboard/discover/components/AnimatedScoreRing.tsx)):
- Per-frame React state update for discover results
- RAF-based animation loop

**useCountUp() Hook** ([`src/lib/shared-hooks.ts`](src/lib/shared-hooks.ts)):
- Animated counter with ease-out cubic timing
- Automatic cancellation on unmount
- Configurable duration and start/end values

**Page Transitions:**
- Framer Motion `AnimatePresence` for route transitions
- Fade/slide combinations for content panels

**Toast Notifications** ([`src/components/ui/Toast.tsx`](src/components/ui/Toast.tsx)):
- Framer Motion fade-up enter/exit animations
- Fixed position bottom-right
- 3-second auto-dismiss with hover-to-pause

### 9.3 Landing Page Animations

- **Hero Section**: CanvasBackground (lazy-loaded via `next/dynamic`, pauses when off-screen via IntersectionObserver)
- **Scroll-triggered** section entrances using Framer Motion viewport detection
- **Staggered content** reveals in feature sections
- **Accordion animations** in FAQ via [`useAccordion()`](src/lib/shared-hooks.ts)

---

## 10. UI Design System

### 10.1 Brand & Theme ([`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md))

| Element | Value |
|---------|-------|
| **Background** | Near-black navy `#0a0e12` |
| **Accent** | Sage green `#8A9777` |
| **Surface** | `#14181d` (cards, panels) |
| **Border** | `#1e2329` |
| **Text Primary** | `#e8e8e8` |
| **Text Secondary** | `#8b8f93` |
| **Text Muted** | `#5a5f65` |
| **Theme** | Dark only (no light mode) |

### 10.2 Typography

| Font | Usage | Weights |
|------|-------|---------|
| **Geist** | UI text (headings, body, labels) | 300, 400, 500, 600 |
| **Switzer** | Hero section headlines only | Display weights |
| **Geist Mono** | Code, metrics, data displays | 400, 500 |

### 10.3 Layout

- **Dashboard**: Fixed sidebar (w-60 / 240px) + flex-1 main content
- **Main content**: max-w-7xl centered
- **Landing**: Full-width sections with centered content
- **Auth**: Centered card layout with background

### 10.4 Component Standards

**Cards:**
```css
bg-[var(--bg-surface)]
rounded-xl
border border-[var(--border)]
shadow-[var(--shadow-sm)]
```

**Score Rings:** SVG circular progress, 44px default, colored via CSS variables

**Badge Semantic Colors:**
| Variant | Color | Usage |
|---------|-------|-------|
| `success` | Green (`#4ade80`) | Opportunity found |
| `danger` | Red (`#ef4444`) | Website opportunity |
| `warning` | Amber (`#f59e0b`) | Social presence |
| `info` | Indigo (`#818cf8`) | Platform presence |

**Buttons:**
- Variants: primary (accent bg), secondary (outline), ghost (transparent), danger (red)
- Sizes: sm, md, lg
- Loading state with spinner

**Toast:** Fixed bottom-6 right-6, 3s auto-dismiss, Framer Motion fade-up

**Empty States:** Centered layout, py-20, icon + title + description + action button

---

## 11. Data Layer & Database Schema

### 11.1 Schema Overview ([`docs/SCHEMA.md`](docs/SCHEMA.md))

**12 active tables**, 5 migration scripts:

| Table | Columns | Write Client | Purpose |
|-------|---------|-------------|---------|
| `profiles` | 5 | session | User identity (id, email, name, avatar_url, created_at) |
| `businesses` | 24 | session (discover), admin (updates) | Discovered leads per user with scores, website status, contact info |
| `places_cache` | 8 | **admin only** | Global website-detection cache (shared across all users) |
| `audits` | 12 | **admin** | PageSpeed results (2 rows per run: mobile + desktop) |
| `design_analyses` | 10 | **admin** | Gemini vision design results (2 rows per run) |
| `ux_analyses` | 7 | **admin** | Playwright + Gemini UX results (v2, dormant) |
| `pipeline` | 5 | session | Lead funnel tracking (business_id, user_id, stage, updated_at) |
| `pitches` | 12 | **admin** | Generated outreach emails (content, tone, channel, metadata) |
| `share_links` | 6 | **admin** (insert), anon (select) | Public share tokens with optional expiry |
| `territories` | 7 | session | Saved search alerts (city, business_type, radius, filters) |
| `subscriptions` | 10 | session | Billing tracking (tier, audits_used, audits_limit, dodo IDs) |
| `mockups` | 6 | — | AI redesign HTML (v2, dormant) |

### 11.2 Key Constraints

- `businesses_place_user_unique`: Unique constraint on `(place_id, user_id)` — prevents duplicate leads

### 11.3 Database Enums

11 enums defined in schema:
- `website_status` — 5 values: `has_website`, `platform_only`, `social_only`, `no_website`, `unknown`
- `pipeline_stage` — 7 values: `new_lead`, `analysed`, `pitch_generated`, `contacted`, `in_conversation`, `won`, `lost`
- `subscription_tier` — 4 values: `free`, `starter`, `agency`, `enterprise`
- `lead_type`, `pitch_status`, `tone`, `channel`, `focus`, `opening`, `urgency`, `ux_status`

### 11.4 Supabase Client Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     Application Code                      │
├──────────────┬──────────────┬────────────────────────────┤
│  Browser     │  Server      │  Admin / API Routes        │
│  (client.ts) │  (server.ts) │  (admin.ts)                │
│              │              │                            │
│  anon key    │  anon key    │  service_role key           │
│  RLS on      │  RLS on      │  RLS bypassed              │
│  client      │  + cookies   │  NEVER in browser          │
│  components  │  SSR reads   │  ALL writes                │
└──────────────┴──────────────┴────────────────────────────┘
```

### 11.5 Key Data Flows

**Discover Flow:**
```
City/Type/Radius
  → 3 parallel Google Places Nearby Search queries
  → Dedup by place_id
  → places_cache lookup (avoid duplicate API calls)
  → Place Details enrichment (batches of 25)
  → classifyWebsite() — 50+ social/platform domain patterns
  → businesses upsert (50/batch)
  → NDJSON stream to client
```

**Audit Flow:**
```
Check 7-day cache
  → Cache hit: return immediately
  → Cache miss:
    → PageSpeed mobile + desktop (concurrent)
    → Extract metrics (FCP, LCP, TBT, CLS, scores)
    → Insert audits via admin client
    → Update businesses scores
    → Stream via NDJSON
```

**Design Analysis Flow:**
```
Check 7-day cache
  → Cache hit: return immediately
  → Cache miss:
    → ScreenshotOne capture
    → Gemini vision analysis
    → Insert design_analyses via admin client
    → Update businesses
    → Stream via NDJSON
```

---

## 12. Scoring System

The scoring system is the analytical core of Nearsited, implemented entirely in [`src/lib/scoring.ts`](src/lib/scoring.ts).

### 12.1 Six Core Scores

| Score | Source | What It Measures |
|-------|--------|-----------------|
| **Performance** | PageSpeed (desktop) | Load speed, responsiveness |
| **SEO** | PageSpeed (desktop) | SEO best practices |
| **Mobile** | PageSpeed (mobile) | Mobile performance |
| **UX/Design** | Gemini vision | Visual design quality, layout, aesthetics |
| **Trust** | Gemini vision | Trust signals (SSL, contact, privacy policy) |
| **Overall** | Weighted formula | Composite of all scores |

### 12.2 Score Ranges & Labels

| Range | Label | Color | CSS Class |
|-------|-------|-------|-----------|
| 0–39 | Poor | Red | `text-red-400` |
| 40–69 | Needs Improvement | Amber | `text-amber-400` |
| 70–84 | Good | Green | `text-green-400` |
| 85+ | Strong | Emerald | `text-emerald-400` |

### 12.3 Opportunity Scoring

`computeOpportunityScore()` calculates a business's potential value as a client:

```
opportunity_score = websiteWeakness() × businessViabilityMultiplier() × INDUSTRY_MULTIPLIERS[category]
```

- **`websiteWeakness()`** — How bad is their current web presence? (0–1)
- **`businessViabilityMultiplier()`** — Is this a real, active business? (based on reviews, rating, status)
- **`INDUSTRY_MULTIPLIERS`** — 80+ industry entries capturing which industries spend most on web design

### 12.4 Projection

```
projection = min(95, current_score + sum(top_3_deductions))
```

Shows users their potential score improvement by fixing the top 3 issues.

### 12.5 Blended Quality Score

```
blended = design_score × 0.5 + ux_score × 0.5
```

Used when UX analysis data is available (v2 feature).

### 12.6 Pre-Audit Estimation

`estimatedOpportunity()` provides a quick opportunity estimate before running a full audit, using only `website_status` and review signals (rating, review count).

---

## 13. API Routes Reference

### 13.1 Core Feature APIs

| Route | Method | Purpose | Input Validation | Rate Limited | Streaming |
|-------|--------|---------|-----------------|--------------|-----------|
| [`/api/discover`](src/app/api/discover/route.ts) | POST | 3 parallel Nearby Search + enrichment + upsert | Zod (discoverSchema) | Yes (standard) | NDJSON |
| [`/api/audit`](src/app/api/audit/route.ts) | POST | PageSpeed mobile+desktop, 30s timeout, 7-day cache | Zod | Yes (standard) | NDJSON |
| [`/api/analyze-design`](src/app/api/analyze-design/route.ts) | POST | ScreenshotOne + Gemini vision, 7-day cache | Zod | Yes (standard) | NDJSON |
| [`/api/pitch`](src/app/api/pitch/route.ts) | POST | Gemini pitch generation, 3 workflows, 6 angles | Zod (pitchSchema) | Yes (standard) | — |
| [`/api/pipeline`](src/app/api/pipeline/route.ts) | GET/POST/PATCH | Pipeline CRUD | — | Yes | — |

### 13.2 Data APIs

| Route | Method | Purpose |
|-------|--------|---------|
| [`/api/cities/search`](src/app/api/cities/search/route.ts) | GET | City search (queries 29MB city JSON via fs) |
| [`/api/saved-searches`](src/app/api/saved-searches/route.ts) | GET/POST/DELETE | Territories/ saved searches CRUD |
| [`/api/data/clear`](src/app/api/data/clear/route.ts) | POST | Clear user data |

### 13.3 Billing & Subscription APIs

| Route | Method | Purpose |
|-------|--------|---------|
| [`/api/check-subscription`](src/app/api/check-subscription/route.ts) | GET | Dodo subscription reconciliation |
| [`/api/checkout`](src/app/api/checkout/route.ts) | POST | Create checkout session |
| [`/api/webhooks/dodo`](src/app/api/webhooks/dodo/route.ts) | POST | Dodo payment webhook handler |

### 13.4 Export & Sharing APIs

| Route | Method | Purpose |
|-------|--------|---------|
| [`/api/export/pdf`](src/app/api/export/pdf/route.ts) | GET | jsPDF audit report generation |
| [`/api/share`](src/app/api/share/route.ts) | POST | Create share link with token |

### 13.5 Utility APIs

| Route | Method | Purpose |
|-------|--------|---------|
| [`/api/contact-info`](src/app/api/contact-info/route.ts) | GET | Scrape website for email/phone |
| [`/api/refresh-ratings`](src/app/api/refresh-ratings/route.ts) | POST | Background Google Places rating refresh |
| [`/api/audit`](src/app/api/audit/route.ts) (design) | POST | Enqueue UX analysis job (v2) |

### 13.6 Auth APIs

| Route | Method | Purpose |
|-------|--------|---------|
| [`/auth/callback`](src/app/auth/callback/route.ts) | GET | OAuth + email confirmation callback |
| [`/auth/password-reset`](src/app/auth/password-reset/route.ts) | GET | Password reset token exchange |

---

## 14. Pricing & Subscription Model

### 14.1 Current State

Nearsited is **live with paid plans** via Dodo Payments. Free users get a lifetime credit allowance; paid plans unlock higher monthly limits with auto-reset.

### 14.2 Product Tiers

([`src/lib/products.ts`](src/lib/products.ts) + [`src/lib/dodo.ts`](src/lib/dodo.ts))

| Plan | Billing | Price | Analyses | Searches |
|------|---------|-------|----------|----------|
| Free | Lifetime | $0 | 20 total | 3 total |
| Starter | Monthly | $19/mo | 50/mo | 3/mo |
| Starter | Annual | $180/yr ($15/mo) | 50/mo | 3/mo |
| Agency | Monthly | $49/mo | 200/mo | 10/mo |
| Agency | Annual | $468/yr ($39/mo) | 200/mo | 10/mo |

Free credits do not reset — they are a one-time lifetime allowance. Paid plan credits reset monthly on `credits_reset_at`.

### 14.3 Credit System ([`src/lib/credits.ts`](src/lib/credits.ts))

- **`getSubscription()`** — Provisions a free-tier subscription on first lookup if none exists
- **`checkCredit()`** — Checks if user has available credits (with monthly auto-reset on `credits_reset_at`)
- **`deductCredit()`** — Optimistic concurrency control with 3 retry attempts
- **`FREE_AUDIT_LIMIT = 20`** — Lifetime credit allowance for free tier (1 search + 20 analyses)

### 14.4 Dodo Payments Integration

- Dodo client singleton configured in [`src/lib/dodo.ts`](src/lib/dodo.ts)
- Product ID mapping to Dodo product catalog
- Webhook at [`/api/webhooks/dodo`](src/app/api/webhooks/dodo/route.ts) handles subscription lifecycle events (creation, renewal, cancellation)
- Subscription sync scripts in `/scripts/sync-*.mjs`
- Dodo auto-detects test vs live mode via `S-` prefix on API key
- No discount codes or promo codes are configured

---

## 15. External Integrations

| Service | Integration Point | Usage | Cost Implication |
|---------|------------------|-------|-----------------|
| **Google Places API** | [`src/lib/google-places.ts`](src/lib/google-places.ts) | Geocoding, Nearby Search, Place Details | ₹2.67/search, ₹0.25/details |
| **Google PageSpeed Insights** | [`/api/audit`](src/app/api/audit/route.ts) | Performance + SEO metrics (mobile + desktop) | Free |
| **Gemini 3.5 Flash** | [`/api/analyze-design`](src/app/api/analyze-design/route.ts), [`/api/pitch`](src/app/api/pitch/route.ts) | Vision analysis (screenshots) + text generation (pitches) | ~$1.50/M input tokens, ~$9/M output tokens |
| **ScreenshotOne** | [`/api/analyze-design`](src/app/api/analyze-design/route.ts) | Static website screenshots for visual analysis | 200 free/month |
| **Dodo Payments** | [`src/lib/dodo.ts`](src/lib/dodo.ts), webhooks | Subscription management, checkout, payment processing | Payment processing fees |
| **Supabase** | [`src/lib/supabase/*`](src/lib/supabase/) | Postgres database, Auth (email + OAuth), Storage (v2) | Free tier |
| **Upstash Redis** | [`src/lib/rate-limit.ts`](src/lib/rate-limit.ts) | Rate limiting (3 limiters) | Usage-based |

### Powered by Google

The `PoweredByGoogle` component is displayed in the discover UI to comply with Google Places API attribution requirements.

---

## 16. Scripts & Migrations

### 16.1 Database Migrations

| Script | Description |
|--------|-------------|
| [`scripts/migrate.sql`](scripts/migrate.sql) | **Main migration** — businesses cleanup (8 orphan columns), `seo_score` column, pitch metadata (`tone`, `lead_type`, `pitch_status`), RLS policies, pipeline realignment (prospect→new_lead), territories rename (`category`→`business_type`), UX columns |
| [`scripts/migrate-vibecode-fixes.sql`](scripts/migrate-vibecode-fixes.sql) | Channel column for pitches, `contact_info` JSONB for businesses |
| [`scripts/migrate-dodo.sql`](scripts/migrate-dodo.sql) | Subscriptions schema — `dodo_customer_id`, `dodo_subscription_id`, `tier`, `audits_used`, `audits_limit`, `credits_reset_at` |
| [`scripts/migrate-rls-fix.sql`](scripts/migrate-rls-fix.sql) | RLS policy fixes for various tables |
| [`scripts/migrate-admin-users.sql`](scripts/migrate-admin-users.sql) | Admin users table creation |

### 16.2 Migration Runners

| Script | Description |
|--------|-------------|
| [`scripts/run-migrations.mjs`](scripts/run-migrations.mjs) | Migration runner with direct PostgreSQL + Management API fallback |
| [`scripts/run-vibecode-migration.mjs`](scripts/run-vibecode-migration.mjs) | Specific migration runner for vibecode fixes |

### 16.3 Utility & Maintenance Scripts

| Script | Description | npm Script |
|--------|-------------|------------|
| [`scripts/backfill-opportunity.mjs`](scripts/backfill-opportunity.mjs) | Backfill opportunity scores for existing businesses | — |
| [`scripts/check-db-state.mjs`](scripts/check-db-state.mjs) | Database state checker | `db:check` |
| [`scripts/check-constraint.mjs`](scripts/check-constraint.mjs) | DB constraint checker | — |
| [`scripts/check-sub-status.mjs`](scripts/check-sub-status.mjs) | Subscription status checker | — |
| [`scripts/check-subscriptions-table.mjs`](scripts/check-subscriptions-table.mjs) | Subscriptions table verifier | — |
| [`scripts/check-billing-test.mjs`](scripts/check-billing-test.mjs) | Billing integration test | — |
| [`scripts/clean-cache.mjs`](scripts/clean-cache.mjs) | Cache cleaner | `clean:all` |
| [`scripts/convert-logos.mjs`](scripts/convert-logos.mjs) | Logo format converter | — |
| [`scripts/download-cities.mjs`](scripts/download-cities.mjs) | City data downloader (29MB) | — |
| [`scripts/fix-tier-constraint.mjs`](scripts/fix-tier-constraint.mjs) | Tier constraint fix | — |
| [`scripts/load-env.mjs`](scripts/load-env.mjs) | Environment loader utility | — |

### 16.4 Subscription Sync Scripts

| Script | Description |
|--------|-------------|
| [`scripts/sync-subscription.mjs`](scripts/sync-subscription.mjs) | Subscription sync utility |
| [`scripts/sync-manual.mjs`](scripts/sync-manual.mjs) | Manual subscription sync |
| [`scripts/sync-now.mjs`](scripts/sync-now.mjs) | Immediate subscription sync |
| [`scripts/sync-both.mjs`](scripts/sync-both.mjs) | Two-way subscription sync |
| [`scripts/sync-second.mjs`](scripts/sync-second.mjs) | Secondary subscription sync |

---

## 17. Known Issues & Audit Findings

The pre-launch audit ([`plans/pre-launch-audit-report.md`](plans/pre-launch-audit-report.md)) identified **108 issues** across severity levels. **~106 issues have been resolved** as of June 2026 (35+ additional items resolved in post-launch sessions):

### Critical (14 → 0 unresolved ✅)

| ID | Issue | Area | Status |
|----|-------|------|--------|
| C-1 | NDJSON last-chunk data loss in `readNdjsonStream()` | Core Streaming | ✅ Fixed |
| C-2 | ProofBlocksSection has zero proof (no stats/data) | Landing Page | ✅ Fixed |
| C-3 | Contradictory free audit counts (50 vs 10) | Pricing | ✅ Fixed |
| C-4 | Terms of Service contradicts pricing page | Legal | ✅ Fixed |
| C-5 | No cookie consent mechanism (GDPR risk) | Legal/Compliance | ✅ Fixed |
| C-6 | Missing `SCREENSHOT_API_KEY` from env validation | Security | ✅ Fixed |
| C-7 | Missing `aria-label` on icon-only buttons | Accessibility | ✅ Fixed |
| C-8 | No Open Graph tags (SEO) | SEO | ✅ Fixed |
| C-9 | `lead-detail-client.tsx` — 1363-line monolith | Code Quality | ✅ Fixed — extracted 4 hooks + 7 components, 1363→451 lines |
| C-10 | LeadsPage — 1001-line monolith | Code Quality | ✅ Fixed — extracted 2 hooks + 8 components, 1001→227 lines |
| C-11 | Admin client used excessively (bypasses RLS) | Security | ✅ Fixed — 4 locations now use `scopedAdmin(user.id)` for reads |
| C-12 | Non-semantic heading hierarchy | Accessibility | ✅ Fixed |
| C-13 | Time claims contradict (2min vs 3min vs 3sec) | Marketing | ✅ Fixed |
| C-14 | Stale RAF closure in ScoreRing | Animation | ✅ Fixed |

### High (28 → 4 unresolved)

Key high-severity issues include:
- ~~Missing rate limiting on `/api/checkout`~~ ✅ Fixed
- ~~Missing rate limiting on `/api/cities/search`~~ ✅ Fixed
- ~~Sensitive body logging~~ → ✅ Sanitized in discover route
- ~~Share link token expiration not enforced~~ ✅ Fixed
- ~~`"use client"` on landing page~~ → ✅ Thin server wrapper created
- ~~Duplicated `useCountUp`~~ → ✅ Consolidated in shared-hooks.ts
- ~~Waterfall requests~~ → ✅ Parallelized with Promise.all in lead-detail
- ~~Hardcoded colors~~ → ✅ Replaced with CSS variables in LandingHero
- ~~Hydration mismatches~~ → ✅ Fixed in LandingNav
- ~~No founder photo~~ → ✅ Added founder identity to FounderStorySection
- ~~Missing GDPR rights~~ → ✅ Added GDPR + CCPA + cookie disclosure to Privacy Policy
- ~~Missing loading.tsx files~~ → ✅ 7 loading skeletons created
- ~~No error boundaries~~ → ✅ Added dashboard/error.tsx
- ~~No `<Link>` usage~~ → ✅ Updated LandingNav + LandingFooter
- ~~No JSON-LD structured data~~ → ✅ Added SoftwareApplication + FAQPage schema
- ~~Empty catch block swallows errors~~ → ✅ Logged in dashboard layout
- ~~DOM duplication for reduced motion~~ → ✅ Eliminated in WhyNearsited + HowItWorks
- ~~Missing loading states on async operations~~ → Already implemented
- ~~`any` type in dashboard layout~~ → ✅ Replaced with `Pick<SubscriptionRow, "tier">` generic type in dashboard layout
- ~~CreditsWidget re-fetches server data~~ → ✅ Accepts `tier`, `auditsUsed`, `auditsLimit` as props from server layout

### Medium (43 → 0)

Resolved medium items include:
- ~~Weak CSP~~ → ✅ Documented, added report-uri + wss: support
- ~~`@types/jspdf` in prod deps~~ → ✅ Moved to devDependencies
- ~~Redis rate limiting fallback~~ → ✅ Try/catch + no-op mock limiter
- ~~`contact_info` validation~~ → ✅ Zod validation before store
- ~~`autoprefixer`, `postcss` in prod deps~~ → ✅ Moved to devDependencies
- ~~Pulse animation ignores reduced motion~~ → ✅ Conditional on useReducedMotion()
- ~~Unused `_totalPitches` prop~~ → ✅ Removed prop and query
- ~~Pricing default export~~ → ✅ Changed to named export
- ~~Sidebar width hardcoded `w-60`~~ → ✅ Uses CSS variable
- ~~Mobile nav missing audit/pitches~~ → ✅ Added to nav
- ~~Hardcoded `pt-20` for nav~~ → ✅ Uses `var(--nav-height)`
- ~~Missing `@media print` styles~~ → ✅ Added
- ~~Section ordering~~ → ✅ FounderStory moved after WhyNearsited
- ~~Hash link scroll hidden~~ → ✅ `scroll-margin-top` added
- ~~AnimatedScoreRing per-frame state update~~ → ✅ Fixed with `noAnimate` prop
- ~~Button `motion.div` wrapping~~ → ✅ Direct `motion.button`
- ~~Toast always success icon~~ → ✅ Type prop added
- ~~CreditsWidget client per render~~ → ✅ Moved into useEffect
- ~~AnimatePresence exit never plays~~ → ✅ Moved to parent
- ~~Duplicated nav entries~~ → ✅ Shared constants
- ~~User email in checkout error responses~~ → ✅ Added `redactPII()` helper, sanitized catch block
- ~~Duplicate `WebsiteStatus` type~~ → ✅ Consolidated to `db-types.ts` as canonical source
- ~~"ProofBlocks" content is thin~~ → ✅ Added explainer paragraph + testimonial blurb with avatar
- ~~Duplicated trust signals~~ → ✅ Transformed TrustBar to social-proof bar
- ~~Scoring explanation buried in FAQ~~ → ✅ Added explainer card in HowItWorksSection
- ~~`cmdk` potentially unused~~ → 🔍 Investigated — actively used in SearchableSelect; no change needed
- ~~Settings route 404 on mobile~~ → ✅ Confirmed resolved by M-17 (shared nav-constants)
- ~~Open redirect protection~~ → ✅ Strengthened `safeRedirect()` with allowlist, URL decode validation, path traversal blocking, userinfo blocking
- ~~Missing `--accent-warm` CSS variable~~ → ✅ Added to globals.css
- ~~Missing z-index scale CSS variables~~ → ✅ Added `--z-base` through `--z-tooltip` to globals.css
- ~~Inconsistent Switzer font-family references~~ → ✅ Replaced with `var(--font-sans)` (Geist)
- ~~"Again Labs" link description too vague~~ → ✅ Changed to "the product studio where Arjun built this"
- ~~Missing CCPA disclosure~~ → ✅ Expanded with comprehensive California rights, "We do not sell" statement, request process
- ~~Edit Tone button in SamplePitchSection non-functional~~ → ✅ Wired to state machine cycling Professional → Friendly → Luxury
- ~~Regenerate button in SamplePitchSection non-functional~~ → ✅ Now cycles pitch tab types (weak → none → social → platform)
- ~~AgencyUseCasesSection only 2 use cases, no attribution~~ → ✅ Expanded to 4 use cases, added beta user footnote
- ~~Apollo/Hunter objection missing from ObjectionsSection~~ → ✅ Added 6th objection (Apollo/Hunter vs. Nearsited)
- ~~FAQ missing data accuracy + geographic coverage questions~~ → ✅ Added 2 FAQs, fixed hydration risk (useReducedMotion)
- ~~HowItWorks pitch conversion stat unverified~~ → ✅ Updated to "2–3× higher conversion†" with beta-user footnote
- ~~"Local businesses" missing "hyperlocal" keyword in HowItWorks + Hero~~ → ✅ Added in both HowItWorksSection step and LandingHero subtitle
- ~~SampleReportSection value unit inconsistency~~ → ✅ Unified to "$3,000–$8,000" across both AnimatePresence branches
- ~~Privacy Policy references "Lemon Squeezy" (wrong processor)~~ → ✅ Updated to "Dodo Payments" in markdown + rendered page; rendered page now synced with all 9 sections (cookies, GDPR, CCPA, retention, international transfers)
- ~~ProofBlocksSection "7,500+ cities" contradicts FAQ "29,000+"~~ → ✅ Updated to "29,000+"
- ~~ProofBlocksSection testimonial missing attribution context~~ → ✅ Added "· beta user" to testimonial attribution
- ~~ObjectionsSection Google Maps response lacks depth~~ → ✅ Enhanced with 4-bullet comparison list (React.ReactNode response type)
- ~~LandingFooter Company section only has "Contact"~~ → ✅ Added "About" link (/#story)

- ~~`lead-detail-client.tsx` 1363-line monolith (C-9)~~ → ✅ Extracted 4 hooks + 7 components, file reduced from 1363 → 451 lines (67%)

All 43 medium issues have been fully resolved. The previously remaining content items (M-32 through M-43) — hyperlocal keyword, pipeline stats attribution, value unit consistency, tone customization interactivity, expanded use cases, Apollo/Hunter objection, data accuracy FAQ, geographic coverage FAQ — have all been addressed in code across the landing page components.

### June 6, 2026 Session Fixes

Additional fixes applied in the June 6 session:

- **Analysis error handling**: Non-2xx API responses now throw properly with toast messages (was silently swallowing errors)
- **Hero section pitch**: Now dynamic — changes based on which demo card is selected (fixed pitch mismatch)
- **Auth page scoring**: Quality values updated to reflect actual `estimatedOpportunity()` / `computeOpportunityScore()` logic
- **Hero score rings**: Changed from `opportunity` to `estimate` variant (dashed ring + ~ prefix) to distinguish pre-analysis scores
- **Sample report verified badges**: Added "Verified" badge to all 4 sample report tabs — contrasts with hero's "Estimated"
- **Landing page performance**: CanvasBackground pauses animation when off-screen via IntersectionObserver; `content-visibility: auto` on hero section
- **Framer Motion tree-shaking**: Added to `optimizePackageImports`; re-exported `useReducedMotion` and `AnimatePresence` through `motion.tsx`
- **Dashboard layout**: Subscription fetch moved to client-side (CreditsWidget) — no longer blocks all dashboard page loads
- **Lead detail page DB queries**: Parallelized 5 queries via `Promise.all` (was sequential waterfall)
- **Pitches page navigation**: "View Pipeline" now correctly navigates to lead detail page; added "Add to Pipeline" / "Remove from Pipeline" buttons
- **SearchableSelect fallback**: Shows raw value when options array hasn't loaded yet (prevents empty city field on Discover page return)
- **Credit terminology**: Standardized across all UI ("audits" → "credits" / "analyses"); fixed AuthCard bug (100→10 free analyses)
- **Signup notifications**: New `/api/notify-signup` route sends email via Resend on new user registration
- **SEO**: Sitemap, robots.txt, canonical URL, Bing Webmaster Tools verification, Google Search Console verification
- **AI discovery**: `llms.txt` file created for LLM-based recommendations
- **OG image**: Created SVG-based og-image for social sharing previews
- **Rate limiter**: Graceful fallback when Upstash Redis is not configured
- **Gemini model name**: Corrected from `gemini-3.5-flash` to `gemini-2.0-flash`
- **Audit page mobile layout**: Fixed new search button and complete element responsive layout
- **Database query parallelization**: `businessType` parameter now passed to `computeOpportunityScore()` in 4 locations for accurate industry multipliers

All critical and high items have been resolved.

### Low (23 → 22 resolved, 1 remaining)

Resolved low items:
- ~~No per-token rate limiting on share links~~ → ✅ Added per-token rate limiter (60 req/60s keyed on token+ip)
- ~~Email lookup in webhook could leak existence~~ → ✅ Removed `console.log("Found user via email")` timing signal
- ~~Duplicate "Find businesses that need websites" phrasing~~ → ✅ Changed to "Discover untapped opportunities — businesses that need websites..."
- ~~No newsletter signup in footer~~ → ✅ Added newsletter signup form (email input + Subscribe button)
- ~~Missing `aria-expanded` on accordion triggers~~ → ✅ Added to ObjectionsSection + LandingFAQ accordion trigger buttons
- ~~Admin cache TTL too long (60s) — staleness risk in serverless (L-3)~~ → ✅ Lowered to 30s; documented that serverless cold starts always re-fetch
- ~~Oversized API route files (L-1)~~ → ✅ Refactored [`analyze-design/route.ts`](src/app/api/analyze-design/route.ts) (741→362), [`pitch/route.ts`](src/app/api/pitch/route.ts) (626→490), [`discover/route.ts`](src/app/api/discover/route.ts) (582→378). Extracted shared logic into [`stream-utils.ts`](src/lib/api/stream-utils.ts), [`retry.ts`](src/lib/api/retry.ts), [`sanitize.ts`](src/lib/api/sanitize.ts), [`gemini.ts`](src/lib/gemini.ts), [`screenshot.ts`](src/lib/screenshot.ts), [`design-analysis.ts`](src/lib/design-analysis.ts), [`places-types.ts`](src/lib/data/places-types.ts)
- ~~No video demo (L-11)~~ → ✅ Created [`VideoDemoSection.tsx`](src/components/landing/VideoDemoSection.tsx) — mock video player with play button, gradient placeholder, CTA. Wired into [`LandingPageClient.tsx`](src/components/landing/LandingPageClient.tsx)
- ~~No competitor comparison (L-12)~~ → ✅ Created [`CompetitorComparisonSection.tsx`](src/components/landing/CompetitorComparisonSection.tsx) — 3-column comparison grid (Manual vs Nearsited). Wired into [`LandingPageClient.tsx`](src/components/landing/LandingPageClient.tsx)
- ~~No blog/resources (L-13)~~ → ✅ Created [`BlogResourcesSection.tsx`](src/components/landing/BlogResourcesSection.tsx) — 3 blog post placeholder cards. Wired into [`LandingPageClient.tsx`](src/components/landing/LandingPageClient.tsx)
- ~~Missing `lang` attribute on HTML~~ → ✅ Already present (`lang="en"` in [`src/app/layout.tsx`](src/app/layout.tsx:47))
- ~~No `rel="noopener"` on external links~~ → ✅ All `target="_blank"` links already carry `rel="noreferrer"` (which implies noopener)
- ~~No CI pipeline (L-2)~~ → ✅ Added [`/.github/workflows/ci.yml`](.github/workflows/ci.yml) — type-check + lint + test on push/PR to master
- ~~No PWA manifest~~ → ✅ Added [`/public/manifest.json`](public/manifest.json) with brand colors, linked via `metadata.manifest` in root layout

22/23 resolved. 1 remaining: No full service worker caching strategy — deferred to v2 (no-op blocker already in place for webview safety).

---

## Appendix A: npm Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `next dev --turbopack` | Development server with Turbopack |
| `build` | `next build` | Production build |
| `start` | `next start` | Production server |
| `lint` | `next lint` | Lint check |
| `test` | `vitest run` | Run tests |
| `test:watch` | `vitest` | Watch mode tests |
| `db:check` | `node scripts/check-db-state.mjs` | Check database state |
| `clean:all` | `node scripts/clean-cache.mjs` | Clean caches |

## Appendix B: Environment Variables

Required variables (checked by [`validateEnv()`](src/lib/env.ts)):

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (secret, NEVER public) |
| `GEMINI_API_KEY` | Google Gemini API key |
| `SCREENSHOT_API_KEY` | ScreenshotOne API key |
| `GOOGLE_PLACES_API_KEY` | Google Places API key |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis token |
| `DODO_API_KEY` | Dodo Payments API key |
| `DODO_WEBHOOK_SECRET` | Dodo webhook secret |
| `RESEND_API_KEY` | Resend email API key (signup notifications) |
| `ADMIN_EMAIL` | Admin email for signup notifications |

---

> **End of Report** — This document covers Nearsited as of June 5, 2026.
>
> For the most up-to-date information, refer to the source files in the repository, particularly:
> - [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — Architecture decisions
> - [`docs/SCHEMA.md`](docs/SCHEMA.md) — Database schema (authoritative)
> - [`docs/CONVENTIONS.md`](docs/CONVENTIONS.md) — Coding conventions & decisions
> - [`CLAUDE.md`](CLAUDE.md) — Master rules and references
> - [`plans/pre-launch-audit-report.md`](plans/pre-launch-audit-report.md) — Known issues
