# CLAUDE.md — Nearsited
*Auto-loaded by Claude Code every session. Keep current. This is the contract; SCHEMA.md / ARCHITECTURE.md / CONVENTIONS.md are the detail.*

---

## Product
Nearsited = AI redesign-opportunity intelligence for web design agencies.
Workflow: **discover** local businesses → **classify** web presence → **audit** performance → **analyse design** (static vision) → **[v2] analyse UX** (recorded interaction) → **generate pitch** → **track** in pipeline.
Goal: walk an agency rep into a prospect meeting with real scores, ranked issues, and a written pitch — in under 2 minutes.

## Environment
- Stack: Next.js 16.2.6 (App Router, Turbopack) · TypeScript · Tailwind · Supabase (DB+Auth+Storage) · Gemini 3.5 Flash · ScreenshotOne · Google Places/PageSpeed · **jsPDF** · **lucide-react**. **[v2]** Playwright · job queue · worker server.
- **Project root: `C:\projects\nearsited\nearsited`** — every `npm` command runs here. `cd nearsited` first, ALWAYS. (`C:\projects\nearsited\` has no package.json — the #1 recurring mistake.)
- Dev server: `npm run dev` → localhost:3000. Env changes need a restart.
- Theme: **light** (white bg, indigo-600 `#4F46E5`). CSS variables in `globals.css`. Light theme migration is COMPLETE.

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
7. **Timeout every external call** (AbortController): PageSpeed 60s, ScreenshotOne 30s, Gemini 30s, Playwright nav 30s / session 120s. Retry once on 500/429 only (never 403/400/abort).

---

## Canonical Enums (verbatim — defined in [`src/lib/types.ts`](nearsited/src/lib/types.ts))

```ts
WebsiteStatus  = "has_website" | "no_website" | "social_only" | "platform_only" | "unknown"
PipelineStatus = "new_lead" | "analysed" | "pitch_generated" | "contacted" | "in_conversation" | "won" | "lost"
Strategy       = "mobile" | "desktop"          // audits, design_analyses, ux_analyses
PitchTone      = "professional" | "friendly" | "luxury"
ImpactLevel    = "High" | "Medium" | "Low"     // design + ux issues
PitchStatus    = "draft" | "sent" | "replied"
UxAction       = "scroll" | "click" | "fill_form" | "hover" | "navigate"   // [v2]
```
**BANNED website_status values:** `good`, `weak`, `none`, `poor`, `social`, `real-weak`, `real-decent`, `link-in-bio`, anything with a space.

---

## External APIs (verified May 2026)

### Gemini — `gemini-3.5-flash`
- ⚠️ `gemini-1.5-flash` and `gemini-2.x` are dead/legacy. Stable ID is exactly `gemini-3.5-flash`. Define once: `const GEMINI_MODEL = "gemini-3.5-flash"`.
- Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent`
- Auth: **header** `x-goog-api-key: process.env.GEMINI_API_KEY` (NOT query param).
- Multimodal: `parts:[{ inline_data:{ mime_type:"image/png", data:<base64> } }, { text:<prompt> }]`. For UX, send multiple `inline_data` frame parts in one call.
- Always: prompt for JSON → strip ```json fences → JSON.parse in try/catch → log raw text on parse fail.
- Cost (real): $1.50/M in, $9/M out, $0.15/M cached. NOT free. Static design ≈ ₹0.60/strategy; UX frame-seq ≈ ₹1.50/strategy. At scale consider Flash-Lite ($0.25/$1.50) for analysis, keep 3.5 Flash for pitches.
- Used in: `/api/analyze-design` (design critique), `/api/pitch` (pitch generation), `/api/gemini-test` (smoke test).

### Google Places / Geocoding / PageSpeed — one key
- `process.env.GOOGLE_PLACES_API_KEY`, query param `?key=`.
- PageSpeed **defaults to performance only** — for SEO add `&category=performance&category=seo`. ✅ Both categories are now always requested in [`src/app/api/audit/route.ts`](nearsited/src/app/api/audit/route.ts:43-44).
- Extract `lighthouseResult.categories.{performance,seo}.score × 100`; vitals from `lighthouseResult.audits[...].displayValue`.
- Run mobile + desktop concurrently (`Promise.allSettled`). PageSpeed free; Nearby Search ₹2.67, Place Details ₹0.25.
- Used in: `/api/discover` (geocoding + Places + Place Details), `/api/audit` (PageSpeed).

### ScreenshotOne (v1 static screenshots)
- `process.env.SCREENSHOT_API_KEY`. Full-page, mobile ~390px / desktop ~1440px. arraybuffer → base64.
- `ignore_host_errors=true`; log `returned_status_code`. Charged only for successful renders. Free 200/mo → $17/2,000.
- Behind a `takeScreenshot()` abstraction in [`src/app/api/analyze-design/route.ts`](nearsited/src/app/api/analyze-design/route.ts:52) so the self-hosted Playwright swap touches one file.

### Playwright (v2 — Runtime B only)
- Headless Chromium on the worker. ~500MB/instance, 30–120s/session. Frame-sequence capture (NOT raw video).
- Cannot run on Vercel. In `worker/`. Writes frames to Supabase Storage, rows via service-role.

---

## Supabase Clients — when to use which
- [`src/lib/supabase/admin.ts`](nearsited/src/lib/supabase/admin.ts) `createAdminClient()` → **all server-side INSERT/UPDATE** (cache, audits, design_analyses, ux_analyses, pitches, businesses score updates, Storage uploads). Bypasses RLS. NEVER in browser code.
- [`src/lib/supabase/server.ts`](nearsited/src/lib/supabase/server.ts) server `createClient()` → `auth.getUser()` + RLS-safe reads.
- [`src/lib/supabase/client.ts`](nearsited/src/lib/supabase/client.ts) browser `createClient()` → client components only.
- `worker/src/lib/supabaseAdmin.ts` → service role on Runtime B (workers have no user session).

`SUPABASE_SERVICE_ROLE_KEY` NEVER carries `NEXT_PUBLIC_`.

---

## Database (active + v2 tables — full detail in [`docs/SCHEMA.md`](nearsited/docs/SCHEMA.md))

```
profiles         id, email, full_name, created_at
businesses       id, user_id, name, place_id, business_type, address, city, phone,
                 website, website_status, rating, review_count,
                 performance_score, design_score, ux_score,          ← ux_score nullable (v2)
                 opportunity_score,                                 ← weakness×viability, 0–100
                 flagged_for_outreach, outreach_reason,
                 discovered_at, audited_at, design_analyzed_at, ux_analyzed_at
                 → 23 cols. Orphans dropped: website_url, gmb_place_id, gmb_rating,
                   gmb_review_count, category, website_type, country, cached_at
places_cache     place_id(PK), website, website_status, details_fetched_at      [shared, admin-write]
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
profiles         id, email, full_name, created_at
```
v2 dormant: `mockups`, `subscriptions`, `territories`. Storage bucket: `recordings` (private, signed-URL reads) [v2].
**FKs:** all `user_id→profiles.id`, all `business_id→businesses.id`, `ON DELETE CASCADE`.

---

## Score Model (compute in [`src/lib/scoring.ts`](nearsited/src/lib/scoring.ts) only — never inline)

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

---

## Website Classification — `classifyWebsite(url)` in [`src/lib/types.ts`](nearsited/src/lib/types.ts:81)
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

## Pitch Generation — [`/api/pitch`](nearsited/src/app/api/pitch/route.ts)
✅ **Rebuilt.** Branch angle by `lead_type` (= business `website_status`):
- `has_website` <50 → "your site is costing you customers, here's the proof" (cite LCP, design issues)
- `has_website` 50–69 → "real potential held back by fixable issues"
- `has_website` ≥70 → "solid site, specific wins worth chasing"
- `no_website` → "no web presence — here's what you're leaving on the table"
- `social_only` → "Facebook isn't a website — here's what a real one does"
- `platform_only` → "you're renting space on someone else's platform — here's the risk"

Pulls real data: latest `audits` (perf, lcp, fcp) + latest `design_analyses` (design_score, top-3 issues) + [v2] `ux_analyses` (ux issues). Honours tone/length/focus. Saves to `pitches` with `lead_type`+`tone`. Model: `gemini-3.5-flash`, header auth. JSON only response.

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
| `/api/discover` | [`src/app/api/discover/route.ts`](nearsited/src/app/api/discover/route.ts) | ✅ Live | **3 parallel Nearby Search queries** (keyword, keyword+type, 1.5×radius), dedup by place_id, **NDJSON streaming** (results→enrichment→done), places_cache enrichment, website classification, businesses upsert |
| `/api/audit` | [`src/app/api/audit/route.ts`](nearsited/src/app/api/audit/route.ts) | ✅ Live | **NDJSON streaming with progress steps** (fetching→mobile→desktop→complete→result→done), **7-day audit cache** with `force` param, PageSpeed mobile+desktop, SEO category, AbortController timeout (60s), retry on 500/429, admin client writes, businesses score update |
| `/api/analyze-design` | [`src/app/api/analyze-design/route.ts`](nearsited/src/app/api/analyze-design/route.ts) | ✅ Live | **NDJSON streaming with progress steps** (screenshot→analysis→persisting→complete→result→done), **7-day design cache** with `force` param, ScreenshotOne + Gemini 3.5 Flash, point_deduction+impact in prompt, mobile+desktop concurrent, admin client writes |
| `/api/pitch` | [`src/app/api/pitch/route.ts`](nearsited/src/app/api/pitch/route.ts) | ✅ Rebuilt | gemini-3.5-flash, header auth, 6 lead-type angles, real data citation, tone/length/focus, saves to pitches (admin) |
| `/api/pipeline` | [`src/app/api/pipeline/route.ts`](nearsited/src/app/api/pipeline/route.ts) | ✅ Live | POST add, PATCH update status, canonical status validation |
| `/api/export/pdf` | [`src/app/api/export/pdf/route.ts`](nearsited/src/app/api/export/pdf/route.ts) | ✅ Live | jsPDF, business name+scores+issues, downloadable `<business>-audit.pdf` |
| `/api/saved-searches` | [`src/app/api/saved-searches/route.ts`](nearsited/src/app/api/saved-searches/route.ts) | ✅ Live | CRUD for territories, session client, canonical business_type |
| `/api/gemini-test` | [`src/app/api/gemini-test/route.ts`](nearsited/src/app/api/gemini-test/route.ts) | ✅ Live | Smoke test for Gemini model connectivity |

### ✅ UI Pages (all v1)
| Page | Route | File(s) | Status | Key Features |
|---|---|---|---|---|
| Dashboard | `/dashboard` | [`page.tsx`](nearsited/src/app/dashboard/page.tsx) + [`dashboard-client.tsx`](nearsited/src/app/dashboard/dashboard-client.tsx) | ✅ Live | Stat cards, recent leads, pipeline funnel, Radar stub, inline lead detail |
| Leads | `/dashboard/leads` | [`page.tsx`](nearsited/src/app/dashboard/leads/page.tsx) | ✅ Live | Full table, search, tab filters, score rings, website badges, pagination 25/page, filter panel |
| Lead Detail | `/dashboard/leads/[id]` | [`page.tsx`](nearsited/src/app/dashboard/leads/[id]/page.tsx) + [`lead-detail-client.tsx`](nearsited/src/app/dashboard/leads/[id]/lead-detail-client.tsx) | ✅ Live | Overview/Audit/Issues/History tabs, 6 sub-scores (reactive to Mobile/Desktop toggle), top issues with point deductions, AI pitch generation (tone/length + error display + `lead_type`), **Copy Pitch** (clipboard), **Share Link** (copies page URL), PDF export, **pipeline status dropdown** (PATCH /api/pipeline, human-readable labels), **Run Audit / Run Design Analysis** missing-analysis buttons on Overview, **auto-pipeline on first audit** (sets status→"analysed" + toast), **re-analyse completion toast**, **expanded Core Web Vitals** (full names + subtitles + colour indicators), **toast system** (fixed bottom-right), UX/Competitors [v2] stubs |
| Discover | `/dashboard/discover` | [`page.tsx`](nearsited/src/app/dashboard/discover/page.tsx) | ✅ Live | City/business type search, radius slider, Save Search, **NDJSON streaming results** (renders immediately, enrichment fills in), **progress panels** (named steps instead of spinners for audit/design), audit/design analysis, pipeline add, session storage, client-side filters |
| Quick Site Audit | `/dashboard/audit` | [`page.tsx`](nearsited/src/app/dashboard/audit/page.tsx) | ✅ Live | URL input (Enter key support), **visual step-by-step progress checklist** (9 steps, CheckCircle/Loader/Circle icons, stays green after completion), **sessionStorage result persistence** ('ai_audit_last_result') with "Showing results from X ago" note, **expanded Core Web Vitals** metric cards (full names + subtitles + colour indicators via METRIC_META), **plain English performance + design summaries** (indigo-50 boxes), **Save as Lead** banner → /dashboard/discover |
| Pipeline | `/dashboard/pipeline` | [`page.tsx`](nearsited/src/app/dashboard/pipeline/page.tsx) | ✅ Live | Table, status dropdown with optimistic updates, canonical statuses |
| Pitches | `/dashboard/pitches` | [`page.tsx`](nearsited/src/app/dashboard/pitches/page.tsx) | ✅ Live | Pitch list, copy to clipboard, delete, status badges |
| Settings | `/dashboard/settings` | [`page.tsx`](nearsited/src/app/dashboard/settings/page.tsx) | ✅ Live | Profile view, plan info, API status, sign out |
| Auth (login) | `/login` | [`page.tsx`](nearsited/src/app/(auth)/login/page.tsx) | ✅ Live | Email/password + Google OAuth |
| Auth (signup) | `/signup` | [`page.tsx`](nearsited/src/app/(auth)/signup/page.tsx) | ✅ Live | Registration |
| Auth (callback) | `/callback` | [`route.ts`](nearsited/src/app/(auth)/callback/route.ts) | ✅ Live | OAuth callback handler |

### ✅ Library Code
| File | Purpose |
|---|---|
| [`src/lib/scoring.ts`](nearsited/src/lib/scoring.ts) | Scores: computeOverall, uxDesignScore, trustScore, uxInteractionScore, projection, blendedQuality, scoreLabel, scoreColor, scoreColorClasses |
| [`src/lib/types.ts`](nearsited/src/lib/types.ts) | WebsiteStatus enum, classifyWebsite() with extensive SOCIAL_DOMAINS + PLATFORM_DOMAINS lists |
| [`src/lib/analysis-context.tsx`](nearsited/src/lib/analysis-context.tsx) | React context tracking audit/design analysis progress across pages |
| [`src/lib/supabase/admin.ts`](nearsited/src/lib/supabase/admin.ts) | Singleton admin client (service role, bypasses RLS, never browser) |
| [`src/lib/supabase/server.ts`](nearsited/src/lib/supabase/server.ts) | Server client (auth + RLS-safe reads) |
| [`src/lib/supabase/client.ts`](nearsited/src/lib/supabase/client.ts) | Browser client (client components) |
| [`src/lib/supabase/middleware.ts`](nearsited/src/lib/supabase/middleware.ts) | Session cookie middleware |

### ✅ Infrastructure
| Item | Details |
|---|---|
| [`scripts/migrate.sql`](nearsited/scripts/migrate.sql) | Full migration SQL from SCHEMA.md §5 — businesses cleanup, seo_score, pitch metadata, RLS, pipeline realignment, territories rename, UX columns |
| [`scripts/run-migrations.mjs`](nearsited/scripts/run-migrations.mjs) | Migration runner — direct PostgreSQL + Management API fallback |
| [`src/middleware.ts`](nearsited/src/middleware.ts) | Auth guard — refresh session on every request |
| [`globals.css`](nearsited/src/app/globals.css) | Light theme CSS variables (indigo-600 primary, white surfaces) |
| [`layout.tsx`](nearsited/src/app/layout.tsx) | Root layout with Geist fonts |
| Dashboard sidebar | [`nearsited/src/app/dashboard/layout.tsx`](nearsited/src/app/dashboard/layout.tsx) — nav, credits widget, user info, v2 stubs (Radar, Templates, Campaigns, Reports, Integrations) |
| [`components/ui/SearchableSelect.tsx`](nearsited/src/components/ui/SearchableSelect.tsx) | Reusable searchable dropdown |
| [`src/lib/data/cities.ts`](nearsited/src/lib/data/cities.ts) | Indian city data with search |
| [`src/lib/data/businessTypes.ts`](nearsited/src/lib/data/businessTypes.ts) | Business types with categories |

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

**Phase 2 — Core UI:**
- [x] `/dashboard/leads` table page (replaces `/discover`)
- [x] `/dashboard/leads/[id]` Lead Detail (Overview/Audit/Issues/History; Competitors + UX stubs)
- [x] Wire "Analyse Design" button

**Phase 3 — Pitch:**
- [x] Rebuild `pitch/route.ts` (gemini-3.5-flash, lead-type branching, cites real data, tone/length/focus)

**Phase 4 — Dashboard & polish:**
- [x] `/dashboard` home (stat cards, recent leads, inline detail, pipeline funnel, Radar stub)
- [x] `/dashboard/pitches` list
- [x] Sort-by on leads page; credits UI widget ("Buy More" → disabled, no Stripe)

**Phase 5 — Export:**
- [x] PDF audit report (jsPDF, business name, scores, issues)
- [x] Share Link — copies current page URL to clipboard + toast (v1 implementation)

**Phase 6 — Light theme:**
- [x] COMPLETE — CSS variables in globals.css, light theme applied everywhere

### Remaining v1 items:
- Leads page: "Audited" / "Analysed" filter tabs (audited_at / design_analyzed_at IS NOT NULL)
- Leads page: Audit / Analyse action buttons in table rows
- Leads page: pagination position restored on back-navigation (sessionStorage)
- Leads page: filter tab tooltips (ⓘ with plain-English explanations)
- Leads page: "Last Analysed" shows "—" for unanalysed leads (currently shows "Today")

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

### METRIC_META — Core Web Vitals display
Defined identically in `lead-detail-client.tsx` and `audit/page.tsx`. Extract to a shared lib if used in a third place.
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

## Don't Repeat These (each a real past bug)
1. Writing `website_url`/`gmb_*`/`category` (DROPPED → `website`/`place_id`/`rating`/`review_count`/`business_type`).
2. `gemini-1.5-flash` (SHUT DOWN → `gemini-3.5-flash`).
3. Session client for server INSERT → RLS 42501 silent fail (→ admin client).
4. Returning 200 after a failed insert (→ surface `persisted:false`).
5. `npm run dev` from `C:\projects\nearsited\` not `C:\projects\nearsited\nearsited\`.
6. Inlining PageSpeed/Gemini/screenshot logic in the POST handler (→ exported functions).
7. Forgetting `&category=seo` on PageSpeed (→ SEO score undefined).
8. No AbortController timeout (→ route hangs on slow sites).
9. **[v2]** Trying to run Playwright on Vercel (→ it needs Runtime B worker server).
10. **[v2]** Running UX analysis synchronously in an API route (→ queue-only, it's 30–120s).
11. Inline score computation instead of importing from `scoring.ts`.
12. Writing `category` instead of `business_type` on territories/businesses.

---
*Update this file the moment a schema, enum, model name, runtime, or convention changes.*
