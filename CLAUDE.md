# CLAUDE.md — Nearsited
*Auto-loaded by Claude Code every session. Keep current. This is the contract; SCHEMA.md / ARCHITECTURE.md / CONVENTIONS.md are the detail.*

---

## Product
Nearsited = find businesses that need websites. Designed for web design agencies.
Workflow: **discover** local businesses → **classify** web presence → **audit** performance → **analyse design** → **generate pitch** → **track** in pipeline.
Goal: walk an agency rep into a prospect meeting with real scores, ranked issues, and a written pitch — in under 2 minutes.

## Environment
- Stack: Next.js 16.2.6 (App Router, Turbopack) · TypeScript · Tailwind · Supabase (DB+Auth+Storage) · Gemini 2.5 Flash · ScreenshotCore · Google Places/PageSpeed · **jsPDF** · **lucide-react** · **Radix UI** · **recharts**. **[v2]** Playwright · job queue · worker server.
- **Project root: `c:/Projects/nearsited`** — all npm commands run here.
- Dev server: `npm run dev` → localhost:3000. Env changes need a restart.
- Theme: **dark** (near-black navy `#0a0e12`, sage green accent `#8A9777`). CSS variables in [`src/app/globals.css`](src/app/globals.css).

## Two Runtimes (important)
- **Runtime A — Vercel/Next.js:** all UI + all v1 API routes + anything <60s. Ships v1 entirely.
- **Runtime B — persistent worker server (v2 only):** Railway/Render/Fly.io, Chrome-equipped, always-on. Runs Playwright UX recording, Radar scans, self-hosted screenshots. **Playwright CANNOT run on Vercel** (no persistent Chrome, 60s cap, RAM). Lives in `worker/`, deployed separately.

---

## THE SEVEN RULES (non-negotiable)

1. **Schema first.** Never write code touching a table until it exists in the DB *and* SCHEMA.md. Order: edit SCHEMA.md → run SQL → write code.
2. **Canonical enums only** (below). Never invent/abbreviate a status string. Label drift = #1 past bug.
3. **Never return a fake 200.** Failed write → return error or `{ persisted:false, errors:[...] }`. Silent-insert-behind-200 is banned.
4. **Admin client for every server-side write** (routes AND workers). Session client is for `auth.getUser()` only. (Server `auth.uid()` is null → blocks session-client inserts.)
5. **Thin route handlers.** Analysis logic in exported functions; handler validates+auths+calls. Lets a function move from a sync route to a queue worker without rewrite.
6. **Log every external call + every DB error.** `[ROUTENAME]` prefix; on DB failure log full `{code,message,details,hint}`.
7. **Timeout every external call** (AbortController): PageSpeed 60s, ScreenshotCore 15s, Gemini 30s, Playwright nav 30s / session 120s. Retry once on 500/429 only (never 403/400/abort).

---

## Canonical Enums (verbatim — defined in [`src/lib/types.ts`](src/lib/types.ts))

```ts
WebsiteStatus  = "has_website" | "no_website" | "social_only" | "platform_only" | "unknown"
PipelineStatus = "new_lead" | "analysed" | "contacted" | "in_conversation" | "won" | "lost"
Strategy       = "mobile" | "desktop"          // audits, design_analyses, ux_analyses
PitchTone      = "professional" | "friendly" | "luxury"
ImpactLevel    = "High" | "Medium" | "Low"     // design + ux issues
PitchStatus    = "draft" | "sent" | "replied"
UxAction       = "scroll" | "click" | "fill_form" | "hover" | "navigate"   // [v2]
```
**BANNED website_status values:** `good`, `weak`, `none`, `poor`, `social`, `real-weak`, `real-decent`, `link-in-bio`, anything with a space.

---

## UI Constants — Labels (from [`src/lib/ui-constants.ts`](src/lib/ui-constants.ts))
```ts
PIPELINE_LABELS:      new_lead → "Prospect", analysed → "Analysed", contacted → "Contacted",
                      in_conversation → "In Conversation", won → "Won", lost → "Lost"
PIPELINE_SALES_STATUSES: ["new_lead", "contacted", "in_conversation", "won", "lost"]  (hides product events)
PITCH_STATUS_LABELS:  draft → "Draft", sent → "Sent", replied → "Replied"
LEAD_TYPE_LABELS:     has_website → "Has site", no_website → "No site", social_only → "Social only",
                      platform_only → "Platform only", unknown → "Unknown"
WEBSITE_STATUS_LABELS: same as LEAD_TYPE_LABELS
```

## Sidebar Nav (7 items, no Coming Soon)
```
Dashboard     /dashboard           ✅
Opportunities /dashboard/leads     ✅
Opportunity Discovery /dashboard/discover ✅
Opportunity Review /dashboard/audit ✅
Pipeline      /dashboard/pipeline  ✅
Pitches       /dashboard/pitches   ✅
Settings      /dashboard/settings  ✅
```

---

## External APIs (verified July 2026)

### Gemini — `gemini-2.5-flash`
- ⚠️ Model status: `gemini-1.5-flash` = dead; `gemini-2.0-flash` = deprecated June 2026; `gemini-2.5-flash` = **alive GA, recommended**. Define once: `const GEMINI_MODEL = "gemini-2.5-flash"` in [`src/lib/gemini.ts`](src/lib/gemini.ts).
- Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`
- Auth: **header** `x-goog-api-key: process.env.GEMINI_API_KEY` (NOT query param).
- Multimodal: `parts:[{ inline_data:{ mime_type:"image/png", data:<base64> } }, { text:<prompt> }]`. For UX, send multiple `inline_data` frame parts in one call.
- Always: prompt for JSON → strip ```json fences → JSON.parse in try/catch → log raw text on parse fail.
- Cost (real): $0.30/M in, $2.50/M out. Free tier: 1,500 req/day, 15 RPM, 1M TPM. Static design ≈ ₹0.18/strategy; UX frame-seq ≈ ₹0.45/strategy. Free tier covers ~750 full lead analyses/day before paid tier needed.
- Used in: `/api/analyze-design` (design critique), `/api/pitch` (pitch generation), `/api/gemini-test` (smoke test).

### Google Places / Geocoding / PageSpeed — one key
- `process.env.GOOGLE_PLACES_API_KEY`, query param `?key=`.
- PageSpeed **defaults to performance only** — for SEO add `&category=performance&category=seo`. ✅ Both categories are now always requested in [`src/app/api/audit/route.ts`](src/app/api/audit/route.ts:43-44).
- Extract `lighthouseResult.categories.{performance,seo}.score × 100`; vitals from `lighthouseResult.audits[...].displayValue`.
- Run mobile + desktop concurrently (`Promise.allSettled`). PageSpeed free; Nearby Search ₹2.67/platform; Place Details ₹0.25.
- Used in: `/api/discover` (geocoding + Places + Place Details), `/api/audit` (PageSpeed).

### ScreenshotCore (v1 static screenshots)
- `process.env.SCREENSHOT_API_KEY`. Full-page, mobile 390px / desktop 1440px. arraybuffer → base64. 15s AbortController timeout.
- Params: `url`, `access_key`, `viewport_width/height`, `format=png`, `block_ads=true`, `block_cookie_banners=true`.
- Behind a `takeScreenshot()` abstraction in [`src/lib/screenshot.ts`](src/lib/screenshot.ts) so the self-hosted Playwright swap touches one file.

### Playwright (v2 — Runtime B only)
- Headless Chromium on the worker. ~500MB/instance, 30–120s/session. Frame-sequence capture (NOT raw video).
- Cannot run on Vercel. In `worker/`. Writes frames to Supabase Storage, rows via service-role.

---

## Supabase Clients — when to use which
- [`src/lib/supabase/admin.ts`](src/lib/supabase/admin.ts) `createAdminClient()` → **all server-side INSERT/UPDATE** (cache, audits, design_analyses, ux_analyses, pitches, businesses score updates, Storage uploads). Bypasses RLS. NEVER in browser code.
- [`src/lib/supabase/server.ts`](src/lib/supabase/server.ts) server `createClient()` → `auth.getUser()` + RLS-safe reads.
- [`src/lib/supabase/client.ts`](src/lib/supabase/client.ts) browser `createClient()` → client components only.
- `worker/src/lib/supabaseAdmin.ts` → service role on Runtime B (workers have no user session).

`SUPABASE_SERVICE_ROLE_KEY` NEVER carries `NEXT_PUBLIC_`.

---

## Database (active + v2 tables — full detail in [`docs/SCHEMA.md`](docs/SCHEMA.md))

```
profiles         id, email, full_name, created_at
businesses       id, user_id, name, place_id, business_type, address, city, phone,
                 website, website_status, rating, review_count,
                 performance_score, design_score, ux_score,          ← ux_score nullable (v2)
                 opportunity_score,                                 ← weakness×viability, 0–100
                 flagged_for_outreach, outreach_reason, contact_info,          ← JSONB
                 discovered_at, audited_at, design_analyzed_at, ux_analyzed_at
                 → 24 cols. Orphans dropped: website_url, gmb_place_id, gmb_rating,
                   gmb_review_count, category, website_type, country, cached_at
places_cache     place_id(PK), website, website_status, rating, review_count,
                 ratings_fetched_at, details_fetched_at                          [shared, admin-write]
audits           id, business_id, user_id, strategy, performance_score, seo_score,
                 fcp, lcp, tbt, cls, has_ssl, audit_data, created_at             [2 rows/run]
design_analyses  id, business_id, user_id, strategy, design_score,
                 criteria_scores, issues, screenshot_url, raw_analysis, analyzed_at   [2 rows/run, STATIC]
ux_analyses      id, business_id, user_id, strategy, ux_score, criteria_scores,  [V2, 2 rows/run,
                 issues, interactions, frame_paths, recording_url,                INTERACTION, queue-only]
                 raw_analysis, analyzed_at
pipeline         id, business_id, user_id, status, notes, created_at, updated_at
pitches          id, business_id, user_id, subject, body, tone, lead_type,
                 pitch_status, created_at
```
v2 dormant: `mockups`, `subscriptions`, `territories`. Storage bucket: `recordings` (private, signed-URL reads) [v2].
**FKs:** all `user_id→profiles.id`, all `business_id→businesses.id`, `ON DELETE CASCADE`.

---

## Score Model (compute in [`src/lib/scoring.ts`](src/lib/scoring.ts) only — never inline)

**Six core (v1):**
| Score | Source / strategy | Formula |
|---|---|---|
| Performance | PageSpeed desktop | `categories.performance.score × 100` |
| SEO | PageSpeed desktop | `categories.seo.score × 100` (needs `category=seo`) |
| Mobile | PageSpeed mobile | `categories.performance.score × 100` |
| UX/Design | Gemini static, mobile | `(modernity+readability+cta+hierarchy)/4 × 10` |
| Trust | Gemini static, mobile | `trust × 10` |
| Overall | computed | `perf·0.25 + seo·0.15 + mobile·0.25 + uxdesign·0.20 + trust·0.15` |

**Seventh (v2 — UX interaction):**
| UX | Playwright+Gemini, mobile | `(navigation+cta_flow+form_experience+interaction_feedback+scroll_experience)/5 × 10` |

**Merge:** UI shows ONE blended quality number; "Deep Analysis" toggle splits static Design vs interaction UX. Blend when UX exists: `design·0.5 + ux·0.5`. All read-time, never stored.
Labels: 0–39 Poor(red) · 40–69 Needs Improvement(amber) · 70–84 Good(green) · 85+ Strong(deep green).
Issue point deductions come from Gemini; projection = `min(95, score + sum(top3 deductions))`.

**Opportunity score input — always use `blendQualityForOpportunity()`:**
`computeOpportunityScore(qualityScore, reviewCount, rating, businessType)` must receive the result of `blendQualityForOpportunity(mobilePerf, desktopPerf, designScore)` — NOT raw `max(mobile, desktop)`.
- `blendQualityForOpportunity`: averages mobile+desktop perf (never max), then blends in design at 60/40 when present
- Write paths: `api/audit` (uses avg perf + existing design), `api/analyze-design` (recomputes after design runs), `api/leads`, `api/businesses/[id]`
- UI fallbacks: pass `(null, performance_score, design_score)` when separate mobile/desktop not available

---

## Website Classification — `classifyWebsite(url)` in [`src/lib/types.ts`](src/lib/types.ts:81)
```
empty/null → "no_website"
host ∈ {facebook,fb,instagram,twitter,x,tiktok,linkedin,linktr.ee,wa.me,...} → "social_only"
host ∈ {booking,opentable,fresha,booksy,doordash,ubereats,square.site,
        wixsite,weebly,godaddysites,business.site,myshopify,wordpress,
        blogspot,yelp,tripadvisor,justdial,...} → "platform_only"
otherwise → "has_website"
```
Match hostname, case-insensitive, strip `www.`/`m.`, match subdomains. Extensive lists in `types.ts`.

---

## Three-Workflow Opportunity Detail Architecture
The Lead Detail page at `/dashboard/leads/[id]` routes to **three different components** based on business `website_status` (determined by [`detectLeadWorkflow()`](src/lib/lead-types.ts:21)):

| Workflow | website_status | Component | File |
|---|---|---|---|
| `website` | `has_website`, `platform_only` | `LeadDetailClient` | [`lead-detail-client.tsx`](src/app/dashboard/leads/[id]/lead-detail-client.tsx) |
| `social_only` | `social_only` | `SocialOpportunityPage` | [`components/social-opportunity-page.tsx`](src/app/dashboard/leads/[id]/components/social-opportunity-page.tsx) |
| `no_digital_presence` | `no_website`, `unknown` | `NoDigitalPresencePage` | [`components/no-digital-presence-page.tsx`](src/app/dashboard/leads/[id]/components/no-digital-presence-page.tsx) |

Routing happens server-side in [`page.tsx`](src/app/dashboard/leads/[id]/page.tsx:65) via a `switch` on the workflow type. All three components receive the same props shape (`business`, `pipelineStatus`, `savedPitch`) but the `website` workflow additionally receives `audits` and `designAnalyses` arrays.

**Website workflow** (`lead-detail-client.tsx`): Full audit/design analysis with scores, Core Web Vitals, issue tracking, pipeline management, pitch generation, export. ~1492 lines.

**Social-only workflow** ([`components/social-opportunity-page.tsx`](src/app/dashboard/leads/[id]/components/social-opportunity-page.tsx)): Detects social platforms from `business.website` via `detectSocialPlatforms()`, shows Digital Presence Analysis card, Website Opportunity Impact estimates (Trust/Lead Capture/Search/Brand Control), channel-specific outreach tabs (WhatsApp/Instagram DM/Facebook Message/Email), social-aware pitch generation via `/api/pitch` with `workflow:"social_only"` + `socialPlatforms[]`. No audit/design scores shown.

**No-digital-presence workflow** ([`components/no-digital-presence-page.tsx`](src/app/dashboard/leads/[id]/components/no-digital-presence-page.tsx)): Shows "Why This Is An Opportunity" reasons, Website Opportunity benefits (Visibility/Trust/Lead Gen/Customer Experience), **channel tabs (Email/WhatsApp)** with contact hints, pitch via `/api/pitch` with `workflow:"no_digital_presence"` + `channel`. No audit/design analysis.

All three workflows share: contact info fetch (`/api/contact-info`), background rating refresh (`/api/refresh-ratings`), pipeline status dropdown, pitch generation with tone/length controls, PDF export, Share Link, toast system.

---

## Pitch Generation — [`/api/pitch`](src/app/api/pitch/route.ts)
✅ **Enhanced.** Branch angle by `workflow` (from [`lead-types.ts`](src/lib/lead-types.ts)) + `lead_type` (= business `website_status`):

**Workflow-based branching** (new in v1 — overrides lead_type when present):
- `workflow:"social_only"` — References detected social platforms, never mentions audits/scores. Focus: "Your Instagram and Facebook presence is strong. Here's what a website could add..."
- `workflow:"no_digital_presence"` — Focuses on visibility gap. Never mentions audits/website issues. Focus: "Limited online presence means customers may not find you..."

**Legacy lead_type branching** (when workflow is `"website"` or unset):
- `has_website` <50 → "your site is costing you customers, here's the proof" (cite LCP, design issues)
- `has_website` 50–69 → "real potential held back by fixable issues"
- `has_website` ≥70 → "solid site, specific wins worth chasing"
- `no_website` → "no web presence — here's what you're leaving on the table"
- `social_only` → "Facebook isn't a website — here's what a real one does"
- `platform_only` → "you're renting space on someone else's platform — here's the risk"

**Channel-specific formatting** (new in v1):
- `channel:"email"` → subject + body, ~150 words (default)
- `channel:"whatsapp"` → body only, ~60 words, conversational, no formatting

**Request body:** `businessId`, `tone` (professional/friendly/luxury), `length` (short/medium/detailed), `channel` (email/whatsapp), `workflow` (website/social_only/no_digital_presence), `socialPlatforms[]`, `focus`, `opening` (direct/question/empathy/data), `urgency` (low/medium/high).

Pulls real data: latest `audits` (perf, lcp, fcp) + latest `design_analyses` (design_score, top-3 issues) + [v2] `ux_analyses` (ux issues). Honours tone/length/focus. Saves to `pitches` with `lead_type`+`tone`. Model: `gemini-2.5-flash`, header auth. JSON only response.

---

## Async Pattern (v2 — UX analysis)
UX can't return inline (30–120s):
```
POST /api/analyze-ux {businessId,website} → validate+auth → ENQUEUE job → return {jobId} <1s
Worker (Runtime B): Playwright record → upload frames to Storage → Gemini analyse frames
                    → write ux_analyses (admin) → update businesses.ux_score/ux_analyzed_at (admin)
UI completion via Supabase Realtime subscription on ux_analyses (preferred), or queue callback.
```

---

## V1 — COMPLETED BUILD STATUS

### ✅ API Routes (all v1)
| Route | File | Status | Key Features |
|---|---|---|---|
| `/api/discover` | [`src/app/api/discover/route.ts`](src/app/api/discover/route.ts) | ✅ Live | **3 parallel Nearby Search queries** (keyword, keyword+type, 1.5×radius), dedup by place_id, **NDJSON streaming** (results→enrichment→done), places_cache enrichment, website classification, businesses upsert |
| `/api/audit` | [`src/app/api/audit/route.ts`](src/app/api/audit/route.ts) | ✅ Live | **NDJSON streaming with progress steps** (fetching→mobile→desktop→complete→result→done), **7-day audit cache** with `force` param, PageSpeed mobile+desktop, SEO category, AbortController timeout (60s), retry on 500/429, admin client writes, businesses score update |
| `/api/analyze-design` | [`src/app/api/analyze-design/route.ts`](src/app/api/analyze-design/route.ts) | ✅ Live | **NDJSON streaming with progress steps** (screenshot→analysis→persisting→complete→result→done), **7-day design cache** with `force` param, ScreenshotCore + Gemini 2.5 Flash, point_deduction+impact in prompt, mobile+desktop concurrent, admin client writes, **recomputes + stores opportunity_score after design analysis** (blends stored perf_score + new design_score) |
| `/api/pitch` | [`src/app/api/pitch/route.ts`](src/app/api/pitch/route.ts) | ✅ Enhanced | gemini-2.5-flash, header auth, 6 lead-type angles, real data citation, tone/length/focus, **workflow param** (`website`/`social_only`/`no_digital_presence`), **channel param** (`email`/`whatsapp`), **socialPlatforms[]** for contextual prompts, saves to pitches (admin) |
| `/api/pipeline` | [`src/app/api/pipeline/route.ts`](src/app/api/pipeline/route.ts) | ✅ Live | POST add, PATCH update status, **6 canonical statuses** (pitch_generated removed) |
| `/api/export/pdf` | [`src/app/api/export/pdf/route.ts`](src/app/api/export/pdf/route.ts) | ✅ Live | jsPDF, business name+scores+issues, downloadable `<business>-audit.pdf` |
| `/api/contact-info` | [`src/app/api/contact-info/route.ts`](src/app/api/contact-info/route.ts) | ✅ Live | Scrapes website for email (mailto regex, 5s timeout), returns phone from `businesses.phone`, caches to `contact_info` JSONB column, 30-day cache TTL, admin client write |
| `/api/refresh-ratings` | [`src/app/api/refresh-ratings/route.ts`](src/app/api/refresh-ratings/route.ts) | ✅ Live | Background fire-and-forget, Google Places Place Details fetch, updates `places_cache.rating`+`review_count`+`ratings_fetched_at`, admin client write, 7-day cache, 10s timeout |
| `/api/saved-searches` | [`src/app/api/saved-searches/route.ts`](src/app/api/saved-searches/route.ts) | ✅ Live | CRUD for territories, session client, canonical business_type |
| `/api/share` | [`src/app/api/share/route.ts`](src/app/api/share/route.ts) | ✅ Live | Creates share token (admin client), returns URL |
| `/api/gemini-test` | [`src/app/api/gemini-test/route.ts`](src/app/api/gemini-test/route.ts) | ✅ Live | Smoke test for Gemini model connectivity |

### ✅ UI Pages (all v1)
| Page | Route | File(s) | Status | Key Features |
|---|---|---|---|---|
| Dashboard | `/dashboard` | [`page.tsx`](src/app/dashboard/page.tsx) + [`dashboard-client.tsx`](src/app/dashboard/dashboard-client.tsx) | ✅ Live | 4 stat cards, recent leads, pipeline funnel, empty state, full-width layout |
| Leads | `/dashboard/leads` | [`page.tsx`](src/app/dashboard/leads/page.tsx) | ✅ Live | Full table, search, 4 filter tabs, score rings, website badges, pagination 25/page, filter panel |
| Lead Detail | `/dashboard/leads/[id]` | — **Three-Workflow Routing** (see § below) — | ✅ Live | Routes by `detectLeadWorkflow()` based on `website_status` |
| Lead Detail (Website) | `/dashboard/leads/[id]` | [`lead-detail-client.tsx`](src/app/dashboard/leads/[id]/lead-detail-client.tsx) | ✅ Live | Overview/Audit/Issues/History tabs, 6 sub-scores (reactive to Mobile/Desktop toggle), expanded Core Web Vitals, top issues with point deductions, AI pitch generation (tone/length + error display), **Copy Pitch**, **Share Link**, PDF export, **pipeline status dropdown**, **Run Audit / Run Design Analysis** buttons, **auto-pipeline** on first audit (toast), **toast system** (fixed bottom-right), **contact info fetch**, **channel selection** (email/whatsapp) |
| Lead Detail (Social Only) | `/dashboard/leads/[id]` | [`components/social-opportunity-page.tsx`](src/app/dashboard/leads/[id]/components/social-opportunity-page.tsx) | ✅ Live | Social platform badges, Digital Presence Analysis card, Website Opportunity Impact estimates, channel tabs (WhatsApp/Instagram/Facebook/Email), social-aware pitch gen, Client Call Summary |
| Lead Detail (No Digital Presence) | `/dashboard/leads/[id]` | [`components/no-digital-presence-page.tsx`](src/app/dashboard/leads/[id]/components/no-digital-presence-page.tsx) | ✅ Live | No Digital Presence badge, Why This Is An Opportunity, Website Opportunity benefits, **channel tabs (Email/WhatsApp)** with contact hints, pitch gen with `channel` param, Client Call Summary, PDF export, Share Link |
| Discover | `/dashboard/discover` | [`page.tsx`](src/app/dashboard/discover/page.tsx) | ✅ Live | City/business type search, radius slider, Save Search, **NDJSON streaming**, **progress panels**, audit/design analysis, pipeline add, session storage, client-side filters |
| Opportunity Review | `/dashboard/audit` | [`page.tsx`](src/app/dashboard/audit/page.tsx) | ✅ Live | URL input, **9-step progress checklist**, **sessionStorage persistence**, **expanded Core Web Vitals**, **plain English summaries**, **Save as Lead** banner, ephemeral pitch generation, 90s timeout |
| Pipeline | `/dashboard/pipeline` | [`page.tsx`](src/app/dashboard/pipeline/page.tsx) | ✅ Live | Table, status dropdown with optimistic updates, 7 canonical stages |
| Pitches | `/dashboard/pitches` | [`page.tsx`](src/app/dashboard/pitches/page.tsx) | ✅ Live | Pitch list, copy, delete, status badges via label maps |
| Settings | `/dashboard/settings` | [`page.tsx`](src/app/dashboard/settings/page.tsx) | ✅ Live | Profile, plan info, API integrations display-only, sign out |
| Auth (login) | `/login` | [`page.tsx`](src/app/(auth)/login/page.tsx) | ✅ Live | Email/password + Google OAuth |
| Auth (signup) | `/signup` | [`page.tsx`](src/app/(auth)/signup/page.tsx) | ✅ Live | Registration with name |
| Auth (callback) | `/callback` | [`route.ts`](src/app/(auth)/callback/route.ts) | ✅ Live | OAuth callback handler |
| Share | `/share/[token]` | [`page.tsx`](src/app/share/[token]/page.tsx) | ✅ Live | Public read-only report page, admin-client DB reads |

### ✅ Library Code
| File | Purpose |
|---|---|
| [`src/lib/scoring.ts`](src/lib/scoring.ts) | Scores: computeOverall, uxDesignScore, trustScore, uxInteractionScore, projection, blendedQuality, scoreLabel, scoreColor, scoreColorClasses, **blendQualityForOpportunity** (avg perf + design blend), **computeOpportunityScore**, opportunityLabel, opportunityBadgeVariant, websiteWeakness, businessViabilityMultiplier, getIndustryMultiplier, estimatedOpportunity |
| [`src/lib/types.ts`](src/lib/types.ts) | WebsiteStatus enum, classifyWebsite() with extensive SOCIAL_DOMAINS + PLATFORM_DOMAINS lists |
| [`src/lib/ui-constants.ts`](src/lib/ui-constants.ts) | PIPELINE_LABELS (6 statuses, pitch_generated removed), PIPELINE_SALES_STATUSES, OPPORTUNITY_INDICATORS, PITCH_STATUS_LABELS, LEAD_TYPE_LABELS, WEBSITE_STATUS_LABELS, badge styles, IMPACT_PILL_STYLES, getOpportunityLevel() |
| [`src/lib/lead-types.ts`](src/lib/lead-types.ts) | **NEW** — `LeadWorkflow` type (`website`/`social_only`/`no_digital_presence`), `detectLeadWorkflow()`, `detectSocialPlatforms()`, `getSocialOpportunityReasons()`, `getNoDigitalOpportunityReasons()`, `getSocialImpactEstimates()`, `getDigitalFoundationRecommendations()` |
| [`src/lib/metric-meta.ts`](src/lib/metric-meta.ts) | **NEW** — `METRIC_META` registry (FCP/LCP/TBT/CLS with labels, thresholds, `toCanonical` parser), `metricColor()` helper. Shared by lead-detail and audit pages. Single source of truth for Core Web Vitals display. |
| [`src/lib/analysis-context.tsx`](src/lib/analysis-context.tsx) | React context tracking audit/design analysis progress across pages |
| [`src/lib/supabase/admin.ts`](src/lib/supabase/admin.ts) | Singleton admin client (service role, bypasses RLS, never browser) |
| [`src/lib/supabase/server.ts`](src/lib/supabase/server.ts) | Server client (auth + RLS-safe reads) |
| [`src/lib/supabase/client.ts`](src/lib/supabase/client.ts) | Browser client (client components) |
| [`src/lib/supabase/middleware.ts`](src/lib/supabase/middleware.ts) | Session cookie middleware |
| [`src/lib/db-types.ts`](src/lib/db-types.ts) | **NEW** — Database row TypeScript interfaces (BusinessRow, AuditRow, DesignAnalysisRow, DesignIssue, PipelineRow, PitchRow, etc.) — replaces `Record<string, unknown>` casts |
| [`src/lib/shared-hooks.ts`](src/lib/shared-hooks.ts) | **NEW** — Shared React hooks: `useCountUp()`, `useAccordion()`, `useToast()` |
| [`src/lib/ndjson.ts`](src/lib/ndjson.ts) | **NEW** — Shared NDJSON stream reader `readNdjsonStream<T>()` |

### ✅ Infrastructure
| Item | Details |
|---|---|
| [`scripts/migrate.sql`](scripts/migrate.sql) | Full migration SQL from SCHEMA.md §5 — businesses cleanup, seo_score, pitch metadata, RLS, pipeline realignment, territories rename, UX columns |
| [`scripts/run-migrations.mjs`](scripts/run-migrations.mjs) | Migration runner — direct PostgreSQL + Management API fallback |
| [`src/middleware.ts`](src/middleware.ts) | Auth guard — refresh session on every request |
| [`src/app/globals.css`](src/app/globals.css) | Dark theme CSS variables, lens motif, pipeline status colors |
| [`src/app/layout.tsx`](src/app/layout.tsx) | Root layout with Geist fonts |
| Dashboard sidebar | [`src/app/dashboard/layout.tsx`](src/app/dashboard/layout.tsx) — sidebar + credits widget + 7 nav items |
| [`src/components/ui/SearchableSelect.tsx`](src/components/ui/SearchableSelect.tsx) | Reusable searchable dropdown |
| [`src/lib/data/cities.ts`](src/lib/data/cities.ts) | Indian city data with search |
| [`src/lib/data/businessTypes.ts`](src/lib/data/businessTypes.ts) | Business types with categories |

---

## V1 Task Board — COMPLETED ✅
All v1 phases are now COMPLETE. Specific items:

**Phase 0 — Foundation:**
- [x] Run SCHEMA §5.1 businesses cleanup, then §5.2–5.7 (migration SQL + runner exist)
- [x] Remove auth bypass in `analyze-design/route.ts`
- [x] CLAUDE.md at root; PRD/ARCHITECTURE/SCHEMA/CONVENTIONS in `docs/`

**Phase 1 — Data completeness:**
- [x] Add `&category=seo` + `seo_score` extraction to `audit/route.ts`
- [x] Add `point_deduction` + `impact` to design-analysis Gemini prompt
- [x] Add score projection to `scoring.ts`
- [x] Reload audit/design results from DB when rendering lead cards
- [x] Add `opportunity_score` + `backfill-opportunity.mjs` script

**Phase 2 — Core UI:**
- [x] `/dashboard/leads` table page (replaces `/discover`)
- [x] `/dashboard/leads/[id]` Lead Detail (Overview/Audit/Issues/History; Competitors + UX stubs)
- [x] Wire "Analyse Design" button
- [x] Mobile/Desktop toggle for reactive scores in Lead Detail
- [x] Pipeline status dropdown with human-readable labels
- [x] Toast notification system

**Phase 3 — Pitch:**
- [x] Rebuild `pitch/route.ts` (gemini-2.5-flash, lead-type branching, cites real data, tone/length/focus)
- [x] Pitch generation with error display + console logging

**Phase 4 — Dashboard & polish:**
- [x] `/dashboard` home (4 stat cards, recent leads, pipeline funnel, empty state)
- [x] `/dashboard/pitches` list
- [x] Credits UI widget ("Buy More" → disabled, no Stripe)
- [x] Sidebar cleaned (7 items, no Coming Soon section)
- [x] Opportunity indicators + label maps

**Phase 5 — Export:**
- [x] PDF audit report (jsPDF, business name, scores, issues)
- [x] Share Link — POST /api/share, copies URL to clipboard + toast
- [x] Share page (`/share/[token]`) — public read-only report

**Phase 6 — Dark theme:**
- [x] COMPLETE — CSS variables in globals.css (dark theme, near-black navy `#0a0e12`, sage green accent `#8A9777`)
- [x] Pipeline status CSS vars + badge styles
- [x] Lens motif (`.lens-focus`) implemented
- [x] Autofill override for dark inputs

### Remaining v1 items:
- Leads page: "Audited" / "Analysed" filter tabs (audited_at / design_analyzed_at IS NOT NULL)
- Leads page: pagination position restored on back-navigation (sessionStorage)
- Leads page: filter tab tooltips (ⓘ with plain-English explanations)
- ✅ `/api/pitch` DB persistence: `channel` column migration created at [`scripts/migrate-vibecode-fixes.sql`](scripts/migrate-vibecode-fixes.sql) — run via Supabase SQL editor
- ✅ `/api/contact-info`: `contact_info` JSONB column migration created at [`scripts/migrate-vibecode-fixes.sql`](scripts/migrate-vibecode-fixes.sql) — run via Supabase SQL editor

**V2:** UX analysis (Playwright+queue+worker+Storage — build these together), Radar/decay monitoring, Competitor tab, mockup generation, Stripe/credits, Campaigns/Templates/Reports/Integrations, Pitch Deck + Loom export, vertical packs. Job queue added with first async feature.

---

## New-Session / New-Task Checklist
Lead every Claude Code or Roo task with:
```
PROJECT: Nearsited (see CLAUDE.md). TASK: <one concern>.
TARGET FILE(S): <exact paths>. DO NOT TOUCH: <paths>.
```
Start fresh when: current task done & verified · tool edits wrong file or loops · switching features. Docs are the memory; sessions are disposable.

---

## NDJSON Streaming Convention (all streaming routes)
Routes that take >2s should stream progress via NDJSON (`application/x-ndjson`):
```
Client sends POST → server responds 200 with ReadableStream
  → NDJSON lines: {"type":"progress","step":"...","label":"..."}
  → {"type":"result", ...data}   // final result payload
  → {"type":"done"}              // stream complete
  → {"type":"error","message":"..."}  // on failure
```
- **`/api/discover`**: streams `results` → `enrichment` → `done`
- **`/api/audit`**: streams progress steps (fetching→mobile→desktop→complete) → `result` → `done`
- **`/api/analyze-design`**: streams progress steps (screenshot→analysis→persisting→complete) → `result` → `done`
- Client uses `response.body!.getReader()` to read the stream line-by-line
- Non-streaming error responses (400/500) return regular JSON, not NDJSON

## Cache Convention (audit + analyze-design)
Both `/api/audit` and `/api/analyze-design` cache results for **7 days**:
- On POST, check for fresh (≤7d) mobile+desktop rows in DB
- Cache hit → return `{cached:true, cached_at, mobile, desktop}` immediately (regular JSON, not stream)
- Cache miss → run live API → stream progress → persist → return result
- `force: true` in request body bypasses cache (triggered by retry button on client)

---

## UI Patterns (established — reuse these)

### METRIC_META — Core Web Vitals display (shared lib)
Defined once in [`src/lib/metric-meta.ts`](src/lib/metric-meta.ts), imported by both `lead-detail-client.tsx` and `audit/page.tsx`.
```ts
// Each entry: label (full name), subtitle (plain English), thresholds [good, warn], toCanonical (parse raw string → canonical unit)
// FCP/LCP thresholds in seconds; TBT in ms; CLS unitless.
// metricColor(key, rawValue) → "text-green-600" | "text-amber-600" | "text-red-600"
```
Google Core Web Vitals thresholds: FCP <1.8s/<3s, LCP <2.5s/<4s, TBT <200ms/<600ms, CLS <0.1/<0.25.

### Toast system (lead-detail-client.tsx)
```ts
const [toast, setToast] = useState<string | null>(null);
const showToast = useCallback((msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); }, []);
// Render: fixed bottom-6 right-6 z-50, border-green-200 bg-white, CheckCircle2 icon, 3s auto-dismiss
```

### Pipeline status dropdown (lead-detail-client.tsx)
`PIPELINE_LABELS` maps raw enum → human label. `handlePipelineChange` PATCHes `/api/pipeline`. Local `currentPipelineStatus` state initialized from prop for instant optimistic updates.

### SessionStorage audit cache (audit/page.tsx)
Key: `'ai_audit_last_result'`. Shape: `{ url, auditResult, designResult, timestamp }`. Cleared on new run. Restored on mount. `timeAgo(ts)` formats the staleness note.

### Progress step key mapping (audit/page.tsx)
Both audit and design APIs send `{ type:"progress", step:"complete" }` at the end. To avoid collision, map: audit-phase "complete" → `"audit_complete"`, design-phase "complete" → `"design_complete"`.

---

## Canonical File Structure (AI — Follow This)

Every page must follow this structure to stay AI-maintainable:

### Page Composition Pattern
```
src/app/dashboard/<page>/
├── page.tsx              ← Thin composition, <200 lines. Imports components, composes layout.
└── components/
    ├── types.ts           ← Page-specific types (if needed beyond db-types.ts)
    ├── <Page>Form.tsx     ← Search/input forms
    ├── <Page>Card.tsx     ← Result/item cards
    ├── <Page>Panel.tsx    ← Progress/status panels
    └── <Page>Dialog.tsx   ← Modals and dialogs
```

### Landing Page Pattern
```
src/components/landing/
├── SectionLabel.tsx      ← Shared helpers
├── SectionTitle.tsx
├── SectionSub.tsx
├── LandingNav.tsx        ← Each section = one file
├── LandingHero.tsx
├── TrustBar.tsx
├── HowItWorksSection.tsx
├── WhyNearsitedSection.tsx
├── SampleReportSection.tsx
├── SamplePitchSection.tsx
├── AgencyUseCasesSection.tsx
├── FounderStorySection.tsx
├── ObjectionsSection.tsx  ← Uses useAccordion()
├── ProofBlocksSection.tsx
├── LandingFAQ.tsx         ← Uses useAccordion()
├── CTASection.tsx
├── LandingFooter.tsx
└── Pricing.tsx            ← Only legacy file kept
```

### Three-Workflow Lead Detail Pattern
```
src/app/dashboard/leads/[id]/
├── page.tsx                                    ← Server component, detectLeadWorkflow(), routes
├── lead-detail-client.tsx                      ← Website workflow (~360 lines, imports components)
├── components/
│   ├── social-opportunity-page.tsx             ← Social-only workflow
│   ├── no-digital-presence-page.tsx            ← No-digital-presence workflow
│   ├── opportunity-score-explanation.tsx       ← Shared score breakdown
│   ├── ScoreRingWithLabel.tsx                  ← Animated SVG ring
│   ├── SubScore.tsx                            ← Label + value
│   ├── ImpactPill.tsx                          ← Colored impact badge
│   ├── OpportunityBullets.tsx                  ← buildClientCallSummary() helper
│   ├── LeadHeroSection.tsx                     ← Business info + actions
│   ├── LeadOutreachSection.tsx                 ← Pitch generation + channel UI
│   ├── LeadExportSection.tsx                   ← PDF + Share
│   └── QuotaErrorBanner.tsx                    ← Fixed bottom banner
```

## AI-Friendly Patterns (for vibecoding sessions)

These patterns ensure future AI iterations can work with the codebase without breaking types or creating duplicates:

1. **Import DB types, don't cast.** Never use `as Record<string, unknown>`. Import `BusinessRow`, `AuditRow` etc. from [`src/lib/db-types.ts`](src/lib/db-types.ts).
2. **Use shared hooks.** Before writing `useState + useEffect` combo, check [`src/lib/shared-hooks.ts`](src/lib/shared-hooks.ts) for `useCountUp()`, `useAccordion()`, `useToast()`.
3. **Use shared NDJSON reader.** For streaming API responses, use `readNdjsonStream()` from [`src/lib/ndjson.ts`](src/lib/ndjson.ts) — not inline stream readers.
4. **One file per section.** No file should exceed ~400 lines. Extract sections into `components/<page>/`.
5. **Named exports only.** Use `export function ComponentName()` — not `export default`. Makes tree-shaking and imports predictable.
6. **Prefix all error logs.** Every `console.error` must include a `[PREFIX]` tag matching the route name (e.g., `[LEAD-DETAIL]`, `[DISCOVER]`).
7. **Don't add packages without importing them.** If a dependency is added to `package.json`, it must be imported in `src/` within the same session.
8. **Run `npx tsc --noEmit` before finishing.** Verify TypeScript passes before marking done.

---

## Don't Repeat These (each a real past bug)
1. Writing `website_url`/`gmb_*`/`category` (DROPPED → `website`/`place_id`/`rating`/`review_count`/`business_type`).
2. `gemini-1.5-flash` / `gemini-2.0-flash` (SHUT DOWN → `gemini-2.5-flash`). Always use the canonical model constant from [`src/lib/gemini.ts`](src/lib/gemini.ts).
3. Session client for server INSERT → RLS 42501 silent fail (→ admin client).
4. Returning 200 after a failed insert (→ surface `persisted:false`).
5. `npm run dev` from wrong directory — run from `c:/Projects/nearsited`.
6. Inlining PageSpeed/Gemini/screenshot logic in the POST handler (→ exported functions).
7. Forgetting `&category=seo` on PageSpeed (→ SEO score undefined).
8. No AbortController timeout (→ route hangs on slow sites).
9. **[v2]** Trying to run Playwright on Vercel (→ it needs Runtime B worker server).
10. **[v2]** Running UX analysis synchronously in an API route (→ queue-only, it's 30–120s).
11. Inline score computation instead of importing from `scoring.ts`.
11b. Passing `max(mobile, desktop)` directly to `computeOpportunityScore` — always use `blendQualityForOpportunity(mobilePerf, desktopPerf, designScore)` as the quality input. Max inflates quality → understates opportunity (MySyara bug: desktop 90 → score 19 instead of 62).
12. Writing `category` instead of `business_type` on territories/businesses.
13. Using `LeadDetailClient` for all lead types — route via `detectLeadWorkflow()` in `page.tsx` instead (social_only → `SocialOpportunityPage`, no_website → `NoDigitalPresencePage`).
14. Scraping contact info synchronously in the response — use `GET /api/contact-info` with 5s timeout + fire-and-forget admin cache write instead.
15. Forgetting `contact_info` JSONB column migration — cache write fails silently without it (no-op if column missing, but data is lost).
16. Hardcoding pipeline statuses — always import from `ui-constants.ts`; `pitch_generated` is removed from canonical enum.
17. Inlining Core Web Vitals display logic — import `METRIC_META` + `metricColor()` from `metric-meta.ts` instead.
18. Creating duplicate CountUp/accordion/toast hooks — import from `src/lib/shared-hooks.ts` instead.
19. Writing inline NDJSON stream readers — use `readNdjsonStream()` from `src/lib/ndjson.ts`.
20. Using `as Record<string, unknown>` — define and import proper types from `src/lib/db-types.ts`.

---
*Update this file the moment a schema, enum, model name, runtime, or convention changes.*
