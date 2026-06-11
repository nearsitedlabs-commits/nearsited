# Nearsited — Conventions & Decisions Log
**Version:** 2.2 · **Date:** June 2026

---

## 1. The Cardinal Rules

Non-negotiable. Each was learned the hard way during this build.

### Rule 1 — Schema First, Always
Never write code touching a table until it exists in the DB AND is documented in SCHEMA.md.
Order: **SCHEMA.md update → SQL in Supabase → route/worker code.** The "column does not exist" error class is entirely preventable by this discipline.

### Rule 2 — One Source of Truth Per Fact
Every enum value, model name, API endpoint, and score formula lives in exactly ONE place in code and ONE in the docs. Two homes → drift.
- `website_status` enum → `src/lib/types.ts` + SCHEMA §3.1
- Gemini model → `const GEMINI_MODEL` per call-site + ARCHITECTURE §6.2
- Score math → `src/lib/scoring.ts` (one function, never inline)

### Rule 3 — Never Return a Fake 200
If an operation fails, the client must know. Silent persistence failure (success shown, data lost, no error) is the worst class of bug.
```ts
if (error) {
  console.error('[ROUTE] CRITICAL: insert failed', { code:error.code, message:error.message, details:error.details, hint:error.hint });
  return NextResponse.json({ success:false, persisted:false, error:error.message }, { status:500 });
}
```

### Rule 4 — Admin Client for Server Writes, Session Client for Auth
- `createAdminClient()` → all INSERT/UPDATE from API routes AND queue workers (bypasses RLS; correct for server code that derives user_id from session, or workers with no session at all).
- server `createClient()` → `auth.getUser()` only.
- browser `createClient()` → client components only.
Never import the admin client into browser code — it carries the service-role key.

### Rule 5 — Logs at Every External Call
Every route/job logs with a `[ROUTENAME]` prefix. External calls log HTTP status. DB writes log success or full error object. Primary debugging tool, not optional.
```
[DISCOVER] enrichment — cache hits: 23, details calls: 12, total: 35
[AUDIT] Mobile PageSpeed failed: returned 403
[DESIGN] CRITICAL: insert failed for strategy mobile { code, message, details, hint }
[UX] Playwright session complete — 8 frames captured, uploading to Storage
```

### Rule 6 — Thin Handlers, Logic in Functions
Analysis logic lives in exported functions; the route handler validates + auths + calls. This is what lets `runAudit()` / `analyzeDesign()` move from a sync route to a queue worker without a rewrite. UX analysis depends on this — its logic runs in a worker, not a route.

### Rule 7 — Timeout Every External Call
AbortController on everything: PageSpeed **30s**, ScreenshotCore **15s**, Gemini 30s, Playwright nav 30s / session 120s. Retry once on transient 500/429; never on 403/400/AbortError.

---

## 2. The Anti-Patterns (Never Repeat)

Every one caused a real bug in this project.

### 2.1 Label Drift
`website_status` was once stored as `"good"/"weak"/"none"` in `businesses`, `"has_website"/"no_website"` in `places_cache`, and the UI filters checked other values. Nothing matched.
**Fix/rule:** one canonical enum in `types.ts`. Adding a value → update `types.ts` FIRST, then every consumer. SCHEMA §3 is the registry.

### 2.2 Schema Before Code
Tables were created with names that didn't match later code (`score` vs `performance_score`, `ssl_valid` vs `has_ssl`). Every audit insert silently failed for weeks.
**Rule:** Rule 1. Schema first.

### 2.3 Stale Model Names
Scaffolded with `gemini-1.5-flash`; by build time it was shut down — every Gemini call 404'd. Happened again when `gemini-2.0-flash` was deprecated June 2026.
**Rule:** never hardcode the model string in any route or library. Define it once in [`src/lib/gemini.ts`](src/lib/gemini.ts) and import `GEMINI_URL` everywhere. Run the `/api/gemini-test` smoke test before any new Gemini integration to confirm the model ID is live.
**Current confirmed (June 2026):** `gemini-2.5-flash`. Model history: `gemini-1.5-flash` = dead; `gemini-2.0-flash` = deprecated June 2026.

### 2.4 Synchronous Without Timeout
PageSpeed with no timeout hung routes on slow/broken sites.
**Rule:** Rule 7. AbortController everywhere.

### 2.5 Mixed Vocabularies in One Table
`businesses` accumulated orphan columns across two schema generations (`website_url` AND `website`, `gmb_rating` AND `rating`). Code used the new ones; the old ones confused every assistant and dev.
**Rule:** when superseding a column, drop the old one in the same migration. Unwritten columns are dead weight — remove them.

### 2.6 RLS Without Admin Client
`design_analyses` inserts from the route used the session client. RLS blocked them (`42501: row violates row-level security policy`). The route returned 200 anyway. Data silently lost.
**Rule:** Rule 4. Server-side writes (routes and workers) use the admin client.

### 2.7 The Subfolder Trap
Running `npm run dev` from `C:\projects\nearsited\` instead of `C:\projects\nearsited\nearsited\`. No package.json found, server won't start.
**Rule:** always `cd nearsited` first. ALL npm commands run in `C:\projects\nearsited\nearsited`.

### 2.8 Forgetting the PageSpeed Category Param
PageSpeed returns performance ONLY by default. Code expecting an SEO score got `undefined` because the request didn't ask for it.
**Rule:** SEO/accessibility/best-practices each require an explicit `&category=` param (repeatable). For Nearsited: `&category=performance&category=seo`.

### 2.9 [V2] Playwright on Serverless
Attempting Playwright on Vercel fails — no persistent Chrome, 60s cap, insufficient RAM.
**Rule:** Playwright lives on Runtime B (the worker server) only. Never import it into a Next.js API route.

### 2.10 [V2] Synchronous Long Jobs
A 30–120s UX recording cannot run in a request handler — it will time out and burn a serverless invocation.
**Rule:** UX analysis (and Radar scans) are queue jobs. The API route enqueues and returns a `jobId`; the worker does the work; the UI learns of completion via Supabase Realtime.

### 2.11 Inline Score Math
Score formulas were initially computed inline in multiple components — led to inconsistent numbers.
**Rule:** All score math in `src/lib/scoring.ts` only. Import functions, never reimplement.

### 2.12 Writing `category` Instead of `business_type`
Some code used `category` (dropped orphan column) instead of `business_type`. Inserts silently failed.
**Rule:** Always check SCHEMA.md for current column names. `business_type` is the canonical name.

---

## 3. Design Conventions

Rules that govern every UI component, page, and layout decision. Violations trigger regressions across the design system.

### Token usage
All colors, spacing, and radius values come exclusively from `src/app/globals.css` CSS variables. Never hardcode hex colors or use Tailwind color classes (e.g. `text-green-600`) for semantic states — use `var(--color-success)`, `var(--color-danger)`, etc.

**Radius rule:** only `--radius-sm` (6px) and `--radius-md` (10px) are permitted. Never use `rounded-xl`, `rounded-2xl`, `rounded-3xl`, or any Tailwind radius outside this set.

### Rules A–J (non-negotiable)

**A. At most ONE `<Section variant="card">` per page.** Use `"flush"` (default for lists) or `"bordered"` (secondary groups) for everything else.

**B. No decorative icons.** Icons appear only when they perform a function: button affordance, status indicator, or navigation. When in doubt, remove.

**C. Color is semantic. Gray for zero/neutral.** Color only when it carries meaning. "Won = 0" is gray, not green. "Lost = 0" is gray, not red. Never use `--color-success` or `--color-danger` on zero-value metrics.

**D. List row height: 42–48px max.** Row data = name + 1 line of metadata + actions. Strip any metadata duplicated from the page header or search query.

**E. Headers stand alone.** Don't wrap section headers in cards. Use `<Section variant="flush">`.

**F. State vs action visual distinction.** "In pipeline" with checkmark = state (achieved). "→ Pipeline" = action (do this). State uses `<Pill>`. Action uses `<SecondaryButton>` or `<GhostButton>`.

**G. One primary action per page section.** Secondary/tertiary actions go in `<ActionMenu>`.

**H. No "Back to [parent]" links on primary nav pages** (Dashboard, Opportunities, Discovery, Pipeline, Pitches, Settings).

**I. No uppercase eyebrow text that repeats the sidebar nav label.** Don't write "OPPORTUNITIES" as a section header on the Opportunities page.

**J. Score circles never show "~95".** Use `<ScoreCircle variant="estimated">` (dotted ring) for projections — never tilde-prefix the number.

### Four-state website classification
Website status is always one of: `has_website` · `no_website` · `social_only` · `platform_only` · `unknown`. Classification via `classifyWebsite()` in `src/lib/types.ts`. These map to distinct pitch angles — never collapse them. Display via `<WebsiteStatusPill>`.

### Empty / loading / error copy
- Loading: plain declarative ("Finding contact info…", "Generating pitch…"). No progress jokes.
- Empty: state the condition, suggest the action ("No pitches yet — generate one from any opportunity.").
- Error: plain sentence, no stack traces in UI, no apology ("Failed to load audit results. Retry →").
- Never use "Oops", "Uh oh", "Hmm", or exclamation marks in error or empty states.

---

## 4. Naming Conventions

### Database
- Tables: `snake_case`, plural (`businesses`, `design_analyses`, `ux_analyses`, `places_cache`).
- Columns: `snake_case`. FKs: `<singular>_id` (`business_id`, `user_id`). Timestamps: `<event>_at`.
- Constraints: `<table>_<description>` (`pipeline_business_user_unique`). PK always `id`.

### TypeScript
- Types/interfaces `PascalCase`; functions `camelCase`; config constants `SCREAMING_SNAKE_CASE` (`GEMINI_MODEL`, `BATCH_SIZE`, `MOBILE_VIEWPORT`).
- Route/job log prefix in caps brackets: `[DISCOVER]`, `[AUDIT]`, `[DESIGN]`, `[PITCH]`, `[UX]`, `[RADAR]`.

### API Routes
- `POST` for create/modify. Body keys `camelCase`. Mutation responses always include `success: boolean`; async routes return `{ jobId }`.

### Storage (v2)
- Bucket `recordings`, private. Path: `recordings/<business_id>/<analysis_id>/frame_NN.png`. UI reads via server-generated signed URLs; bucket never public.

### Environment Variables
- Public (browser-safe): `NEXT_PUBLIC_` prefix. Server-only secrets: no prefix.
- Service role: `SUPABASE_SERVICE_ROLE_KEY` — NEVER `NEXT_PUBLIC_`.

---

## 4. When to Start a New Chat / Task

### Claude (claude.ai — this interface)
**For:** planning, architecture, debugging logic, generating prompts, reviewing for correctness.
**Start fresh when:** switching feature/phase · 30+ exchanges in and stale context shows · decisions made mid-chat contradict earlier context · starting any major build session.
**Start well:** paste CLAUDE.md at the top of the new chat.

### Claude Code (VS Code terminal — agentic)
**For:** multi-file changes, surgical edits, shell commands, filesystem work.
**Start fresh when:** each task is complete & verified · after touching many files · it edits the wrong file or loops.
**Start well:** reads CLAUDE.md automatically — keep it current. Always specify `TARGET FILE: src/...` for surgical edits.

### Roo Code (VS Code in-editor)
**For:** single-file / small prompt-driven edits.
**Start fresh when:** each prompt-sized unit is done · it hangs/loops/edits the wrong file (stop immediately, don't fight a confused task) · between numbered build steps.
**Start well:** keep its rules file current; lead with `TARGET FILE: src/path`.

### Universal Rule
**Never rely on a tool remembering across a reset. Rely on the docs.** Docs are persistent memory; chats are disposable working sessions. A fresh session backed by good docs beats a long session with accumulated confusion.

---

## 5. Decisions Log

Append a row whenever a non-obvious decision is made.

| # | Decision | Reasoning | Date |
|---|---|---|---|
| 1 | Two rows per audit (mobile + desktop), not one row with `mobile_*`/`desktop_*` columns | Flexible — query a single strategy, extend strategies later | May 2026 |
| 2 | Global `places_cache` keyed on `place_id` alone (not per-user) | One Place Details call per unique business platform-wide, ever. Hit-rate rises with user base. The data moat. | May 2026 |
| 3 | `places_cache` writes via admin client, no user INSERT policy | Shared global resource — user RLS scoping would defeat the purpose | May 2026 |
| 4 | `analyze-design` (and all analysis) inserts via admin client | Routes derive user_id from session; server `auth.uid()` is null → RLS blocks session-client writes | May 2026 |
| 5 | Separate `GEMINI_API_KEY` from `GOOGLE_PLACES_API_KEY` | Security: one mega-key is a single point of catastrophic failure; separate keys restrict independently | May 2026 |
| 6 | `gemini-2.5-flash` via `x-goog-api-key` header, defined once in `src/lib/gemini.ts` | `gemini-1.5-flash` shut down; `gemini-2.0-flash` deprecated June 2026 — use `gemini-2.5-flash` as the canonical model | June 2026 |
| 7 | Synchronous routes for v1 (no job queue) | Zero cost to build; queue added in v2 with first async feature; thin-wrapper convention makes migration cheap | May 2026 |
| 8 | 5-value website classification (has/no/social/platform/unknown) | Two-value (has/no) produced 100% false positives on social-only businesses; social vs platform are distinct pitch angles | May 2026 |
| 9 | UX/Design + Trust scores from Gemini vision, not PageSpeed | PageSpeed doesn't measure design quality or trust signals — needs visual inspection | May 2026 |
| 10 | SEO score from Lighthouse SEO category (already in PageSpeed) | Free, no extra call — but must explicitly request `&category=seo` | May 2026 |
| 11 | Light theme for UI | Mockup direction is white/indigo; the dark theme was a dev choice, not a product decision | May 2026 |
| 12 | Defer Stripe/credits backend to v2; show credits UI now | Don't build billing before there's something to charge for; "Buy More" → disabled link until then | May 2026 |
| 13 | **UX analysis is a SEPARATE table (`ux_analyses`), not columns on `design_analyses`** | Different artifact: static PNG→text vs recorded session→frame sequence→multi-frame analysis. Different cost, cadence, data shape. | May 2026 |
| 14 | **UX analysis captures a FRAME SEQUENCE, not raw video** | ~8 selected frames give Gemini clearer signal at far lower token cost (~₹1.50 vs ~₹3.75/strategy) and avoid video codec/storage overhead | May 2026 |
| 15 | **UX analysis is QUEUE-ONLY, runs on a persistent worker (Runtime B), never on Vercel** | Playwright needs persistent Chrome + ~500MB RAM + 30–120s; impossible on serverless within the 60s cap | May 2026 |
| 16 | **UX analysis built MOBILE-FIRST (schema supports two-row mobile+desktop)** | Mobile UX failures hurt small businesses most; desktop added later with no migration since schema already has `strategy` | May 2026 |
| 17 | **Design + UX scores stored separately; UI shows one blended number with a "Deep Analysis" split toggle** | Casual users want one clean number; power users want the why. Storing both enables both views; blend computed at read time. | May 2026 |
| 18 | **Worker server, job queue, and Supabase Storage introduced together for UX analysis, then reused by Radar + self-hosted screenshots** | No v2 workload adds a new infrastructure category — they share Runtime B. Cleaner ops, one thing to maintain. | May 2026 |
| 19 | **UX recordings in a PRIVATE Supabase Storage bucket, read via server-generated signed URLs** | Recordings of third-party sites shouldn't be public; signed URLs scope access without a public bucket | May 2026 |
| 20 | **Cost-sensitive model routing deferred (note only): Flash-Lite for analysis, 2.5 Flash for pitches** | Gemini 2.5 Flash output is cost-effective at volume; but don't prematurely optimise — revisit when volume justifies. Model name per call-site makes it a 1-line change. | June 2026 |
| 21 | **`businesses` table includes `flagged_for_outreach` + `outreach_reason` columns for lead scoring** | Enables the dashboard to surface "opportunities" without re-querying website_status each time; set during discover/audit/design | May 2026 |
| 22 | **Discover page persists search results to sessionStorage** | Prevents losing results on accidental navigation/refresh; cache keyed by form state | May 2026 |
| 23 | **Pitch generation returns JSON only, not markdown body** | Cleaner UI rendering; Gemini prompt explicitly requests `{"subject": "...", "body": "..."}` with no fences | May 2026 |
| 24 | **Pipeline uses optimistic updates for status changes** | Status dropdown changes reflect immediately; reverts on API failure with a full refetch | May 2026 |
| 25 | **`business_type` replaces `category` across all tables** | `category` was ambiguous (could mean business type, industry, or website status); `business_type` is explicit | May 2026 |
| 26 | **Separate Discover and Leads pages** | Discover is the search/ingestion workflow; Leads is the persistent review/analysis workspace. Different UX needs. | May 2026 |
| 27 | **jsPDF for PDF generation (not Puppeteer/Playwright)** | Server-side in Vercel without Chrome dependency; lightweight, fast, sufficient for v1 report format | May 2026 |
| 28 | **NDJSON streaming for long-running routes** | `/api/discover`, `/api/audit`, `/api/analyze-design` all stream NDJSON lines. Client reads with `response.body.getReader()`. Progress steps make waits feel intentional. Error responses (400/500) still return regular JSON. | May 2026 |
| 29 | **3 parallel Nearby Search queries per discover run** | Keyword + keyword+type + 1.5×radius. Results deduped by `place_id`. Yields 120–180 unique businesses vs ~60 before. `Promise.allSettled` ensures one failing query doesn't kill the others. | May 2026 |
| 30 | **Audit + design analysis have 7-day DB cache** | Checks `audits`/`design_analyses` for fresh mobile+desktop rows before calling external APIs. `force: true` bypasses cache. Cache hit returns regular JSON immediately (not stream). Saves API costs on repeated analyses. | May 2026 |
| 31 | **Progress panels replace spinners for audit/design on discover page** | Named steps (✓ completed, ⟳ current pulsing, ○ pending) instead of a generic spinner. Error state shows Retry link. Reduces perceived wait time during 30–60s operations. | May 2026 |
| 32 | **`BUSINESS_TYPE_TO_PLACES_TYPE` mapping in discover route** | Maps all 72 Nearsited business_type values to Google Places supported types. Falls back gracefully (skips type param) if no mapping exists. | May 2026 |
| 33 | **Pipeline status in Lead Detail header is a `<select>` dropdown with human-readable labels, not a raw span** | Raw enum values (`new_lead`) shown to users is a UX bug. `PIPELINE_LABELS` map converts to "New Lead" etc. Local state for optimistic updates; PATCH /api/pipeline on change. | May 2026 |
| 34 | **Mobile/Desktop toggle in Lead Detail drives all score computations (`activeAudit`, `activeDesign`)** | `screenshotStrategy` state now selects which audit/design row is used for perfScore, seoScore, criteria — Score Breakdown updates reactively. Previously both views showed the same scores. | May 2026 |
| 35 | **`METRIC_META` config (Lead Detail + Audit page) for Core Web Vitals display** | Each CWV metric has: full label, subtitle, thresholds [good, warn], `toCanonical()` parser. `metricColor()` derives green/amber/red. Pattern defined in both files; extract to shared lib if a third file needs it. Google CWV thresholds: FCP <1.8s/<3s, LCP <2.5s/<4s, TBT <200ms/<600ms, CLS <0.1/<0.25. | May 2026 |
| 36 | **"Send Pitch" renamed to "Copy Pitch" (clipboard only, v1)** | "Send" implies email delivery which isn't built in v1. "Copy Pitch" is honest. Copies `pitchResult.body` via `navigator.clipboard.writeText`. Shows "Generate a pitch first" toast if no pitch generated yet. | May 2026 |
| 37 | **Share Link = copy current page URL, not /api/share** | `/api/share` returned nothing. For v1, `window.location.href` is immediately useful as a share link even without a public share page. Copied to clipboard + "Link copied to clipboard" toast. | May 2026 |
| 38 | **First audit auto-adds business to pipeline with status "analysed"** | Removes a manual friction step. Triggered in `handleRunAudit` when `!biz.audited_at && !currentPipelineStatus`. PATCHes /api/pipeline, updates local state, shows toast. | May 2026 |
| 39 | **Toast system for Lead Detail (fixed bottom-right, 3s auto-dismiss)** | Consistent transient feedback for: pitch copied, link copied, added to pipeline, re-analysis complete/failed, audit/design errors. `showToast(msg)` callback with `setTimeout` clear. | May 2026 |
| 40 | **Pitch generation sends `lead_type: biz.website_status` to /api/pitch** | The pitch API branches angle by lead_type; without it, the route couldn't select the right pitch frame. Added along with `console.log` before/after for debugging failures. | May 2026 |
| 41 | **Quick Site Audit renamed from "AI Audit"** | "Quick Site Audit" is more descriptive and accurately sets time expectations ("under 2 minutes"). Matches the subtitle copy update. Page route unchanged (`/dashboard/audit`). | May 2026 |
| 42 | **AI Audit progress tracker stays visible after completion (all green)** | Immediate disappearing after completion removes the confirmation that everything ran. All-green checklist acts as a clear "done" state before scrolling to results. | May 2026 |
| 43 | **AI Audit results persist in sessionStorage keyed `'ai_audit_last_result'`** | Navigating away and back loses results. sessionStorage survives tab navigation. Cleared on new run, restored on mount. `timeAgo()` helper shows staleness. Timestamp captured in local variable (not state) to avoid async state-read inside the run handler. | May 2026 |
| 44 | **Audit "complete" step mapped to `"audit_complete"`, design "complete" to `"design_complete"`** | Both `/api/audit` and `/api/analyze-design` stream `{step:"complete"}` at the end of their respective phases. Without remapping, both would write to the same key and the checklist couldn't distinguish them. | May 2026 |
| 45 | **"Run Audit" / "Run Design Analysis" buttons on Lead Detail Overview when analysis is missing** | Users shouldn't need to return to the Leads list to trigger a missing analysis. Buttons appear conditionally: "Run Audit" if `!biz.audited_at`, "Run Design Analysis" if `!biz.design_analyzed_at` (and website exists). | May 2026 |
| 46 | **Per-channel pitch body state: `Record<channel, string \| null>` not `useState`** | Switching channels was leaking one channel's edited draft into the other. A `Record<OutreachChannel, string \| null>` keyed state with `editedBody = editedBodies[outreachChannel] ?? null` derives the correct value without `useEffect`. Avoids the setState-in-useEffect linter error entirely. | June 2026 |
| 47 | **`onCloseRef` pattern for dialog keyboard listeners** | `useEffect` keyboard trap needs `onClose` but a direct closure goes stale. Solution: `const onCloseRef = useRef(onClose)` + `useEffect(() => { onCloseRef.current = onClose; })` (no deps — runs after every render). The trap calls `onCloseRef.current()`. Avoids stale closure without triggering "cannot access refs during render" linter error. | June 2026 |
| 48 | **`useId()` for SVG filter IDs in `ScoreRing`** | Multiple `<ScoreRing>` instances shared `id="glow-opp"` etc. — SVG filter ID collisions caused rendering artefacts. `const uid = useId().replace(/:/g, "-"); const filterId = \`glow-\${uid}\`` gives each instance a unique DOM ID. React 18 built-in, no library needed. | June 2026 |
| 49 | **Toast position `bottom-20 right-4 sm:bottom-6 sm:right-6`** | Dashboard has a `lg:hidden` fixed mobile bottom nav (~56px). `bottom-6` (24px) was obscured by it. `bottom-20` (80px) clears the nav on small screens; reverts to `bottom-6` at `sm+` breakpoint. | June 2026 |
| 50 | **WCAG AA: `--text-tertiary` raised from `#7a7268` to `#8a8278`** | Original `#7a7268` on `#0a0e12` was ~3.8:1 contrast (fails WCAG AA 4.5:1 for normal text). Raised to `#8a8278` → ~4.6:1. Affects labels, metadata, placeholders across every page. | June 2026 |
| 51 | **`PitchToneConfig` bridge: composite config object + `useCallback` dispatcher** | `usePitchGeneration` returns individual state setters (`setPitchTone`, `setPitchLength`, etc.); `PitchCard` takes a single `PitchToneConfig` object + `setPitchConfig(config)`. Bridge: compute config inline from individual state values; `useCallback` setter dispatches to all five setters. Destructure individual setters before the callback to satisfy eslint dependency array without referencing the hook object. | June 2026 |
| 52 | **`buildPreCallBriefSections()` replaces `buildClientCallSummary()`** | Em-dash text-wall summaries were unreadable in practice. Structured HOOK/PAIN/SCOPE/OBJECTION blocks from real data (perf scores, rating/review count, top issue titles) give the agency rep a scannable, rehearsable call guide. Hook leads with social proof (rating+reviews) when available; falls back to score-based copy. | June 2026 |
| 53 | **`AIQuotaBanner` type-differentiates Gemini API 429 from user credit errors** | `QuotaErrorBanner` showed the same message for both. Gemini 429 = API rate limit (wait + retry), user credit exhaustion = different CTA (upgrade). `isGeminiQuota: true` switches to countdown + auto-retry + Flash-Lite fallback. `retryCount` prop tracks attempts to suppress auto-retry on 2nd failure. | June 2026 |
| 54 | **`LeadHeaderStrip` unifies header across all three lead workflows** | Website / Social-only / No-digital-presence each had their own header implementation with drift between them. A single shared component with `badge?` + `extraActions?` slots covers all three cases. Eliminates the "Opportunity Details" uppercase eyebrow (Rule I) and the standalone star-block; rating merged into one-line meta string. | June 2026 |
| 55 | **Pitches page filter counts always shown (even when zero)** | Previously hidden with `{count > 0 && <span>({count})</span>}`. Users couldn't distinguish "this filter has 0 matches" from "this filter has no count concept". Counts now always render at 10px/70% opacity; zero is informative, not noisy. | June 2026 |

---

*End of Conventions · Append to the Decisions Log as the project evolves.*
