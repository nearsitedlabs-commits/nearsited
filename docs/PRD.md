# Nearsited — Product Requirements Document
**Version:** 2.2 · **Date:** June 2026 · **Team:** Again Labs

---

## 1. Product Overview

### 1.1 What Nearsited Is
Nearsited finds local businesses with weak websites or no website at all, shows you exactly what's wrong, and writes the pitch — so agencies close redesign deals in minutes, not hours.

### 1.2 Positioning
**"Find businesses that need websites."**
Not a generic lead finder. The tool that walks an agency's salesperson into a prospect meeting fully loaded: real performance numbers, a design critique, ranked issues with point deductions, a pitch already written, and an export-ready PDF.

### 1.3 Target User
Web design agencies (1–20 people) doing outbound prospecting. Today they Google local businesses, eyeball sites, write pitches from scratch. Nearsited automates every step from discovery to outreach. Primary persona: agency owner or sales lead — non-technical, time-poor, prospecting 20–50 businesses/week.

---

## 2. The Magic Workflow

```
+ New Search → city + business type + radius
  → Discover 20–60 businesses, each classified by web presence
  → Review the Leads table (score rings + website badges)
  → Open a lead → Lead Detail
      → Screenshot + 6 scores (Performance, SEO, Mobile, UX/Design, Trust, Overall)
      → [v2] Run UX analysis → recorded interaction teardown + 7th score
      → Top issues with point deductions + "could reach X+" projection
      → AI Opportunity Summary (3–5 bullets)
      → AI Generated Pitch — pre-written, tone/length/focus adjustable
      → Export: PDF Report / Copy Email
  → Add to Pipeline → track to Won
```
This workflow is the spine. Every feature serves it or is deferred.

---

## 3. Navigation & Pages

### 3.1 Sidebar
```
Dashboard           ✅
Find                ✅ (was "Opportunity Discovery")
Opportunities       ✅ (consolidated from Opportunities + Review)
Pipeline            ✅
Pitches             ✅
Settings            ✅
USAGE
  Credits 18/20 · Free credits are lifetime · [Upgrade → Pricing]
[avatar · Free Plan]
```
6 nav items (consolidated for clarity). Credits widget always visible. Billing live via **Dodo Payments** (not Stripe).

### 3.2 Pages (V1 — All Built ✅)
| Page | Route | Status | Features |
|---|---|---|---|
| Dashboard | `/dashboard` | ✅ Live | Compact header + date, next action card (only card), opportunities list with inline stats, pipeline segmented bar |
| Leads (list) | `/dashboard/leads` | ✅ Live | Full table, search, tab filters, score rings, website badges, pagination 25/page, filter panel |
| Lead Detail | `/dashboard/leads/[id]` | ✅ Live | Overview/Audit/Issues/History tabs, 6 sub-scores (Mobile/Desktop reactive), top issues with deductions, pipeline dropdown, Copy Pitch, Share Link, Run Audit/Design buttons, auto-pipeline, toast system, expanded Core Web Vitals |
| Business Discovery | `/dashboard/discover` | ✅ Live | City/business type search, radius slider, results grid, audit/design analysis buttons, session storage, filters |
| Quick Site Audit | `/dashboard/audit` | ✅ Live | URL input, 9-step visual progress checklist, sessionStorage persistence, expanded Core Web Vitals, plain-English summaries, Save as Lead banner |
| Pipeline | `/dashboard/pipeline` | ✅ Live | Table with status dropdown (optimistic updates), canonical statuses |
| Pitches | `/dashboard/pitches` | ✅ Live | Redesigned cards: business name + type tag + pipeline state, subject + meta + 2-line preview, horizontal action row (Copy/Open in channel/View/overflow menu), collapsible search + filter panel |
| Settings | `/dashboard/settings` | ✅ Live | Profile view, plan info, API status, sign out |
| Auth | `/login`, `/signup` | ✅ Live | Email/password + Google OAuth, sign-up with name |

---

## 4. Page Specifications

### 4.1 Dashboard (`/dashboard`)
✅ **Built.** Compact single-column layout. No decorative icons, at most one card on the page.

**Header:** Date (small uppercase tertiary text) + workspace label on left, bordered "Discover" button on right. Under 50px tall.

**Next Action Card:** The only card on the page. Eyebrow: "Today". Headline: "{N} leads ready to pitch". Sub-line computed from real data (high-opportunity count, user's city). CTA: "Pitch them →".

**Opportunities List:** No card wrapper. Section header "Opportunities" + "View all →". Inline stat line: "{total} total · {unanalysed} unanalysed · {high} high opportunity · {pipeline} in pipeline · {conv} in conversation". Tight 50px rows, 0.5px borders. 32px score circles (no "~" prefix). Badges: Weak site / No website / Social only / Platform only.

**Pipeline:** No card wrapper. Horizontal segmented bar proportional to counts. Count line with color rules: zeros in gray, non-zero in stage color. Header "Pipeline" + "Manage →".

**Empty state (first-time user):** centered card with "Find your first opportunity" heading + "Start Discovering →" CTA.

### 4.2 Leads (`/dashboard/leads`)
✅ **Built.** Full-width table + right filter panel.
**Header:** title, search (name/category/city), "+ New Search" primary, Filters toggle.
**Sub-header stat cards:** Total Leads · Needs Improvement · Strong Opportunities · Contacted.
**Tab filters:** All · Needs Improvement · Strong Opportunities · Contacted · Archived.
**Table columns:** · name + category · location · website badge · score ring + label · issues count (placeholder) · last analyzed · status badge · actions (View, Maps, Website).
**Status badges:** Strong Opportunity (green/border), Needs Improvement (amber), Poor (red), Not Analyzed (grey).
**Right filter panel:** website status filter · sort-by + order · score range slider.
**Pagination:** 25/page, numbered.

### 4.3 Lead Detail (`/dashboard/leads/[id]`)
✅ **Built + improved (May 2026).**
**Header:** ← Back · business name (H1) · location · category · URL (external link) · Map link · **pipeline status dropdown** (all 7 canonical stages, human-readable labels, PATCH /api/pipeline on change) · **Copy Pitch** button (copies generated pitch body to clipboard; shows "Generate a pitch first" toast if none).
**Tabs:** Overview · Audit · Issues · UX [v2] · Competitors [v2] · History.

**Overview tab** — two columns.
*Left:* **Mobile/Desktop toggle** (fully reactive — switches performance score, SEO score, and design criteria displayed) · overall score ring + label · "Last analysed" date · **action buttons**: Re-analyse (spinner + "Re-analysing…" + "Re-analysis complete" toast on done) / **Run Audit** (if never audited) / **Run Design Analysis** (if audited but no design) · score projection ("Fixing top issues could improve to X+") · **Top Issues Impacting Score** (3 issues: title, detail, impact pill, point deduction) · **Redesign Opportunity** ([v2] placeholder).
*Right:* **Score Breakdown** (6 sub-scores, all reactive to Mobile/Desktop toggle) · **AI Opportunity Summary** (3–5 bullets) · **AI Generated Pitch** (Tone / Length dropdowns, Generate button with **error display** and console logging, pitch result with inline **Copy Pitch** button) · **Export Options** (PDF Report; **Share Link** copies current page URL to clipboard + toast; Pitch Deck [v2] stub).

**Audit tab:** full PageSpeed breakdown for Mobile + Desktop. **Expanded Core Web Vitals** metric cards: full name (e.g. "First Contentful Paint (FCP)"), plain-English subtitle ("Time until first content appears"), colour-coded value (green/amber/red per Google CWV thresholds). Performance + SEO sub-scores.
**Issues tab:** all design issues — title, detail, impact tag, point deduction.
**UX tab [V2]:** "Coming Soon" placeholder.
**Competitors tab:** [v2] "Coming Soon" placeholder.
**History tab:** timeline of audits/analyses — date, scores.

**Auto-pipeline:** When a lead is audited for the first time (`audited_at` was null), the system automatically adds it to the pipeline with status "analysed" and shows "Added to pipeline automatically" toast.

**Toast system:** fixed bottom-right overlay (CheckCircle2 icon, green border, 3s auto-dismiss) for: Pitch copied, Link copied, Added to pipeline, Re-analysis complete/failed, Audit/design errors.

### 4.4 Quick Site Audit (`/dashboard/audit`)
✅ **Built + improved (May 2026).** Renamed from "AI Audit" to "Quick Site Audit". Subtitle: "Enter any website URL to get a performance score, SEO score, and AI design analysis in under 2 minutes."

**URL input:** Enter key triggers run. "Run Audit" button shows spinner + phase label ("Auditing…"/"Analysing…") while running.

**Visual progress checklist:** 9 named steps shown as a card below the input while running (and remains visible with all-green checkmarks after completion):
1. Fetching site data · 2. Running Mobile PageSpeed · 3. Running Desktop PageSpeed · 4. Performance audit complete
5. Taking Mobile screenshot · 6. Taking Desktop screenshot · 7. Analysing Mobile design · 8. Analysing Desktop design · 9. Analysis complete
Each step shows: ✓ CheckCircle (green, line-through) when done · ⟳ Loader spinner (indigo) when active · ○ Circle (gray) when pending.

**Performance Scores section:** Mobile + Desktop columns. Expanded Core Web Vitals (FCP/LCP/TBT/CLS) with full names, plain-English subtitles, colour-coded values (green/amber/red per Google thresholds). **Plain English summary** in indigo-50 box (e.g. "This site is noticeably slow. Visitors on mobile are likely leaving before it loads.").

**Design Analysis section:** design score + issues per strategy. **Plain English design summary** ("The main issues found: …").

**SessionStorage persistence:** results saved to `'ai_audit_last_result'` with timestamp. On return visit: restored immediately with "Showing results from X ago — Run a new audit to refresh" note.

**Save as Lead banner:** appears after completion — links to /dashboard/discover with explanatory text. Quota error banner (amber, with countdown timer) on AI_QUOTA_EXCEEDED.

### 4.5 Pitches (`/dashboard/pitches`)
✅ **Built + refactored (June 2026).** Redesigned pitch cards with horizontal action layout.

**Header:** "Pitches" (16px) + inline stats line. Collapsible Filter ▾ trigger on right.

**Search/Filters:** Collapsible panel with "OPPORTUNITY TYPE" and "CHANNEL" labels. Chips show counts, zero-result chips dimmed at 50% opacity. Clear all filters action.

**Pitch Card:** Business name (14px, 500) + compact opportunity type tag + pipeline state ("✓ In pipeline" gray text or "→ Pipeline" button). Subject line + metadata line ("Email · Professional · Score 78 · 9 Jun") + 2-line body preview (sentence-boundary truncated). Bottom action row: [Copy] primary, [Open in email/WhatsApp] secondary (channel-aware), [View ↗] link, [⋯] overflow menu (Regenerate · Edit · Send to pipeline · Delete).

**Empty-space CTA:** Dashed-border card when < 5 pitches: "That's all your pitches. Generate more from Opportunities →".

### 4.6 Discover (`/dashboard/discover`)
✅ **Built.** Search form: city (searchable select with Indian cities), business type (searchable select grouped by category), radius slider (1–100km), Save Search. Results grid with website status badges, rating, audit scores, audit/design analysis buttons, pipeline add. Client-side filters: website status, min ratings, min reviews. Session storage persistence. "Load More" pagination.

### 4.7 Pipeline (`/dashboard/pipeline`)
✅ **Built.** Table of pipeline businesses. Status dropdown with all 7 canonical stages, optimistic update on change, loading spinner during update.

---

## 5. UX Analysis (V2 Feature Spec)

### 5.1 What It Is
Where the static design analysis evaluates an above-the-fold screenshot, **UX analysis evaluates how the site behaves** — captured by driving a real headless browser (Playwright) through the site: scrolling, clicking the primary CTA, attempting a form, observing animations and feedback. The recorded frame sequence is analysed by Gemini for interaction quality.

### 5.2 Why It's Separate From Design Analysis
- **Design** = static visual quality (modernity, readability, hierarchy, trust) from one screenshot.
- **UX** = interaction quality (navigation clarity, CTA flow, form behaviour, interaction feedback, scroll experience) from a recorded session.
Different artifact, different cost, different infrastructure (queue + worker server). Stored in its own `ux_analyses` table.

### 5.3 User Flow
```
Lead Detail → UX tab → "Run UX Analysis" button
  → enqueues a job, returns immediately
  → UI: "Analyzing UX… (~1 min)" with live status (Supabase Realtime)
  → worker drives Playwright, records frames, Gemini analyses
  → UX tab populates: frame sequence viewer + UX score + interaction findings + UX issues
```

### 5.4 UX Tab Contents (once analysed)
- **UX score** (0–100) + label, alongside the design score.
- **Frame sequence viewer:** the captured interaction frames (scroll positions, CTA clicked, form state) as a stepped gallery or scrubber.
- **Interaction findings:** what the browser did and what happened.
- **UX issues:** ranked list with impact tags + point deductions.
- **5 UX criteria** (1–10): navigation, cta_flow, form_experience, interaction_feedback, scroll_experience.

### 5.5 Score Merge Behaviour (Product Decision)
Default UI shows **one blended quality number** (Design + UX). A **"Deep Analysis" toggle** splits it into Design (static) vs UX (interaction). Both scores stored separately; blend computed at read time (`design×0.5 + ux×0.5` when UX exists; design alone otherwise).

### 5.6 Build Constraints
- Mobile-first.
- Queue-only — a session takes 30–120s, impossible synchronously.
- Runs on the persistent worker server (Runtime B), never Vercel.
- Frame sequence, not raw video.
Full technical detail: ARCHITECTURE §10, SCHEMA §2.6 + §6.

---

## 6. Scoring System

### 6.1 The Scores
| Score | Source | Strategy | Formula |
|---|---|---|---|
| Performance | PageSpeed | desktop | `categories.performance.score × 100` |
| SEO | PageSpeed | desktop | `categories.seo.score × 100` (needs `category=seo`) |
| Mobile | PageSpeed | mobile | `categories.performance.score × 100` |
| UX/Design | Gemini static | mobile | `(modernity+readability+cta+hierarchy)/4 × 10` |
| Trust | Gemini static | mobile | `trust × 10` |
| Overall | computed | — | `perf·0.25 + seo·0.15 + mobile·0.25 + uxdesign·0.20 + trust·0.15` |
| **UX (interaction)** [v2] | Playwright+Gemini | mobile | `(navigation+cta_flow+form_experience+interaction_feedback+scroll_experience)/5 × 10` |

### 6.2 Labels
0–39 Poor (red) · 40–69 Needs Improvement (amber) · 70–84 Good (green) · 85–100 Strong (deep green).

### 6.3 Point Deductions & Projection
Gemini assigns a point deduction per issue (estimate of points removed from 100). Projection = `min(95, score + sum(top-3 deductions))` → "Fixing these could improve your score to X+". Computed only in [`src/lib/scoring.ts`](nearsited/src/lib/scoring.ts).

✅ All scoring functions are implemented in `scoring.ts`: computeOverall, uxDesignScore, trustScore, uxInteractionScore, projection, blendedQuality, scoreLabel, scoreColor, scoreColorClasses.

---

## 7. Lead Classification & Pitch Branching

### 7.1 `website_status`
`has_website` · `no_website` · `social_only` · `platform_only` · `unknown`.

### 7.2 Pitch Angles by Lead Type
✅ All 6 angles implemented in [`src/app/api/pitch/route.ts`](nearsited/src/app/api/pitch/route.ts:44).
| Lead Type | Angle |
|---|---|
| `has_website` <50 | "Your site is actively costing you customers — here's the proof" |
| `has_website` 50–69 | "Real potential held back by fixable issues" |
| `has_website` ≥70 | "Solid site, specific wins worth going after" |
| `no_website` | "You have no web presence — here's what you're leaving on the table" |
| `social_only` | "Facebook is not a website — here's what a real one would do for you" |
| `platform_only` | "You're renting space on someone else's platform — here's the risk" |

Pitch pulls real data: latest audit (performance, LCP, FCP), latest design analysis (design score, top issues), [v2] latest UX analysis (UX issues). Honours Tone (professional/friendly/luxury), Length (short/medium/detailed), Focus (conversion/trust/performance).

---

## 8. Pipeline Stages
`new_lead → analysed → pitch_generated → contacted → in_conversation → won → lost`
| Stage | Meaning |
|---|---|
| new_lead | discovered, not audited |
| analysed | audit + design analysis complete |
| pitch_generated | AI pitch created |
| contacted | outreach sent |
| in_conversation | prospect replied |
| won | client signed |
| lost | closed, no conversion |

✅ All stages valid in `pipeline` table constraint. Legacy `stage` column dropped.

---

## 9. V1 vs V2

### ✅ V1 (Built)
Discover + Classify · Performance Audit (6 scores) · Design Analysis (Gemini static vision) · Leads page · Lead Detail (all tabs except UX/Competitors; pipeline dropdown; reactive Mobile/Desktop scores; expanded Core Web Vitals; Copy Pitch; Share Link; Run Audit/Design buttons; auto-pipeline; toast system) · Dashboard · Pitch Generation (lead-type branched, workflow/channel params) · Pipeline · PDF Report · Share Link · Credits enforcement · Settings · Quick Site Audit · Saved Searches · **Dodo Payments billing (live — Starter $19/mo, Agency $49/mo)**.

**Pricing tiers (live):**
| Plan | Price | Analyses/mo | Searches/mo |
|---|---|---|---|
| Free | $0 | 20 lifetime credits | 1 lifetime |
| Starter | $19/mo ($180/yr) | 50 | 3 |
| Agency | $49/mo ($468/yr) | 200 | 10 |

Free tier = 20 audit credits at signup (covers ~10 full lead analyses). No time limit, no card required. Monthly reset on paid plans only. Team seats **not yet built** (removed from pricing page).

### V2 (Build Later)
**UX Analysis** (Playwright + queue + worker + Storage) · Radar / decay monitoring · Competitor Intelligence · Mockup Generation · Pitch Deck + Loom export · Campaigns · Templates · Reports · Integrations · Team seats / multi-user · Email sending in-product · Vertical Intelligence Packs.

> v2 sequencing note: UX Analysis is built first among v2 features because it establishes the worker server + queue + Storage that Radar and self-hosted screenshots also use.

---

## 10. Design System
Theme: **dark** — near-black navy `#0a0e12`, sage green accent `#8A9777`. CSS variables in [`src/app/globals.css`](src/app/globals.css) are authoritative.
Font: **Geist** (UI, weights 300/400/500/600), **Switzer** (hero headlines only, landing page), **Geist Mono** (mono/code).
Score rings: SVG circular progress, colour-coded (score-good/score-mid/score-high CSS vars).
Impact pills: High=red, Medium=amber, Low=green.
Layout: fixed sidebar (w-60) + main (flex-1, max-w-7xl centered). v2 nav items removed entirely.
Credits widget always visible. "Buy More" links to Dodo Payments checkout (live). Free tier: 20 lifetime credits. Paid plans reset monthly.
Screenshot thumbnails 16:9, rounded (`rounded-xl`), bordered.

---

*End of PRD.*
