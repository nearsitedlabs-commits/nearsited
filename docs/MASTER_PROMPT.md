# NEARSITED — MASTER CONTEXT PROMPT v2
> Paste this entire block at the start of every Copilot Chat or Zed AI session.
> Replace CURRENT TASK at the bottom with your specific task.
> Last updated: June 1, 2026 — corrected theme, fonts, path, new bugs from Batch 1+2 review.

---

## ⚠️ NEXT.JS WARNING (from AGENTS.md)
This is NOT the Next.js you know from training data. APIs, conventions, and file
structure may differ. Before writing any Next.js-specific code, read
`node_modules/next/dist/docs/` and heed deprecation notices.

---

## PROJECT

**Nearsited** — AI-powered redesign opportunity intelligence SaaS for web agencies.
Tagline: "Find what others overlook."
Core belief: "The best opportunities are not hidden. They are overlooked."
Built by Again Labs. Founder is near-sighted — the glasses logo is literal.

Magic workflow:
  New Search → discover 20–60 businesses by city + type + radius
    → score each by web presence → open a lead
    → 6 AI scores + screenshot + ranked issues + projection
    → AI Opportunity Summary → AI Generated Pitch (tone-adjustable, cites real numbers)
    → Export PDF / Copy Pitch → Add to Pipeline → track to Won

Internal mantra: Discover. Understand. Pitch. Win.

---

## STACK

Framework:  Next.js 16.2.6, App Router, Turbopack (see warning above)
Language:   TypeScript strict
Styling:    Tailwind CSS v4 + CSS variables in globals.css — DARK theme
DB / Auth:  Supabase (Postgres 15 + GoTrue)
AI:         gemini-3.5-flash — header auth: x-goog-api-key. NEVER gemini-1.5-flash (shut down).
Screenshots:ScreenshotOne (takeScreenshot() abstraction in analyze-design route)
Places:     Google APIs — one key GOOGLE_PLACES_API_KEY, ?key= param
PageSpeed:  Google APIs — same key, needs &category=performance&category=seo
PDF:        jsPDF server-side
Animation:  framer-motion
Tables:     @tanstack/react-table
Icons:      lucide-react — no emojis as icons ever

Project root: C:\Projects\nearsited — ALL npm commands run HERE.
Dev server:   npm run dev → localhost:3000. Restart after ANY env variable change.
Windows note: Use Select-String not grep in PowerShell.

---

## TWO RUNTIMES — NEVER CONFUSE THEM

Runtime A (Vercel): All Next.js pages, all v1 API routes, auth, anything under 60s.
Runtime B (Railway/Render/Fly.io): Playwright only, v2 only.
NEVER run Playwright on Vercel. V1 ships entirely on Runtime A.

---

## DESIGN SYSTEM

### Theme
DARK theme. Near-black navy foundation. Sage/olive green accent.
Premium simplicity — Linear/Raycast/Vercel quality.
NOT glassmorphism, cyberpunk, neon, startup illustrations.

### Typography
Primary UI:   Geist (weights 300/400/500/600) — everything in the dashboard
Display/Hero: Switzer (weights 400/500/600) — hero headlines on landing ONLY, never dashboard
Mono:         Geist Mono — code, metrics, data values

Rules:
- Geist is the default. Every element uses Geist unless explicitly Switzer.
- NO serif fonts anywhere. Playfair Display, Instrument Serif, Newsreader — banned.
- Score ring numbers: Geist medium (500), never bold, never serif.
- Page headers: Geist, text-2xl font-normal, not bold.

### CSS Variables (globals.css — authoritative)

--bg-base:         #0a0e12
--bg-surface:      #12171e
--bg-elevated:     #1a2028
--border:          rgba(255,255,255,0.06)
--border-strong:   rgba(255,255,255,0.10)
--text-primary:    #f0ede8
--text-secondary:  #b8b0a8
--text-tertiary:   #7a7268
--text-muted:      #3f3a35
--accent:          #8A9777  (sage green — primary accent)
--accent-hover:    #7F8C63
--accent-tint:     rgba(138,151,119,0.14)
--success:         #7a9f7a  (score >=70)
--success-tint:    rgba(122,159,122,0.10)
--warning:         #c4984a  (score 40-69)
--warning-tint:    rgba(196,152,74,0.10)
--error:           #c4665a  (score <40)
--error-tint:      rgba(196,102,90,0.10)
--score-high:      #e86c4a
--score-high-tint: rgba(232,108,74,0.10)
--score-mid:       #d4a017
--score-mid-tint:  rgba(212,160,23,0.10)
--score-good:      #4caf76
--score-good-tint: rgba(76,175,118,0.10)
--badge-green-bg:     rgba(122,159,122,0.12)
--badge-green-border: rgba(122,159,122,0.30)
--badge-green-text:   #9ac49a
--badge-red-bg:       rgba(196,102,90,0.12)
--badge-red-border:   rgba(196,102,90,0.30)
--badge-red-text:     #d49080
--badge-amber-bg:     rgba(196,152,74,0.12)
--badge-amber-border: rgba(196,152,74,0.30)
--badge-amber-text:   #d4b870
--badge-indigo-bg:    rgba(108,92,231,0.10)
--badge-indigo-border:rgba(108,92,231,0.25)
--badge-indigo-text:  #b0a0f0

### Component Patterns
Cards:    bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5
Buttons:  Primary: bg-[var(--accent)] text-white rounded-lg px-4 py-2.5 text-sm font-medium
          Ghost: border border-[var(--border)] bg-transparent text-[var(--text-secondary)]
Inputs:   bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg py-2.5 px-4
Badges:   rounded-full px-2.5 py-0.5 text-xs font-medium (use badge semantic tokens)
Tables:   overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]
Page h1:  text-2xl font-normal text-[var(--text-primary)] — Geist, NOT bold, NOT serif
          Section label above: text-[10px] uppercase tracking-[0.2em] text-[var(--text-tertiary)]

Landing page and dashboard share ONE component library from components/ui/*.
components/landing/* is legacy — new work goes in components/ui/*.
OpportunityAtlas shader is already built at src/components/landing/atlas/.

---

## SUPABASE CLIENT RULES — NON-NEGOTIABLE

auth.getUser()                           → createClient() from src/lib/supabase/server.ts
Server INSERT/UPDATE (audits, design_analyses, pitches, places_cache, share_links,
  businesses score update)               → createAdminClient() from src/lib/supabase/admin.ts
businesses upsert (discover)             → createClient() — documented exception
pipeline INSERT/UPDATE                   → createClient() — MUST call auth.getUser() first
Client component reads                   → browser createClient() from src/lib/supabase/client.ts

SUPABASE_SERVICE_ROLE_KEY NEVER gets NEXT_PUBLIC_ prefix.
Never import admin client into browser code.

---

## CANONICAL ENUMS — COPY VERBATIM, NEVER INVENT

WebsiteStatus  = "has_website" | "no_website" | "social_only" | "platform_only" | "unknown"
PipelineStatus = "new_lead" | "analysed" | "pitch_generated" | "contacted" |
                 "in_conversation" | "won" | "lost"
Strategy       = "mobile" | "desktop"
PitchTone      = "professional" | "friendly" | "luxury"
ImpactLevel    = "High" | "Medium" | "Low"
PitchStatus    = "draft" | "sent" | "replied"

Always render pipeline status through PIPELINE_LABELS in src/lib/ui-constants.ts.
Always render website status through WebsiteBadge component.
Always render pitch_status and lead_type through label maps — not raw strings.

---

## PRODUCT TERMINOLOGY

Use:   Opportunity, Opportunity Score, Opportunity Review, Opportunity Summary,
       Opportunity Pipeline, Opportunity Discovery, Discover (not Search)
Avoid: Audit, Analysis, AI (overused), Score (alone)

---

## NDJSON STREAMING FORMAT

Every chunk: JSON.stringify(obj) + "\n"
{"type":"progress","step":"...","label":"..."}  repeated during work
{"type":"result", ...data}                       final payload
{"type":"done"}                                  stream complete
{"type":"error","message":"..."}                 on failure

Cache hits return plain JSON immediately. Client must handle both shapes.

---

## PLACES_CACHE — CORRECT UNDERSTANDING

Columns: place_id, website, website_status, details_fetched_at — ONLY THESE FOUR.
DO NOT add rating or review_count — Google Places API ToS violation.
rating and review_count live on the businesses table (per-user, written during discovery).
Staleness: 90-day TTL via details_fetched_at.
Writes: admin client only. Reads: batched SELECT WHERE place_id IN (...).

---

## OPPORTUNITY SCORING (implemented June 1, 2026)

computeOpportunityScore(qualityScore, reviewCount, rating) in src/lib/scoring.ts.
Stored as opportunity_score on the businesses table.
Backfill script: scripts/backfill-opportunity.mjs.
Peak at quality ~40-45 (bad enough to need redesign, good enough the business cares).
Multiplied by business viability (review count + rating as proxy).
Use opportunityLabel() and opportunityBadgeVariant() from scoring.ts for display.
Never use scoreLabel() for opportunity badges — that describes website quality.

---

## SEVEN CARDINAL RULES

1. Schema first. SCHEMA.md → SQL in Supabase → code. In that order.
2. One source of truth. Enums in types.ts. Scores in scoring.ts.
3. Never return a fake 200. Failed write → error or { persisted:false }.
4. Admin client for server writes. Session client = auth.getUser() only.
5. Thin route handlers. Logic in exported functions, not inline.
6. Log every external call. [ROUTENAME] prefix. Full Supabase error {code,message,details,hint}.
7. Timeout every external call. PageSpeed 60s · ScreenshotOne 30s · Gemini 30s.
   AbortController. Retry once on 500/429 only.

---

## PAST BUGS — NEVER REPEAT

Original bugs:
- website_url / gmb_* / category / website_type / country / cached_at — DROPPED from
  businesses. Use website / place_id / business_type.
- gemini-1.5-flash — DEAD. Use gemini-3.5-flash with x-goog-api-key header.
- Session client for server INSERT → silent 42501 RLS failure → use admin client.
- Missing &category=seo on PageSpeed → seo_score undefined.
- No AbortController → route hangs on slow sites.
- Showing raw pipeline enum to user → use PIPELINE_LABELS.
- navigator.clipboard without try/catch → unhandled promise rejection.
- Playwright on Vercel → impossible. Runtime B only.
- disabled={condition} where condition can be null → hydration mismatch → use !!condition.
- Fake 200 after failed insert → { persisted:false }.
- sessionStorage read in useState initializer → SSR crash → read in useEffect.
- PATCH pipeline without checking row exists → updates 0 rows, returns success. Use upsert.
- /api/pipeline POST trusted userId from body without auth.getUser() → IDOR risk.

New bugs found June 1, 2026 (Batch 1 + 2 review):
- Share link API silently fails: "[LEAD] Share API failed: Failed to create share link".
  Likely admin client not used for share_links insert, or table missing.
  File: src/app/api/share/route.ts — STATUS: FIXED Jun 1, 2026
- History tab score numbers don't match Overview score numbers for the same lead.
  History shows "Performance Audit: 99" but Overview shows Performance: 95/Mobile: 95.
  File: src/app/dashboard/leads/[id]/lead-detail-client.tsx — STATUS: FIXED Jun 1, 2026
- Gemini design analysis no retry on 429/503 — hard fails on rate limit immediately.
  File: src/app/api/analyze-design/route.ts — STATUS: FIXED Jun 1, 2026
- Generate Pitch fails entirely when design analysis missing, even with performance data.
  File: src/app/api/pitch/route.ts — STATUS: FIXED Jun 1, 2026
- Unanalysed lead Proposal Ready section shows fabricated generic AI summary as if real data.
  File: src/app/dashboard/leads/[id]/lead-detail-client.tsx — STATUS: FIXED Jun 1, 2026
- Date format "Last analysed: 1/6/2026" should be "Jun 1, 2026" (PDF is correct, UI wrong).
  File: src/app/dashboard/leads/[id]/lead-detail-client.tsx — STATUS: FIXED Jun 1, 2026

---

## ENV VARIABLES

Client-safe (NEXT_PUBLIC_ required):
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY

Server-only (NO NEXT_PUBLIC_ prefix ever):
  SUPABASE_SERVICE_ROLE_KEY
  GOOGLE_PLACES_API_KEY
  GEMINI_API_KEY
  SCREENSHOT_API_KEY

---

## CONFIRMED FILE STRUCTURE (June 1, 2026)

C:\Projects\nearsited\
  docs/
    AGENTS.md, ARCHITECTURE.md, BUSINESS_GTM_STRATEGY.md,
    CONVENTIONS.md, DESIGN_SYSTEM.md, PRD.md, SCHEMA.md
  scripts/
    backfill-opportunity.mjs    ← opportunity score backfill (built)
    migrate.sql
    run-migrations.mjs
  public/
    landing-page-v1.html
    landing-page-v2-editorial.html
  src/app/
    (auth)/login/page.tsx        ← sign-in page
    (auth)/signup/page.tsx       ← sign-up page
    api/
      analyze-design/route.ts   ← Gemini + ScreenshotOne
      audit/route.ts            ← PageSpeed
      discover/route.ts         ← Google Places + scoring
      export/pdf/route.ts       ← jsPDF
      pipeline/route.ts         ← pipeline CRUD
      pitch/route.ts            ← Gemini pitch
      saved-searches/route.ts
      share/route.ts            ← share link creation (fixed Jun 1, 2026)
    auth/callback/route.ts      ← OAuth callback
    dashboard/
      audit/page.tsx            ← Opportunity Review
      dashboard-client.tsx
      discover/page.tsx         ← Opportunity Discovery
      leads/page.tsx            ← Opportunities list
      leads/[id]/
        lead-detail-client.tsx  ← Lead Detail (66KB, largest file)
        page.tsx
      pipeline/page.tsx
      pitches/page.tsx
      settings/page.tsx
      layout.tsx                ← sidebar here
      sidebar-nav.tsx
    share/[token]/page.tsx      ← public share page
    page.tsx                    ← landing page
  src/components/
    auth/                       ← login/signup UI
    landing/
      atlas/                   ← OpportunityAtlas shader (built)
      Hero, Nav, Pricing etc   ← legacy landing components
    ui/                        ← shared component library
      Badge, Button, Card, EmptyState, MetricCard, OpportunityCard,
      ScoreRing, SearchableSelect, StatCard, Toast, Tooltip, WebsiteBadge
  src/lib/
    cn.ts
    metric-meta.ts
    opportunity-insights.ts
    scoring.ts                 ← ALL score math here
    types.ts                   ← WebsiteStatus enum + types
    ui-constants.ts            ← PIPELINE_LABELS, label maps
    data/ (businessTypes, cities.json 27.6MB, cities.ts)
    supabase/ (admin.ts, client.ts, middleware.ts, server.ts)

---

## PAGES STATUS (June 1, 2026)

Landing /                    ✅ Built + cleaned (fake stats/testimonials removed)
Sign In /(auth)/login        ✅ Built + cleaned (fake stats removed)
Sign Up /(auth)/signup       ✅ Built
Dashboard /dashboard         ✅ Built + cleaned (fake feed removed, 4 stats, full-width)
Opportunities /dashboard/leads ✅ Built + cleaned (table layout, 4 filter tabs)
Lead Detail /dashboard/leads/[id] ✅ Built + fixed (share link, History numbers, Proposal Ready, date format)
Opportunity Discovery /dashboard/discover ✅ Built
Opportunity Review /dashboard/audit ✅ Built + fixed (Gemini retry, pitch fallback)
Pipeline /dashboard/pipeline ✅ Built
Pitches /dashboard/pitches   ✅ Built (label maps added)
Settings /dashboard/settings ✅ Built + cleaned (Stripe row removed)
Share /share/[token]         ✅ Built + fixed (Jun 1, 2026)

No remaining critical fixes before demo.
All Batch 1 + 2 issues resolved as of June 1, 2026.

Remaining V1 build (not blocking demo):
  Contacted/Archived tab filter logic in Leads (needs pipeline join)
  Issues count column in Leads table
  Opportunity Review Generate Pitch — ephemeral mode for URL-only flow

V2 priorities (post-demo):
  Stripe + subscription management
  Opportunity Radar
  URL import

---

## CURRENT TASK

TASK: [What you want done]
TARGET FILE(S): [Exact file paths]
DO NOT TOUCH: [What to leave alone]
