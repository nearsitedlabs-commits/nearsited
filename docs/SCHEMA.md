# Nearsited — Database Schema (Authoritative)
**Version:** 3.2 · **Date:** June 2026 · **Database:** Supabase / PostgreSQL 15 + Supabase Storage

---

> ## ⚠️ THE CARDINAL RULE
> **This document is the single source of truth for the database. Read it before writing any code that touches a table. Update it in the same commit as any schema change.**
>
> Every "column does not exist" error this project has hit came from code written against a schema that didn't match reality. A schema doc that drifts is worse than none — it lies with authority. The discipline is: **edit this file → run the SQL → write the code.** In that order, every time.

---

## 0. How To Use This Document

| If you are about to... | Do this first |
|---|---|
| Write an INSERT/UPDATE/SELECT | Find the table in §2, confirm exact column names and types |
| Add a column | Add it to §2 here, write the `ALTER TABLE` in §5, run it, then code |
| Use a status/enum value | Copy it verbatim from §3. Never invent or abbreviate |
| Write to a table from an API route | Check §4 — most writes require the **admin client** |
| Touch `businesses` for the first time | Confirm columns are clean (migrations may need running) |
| Run schema migrations | Use [`scripts/run-migrations.mjs`](nearsited/scripts/run-migrations.mjs) OR paste SQL from [`scripts/migrate.sql`](nearsited/scripts/migrate.sql) into Supabase SQL Editor |
| Build UX analysis (v2) | Read §2.6 (`ux_analyses`) + §6 (Supabase Storage) — it is queue-only, mobile-first |

---

## 1. Table Inventory

| Table | Purpose | Scope | Write Client | Build Status |
|---|---|---|---|---|
| `profiles` | User identity (mirrors `auth.users`) | Per-user | session | ✅ Live |
| `businesses` | Discovered leads | Per-user | session (discover) | ✅ Live — cleanup done (see §5.1) |
| `places_cache` | Global website-detection cache | **Shared** | **admin** | ✅ Live |
| `audits` | PageSpeed performance results | Per-user | **admin** | ✅ Live — `seo_score` added |
| `design_analyses` | Gemini vision *static* design results | Per-user | **admin** | ✅ Live |
| `ux_analyses` | Playwright + Gemini *interaction* results | Per-user | **admin** | 🔵 V2 — new table |
| `pipeline` | Lead funnel tracking | Per-user | session | ✅ Live — stages realigned |
| `pitches` | Generated outreach emails | Per-user | **admin** | ✅ Live — columns + RLS fixed |
| `mockups` | AI redesign HTML (v2) | Per-user | **admin** | 💤 Dormant — RLS fixed |
| `subscriptions` | Stripe billing (v2) | Per-user | session | 💤 Dormant |
| `share_links` | Public share tokens for leads | Per-user | **admin** (insert), anon (select) | ✅ Live — §2.12, §5.10 |
| `territories` | Saved search alerts (v2) | Per-user | session | ✅ Live — column renamed |

**Storage buckets (Supabase Storage):**

| Bucket | Purpose | Status |
|---|---|---|
| `recordings` | UX interaction frame sequences (PNG) per analysis | 🔵 V2 — create when building UX analysis |

**Foreign-key topology:** every table's `user_id` → `profiles.id`; every lead-linked table's `business_id` → `businesses.id`. All FKs are `ON DELETE CASCADE`.

---

## 2. Table Definitions (Current State)

### 2.1 `profiles`
Mirror of Supabase auth users. One row per registered user, created on signup (typically via a trigger on `auth.users`).

```sql
create table public.profiles (
  id         uuid primary key,              -- equals auth.users.id (NOT auto-generated)
  email      text,
  full_name  text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
create policy "users read/update own profile" on public.profiles
  for all to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
```
`id` is NOT defaulted — it must equal the auth user's id.

---

### 2.2 `businesses`  ← core table (current, after cleanup + additions)
One row per discovered business **per user**. The same physical café discovered by two users → two rows (different `user_id`), but one `places_cache` row. Headline scores are denormalised here for fast list rendering; per-strategy detail lives in `audits` / `design_analyses` / `ux_analyses`.

```sql
create table public.businesses (
  id                  uuid primary key default extensions.uuid_generate_v4(),
  user_id             uuid references public.profiles(id) on delete cascade,

  -- Identity
  name                text,
  place_id            text,            -- Google Places place_id (also the places_cache key)
  business_type       text,            -- searched type, e.g. "Florist" — used for pitch context
  address             text,
  city                text,

  -- Contact
  phone               text,
  website             text,            -- canonical URL from Place Details

  -- Classification (allowed values: §3.1)
  website_status      text,

  -- Google ratings
  rating              numeric,
  review_count        integer,

  -- Denormalised headline scores (updated by analysis routes)
  performance_score   numeric,         -- PageSpeed DESKTOP performance, 0–100
  design_score        integer,         -- Gemini MOBILE design score, 0–100
  ux_score            integer,         -- Playwright+Gemini MOBILE UX score, 0–100 (v2, nullable)
  opportunity_score   integer,         -- Combined weakness×viability score, 0–100

  -- Outreach flags
  flagged_for_outreach boolean default false,
  outreach_reason     text,            -- reason for flagging: website_status value or score-based

  -- Lifecycle timestamps
  discovered_at       timestamptz default now(),
  audited_at          timestamptz,     -- last performance audit
  design_analyzed_at  timestamptz,     -- last static design analysis
  ux_analyzed_at      timestamptz,     -- last interaction/UX analysis (v2)

  constraint businesses_place_user_unique unique (place_id, user_id)
);

alter table public.businesses enable row level security;
create policy "users manage own businesses" on public.businesses
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
```

**Current column set (23 columns):**
`id, user_id, name, place_id, business_type, address, city, phone, website, website_status, rating, review_count, performance_score, design_score, ux_score, opportunity_score, flagged_for_outreach, outreach_reason, discovered_at, audited_at, design_analyzed_at, ux_analyzed_at` + the unique constraint.

> `ux_score` and `ux_analyzed_at` are nullable v2 columns — added now (§5.7) so the schema is stable, even though the UX feature is built later. Cheaper than a migration mid-build.

**Columns dropped (orphans — §5.1):** `website_url`, `gmb_place_id`, `gmb_rating`, `gmb_review_count`, `category`, `website_type` (+ CHECK), `country`, `cached_at`.

> **Why dangerous, not just untidy:** `website_url` beside `website` invites code to write the wrong one. The `website_type` CHECK (`'none'|'social'|'link-in-bio'|'real-weak'|'real-decent'`) is a *third* competing classification vocabulary — if any code writes a `website_status` value into it, the INSERT throws.

---

### 2.3 `places_cache`  ← shared, cost-controlling
**NOT per-user.** One row per unique Google `place_id`, platform-wide, forever (90-day staleness refresh). A `place_id` enriched by *any* user's search serves *every* future search for free.

```sql
create table public.places_cache (
  place_id           text primary key,
  website            text,
  website_status     text,            -- §3.1
  details_fetched_at timestamptz default now()
);

alter table public.places_cache enable row level security;

-- READ: any authenticated user reads the whole cache (the entire point)
create policy "authenticated read places_cache" on public.places_cache
  for select to authenticated using (true);

-- WRITE: intentionally NO policy. Writes only via service-role admin client (bypasses RLS).
-- Its absence IS the security model. Do not add a write policy.
```
**Read:** one batched `SELECT … WHERE place_id IN (...)` per discovery run.
**Write:** `adminClient.from('places_cache').upsert({...}, { onConflict:'place_id' })`.
**Staleness:** refetch Place Details if older than 90 days.

---

### 2.4 `audits`  ← two rows per run (mobile + desktop)
Google PageSpeed Insights output. Written via **admin client** (RLS blocks server-side inserts whose `auth.uid()` is null).

```sql
create table public.audits (
  id                uuid primary key default extensions.uuid_generate_v4(),
  business_id       uuid references public.businesses(id) on delete cascade,
  user_id           uuid references public.profiles(id)  on delete cascade,

  strategy          text not null check (strategy in ('mobile','desktop')),

  performance_score integer check (performance_score between 0 and 100),
  seo_score         integer check (seo_score between 0 and 100),   -- requires ?category=seo (§7)

  fcp               text,   -- First Contentful Paint  (e.g. "1.7 s")
  lcp               text,   -- Largest Contentful Paint
  tbt               text,   -- Total Blocking Time
  cls               text,   -- Cumulative Layout Shift

  has_ssl           boolean, -- derived from website URL (https:// → true)

  audit_data        jsonb,  -- trimmed Lighthouse payload (categories + key audits)

  created_at        timestamptz default now()
);

alter table public.audits enable row level security;
create policy "users manage own audits" on public.audits
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
```

---

### 2.5 `design_analyses`  ← two rows per run (STATIC visual)
Gemini 3.5 Flash vision on **static screenshots** (above-the-fold render). Distinct from `ux_analyses`, which analyses **interaction**. Written via **admin client**. The `issues` JSON powers pitches, PDF reports, and the Lead Detail panel — keep it structured.

```sql
create table public.design_analyses (
  id              uuid primary key default extensions.uuid_generate_v4(),
  business_id     uuid references public.businesses(id) on delete cascade,
  user_id         uuid references public.profiles(id)  on delete cascade,

  strategy        text not null check (strategy in ('mobile','desktop')),

  design_score    integer check (design_score between 0 and 100),

  criteria_scores jsonb,   -- { modernity, readability, cta, hierarchy, trust } each 1–10
  issues          jsonb,   -- [ { title, detail, point_deduction:int, impact:"High"|"Medium"|"Low" } ]
  screenshot_url  text,    -- provider URL if retained, else null
  raw_analysis    jsonb,   -- full parsed model response

  analyzed_at     timestamptz default now()
);

alter table public.design_analyses enable row level security;
create policy "users manage own design analyses" on public.design_analyses
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
```
> **Lesson encoded:** inserts here silently failed in dev (`42501: row violates RLS`) because the route used the session client (null `auth.uid()` server-side) and still returned 200. **Fix: admin client for inserts AND the `businesses` headline-score update.** See §4, CONVENTIONS §2.6.

JSON shapes: §8.

---

### 2.6 `ux_analyses`  ← V2 · two-row design, build MOBILE-FIRST
**Separate table by deliberate decision.** A design analysis is *one static PNG → Gemini text*. A UX analysis is *a recorded Playwright interaction session → a sequence of frames in Storage → Gemini multi-frame analysis of behaviour* (scroll experience, CTA flow, form behaviour, animation feedback, navigation clarity). Different artifact, different cost, different cadence — so it gets its own table rather than overloading `design_analyses`.

**Two-row design** (`strategy` mobile/desktop) for parity with audits/design. **Build mobile-only first** (mobile UX failures hurt small businesses most); the schema already accommodates desktop when you add it — no migration needed.

```sql
create table public.ux_analyses (
  id              uuid primary key default extensions.uuid_generate_v4(),
  business_id     uuid references public.businesses(id) on delete cascade,
  user_id         uuid references public.profiles(id)  on delete cascade,

  strategy        text not null check (strategy in ('mobile','desktop')),

  ux_score        integer check (ux_score between 0 and 100),

  -- Per-criterion UX scores (1–10), DISTINCT from design criteria:
  -- { navigation, cta_flow, form_experience, interaction_feedback, scroll_experience }
  criteria_scores jsonb,

  -- UX issues found during the recorded session
  -- [ { title, detail, point_deduction:int, impact:"High"|"Medium"|"Low" } ]
  issues          jsonb,

  -- Interaction map: what Playwright actually did and what happened
  -- [ { action:"scroll"|"click"|"fill_form", target:string, observed:string } ]
  interactions    jsonb,

  -- Storage references to the captured frame sequence (Supabase Storage `recordings` bucket)
  -- [ "recordings/<business_id>/<analysis_id>/frame_01.png", ... ]
  frame_paths     jsonb,
  recording_url   text,    -- optional combined GIF/MP4 path if generated, else null

  raw_analysis    jsonb,   -- full parsed Gemini response

  analyzed_at     timestamptz default now()
);

alter table public.ux_analyses enable row level security;
create policy "users manage own ux analyses" on public.ux_analyses
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
```

**Critical architectural facts (detailed in ARCHITECTURE.md §10):**
- Written **only from a queue job**, never a synchronous API route — a Playwright session takes 30–120s.
- Playwright runs on a **persistent server** (Railway/Render/Fly.io), NOT Vercel serverless.
- Frames captured by Playwright → uploaded to Supabase Storage `recordings` bucket → frame *paths* stored here → Gemini analyses the frame sequence (NOT raw video — frame sequence is cheaper and clearer; see decision in CONVENTIONS).
- Write client: **admin** (same RLS reasoning as audits/design).

**UX score merge behaviour (product decision):** The UI shows a single blended quality number by default; a "Deep Analysis" toggle reveals Design vs UX split. Both scores are stored separately (`businesses.design_score`, `businesses.ux_score`); the blend is computed at read time (§9), not stored.

JSON shapes: §8.

---

### 2.7 `pipeline`  ← lead funnel
Status realigned for v1 (§3.2). Legacy `stage` column dropped.

```sql
create table public.pipeline (
  id          uuid primary key default extensions.uuid_generate_v4(),
  business_id uuid references public.businesses(id) on delete cascade,
  user_id     uuid references public.profiles(id)  on delete cascade,

  status      text default 'new_lead',   -- §3.2 canonical
  notes       text,

  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),

  constraint pipeline_business_user_unique unique (business_id, user_id),
  constraint pipeline_status_check check (status in (
    'new_lead','analysed','pitch_generated','contacted','in_conversation','won','lost'
  ))
);

alter table public.pipeline enable row level security;
create policy "users manage own pipeline" on public.pipeline
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
```

---

### 2.8 `pitches`
Metadata columns added, RLS confirmed.

```sql
create table public.pitches (
  id           uuid primary key default extensions.uuid_generate_v4(),
  business_id  uuid references public.businesses(id) on delete cascade,
  user_id      uuid references public.profiles(id)  on delete cascade,

  subject      text,
  body         text,

  tone         text,                       -- §3.4: professional | friendly | luxury
  lead_type    text,                       -- website_status snapshot at generation (§3.1)
  pitch_status text default 'draft',       -- §3.6: draft | sent | replied

  created_at   timestamptz default now()
);

alter table public.pitches enable row level security;
create policy "users manage own pitches" on public.pitches
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
```
Storing `lead_type` records *why* an angle was chosen — useful for conversion analysis later.

---

### 2.9 `mockups` (v2 — dormant)
Stub for AI redesign HTML. RLS fixed in §5.4.
```sql
create table public.mockups (
  id          uuid primary key default extensions.uuid_generate_v4(),
  business_id uuid references public.businesses(id) on delete cascade,
  user_id     uuid references public.profiles(id)  on delete cascade,
  html_content text,
  preview_url  text,
  created_at   timestamptz default now()
);
```

### 2.10 `subscriptions` (v2 — dormant)
Stripe scaffold. Credits UI reads a placeholder until wired. `tier`: `free | starter | pro | agency`.
```sql
create table public.subscriptions (
  id                     uuid primary key default extensions.uuid_generate_v4(),
  user_id                uuid references public.profiles(id) on delete cascade,
  stripe_customer_id     text,
  stripe_subscription_id text,
  tier                   text,
  credits_discovery      integer,
  credits_mockup         integer,
  credits_reset_at       timestamptz,
  created_at             timestamptz default now()
);
```

### 2.12 `share_links` — public read-only URLs for leads

One row per share link. Tokens are random UUIDs, making the URL effectively unguessable. The public page (`/share/[token]`) selects with no auth — anyone with the link can view. Writes happen via the **admin client** (server-side, authenticated user must own the business).

```sql
create table public.share_links (
  id          uuid primary key default extensions.uuid_generate_v4(),
  business_id uuid references public.businesses(id) on delete cascade,
  user_id     uuid references public.profiles(id) on delete cascade,
  token       text not null unique,
  created_at  timestamptz default now(),
  expires_at  timestamptz                         -- optional expiry, null = never expires
);

alter table public.share_links enable row level security;

-- PUBLIC read: anyone with the link can view (no auth required)
create policy "public read share_links by token" on public.share_links
  for select to anon, authenticated
  using (true);

create index if not exists share_links_token_idx on public.share_links (token);
```

**Write flow:** `POST /api/share` verifies auth, checks business ownership, generates `crypto.randomUUID()` token, inserts via admin client, returns `{ token, url }`.

**Security model:** The token IS the authorization — it's a 128-bit random UUID. No additional auth needed for reads. Optional `expires_at` for time-bombed links (future enhancement).

---

### 2.13 `territories` (v2 — dormant + live for saved searches)
Saved search alerts (basis of v2 Radar). Column renamed from `category` to `business_type`. Used live by `/api/saved-searches`.
```sql
create table public.territories (
  id              uuid primary key default extensions.uuid_generate_v4(),
  user_id         uuid references public.profiles(id) on delete cascade,
  name            text,
  city            text,
  business_type   text,            -- renamed from `category`
  last_scanned_at timestamptz,
  alert_enabled   boolean,
  created_at      timestamptz default now()
);
```

---

## 3. Canonical Enums (Copy Verbatim — Never Invent)

> Single source of truth. Matching TypeScript lives in `src/lib/types.ts`. Add a value → change BOTH + every consumer. Mismatched vocabularies were the #1 bug source.

### 3.1 `website_status`
`businesses.website_status`, `places_cache.website_status`, snapshotted into `pitches.lead_type`.
```ts
type WebsiteStatus =
  | "has_website" | "no_website" | "social_only" | "platform_only" | "unknown";
```
**Banned anywhere:** `good`, `weak`, `none`, `poor`, `real-weak`, `real-decent`, `link-in-bio`, `social`, `"has website"`/`"no website"` (spaces).

### 3.2 `pipeline.status`
```ts
type PipelineStatus =
  | "new_lead" | "analysed" | "pitch_generated"
  | "contacted" | "in_conversation" | "won" | "lost";
```
Migrated from: `prospect→new_lead`, `interested→analysed`, `closed→won`, `rejected→lost`, `contacted→contacted`. Legacy `stage` column dropped.

### 3.3 `strategy`  (audits, design_analyses, ux_analyses)
```ts
type Strategy = "mobile" | "desktop";
```

### 3.4 `pitches.tone`
```ts
type PitchTone = "professional" | "friendly" | "luxury";
```

### 3.5 `issues[].impact`  (design_analyses + ux_analyses)
```ts
type ImpactLevel = "High" | "Medium" | "Low";
```

### 3.6 `pitches.pitch_status`
```ts
type PitchStatus = "draft" | "sent" | "replied";
```

### 3.7 `ux_analyses.interactions[].action`  (v2)
```ts
type UxAction = "scroll" | "click" | "fill_form" | "hover" | "navigate";
```

---

## 4. Which Client Writes Where

| Operation | Client | Reason |
|---|---|---|
| `auth.getUser()` in any API route | **server** | Reads session cookie to identify user |
| `businesses` upsert in `/api/discover` | server | Runs with a real user cookie; RLS satisfied |
| `places_cache` read | server or admin | RLS allows any authenticated read |
| `places_cache` write | **admin** | No write policy; only service role writes |
| `audits` insert | **admin** | Server-side; `auth.uid()` null → RLS blocks |
| `design_analyses` insert | **admin** | Same |
| `ux_analyses` insert (queue job) | **admin** | Same — and runs in a queue worker with no user session at all |
| `businesses` score UPDATE (from analysis routes/jobs) | **admin** | Same; row matched by `id`, RLS would 0-match otherwise |
| `pitches` insert | **admin** | Same |
| `pipeline` insert/update | **session** | Runs with real user cookie; RLS satisfied |
| `share_links` insert | **admin** | Server-side; `auth.uid()` null |
| `saved-searches` (territories) CRUD | **session** | Session cookie, RLS-safe |
| Reads in a client component | **browser** | Runs with user session, RLS enforced |
| Supabase Storage upload (frames) | **admin** | Queue worker, server-side |

**Rule of thumb:** *auth check = server client; every server-side write = admin client; client-component reads = browser client.* Never import the admin client into browser code — it carries the service-role key.

---

## 5. Migrations (Run In This Exact Order)

> Migration SQL is available in [`scripts/migrate.sql`](scripts/migrate.sql) and can be run automatically via [`scripts/run-migrations.mjs`](scripts/run-migrations.mjs) (supports direct PostgreSQL connection or Management API fallback). Alternatively, paste each block below into the Supabase SQL Editor in order.

### 5.1 — Businesses cleanup (RUN FIRST)
```sql
alter table public.businesses drop constraint if exists businesses_website_type_check;
alter table public.businesses
  drop column if exists website_url,
  drop column if exists gmb_place_id,
  drop column if exists gmb_rating,
  drop column if exists gmb_review_count,
  drop column if exists category,
  drop column if exists website_type,
  drop column if exists country,
  drop column if exists cached_at;
```

### 5.2 — Add SEO score to audits
```sql
alter table public.audits add column if not exists seo_score integer;
```

### 5.3 — Add pitch metadata
```sql
alter table public.pitches
  add column if not exists tone text,
  add column if not exists lead_type text,
  add column if not exists pitch_status text default 'draft';
```

### 5.4 — Ensure RLS on pitches and mockups
```sql
alter table public.pitches enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='pitches' and policyname='users manage own pitches') then
    create policy "users manage own pitches" on public.pitches
      for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
end $$;

alter table public.mockups enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='mockups' and policyname='users manage own mockups') then
    create policy "users manage own mockups" on public.mockups
      for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
end $$;
```

### 5.5 — Realign pipeline stages
```sql
alter table public.pipeline drop constraint if exists pipeline_stage_check;
alter table public.pipeline drop constraint if exists pipeline_status_check;
alter table public.pipeline add constraint pipeline_status_check check (status in (
  'new_lead','analysed','pitch_generated','contacted','in_conversation','won','lost'));

update public.pipeline set status='new_lead'  where status='prospect';
update public.pipeline set status='analysed'  where status='interested';
update public.pipeline set status='won'       where status='closed';
update public.pipeline set status='lost'      where status='rejected';
update public.pipeline set status='new_lead'  where status is null;

alter table public.pipeline drop column if exists stage;
```

### 5.6 — Territories column rename
```sql
alter table public.territories rename column category to business_type;
```

### 5.7 — Businesses UX columns (add now, build later)
```sql
alter table public.businesses
  add column if not exists ux_score integer,
  add column if not exists ux_analyzed_at timestamptz;
```

### 5.8 — Create share_links table
```sql
create table if not exists public.share_links (
  id          uuid primary key default extensions.uuid_generate_v4(),
  business_id uuid references public.businesses(id) on delete cascade,
  user_id     uuid references public.profiles(id) on delete cascade,
  token       text not null unique,
  created_at  timestamptz default now(),
  expires_at  timestamptz
);

alter table public.share_links enable row level security;

create policy "public read share_links by token" on public.share_links
  for select to anon, authenticated
  using (true);

create index if not exists share_links_token_idx on public.share_links (token);
```

### 5.10 — Create ux_analyses table (V2 — run when building UX feature)
Full `CREATE TABLE` is in §2.6. Run it, plus its RLS policy, when starting the UX feature.

### 5.11 — Create Supabase Storage bucket (V2)
In Supabase dashboard → Storage → New bucket: name `recordings`, **private** (not public). Then add policies so only the owning user can read their recordings and only the service role writes:
```sql
-- Storage RLS (run in SQL editor after creating the bucket)
-- READ: a user may read objects whose path starts with their data
-- (path convention: recordings/<business_id>/<analysis_id>/frame_NN.png)
-- For v2, simplest secure default: authenticated users read recordings linked to
-- businesses they own. Implement via a signed-URL flow from the server instead of
-- broad public read. Writes happen via the admin/service-role client only.
```
Use **signed URLs** generated server-side to show frames in the UI — do not make the bucket public.

> **Note on `flagged_for_outreach` and `outreach_reason`:** These columns were added directly by the API routes during development and may not have explicit migration SQL in this section. They were added as part of the businesses table via application-level ALTER TABLE (e.g., `alter table public.businesses add column if not exists flagged_for_outreach boolean default false;`). If they do not exist, add them manually.

---

## 6. Supabase Storage (V2 — UX Recordings)

| Aspect | Decision |
|---|---|
| Bucket | `recordings`, **private** |
| Path convention | `recordings/<business_id>/<analysis_id>/frame_01.png` … `frame_NN.png` |
| Writer | Playwright queue worker, via **admin/service-role** client |
| Reader | Server generates **signed URLs** (short TTL) for the UI; bucket is never public |
| Free tier | Supabase free includes 1GB storage — ample for early use (each frame ~100–300KB, ~8 frames/analysis ≈ 2MB/analysis) |
| Cleanup | Optional: delete frames older than N days, or keep only latest analysis per business to bound storage |

At ~2MB per analysis, 1GB free tier ≈ 500 UX analyses stored. Add a retention/cleanup job before this becomes a constraint.

---

## 7. PageSpeed: Getting SEO (Implementation Note)

PageSpeed defaults to **performance only**. To populate `audits.seo_score` you MUST request the category explicitly (repeatable param):
```
GET https://www.googleapis.com/pagespeedonline/v5/runPagespeed
      ?url=<site>&strategy=mobile&category=performance&category=seo&key=<GOOGLE_PLACES_API_KEY>
```
✅ Both categories are now always requested in [`src/app/api/audit/route.ts`](nearsited/src/app/api/audit/route.ts:43-44).

Extraction:
```ts
const lh = data.lighthouseResult;
const performance_score = Math.round((lh.categories.performance?.score ?? 0) * 100);
const seo_score         = Math.round((lh.categories.seo?.score ?? 0) * 100);
const fcp = lh.audits['first-contentful-paint']?.displayValue ?? '';
const lcp = lh.audits['largest-contentful-paint']?.displayValue ?? '';
const tbt = lh.audits['total-blocking-time']?.displayValue ?? '';
const cls = lh.audits['cumulative-layout-shift']?.displayValue ?? '';
```
Run mobile + desktop concurrently (`Promise.allSettled`), each 60s AbortController timeout.

---

## 8. JSON Column Shapes

### `design_analyses.issues` / `ux_analyses.issues`
```json
[ { "title": "Weak mobile experience",
    "detail": "Tap targets are small and content overflows the viewport on phones.",
    "point_deduction": 18, "impact": "High" } ]
```
`point_deduction` = model estimate of points removed from a theoretical 100. Projection = `min(95, score + sum(top3 deductions))`.

### `design_analyses.criteria_scores`
```json
{ "modernity": 3, "readability": 5, "cta": 6, "hierarchy": 3, "trust": 4 }
```
UX/Design score = `round((modernity+readability+cta+hierarchy)/4 × 10)`; Trust = `trust × 10`.

### `ux_analyses.criteria_scores`  (DISTINCT criteria)
```json
{ "navigation": 6, "cta_flow": 4, "form_experience": 3, "interaction_feedback": 5, "scroll_experience": 7 }
```
UX score = `round((navigation + cta_flow + form_experience + interaction_feedback + scroll_experience)/5 × 10)`.

### `ux_analyses.interactions`
```json
[ { "action": "scroll", "target": "full page", "observed": "Hero image lazy-loads late; layout shifts as content appears." },
  { "action": "click", "target": "Book Appointment CTA", "observed": "Opens an external booking platform in a new tab with no loading feedback." },
  { "action": "fill_form", "target": "Contact form", "observed": "No inline validation; submitting empty reloads the page with no error message." } ]
```

### `ux_analyses.frame_paths`
```json
[ "recordings/<business_id>/<analysis_id>/frame_01.png",
  "recordings/<business_id>/<analysis_id>/frame_02.png" ]
```

### `audits.audit_data`
Trimmed Lighthouse object, not the raw ~500KB:
```json
{ "categories": { "performance": { "score": 0.47 }, "seo": { "score": 0.58 } },
  "audits": { "first-contentful-paint": { "displayValue": "1.7 s" },
              "largest-contentful-paint": { "displayValue": "8.4 s" },
              "total-blocking-time": { "displayValue": "70 ms" },
              "cumulative-layout-shift": { "displayValue": "0.767" } } }
```

---

## 9. The Score Model (Where Every Number Comes From)

**Six core scores (v1):**

| Score | Source | Strategy | Formula |
|---|---|---|---|
| Performance | PageSpeed | desktop | `categories.performance.score × 100` |
| SEO | PageSpeed | desktop | `categories.seo.score × 100` (needs `category=seo`) |
| Mobile | PageSpeed | mobile | `categories.performance.score × 100` |
| UX/Design | Gemini vision | mobile | `(modernity+readability+cta+hierarchy)/4 × 10` |
| Trust | Gemini vision | mobile | `trust × 10` |
| **Overall** | computed | — | `perf·0.25 + seo·0.15 + mobile·0.25 + uxdesign·0.20 + trust·0.15` |

**Seventh score (v2 — UX interaction):**

| Score | Source | Strategy | Formula |
|---|---|---|---|
| UX (interaction) | Playwright + Gemini | mobile | `(navigation+cta_flow+form_experience+interaction_feedback+scroll_experience)/5 × 10` |

**Merge behaviour (product decision):** default UI shows ONE blended quality number; a "Deep Analysis" toggle splits Design (static) vs UX (interaction). When UX analysis exists, the displayed unified score blends static design and interaction UX (suggested: `design×0.5 + ux×0.5`); when it doesn't, the design score stands alone. Overall still folds in performance/SEO/mobile per the table above. **Compute all of this in one place: [`src/lib/scoring.ts`](nearsited/src/lib/scoring.ts). Never inline.**

**Score → label:** 0–39 Poor (red) · 40–69 Needs Improvement (amber) · 70–84 Good (green) · 85–100 Strong (deep green).

---

## 10. Quick Reference — Full Column Map

```
profiles         id, email, full_name, created_at
businesses       id, user_id, name, place_id, business_type, address, city, phone,
                 website, website_status, rating, review_count,
                 performance_score, design_score, ux_score,
                 flagged_for_outreach, outreach_reason,
                 discovered_at, audited_at, design_analyzed_at, ux_analyzed_at
places_cache     place_id(PK), website, website_status, details_fetched_at      [shared, admin-write]
audits           id, business_id, user_id, strategy, performance_score, seo_score,
                 fcp, lcp, tbt, cls, has_ssl, audit_data, created_at             [2 rows/run]
design_analyses  id, business_id, user_id, strategy, design_score,
                 criteria_scores, issues, screenshot_url, raw_analysis, analyzed_at   [2 rows/run, STATIC]
ux_analyses      id, business_id, user_id, strategy, ux_score, criteria_scores,
                 issues, interactions, frame_paths, recording_url, raw_analysis,
                 analyzed_at                                                     [V2, 2 rows/run, INTERACTION, queue-only]
pipeline         id, business_id, user_id, status, notes, created_at, updated_at
pitches          id, business_id, user_id, subject, body, tone, lead_type,
                 pitch_status, created_at
mockups          id, business_id, user_id, html_content, preview_url, created_at        [v2]
subscriptions    id, user_id, stripe_customer_id, stripe_subscription_id, tier,
                 credits_discovery, credits_mockup, credits_reset_at, created_at         [v2]
share_links      id, business_id, user_id, token, created_at, expires_at                 [admin insert, anon select]
territories      id, user_id, name, city, business_type,
                 last_scanned_at, alert_enabled, created_at                              [v2 — no radius column]

STORAGE BUCKETS
recordings       recordings/<business_id>/<analysis_id>/frame_NN.png    [v2, private, signed-URL reads]
```

---

*End of Schema · Keep this file and the database in lockstep.*
