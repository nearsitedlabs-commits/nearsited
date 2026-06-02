# Nearsited — Architecture
**Version:** 2.2 · **Date:** June 2026

---

## 1. System Shape (Two Runtimes)

Nearsited runs across **two runtime environments** because the workloads have fundamentally different needs:

```
┌─────────────────────────────────────────────────────────────┐
│  RUNTIME A — Vercel (Next.js serverless)         [v1 + v2]    │
│  • UI (App Router pages)                                      │
│  • All v1 API routes: discover, audit, analyze-design, pitch  │
│    pipeline, export/pdf, saved-searches, gemini-test,         │
│    cities/search, contact-info                                │
│  • Auth, RLS-bound reads/writes                               │
│  • Anything that completes in < 60s                           │
└─────────────────────────────────────────────────────────────┘
                          │  enqueues jobs
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  RUNTIME B — Persistent worker server            [v2 only]    │
│  Railway / Render / Fly.io — always-on, Chrome installed      │
│  • Playwright interaction recording (30–120s per site)        │
│  • Radar territory scans (scheduled)                          │
│  • Self-hosted screenshots (replaces ScreenshotOne at scale)  │
│  • Writes frames to Supabase Storage, rows via admin client   │
└─────────────────────────────────────────────────────────────┘

         Both talk to:  Supabase (Postgres + Auth + Storage)
         External:      Google Places/PageSpeed · Gemini · ScreenshotOne
```

**Why two runtimes:** Vercel serverless functions cap at ~60s, have no persistent Chrome, and limited RAM — fine for API calls to PageSpeed/Gemini, impossible for a 90-second Playwright session that needs ~500MB of headless Chrome. The worker server exists solely for long-running, browser-heavy, or scheduled work. **V1 ships entirely on Runtime A.** Runtime B appears only when building UX analysis / Radar (v2).

---

## 2. Stack

| Layer | Technology | Runtime | Notes |
|---|---|---|---|
| Framework | Next.js 16.2.6 (App Router, Turbopack) | A | Root: `c:/Projects/nearsited` — all npm commands run here. |
| Language | TypeScript (strict) | A + B | |
| Styling | Tailwind CSS v4 | A | **Dark theme** (near-black navy `#0a0e12`, sage green accent `#8A9777`), CSS variables in `globals.css`. |
| DB + Auth + Storage | Supabase (Postgres 15, GoTrue, Storage) | — | Free → Pro at ~500 users. |
| AI (vision + pitch + UX) | Gemini 3.5 Flash | A + B | `gemini-3.5-flash`. Multimodal. |
| Static screenshots | ScreenshotOne | A | v1. Swap for self-hosted Playwright at scale. |
| Interaction recording | Playwright (headless Chromium) | **B** | v2. Cannot run on Vercel. |
| Job queue | Inngest **or** Trigger.dev | A↔B | v2. Free tier covers early scale. |
| Places/Geocoding/PageSpeed | Google APIs | A | One key, query-param auth. |
| PDF generation | jsPDF | A | Server-side PDF export. |
| Hosting (web) | Vercel | A | |
| Hosting (worker) | Railway / Render / Fly.io | B | v2, $5–20/mo. |

---

## 3. Project Structure (Actual)

```
nearsited/                              # Runtime A (Next.js)
  CLAUDE.md                             # auto-loaded by Claude Code
  docs/                                 # PRD, ARCHITECTURE, SCHEMA, CONVENTIONS, AGENTS
  scripts/
    migrate.sql                         # All SCHEMA §5 migrations
    run-migrations.mjs                  # Migration runner (PostgreSQL + Management API)
    download-cities.mjs                 # City data download script
  src/
    app/
      (auth)/ login/  signup/  callback/
      api/
        discover/route.ts               # ✅ Discovery + enrichment               [sync, POST]
        audit/route.ts                  # ✅ PageSpeed audit (mobile+desktop)     [sync, POST]
        analyze-design/route.ts         # ✅ ScreenshotOne + Gemini vision        [sync, POST]
        pitch/route.ts                  # ✅ Pitch generation (rebuilt)           [sync, POST]
        pipeline/route.ts               # ✅ Pipeline CRUD                        [sync, POST+PATCH]
        export/pdf/route.ts             # ✅ PDF report generation                [sync, GET]
        saved-searches/route.ts         # ✅ Territories CRUD                     [sync, GET+POST+DELETE]
        gemini-test/route.ts            # ✅ Gemini smoke test                    [sync, GET]
        analyze-ux/route.ts             # 🟦 ENQUEUE a UX job, return job id     [v2, async]
        webhooks/queue/route.ts         # 🟦 queue callback → reads results       [v2]
      dashboard/
        layout.tsx                      # ✅ Sidebar nav layout
        sidebar-nav.tsx                 # ✅ 7 nav items (no Coming Soon section)
        page.tsx                        # ✅ Dashboard home (stat cards + recent + pipeline)
        dashboard-client.tsx            # ✅ Dashboard client component
        sign-out-button.tsx             # ✅ Sign out button
        leads/ page.tsx                 # ✅ Leads table (full-width, tabs, filters, pagination)
        leads/[id]/ page.tsx            # ✅ Lead Detail server component
        leads/[id]/ lead-detail-client.tsx  # ✅ Lead Detail client (tabs, reactive scores, pipeline dropdown, Copy Pitch, Share, toast, CWV, auto-pipeline)
        discover/ page.tsx              # ✅ Business discovery (search + results + filters)
        audit/ page.tsx                 # ✅ Quick Site Audit (URL input, step checklist, sessionStorage, CWV, summaries)
        pipeline/ page.tsx              # ✅ Pipeline management
        pitches/ page.tsx               # ✅ Pitches list
        settings/ page.tsx              # ✅ Settings page
    components/ui/
      SearchableSelect.tsx              # ✅ Reusable searchable dropdown
    lib/
      supabase/ client.ts  server.ts  admin.ts  middleware.ts
      types.ts                          # ✅ Enums + classifyWebsite()
      scoring.ts                        # ✅ The ONE place scores are computed
      analysis-context.tsx              # ✅ Analysis progress tracking context
      data/ cities.ts  cities.json  businessTypes.ts
  middleware.ts                         # ✅ Auth session guard (restricted to /dashboard/* and /(auth)/*)
  globals.css                           # ✅ Light theme CSS variables

worker/                                 # Runtime B (v2) — separate deploy
  src/
    index.ts                            # queue consumer entrypoint
    jobs/
      uxAnalysis.ts                     # Playwright session → frames → Gemini → DB
      radarScan.ts                      # scheduled territory rescans
      screenshot.ts                     # self-hosted screenshot (ScreenshotOne replacement)
    lib/
      playwright.ts                     # browser launch/teardown helpers
      supabaseAdmin.ts                  # service-role client (worker side)
      gemini.ts                         # shared Gemini call helper
  Dockerfile                            # Chrome + Playwright base image
```

---

## 4. API Routes (v1 — all ✅ built)

| Route | Method | Runtime | Sync/Async | Purpose | Status |
|---|---|---|---|---|---|
| `/api/discover` | POST | A | **NDJSON stream** | 3 parallel queries + enrichment, batched upserts (50/batch) | ✅ Live |
| `/api/audit` | POST | A | **NDJSON stream** | PageSpeed audit with progress steps, 7d cache | ✅ Live |
| `/api/analyze-design` | POST | A | **NDJSON stream** | ScreenshotOne + Gemini, progress steps, 7d cache | ✅ Live |
| `/api/pitch` | POST | A | sync | Pitch generation (lead-type branched, cites real data) | ✅ Rebuilt |
| `/api/pipeline` | POST/PATCH | A | sync | Add/update pipeline | ✅ Live |
| `/api/export/pdf` | GET | A | sync | PDF audit report download | ✅ Live |
| `/api/saved-searches` | GET/POST/DELETE | A | sync | Saved search (territories) CRUD | ✅ Live |
| `/api/gemini-test` | GET | A | sync | Gemini model smoke test | ✅ Live |
| `/api/analyze-ux` | POST | A | **async** | Enqueue UX job, return `{ jobId }` immediately | 🟦 V2 |
| `/api/webhooks/queue` | POST | A | — | Queue → app callback when a job finishes | 🟦 V2 |

### 4.1 The Thin-Wrapper Convention (Cardinal)
All analysis logic lives in **exported functions**; route handlers only validate, auth, and call them. This is what lets a function move from a sync route to a queue worker without a rewrite.

```ts
// ✅ thin route (from audit/route.ts)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { data: { user } } = await supabaseServer.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // logic is local to route for now — extract when adding queue worker
  const result = await runAudit(body.website, body.businessId, user.id);
  return NextResponse.json(result);
}
```

### 4.2 API Route Details

**`/api/discover`** — Geocodes city → **3 parallel Nearby Search queries** (keyword, keyword+type mapped via `BUSINESS_TYPE_TO_PLACES_TYPE`, 1.5× radius) → dedup by `place_id` → streams results via **NDJSON**: `results` (immediate, with cached enrichment) → `enrichment` (batched Place Details updates, **25/batch**, with **batched `places_cache` upserts**) → `done` (final upserted businesses). **Business upserts are batched (50/batch)** instead of one-at-a-time, reducing 180+ sequential DB calls to ~4. `places_cache` 90-day TTL. Website classification (`classifyWebsite()`). Logged with `[DISCOVER]`.

**`/api/audit`** — PageSpeed Insights for mobile + desktop concurrently. Requests both `category=performance` and `category=seo`. **Streams progress via NDJSON**: `fetching` → `mobile` → `desktop` → `complete` → `result` → `done`. **7-day audit cache**: checks `audits` table for fresh mobile+desktop rows; cache hit returns `{cached:true}` immediately (regular JSON); cache miss runs live PageSpeed. `force: true` bypasses cache. Extracts metrics via `extractMetrics()`. Inserts 2 rows via admin client. Updates businesses `performance_score`, `audited_at`, `flagged_for_outreach`. **30s** AbortController timeout (reduced from 60s). Retries once on 500/429. Logged with `[AUDIT]`.

**`/api/analyze-design`** — ScreenshotOne full-page screenshot → Gemini 3.5 Flash vision critique. **Streams progress via NDJSON**: `mobile-screenshot` → `mobile-analysis` → `desktop-analysis` → `persisting` → `complete` → `result` → `done`. **7-day design cache**: checks `design_analyses` table for fresh mobile+desktop rows; cache hit returns `{cached:true}` immediately. `force: true` bypasses cache. Returns structured JSON: `{ design_score, criteria_scores: {...}, issues: [{title,detail,point_deduction,impact}] }`. Mobile + desktop run concurrently. Inserts via admin client, updates businesses. 30s timeout per external call. Logged with `[DESIGN]`.

**`/api/pitch`** — Fetches business + latest audit + latest design analysis → builds 6 lead-type angles → Gemini generates subject+body → saves to `pitches` table via admin client. Supports tone/length/focus. Logged with `[PITCH]`.

**`/api/pipeline`** — POST adds a business to pipeline (`new_lead` default status). PATCH updates status with canonical status validation. Uses session client (RLS-safe).

**`/api/export/pdf`** — Generates PDF via jsPDF with business name, performance/SEO/mobile/design scores, top issues with point deductions. Returns downloadable `<business-name>-audit.pdf`.

**`/api/saved-searches`** — CRUD for `territories` table. Saved city+business_type search queries.

**`/api/cities/search`** — Server-side city search that replaces the **29MB client-side `cities.json`**. Caches all cities in memory on first request, returns max 200 results sorted by popularity. Accepts optional `?q=` search parameter for search-as-you-type. Logged with `[CITIES SEARCH]`.

**`/api/contact-info`** — Fetches phone number and email for a business from the `businesses` table. Used by lead detail pages to show contact info and determine pitch channel. Logged with `[CONTACT INFO]`.

### 4.3 The Async Pattern (UX analysis, v2)
UX analysis cannot return inline (30–120s). Flow:

```
Client clicks "Analyze UX"
  → POST /api/analyze-ux { businessId, website }
  → route validates + auths, ENQUEUES a job, returns { jobId } in <1s
  → UI shows "Analyzing UX… (~1 min)" with polling or realtime subscription
  → Worker (Runtime B) picks up job:
      launch Playwright → record interaction → upload frames to Storage
      → Gemini analyses frame sequence → write ux_analyses rows (admin)
      → update businesses.ux_score, ux_analyzed_at (admin)
  → Worker notifies completion (queue callback or Supabase Realtime)
  → UI refreshes the lead's UX panel
```

UI gets completion via **Supabase Realtime** subscription on the `ux_analyses` table (simplest — no extra webhook plumbing) OR the queue's native completion callback to `/api/webhooks/queue`. Prefer Realtime for v2 simplicity.

---

## 5. Supabase Clients

```ts
// @/lib/supabase/client.ts  — browser, anon key, RLS enforced. Client components only.
// @/lib/supabase/server.ts  — server, anon key + cookies. auth.getUser() + RLS-safe reads.
// @/lib/supabase/admin.ts   — SERVICE ROLE, bypasses RLS. ALL server-side writes. Never in browser.
// worker/src/lib/supabaseAdmin.ts — service role on Runtime B (queue workers have no user session at all).
```

**Rule:** auth check → server client; every server-side write (routes AND workers) → admin/service-role client; client-component reads → browser client. `SUPABASE_SERVICE_ROLE_KEY` never carries `NEXT_PUBLIC_`.

---

## 6. External APIs

### 6.1 Google (Places / Geocoding / PageSpeed) — one key, `?key=`

| API | Endpoint | Cost (INR) |
|---|---|---|
| Geocoding | `maps.googleapis.com/maps/api/geocode/json` | ₹0.42/req |
| Nearby Search | `maps.googleapis.com/maps/api/place/nearbysearch/json` | ₹2.67/req |
| Place Details (website field) | `maps.googleapis.com/maps/api/place/details/json` | ₹0.25/req |
| PageSpeed Insights | `googleapis.com/pagespeedonline/v5/runPagespeed` | Free (huge daily quota) |

**PageSpeed returns performance ONLY by default.** For SEO add `&category=performance&category=seo`. ✅ Both categories are now requested in [`src/app/api/audit/route.ts`](nearsited/src/app/api/audit/route.ts:43-44). Run mobile + desktop concurrently (`Promise.allSettled`), **30s** timeout each (reduced from 60s/90s).

### 6.2 Gemini — `gemini-3.5-flash` (verified June 2026)
- Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent`
- Auth: **header** `x-goog-api-key: <GEMINI_API_KEY>` (NOT query param). Key from Google AI Studio.
- Define once: `const GEMINI_MODEL = 'gemini-3.5-flash'`.
- Multimodal request:
```ts
body: JSON.stringify({
  contents: [{ parts: [
    { inline_data: { mime_type: 'image/png', data: base64 } },  // repeat for multi-frame (UX)
    { text: prompt }
  ]}]
})
```
- Always: prompt for JSON → strip ```json fences → JSON.parse in try/catch → log raw text on failure.
- **Pricing (real):** $1.50/M input, $9.00/M output, $0.15/M cached.
  - Static design (1 image ~1k tokens + prompt + ~800 out) ≈ **₹0.60/strategy**, ~₹1.20 mobile+desktop.
  - UX frame sequence (8 frames ~8k tokens + prompt + ~1k out) ≈ **₹1.50/strategy**.
  - At scale, route design/UX through cheaper Gemini Flash-Lite ($0.25/$1.50) if cost pressures (see §11).

### 6.3 ScreenshotOne (v1 static screenshots)
- `process.env.SCREENSHOT_API_KEY`. Full-page. Mobile ~390px / desktop ~1440px.
- Response → arraybuffer → base64 for Gemini.
- `ignore_host_errors=true` to capture bot-blocking sites; log `returned_status_code` if non-2xx.
- **Charged only for successful renders.** Free 200/mo → $17/2,000 → $79/10,000.
- Behind a `takeScreenshot()` abstraction in `analyze-design/route.ts` so the self-hosted Playwright swap (§10.4) touches one function.

### 6.4 Playwright (v2 — Runtime B only)
- Headless Chromium on the worker server. ~500MB RAM/instance, 30–120s/session.
- Cannot run on Vercel. Lives in `worker/`. See §10.

---

## 7. Places Cache (Cost Control)

**One Place Details call per unique `place_id`, platform-wide, ever (90-day refresh).**
```
discovery run → 3 parallel Nearby Search queries → dedup by place_id
  → collect unique place_ids → ONE batched SELECT (.in('place_id',[...]))
  → split fresh (<90d) vs stale/missing
  → stream initial results (with cache data) to client
  → stale/missing: batch Place Details in groups of 10 (Promise.allSettled)
  → after each batch, stream enrichment update to client
  → upsert to places_cache via ADMIN client
  → upsert all businesses → stream final done
log: [DISCOVER] multi-query: X from keyword, Y from keyword+type, Z from expanded-radius, N unique after dedup
log: [DISCOVER] enrichment — cache hits: X, details calls: Y, total: Z
```
Cache hit-rate rises as the user base grows → marginal website-detection cost trends to zero. The data moat.

**Multi-query expansion:** Each discover run fans out to 3 simultaneous Nearby Search queries at the same location:
1. **Keyword** — original `keyword={businessType}&radius={radius}` (existing behaviour)
2. **Keyword+type** — adds `&type={placesType}` mapped from `BUSINESS_TYPE_TO_PLACES_TYPE` (all 72 business types mapped)
3. **Expanded-radius** — same keyword at `radius×1.5` for broader coverage

Results are deduplicated by `place_id` before enrichment, yielding 120–180 unique businesses per search.

✅ Implementation in [`src/app/api/discover/route.ts`](nearsited/src/app/api/discover/route.ts).

---

## 8. Website Classification

`classifyWebsite(url): WebsiteStatus` in [`src/lib/types.ts`](nearsited/src/lib/types.ts:81). Match hostname, case-insensitive, strip `www.`/`m.`, match subdomains. Extensive `SOCIAL_DOMAINS` (18 entries) and `PLATFORM_DOMAINS` (35+ entries) lists.
```
empty/null                          → "no_website"
facebook/instagram/twitter/x/tiktok/linkedin/linktr.ee/wa.me/sites.google → "social_only"
booking/opentable/fresha/booksy/doordash/ubereats/square.site/
  wixsite/weebly/godaddysites/myshopify/wordpress/blogspot/
  yellowpages/yelp/tripadvisor/justdial... → "platform_only"
otherwise                           → "has_website"
```

---

## 9. Scoring (compute in [`src/lib/scoring.ts`](nearsited/src/lib/scoring.ts) only)

Six core scores (v1) + a seventh UX score (v2). Full table + formulas in SCHEMA §9. Key points:
- Performance/SEO from PageSpeed desktop; Mobile from PageSpeed mobile.
- UX/Design + Trust from Gemini **static** vision (design_analyses).
- UX interaction score from Playwright + Gemini (ux_analyses, v2).
- Overall = `perf·0.25 + seo·0.15 + mobile·0.25 + uxdesign·0.20 + trust·0.15`.
- **Merge behaviour:** UI shows one blended quality number; "Deep Analysis" toggle splits static Design vs interaction UX. Blend (when UX exists): `design·0.5 + ux·0.5`. All computed at read time in the scoring lib — never stored, never inlined.
- **Projection:** `min(95, score + sum(top 3 issues' point_deduction))`.
- **Labels:** Poor(red) · Needs Improvement(amber) · Good(green) · Strong(emerald).

---

## 10. UI Pages (v1 — all ✅ built)

### Dashboard (`/dashboard`)
Two-column split. Left (~65%): stat cards (Leads Analyzed, Opportunities, Pitches, In Pipeline) + Recent Leads (5, clickable) + Pipeline Overview funnel + Opportunity Radar [v2] stub. Right (~35%): inline lead detail for selected lead.

### Leads (`/dashboard/leads`)
Full-width table. Search bar, tab filters (All/Needs Improvement/Strong Opportunity/Contacted/Archived), filter panel (website status, sort by, order, score range). Score rings, website badges, status badges. Pagination 25/page. Actions: view detail, Google Maps, open website.

### Lead Detail (`/dashboard/leads/[id]`)
Tabs: Overview · Audit · Issues · History · UX [v2 stub] · Competitors [v2 stub].

**Header:** pipeline status `<select>` dropdown (PATCH `/api/pipeline`, `PIPELINE_LABELS` map, local optimistic state) + Copy Pitch button.

**Overview tab:** Mobile/Desktop toggle drives `activeAudit = screenshotStrategy === "mobile" ? mobileAudit : desktopAudit` and `activeDesign` — all 6 sub-scores and the Score Breakdown panel are reactive. Action buttons: Re-analyse (force=true, both audit+design, completion toast) / Run Audit (if `!biz.audited_at`) / Run Design Analysis (if `!biz.design_analyzed_at`). First audit auto-PATCHes pipeline to "analysed". AI pitch panel shows errors inline (red banner) and logs to console; `lead_type: biz.website_status` sent to /api/pitch. Share Link copies `window.location.href` to clipboard.

**Audit tab:** `METRIC_META` config drives each CWV card — full name, subtitle, colour-coded value (green/amber/red) via `metricColor(key, rawValue)` with `toCanonical()` parsers per metric.

**Toast system:** `toast` state + `showToast` callback (3s auto-dismiss), rendered as fixed bottom-right overlay.

### Discover (`/dashboard/discover`)
Search form: city (searchable select), business type (searchable select grouped by category), radius slider, Save Search. **NDJSON streaming results** — renders immediately as Places data arrives, website status badges fill in progressively as enrichment completes. **Progress panels** instead of spinners for audit (✓↳○ steps: fetching→mobile→desktop→complete) and design analysis (✓↳○ steps: screenshot→analysis→persisting→complete). Results grid with website status badges, rating, audit scores, audit/design analysis buttons, pipeline add. Client-side filters (website status, min rating, min reviews). Session storage for results persistence.

### Quick Site Audit (`/dashboard/audit`)
Renamed from "AI Audit". URL input with Enter key support. Two-phase sequential execution (audit then design) with shared NDJSON streaming.

**Progress tracker:** `ALL_STEPS` (9 items — 4 audit + 4 design + 1 "Complete") rendered as a card below the input. `completedKeys: string[]` + `activeKey: string | null` state driven by stream events. Stays visible after completion. "complete" events mapped: audit phase → "audit_complete", design phase → "design_complete" to avoid key collision.

**SessionStorage:** key `'ai_audit_last_result'`, shape `{ url, auditResult, designResult, timestamp }`. Cleared on new run, restored on mount. `timeAgo()` formats staleness. Timestamp saved from local variable (not state) so it's available in the same async function after API calls.

**Scores:** `METRIC_META` and `metricColor()` (same pattern as Lead Detail). `getPerformanceSummary(mobile, desktop)` + `getDesignSummary(mobileIssues, desktopIssues)` produce indigo-50 summary boxes.

**Save as Lead:** simple Link to `/dashboard/discover` shown after completion — v1 "honest limitation" approach.

### Pipeline (`/dashboard/pipeline`)
Table of pipeline businesses with status dropdown (optimistic updates, canonical statuses).

### Pitches (`/dashboard/pitches`)
List of saved pitches. Copy to clipboard, delete, status badges (Draft/Sent/Replied).

### Settings (`/dashboard/settings`)
Profile view, plan info, API integration status, sign out.

### Auth
Login and signup with email/password + Google OAuth. Dashboard sidebar includes credits widget (+ Buy More disabled), user avatar, plan badge.

---

## 11. Dashboard Layout & Navigation

```
┌──────────────────────────────────────────────────────────────┐
│ nearsited [logo]                        [avatar · Free Plan] │
│                                                               │
│ MAIN                                                          │
│   Dashboard                                                   │
│   Opportunities                                               │
│   Opportunity Discovery                                       │
│   Opportunity Review                                          │
│   Pipeline                                                    │
│   Pitches                                                     │
│   Settings                                                    │
│                                                               │
│ USAGE                                                         │
│ Credits 100/100 · Resets in 30 days · [Buy More — disabled]  │
└──────────────────────────────────────────────────────────────┘
```

---

## 12. Runtime B — Worker Server (V2 Detail)

### 12.1 Why It Exists
Three workloads need a persistent, Chrome-equipped, long-running environment Vercel can't provide:
1. **UX analysis** — Playwright interaction recording (30–120s, ~500MB Chrome).
2. **Radar scans** — scheduled territory rescans (cron-style).
3. **Self-hosted screenshots** — eliminate ScreenshotOne cost at high volume.

### 12.2 Deployment
- Host: Railway, Render, or Fly.io (any container host). $5–20/mo for one always-on instance.
- Image: `Dockerfile` based on the official Playwright image (Chrome + deps preinstalled).
- Secrets: `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, Supabase URL. Worker writes via service role.
- Scaling: start with one instance + a concurrency limit (e.g. 2 simultaneous browser sessions). Scale horizontally later.

### 12.3 UX Analysis Job Flow
```ts
// worker/src/jobs/uxAnalysis.ts (sketch)
async function uxAnalysisJob({ businessId, website, userId, strategy }) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext(strategy === 'mobile' ? MOBILE_VIEWPORT : DESKTOP_VIEWPORT);
  const page = await ctx.newPage();
  const frames: Buffer[] = [];
  try {
    await page.goto(website, { waitUntil: 'networkidle', timeout: 30000 });
    frames.push(await page.screenshot());                 // initial
    // scroll in steps, capture
    for (const y of scrollStops(page)) { await page.mouse.wheel(0, y); await page.waitForTimeout(400); frames.push(await page.screenshot()); }
    // find + click primary CTA, capture result
    const cta = await findPrimaryCta(page);
    if (cta) { await cta.click().catch(()=>{}); await page.waitForTimeout(1500); frames.push(await page.screenshot()); }
    // attempt a form interaction, capture
    // ... record observations into an interactions[] array
  } finally { await browser.close(); }

  // upload frames to Supabase Storage: recordings/<businessId>/<analysisId>/frame_NN.png
  const framePaths = await uploadFrames(frames, businessId, analysisId);
  // Gemini analyses the frame sequence (multi inline_data parts) → { ux_score, criteria_scores, issues }
  const analysis = await geminiUxAnalyse(frames, interactions);
  // write ux_analyses row (admin), update businesses.ux_score + ux_analyzed_at (admin)
}
```
**Frame sequence, not raw video** — decision recorded in CONVENTIONS. ~8 selected frames give Gemini clear signal at far lower token cost than sampling a video, and avoid codec/storage overhead.

### 12.4 Self-Hosted Screenshot Swap
When ScreenshotOne volume gets expensive, implement `getScreenshot()` against the worker's Playwright instead of the ScreenshotOne API. Because v1 already hides ScreenshotOne behind the `takeScreenshot()` function, this swap touches a single file.

### 12.5 Queue
- Inngest or Trigger.dev. Both: free tier, TypeScript-native, handle retries + scheduling + concurrency.
- The app (Runtime A) enqueues; the worker (Runtime B) consumes.
- Completion → Supabase Realtime (preferred) or callback to `/api/webhooks/queue`.

---

## 13. Cost-Sensitive Model Routing (V2 Note)
Gemini 3.5 Flash is capable but not cheap on output ($9/M). For high-volume image/UX analysis, consider routing analysis calls to **Gemini Flash-Lite** ($0.25/$1.50 — ~6× cheaper) and reserving 3.5 Flash for pitch generation where quality matters most. Keep the model name in `GEMINI_MODEL` per call-site so this is a one-line change per route. Decision deferred until volume justifies it; do not prematurely optimise.

---

## 14. Environment Variables

```bash
# Runtime A — Vercel (.env.local locally)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # NEVER NEXT_PUBLIC_
GOOGLE_PLACES_API_KEY=              # Places + Geocoding + PageSpeed
GEMINI_API_KEY=                     # from Google AI Studio
SCREENSHOT_API_KEY=                 # ScreenshotOne
# v2:
QUEUE_API_KEY=                      # Inngest/Trigger.dev
WORKER_URL=                         # Runtime B base URL (if direct calls needed)

# Runtime B — worker server (v2)
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
```

---

## 15. Logging & Error Rules

- Every route/job logs with a prefix: `[DISCOVER]`, `[AUDIT]`, `[DESIGN]`, `[PITCH]`, `[UX]`, `[RADAR]`.
- Log every external API call's HTTP status + key data. Log full Supabase error `{ code, message, details, hint }` on any DB failure.
- **Never return a fake 200.** Analysis succeeded but write failed → `{ persisted: false, errors: [...] }`. Route itself failed → 500.
- External failures caught per-strategy (`Promise.allSettled`); one strategy failing never kills the other.
- Retry once on transient HTTP 500/429; never on 403/400/AbortError.
- Timeouts: PageSpeed 60s, ScreenshotOne 30s, Gemini 30s, Playwright nav 30s / total session 120s.

---

## 16. V1 → V2 Infrastructure Path

| Stage | Infrastructure | Triggers Adding It |
|---|---|---|
| V1 | Vercel + Supabase + 3 external APIs ✅ | Built now |
| V2.1 | + Job queue (Inngest/Trigger.dev) | First async feature (UX analysis) |
| V2.2 | + Worker server (Railway/Render/Fly.io) + Playwright | UX analysis build |
| V2.3 | + Supabase Storage `recordings` bucket | UX analysis build |
| V2.4 | Worker also runs Radar scans | Radar feature |
| V2.5 | Worker also serves self-hosted screenshots | ScreenshotOne cost > ~₹2,500/mo |

The worker server, queue, and storage are introduced **together** for UX analysis, then reused by Radar and self-hosted screenshots. No workload adds a new infrastructure *category* — they share Runtime B.

---

## 17. Key Library Files

| File | Purpose |
|---|---|
| [`src/lib/scoring.ts`](src/lib/scoring.ts) | All score math: computeOverall, uxDesignScore, trustScore, uxInteractionScore, projection, blendedQuality, scoreLabel, scoreColor, scoreColorClasses |
| [`src/lib/types.ts`](src/lib/types.ts) | WebsiteStatus enum, classifyWebsite() with 50+ domain entries |
| [`src/lib/ui-constants.ts`](src/lib/ui-constants.ts) | PIPELINE_LABELS, OPPORTUNITY_INDICATORS, PITCH_STATUS_LABELS, LEAD_TYPE_LABELS |
| [`src/lib/supabase/admin.ts`](src/lib/supabase/admin.ts) | Singleton admin client (service role, bypasses RLS, never in browser) |
| [`src/lib/supabase/server.ts`](src/lib/supabase/server.ts) | Server client (session-aware auth + RLS reads) |
| [`src/lib/supabase/client.ts`](src/lib/supabase/client.ts) | Browser client (anon key, RLS enforced) |
| [`src/components/ui/SearchableSelect.tsx`](src/components/ui/SearchableSelect.tsx) | Reusable searchable dropdown (used in discover page) |
| [`scripts/run-migrations.mjs`](scripts/run-migrations.mjs) | Migration runner for SCHEMA.md §5 SQL |

---

*End of Architecture · Update when a route, external API, runtime, or infra component changes.*
