# Nearsited — Product Requirements Document
**Version:** 2.1 · **Date:** May 2026 · **Team:** Again Labs

---

## 1. Product Overview

### 1.1 What Nearsited Is
Nearsited is an AI-powered redesign opportunity intelligence platform for web design agencies. It automates the entire business-development workflow: finding local businesses with weak web presence, gathering hard evidence of their problems, and generating a personalised cold outreach pitch — in under two minutes.

### 1.2 Positioning
**"AI-powered redesign opportunity intelligence for web design agencies."**
Not a generic lead finder. The tool that walks an agency's salesperson into a prospect meeting fully loaded: real performance numbers, a design critique, ranked issues with point deductions, an interaction/UX teardown, a pitch already written, and an export-ready PDF.

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
nearsited [logo]
MAIN
  Dashboard           ✅
  Leads               ✅ (primary working page)
  Business Discovery  ✅
  AI Audit            ✅
  Pipeline            ✅
  Pitches             ✅
  Radar     [v2 stub] — Coming Soon
  Templates [v2 stub] — Coming Soon
  Campaigns [v2 stub] — Coming Soon
  Reports   [v2 stub] — Coming Soon
  Integrations [v2 stub] — Coming Soon
  Settings            ✅
USAGE
  Credits 100/100 · Resets in 30 days · [Buy More — disabled, no Stripe]
[avatar · Free Plan]
```
v2 nav items present but disabled with "Coming Soon" tooltip. Credits widget always visible (UI wired, Stripe deferred).

### 3.2 Pages (V1 — All Built ✅)
| Page | Route | Status | Features |
|---|---|---|---|
| Dashboard | `/dashboard` | ✅ Live | Stat cards, recent leads, pipeline funnel, Radar stub, inline lead detail |
| Leads (list) | `/dashboard/leads` | ✅ Live | Full table, search, tab filters, score rings, website badges, pagination 25/page, filter panel |
| Lead Detail | `/dashboard/leads/[id]` | ✅ Live | Overview/Audit/Issues/History tabs, 6 sub-scores (Mobile/Desktop reactive), top issues with deductions, pipeline dropdown, Copy Pitch, Share Link, Run Audit/Design buttons, auto-pipeline, toast system, expanded Core Web Vitals |
| Business Discovery | `/dashboard/discover` | ✅ Live | City/business type search, radius slider, results grid, audit/design analysis buttons, session storage, filters |
| Quick Site Audit | `/dashboard/audit` | ✅ Live | URL input, 9-step visual progress checklist, sessionStorage persistence, expanded Core Web Vitals, plain-English summaries, Save as Lead banner |
| Pipeline | `/dashboard/pipeline` | ✅ Live | Table with status dropdown (optimistic updates), canonical statuses |
| Pitches | `/dashboard/pitches` | ✅ Live | List of saved pitches, copy to clipboard, delete |
| Settings | `/dashboard/settings` | ✅ Live | Profile view, plan info, API status, sign out |
| Auth | `/login`, `/signup` | ✅ Live | Email/password + Google OAuth |

---

## 4. Page Specifications

### 4.1 Dashboard (`/dashboard`)
✅ **Built.** Two-column split. Left (~65%): stat cards + recent leads + pipeline funnel + radar stub. Right (~35%): inline lead detail for the selected lead.

**Stat cards (6):** Leads Analyzed · Opportunities · Pitches Generated · In Pipeline · Emails Sent [v2 stub] · Reply Rate [v2 stub]. The first four show real counts from the DB. The two email cards are v2 stubs (dashed border, "—" value, "v2" badge) — email sending infrastructure is deferred to v2.
**Recent Leads:** 5 most recent — thumbnail, name, city, category, overall score ring, time ago. Click → updates right panel. "View All" → /dashboard/leads.
**Pipeline Overview:** count per stage (New Leads / Analysed / Pitch Generated / Contacted / In Conversation / Won), Win Rate %.
**Opportunity Radar:** [v2 stub] "We monitor your leads and notify you when new opportunities appear." Placeholder stats (Websites Updated, Performance Dropped, SSL Issues, No Updates 90+ days), "Coming Soon" badge.
**Inline Lead Detail (right):** condensed Overview — score ring, sub-scores, flagged status, "View Full Lead" link.

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
✅ **Built.** List of saved pitches. Columns: Business · subject · status (Draft/Sent/Replied) · created · actions (Copy/Delete). Tone and lead_type displayed.

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
Discover + Classify · Performance Audit (6 scores) · Design Analysis (Gemini static vision) · Leads page · Lead Detail (all tabs except UX/Competitors; pipeline dropdown; reactive Mobile/Desktop scores; expanded Core Web Vitals; Copy Pitch; Share Link; Run Audit/Design buttons; auto-pipeline; toast system) · Dashboard (with stubs) · Pitch Generation (lead-type branched, error display) · Pipeline · PDF Report · Share Link (clipboard URL) · Credits UI (no Stripe) · Settings · Quick Site Audit (step progress checklist, sessionStorage persistence, plain-English summaries, Save as Lead) · Saved Searches.

### V2 (Stub in UI, Build Later)
**UX Analysis** (Playwright + queue + worker + Storage) · Radar / decay monitoring · Competitor Intelligence · Mockup Generation · Pitch Deck + Loom export · Campaigns · Templates · Reports · Integrations · Stripe billing + credit enforcement · Email sending in-product · Vertical Intelligence Packs · Share Link.

> v2 sequencing note: UX Analysis is built first among v2 features because it establishes the worker server + queue + Storage that Radar and self-hosted screenshots also use.

---

## 10. Design System
Theme: **light** — white/light backgrounds, indigo-600 `#4F46E5` primary. ✅ Light theme migration COMPLETE (CSS variables in `globals.css`).
Font: DM Sans or Plus Jakarta Sans (Geist as fallback).
Score rings: SVG circular progress, colour-coded (emerald/green/amber/red).
Impact pills: High=red, Medium=amber, Low=green.
Layout: left sidebar + main + right panel (dashboard). v2 nav items disabled with tooltip.
Credits widget always visible, "Buy More" disabled (no Stripe).
Screenshot thumbnails 16:9, rounded, bordered.

---

*End of PRD.*
