-- Nearsited — Row-Level Security Fix Migration
-- ===================================================
-- Adds missing RLS policies to all Supabase tables based on a security audit.
-- Idempotent — safe to run multiple times via psql or Supabase SQL Editor.
--
-- Tables that ALREADY have RLS (NOT modified by this script):
--   pitches      (from scripts/migrate.sql §5.4)
--   mockups      (from scripts/migrate.sql §5.4)
--   share_links  (from scripts/migrate.sql §5.10)
--   subscriptions(from scripts/migrate-dodo.sql §4)
--
-- Tables covered by this script:
--   businesses       — CRUD policies by user_id
--   pipeline         — CRUD policies by user_id
--   audits           — CRUD policies by user_id
--   design_analyses  — CRUD policies by user_id
--   territories      — CRUD policies by user_id
--   places_cache     — SELECT policy for authenticated users (shared cache)
-- ===================================================

-- ═════════════════════════════════════════════════════════════════════════════
-- 1. businesses — Core lead table, per-user rows
-- ═════════════════════════════════════════════════════════════════════════════

-- Idempotent: only enable RLS if not already enabled
do $$
begin
  if not exists (
    select 1 from pg_tables
    where tablename = 'businesses'
    and schemaname = 'public'
    and rowsecurity = true
  ) then
    alter table public.businesses enable row level security;
  end if;
end $$;

-- Drop existing policies first (idempotent — safe on first run too)
drop policy if exists "users_select_own_businesses" on public.businesses cascade;
drop policy if exists "users_insert_own_businesses" on public.businesses cascade;
drop policy if exists "users_update_own_businesses" on public.businesses cascade;
drop policy if exists "users_delete_own_businesses" on public.businesses cascade;

-- Users can SELECT only their own businesses
create policy "users_select_own_businesses" on public.businesses
  for select to authenticated
  using (user_id = auth.uid());

-- Users can INSERT only their own businesses
create policy "users_insert_own_businesses" on public.businesses
  for insert to authenticated
  with check (user_id = auth.uid());

-- Users can UPDATE only their own businesses
create policy "users_update_own_businesses" on public.businesses
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Users can DELETE only their own businesses
create policy "users_delete_own_businesses" on public.businesses
  for delete to authenticated
  using (user_id = auth.uid());


-- ═════════════════════════════════════════════════════════════════════════════
-- 2. pipeline — Lead funnel entries, per-user rows
-- ═════════════════════════════════════════════════════════════════════════════

do $$
begin
  if not exists (
    select 1 from pg_tables
    where tablename = 'pipeline'
    and schemaname = 'public'
    and rowsecurity = true
  ) then
    alter table public.pipeline enable row level security;
  end if;
end $$;

drop policy if exists "users_select_own_pipeline" on public.pipeline cascade;
drop policy if exists "users_insert_own_pipeline" on public.pipeline cascade;
drop policy if exists "users_update_own_pipeline" on public.pipeline cascade;
drop policy if exists "users_delete_own_pipeline" on public.pipeline cascade;

create policy "users_select_own_pipeline" on public.pipeline
  for select to authenticated
  using (user_id = auth.uid());

create policy "users_insert_own_pipeline" on public.pipeline
  for insert to authenticated
  with check (user_id = auth.uid());

create policy "users_update_own_pipeline" on public.pipeline
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "users_delete_own_pipeline" on public.pipeline
  for delete to authenticated
  using (user_id = auth.uid());


-- ═════════════════════════════════════════════════════════════════════════════
-- 3. audits — PageSpeed performance results, per-user rows (has user_id FK)
-- ═════════════════════════════════════════════════════════════════════════════

do $$
begin
  if not exists (
    select 1 from pg_tables
    where tablename = 'audits'
    and schemaname = 'public'
    and rowsecurity = true
  ) then
    alter table public.audits enable row level security;
  end if;
end $$;

drop policy if exists "users_select_own_audits" on public.audits cascade;
drop policy if exists "users_insert_own_audits" on public.audits cascade;
drop policy if exists "users_update_own_audits" on public.audits cascade;
drop policy if exists "users_delete_own_audits" on public.audits cascade;

create policy "users_select_own_audits" on public.audits
  for select to authenticated
  using (user_id = auth.uid());

-- INSERT policy — admin client typically writes audits server-side,
-- but having a policy ensures consistent RLS coverage for all operations
create policy "users_insert_own_audits" on public.audits
  for insert to authenticated
  with check (user_id = auth.uid());

create policy "users_update_own_audits" on public.audits
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "users_delete_own_audits" on public.audits
  for delete to authenticated
  using (user_id = auth.uid());


-- ═════════════════════════════════════════════════════════════════════════════
-- 4. design_analyses — Gemini vision design results, per-user rows (has user_id FK)
-- ═════════════════════════════════════════════════════════════════════════════

do $$
begin
  if not exists (
    select 1 from pg_tables
    where tablename = 'design_analyses'
    and schemaname = 'public'
    and rowsecurity = true
  ) then
    alter table public.design_analyses enable row level security;
  end if;
end $$;

drop policy if exists "users_select_own_design_analyses" on public.design_analyses cascade;
drop policy if exists "users_insert_own_design_analyses" on public.design_analyses cascade;
drop policy if exists "users_update_own_design_analyses" on public.design_analyses cascade;
drop policy if exists "users_delete_own_design_analyses" on public.design_analyses cascade;

create policy "users_select_own_design_analyses" on public.design_analyses
  for select to authenticated
  using (user_id = auth.uid());

create policy "users_insert_own_design_analyses" on public.design_analyses
  for insert to authenticated
  with check (user_id = auth.uid());

create policy "users_update_own_design_analyses" on public.design_analyses
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "users_delete_own_design_analyses" on public.design_analyses
  for delete to authenticated
  using (user_id = auth.uid());


-- ═════════════════════════════════════════════════════════════════════════════
-- 5. territories — Saved search alerts, per-user rows (has user_id column)
-- ═════════════════════════════════════════════════════════════════════════════

do $$
begin
  if not exists (
    select 1 from pg_tables
    where tablename = 'territories'
    and schemaname = 'public'
    and rowsecurity = true
  ) then
    alter table public.territories enable row level security;
  end if;
end $$;

drop policy if exists "users_select_own_territories" on public.territories cascade;
drop policy if exists "users_insert_own_territories" on public.territories cascade;
drop policy if exists "users_update_own_territories" on public.territories cascade;
drop policy if exists "users_delete_own_territories" on public.territories cascade;

create policy "users_select_own_territories" on public.territories
  for select to authenticated
  using (user_id = auth.uid());

create policy "users_insert_own_territories" on public.territories
  for insert to authenticated
  with check (user_id = auth.uid());

create policy "users_update_own_territories" on public.territories
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "users_delete_own_territories" on public.territories
  for delete to authenticated
  using (user_id = auth.uid());


-- ═════════════════════════════════════════════════════════════════════════════
-- 6. places_cache — Shared Google Places cache (no user_id column)
-- ═════════════════════════════════════════════════════════════════════════════
--
-- This table is intentionally SHARED across all users. It stores one row per
-- unique Google place_id, platform-wide, forever (90-day staleness refresh).
-- The same physical business discovered by two users shares one places_cache row.
--
-- Security model:
--   - READ: any authenticated user may read the entire cache (this IS the point)
--   - WRITE: intentionally NO policy — writes happen exclusively via the
--     service-role admin client, which bypasses RLS entirely.
--     Its absence IS the security model. Do not add a write policy.

do $$
begin
  if not exists (
    select 1 from pg_tables
    where tablename = 'places_cache'
    and schemaname = 'public'
    and rowsecurity = true
  ) then
    alter table public.places_cache enable row level security;
  end if;
end $$;

drop policy if exists "authenticated_read_places_cache" on public.places_cache cascade;
drop policy if exists "users_select_places_cache" on public.places_cache cascade;

-- Any authenticated user can read the shared cache
create policy "authenticated_read_places_cache" on public.places_cache
  for select to authenticated
  using (true);

-- NOTE: No INSERT/UPDATE/DELETE policies exist for places_cache.
-- This is intentional — writes are only performed via the service-role
-- admin client (supabase.from('places_cache').upsert(...)) which bypasses RLS.
