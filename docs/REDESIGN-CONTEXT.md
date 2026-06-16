# Nearsited — Current State Report (for Design Refactor Planning)
*Generated 2026-06-16. Purpose: hand this to a planning session before doing a page-by-page visual redesign. Verified against actual files, not just CLAUDE.md.*

---

## 0. Read this first — there is an unresolved direction conflict

The reference screenshots for the new direction (terminal/command-center aesthetic, amber/orange accent, bold "weapon"/"unfair advantage" copy, numbered briefing sections, decorative icons) **directly contradict the currently approved design system**, which is documented as "Status: ✅ Approved" in [`docs/DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md):

| Approved system says | Reference screenshots show |
|---|---|
| Inspirations: Linear, Raycast, Arc, Vercel | Inspiration reads more like a cybersecurity tool / AI-generated SaaS template |
| Brand voice: confident, precise, **calm**, editorial | Copy: "We rebuilt the weapon," "unfair advantage," "Stop guessing. Start scanning." |
| "Avoid: Cyberpunk — too aggressive, undermines trust" | Terminal/monospace labels, scan-line motifs, command-center framing |
| Accent: sage green `#8A9777`, functional color only | Accent: amber/orange, used decoratively throughout |
| "No decorative icons" (CLAUDE.md Rule B) | Icons used decoratively (lightning bolt, shield, trending-up tiles) |
| Landing page = product, same components as dashboard | Reference is pure marketing-brochure styling, unrelated to in-app components |

This isn't a small palette tweak — it's a brand-voice and visual-philosophy change. Before page-by-page work starts, the planning session needs an explicit decision: **(a)** evolve the current sage/calm/editorial system toward more boldness, or **(b)** replace it wholesale with the terminal/command-center direction. Everything below describes the system as it actually exists today, unbiased toward either outcome.

---

## 1. Product & Stack

Nearsited = lead-intelligence tool for web design agencies/freelancers. Workflow: discover local businesses → classify web presence → audit performance → analyse design → generate pitch → track in pipeline.

- Next.js 16.2.6 (App Router, Turbopack), TypeScript, Tailwind, Supabase (DB+Auth+Storage), Gemini 2.5 Flash, ScreenshotCore, Google Places/PageSpeed, jsPDF, lucide-react, Radix UI, recharts.
- Single frontend — **landing page and dashboard share one design system, one component library** (this is a documented, deliberate rule, not an accident — see §3.5/§4 of DESIGN_SYSTEM.md).
- Theme: dark only. No light theme exists.

---

## 2. Current Design System (as implemented today)

Source of truth: [`src/app/globals.css`](../src/app/globals.css) (tokens) + [`docs/DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md) v2.1 (philosophy, approved).

### 2.1 Brand voice & principles (documented, approved)
- Core belief: *"The best opportunities are not hidden. They are overlooked."*
- Voice: confident, precise, editorial, calm, observant — explicitly **not** hype-driven.
- Visual references to emulate: **Linear, Raycast, Arc, Vercel** (secondary: Stripe).
- Explicitly listed to avoid: **cyberpunk** ("too aggressive, undermines trust"), glassmorphism, neumorphism, startup illustrations, excessive gradients.
- Product-first: show the product before explaining it. Landing page hero uses real `<ScoreRing>`/`<Card>`/`<Badge>` components with sample data, not illustrations.
- One frontend rule: landing page must reuse dashboard components (`Button`, `Card`, `Badge`, `ScoreRing`, `WebsiteBadge`, `Table`) — never a parallel marketing-only style.

### 2.2 Color tokens (globals.css)
| Token | Value | Use |
|---|---|---|
| `--color-bg-page` | `#0a0e12` | Page background |
| `--color-bg-surface` | `#12171e` | Cards |
| `--color-bg-elevated` | `#1a2028` | Dropdowns/modals |
| `--color-border-subtle` / `-strong` | `rgba(255,255,255,.06/.10)` | Borders |
| `--color-text-primary/secondary/tertiary` | `#f0ede8` / `#b8b0a8` / `#8a8278` | Text hierarchy |
| `--color-accent` | sage `#8A9777` | Primary actions + active state ONLY |
| `--color-info` | blue `#60a5fa` | In-progress |
| `--color-warning` | amber `#c4984a` | Needs attention / stale |
| `--color-danger` | red `#c4665a` | Destructive / lost only |
| `--color-success` | deep green `#4a8f5a` | Completed / won only |
| `--radius-sm` / `-md` | 6px / 10px | Only two radii allowed — no `-lg/-xl` |

Also present: a `--bg-base/surface-1/2/3` raw layering system (4 levels, the semantic `--color-bg-*` tokens alias into it), score-specific terracotta/ochre/sage triplet, pipeline-status color set, and a badge-color quad (green/red/amber/indigo) — all additional to what CLAUDE.md's table shows, i.e. CLAUDE.md is a simplified summary of a richer token set.

Spacing scale: 4·8·12·16·24·32·48·64px, enforced as CSS vars (`--space-1` … presumably up to `--space-16`).

### 2.3 Component inventory (verified on disk)

**`src/components/ui/`** (current — superset of what CLAUDE.md lists):
`ActionMenu, Badge, Button, CanvasBackground, Card, CreditsWidget, EmptyState, ErrorState, LeadAffordances, ListRow, LoadingState, MetricCard, OpportunityCard, Pill, PipelineSelect, PoweredByGoogle, ScoreCircle, ScoreRing, SearchableSelect, Section, StatCard, StatTile, Toast, Tooltip, WebsiteBadge, WebsiteStatusPill`

**`src/components/ui/mobile/`**: `BottomNav, BottomSheet, MobileHeader, MobileTable, SwipeAction` (+ `index.ts` barrel)

Note: both legacy (`Badge`, `Card`, `ScoreRing`) and "preferred new" (`Pill`, `Section`, `ScoreCircle`) versions exist side by side — CLAUDE.md flags the legacy ones as deprecated-but-still-used. A redesign is a natural point to finish that migration rather than add a third generation.

### 2.4 Rules currently enforced (CLAUDE.md "Global Design Rules A–J")
One `<Section variant="card">` per page · no decorative icons · color is semantic (gray for zero) · list rows 42–48px · headers stand alone (no card wrapper) · state vs. action visually distinct · one primary action per section · no redundant "Back to X" on primary nav pages · no uppercase eyebrow repeating the nav label · score circles never show "~95" (dotted ring instead).

Mobile rules: mobile-first Tailwind, 44×44px touch targets, bottom sheets instead of center modals, fixed bottom nav (max 5 tabs, Settings excluded), iOS safe-area insets, no hover-only states.

---

## 3. Route / Page Inventory (verified against `src/app/`)

### 3.1 Marketing / public (root `src/app/`)
| Route | Status | Notes |
|---|---|---|
| `/` (landing) | Live | Composed from `src/components/landing/*` sections (see §3.4) |
| `/pricing` | Live | |
| `/privacy`, `/terms` | Live | Legal |
| `/(auth)/login`, `/(auth)/signup` | Live | Email/password + Google OAuth |
| `/auth/*` | Live | Supabase OAuth callback handling |
| `/reset-password` | Live | |
| `/share/[token]` | Live | Public read-only audit report, admin-client reads |
| `/admin/*` | Exists | Not documented in CLAUDE.md — gated by admin email (`nearsitedlabs@gmail.com` per memory) |
| `/not-found` | Live | 404 |

### 3.2 Dashboard (authenticated, `src/app/dashboard/`)
| Route | Nav label (actual, from `nav-constants.ts`) | Status |
|---|---|---|
| `/dashboard` | Dashboard | Live — stat cards, recent leads, pipeline funnel |
| `/dashboard/discover` | **Find** (not "Opportunity Discovery" as CLAUDE.md states) | Live — NDJSON streaming search |
| `/dashboard/leads` | Opportunities | Live — table, filters, pagination |
| `/dashboard/leads/[id]` | — | Live — 3-workflow routing (website / social_only / no_digital_presence), see §3.3 |
| `/dashboard/audit` | **Not in nav at all** | Live page exists (CLAUDE.md calls it "Opportunity Review"), but `DASHBOARD_NAV` has no entry pointing to it — likely reached via a different in-app link, not the sidebar |
| `/dashboard/pipeline` | Pipeline | Live |
| `/dashboard/pitches` | Pitches | Live |
| `/dashboard/settings` | Settings | Live |
| `/dashboard/radar` | **Not in nav** | Stub `EmptyState` — "Opportunity Radar... Coming soon" |
| `/dashboard/templates` | **Not in nav** | Stub `EmptyState` — "Templates... Coming soon" |

**Drift note:** CLAUDE.md documents a clean "7 nav items, no Coming Soon" sidebar. The actual `DASHBOARD_NAV` constant has only **6** items (no separate Discover-vs-Review split, labeled "Find" not "Opportunity Discovery"/"Opportunity Review"), and there are two additional routed-but-unlinked stub pages (`radar`, `templates`) that *do* show "Coming soon" copy. Worth deciding during redesign whether to wire these into nav, delete them, or keep them as silent stubs.

### 3.3 Lead Detail — three-workflow architecture (`src/app/dashboard/leads/[id]/`)
Routes server-side via `detectLeadWorkflow()` based on `website_status`:
- **Website workflow** → `lead-detail-client.tsx` (~1492 lines) — full audit/design scores, Core Web Vitals, issues, pitch gen, PDF/share export.
- **Social-only** → `components/social-opportunity-page.tsx`
- **No digital presence** → `components/no-digital-presence-page.tsx`

Shared sub-components actually on disk (`components/`): `LeadHeaderStrip, StatsRow, PitchCard, PreCallBrief, AIQuotaBanner, OpportunityBullets, opportunity-score-explanation, ScoreRingWithLabel, SubScore, ImpactPill, LeadExportSection, ClientCallSummaryCard, IssuesCard, AuditDetailsCard, HistoryCard, AnalysisProgressBanner, DesignErrorBanner, BusinessEditPanel` + legacy `LeadHeroSection, LeadOutreachSection, QuotaErrorBanner` (kept for backward compat, superseded by the shared set above).

### 3.4 Landing page sections (`src/components/landing/`)
`LandingPageClient` composes: `LandingNav, LandingScrollNav, LandingHero, TrustBar, HowItWorksSection, WhyNearsitedSection, SampleReportSection, SamplePitchSection, AgencyUseCasesSection, ObjectionsSection (uses useAccordion), ProofBlocksSection, LandingFAQ, CTASection, LandingFooter` + helpers `SectionLabel, SectionTitle, SectionSub` + legacy `Pricing.tsx`. Also an `atlas/` subfolder (`OpportunityAtlas`, dynamically imported, no-SSR — a canvas/map visualization behind the hero).

**`LandingHero.tsx` as currently built** (the file open in the editor): two-column hero, left = headline/CTA/trust line, right = an interactive sample "opportunity feed" card — three clickable rows (no_website / social_only / has_website sample businesses) that swap a live AI-pitch preview below, built from real `Card`/`Badge`/`ScoreRing`/`Button` components per the product-marketing-continuity rule. This is the literal reference implementation of "show the product, don't illustrate it" — any redesign of this section needs to either preserve that interaction or deliberately decide to drop it.

---

## 4. API Routes (verified, `src/app/api/`)
`account, analyze-design, audit, businesses, check-subscription, checkout, cities, contact-info, csp-report, data, discover, export, leads, notify-signup, pipeline, pitch, places-lookup, refresh-ratings, saved-searches, settings, share, subscribe, webhooks`

(CLAUDE.md documents the core v1 set in detail — `discover`, `audit`, `analyze-design`, `pitch`, `pipeline`, `export/pdf`, `contact-info`, `refresh-ratings`, `saved-searches`, `share`, `gemini-test`. The additional ones above — `account`, `check-subscription`, `checkout`, `subscribe`, `webhooks`, `csp-report`, `places-lookup` — are billing/security infra not covered in CLAUDE.md's route table, presumably added since it was last updated. Not directly relevant to a visual redesign, but flagging since CLAUDE.md says "update this file the moment a convention changes" and it hasn't kept pace.)

---

## 5. Recently committed work (do not lose this in a redesign branch)
The following files that were previously uncommitted have now been committed (`ec31e63`, `0db976d`, `acd48f1`):
- `middleware.ts`, `next.config.ts`, `src/app/api/analyze-design/route.ts`, `src/app/api/audit/route.ts`, `src/app/api/discover/route.ts`, `src/app/api/pipeline/route.ts`, `src/app/api/saved-searches/route.ts`, `src/lib/credits.ts`
- 51 files total in the bulk commit (+442/-310): API route security hardening, landing page component updates, dashboard leads/pipeline/pitches fixes, shared UI improvements (ScoreRing, CookieConsent, motion, validation, url-security), env config updates.
- Plus a `globals.css` `clamp()` fix and `LandingHero.tsx` Tailwind `text-[length:...]` type-prefix fix for the hero title font-size.
- `.gitignore` cleanup excluding audit artifacts and `.claude/`.

**Note:** This document should be re-verified against actual `git status` before branching.

---

## 6. Suggested framing for the planning session
Since this will be done page-by-page:
1. Resolve the §0 direction question first — it changes every subsequent decision (tokens, copy voice, icon usage, component reuse vs. rebuild).
2. Landing page (`/`) is the highest-leverage first target — it's where the reference screenshots clearly apply, and the product-marketing-continuity rule means decisions made here cascade into the dashboard.
3. If the sage/calm system is kept, the redesign is "evolve within the system" (tighten hierarchy, add the data-density/terminal *texture* without changing the philosophy). If replaced, every dashboard page inherits the change per the one-frontend rule — this is not just a landing page redesign in that case.
4. `radar` and `templates` stub pages are good low-risk pages to pilot the new direction on first, since nothing currently depends on their layout.
