-- Nearsited — Fix Zero Limits for User + Unique Constraint
-- ==========================================================
--
-- 1. Adds the UNIQUE constraint on subscriptions.user_id that the RPC functions
--    rely on (ON CONFLICT (user_id) requires it).
-- 2. Cleans up any duplicate rows that may have been created before the constraint.
-- 3. Resets the user's limits to free-tier defaults by email.
--
-- Run this in the Supabase SQL Editor.

-- ── Step 1: Remove duplicates ──────────────────────────────────────────────────
delete from public.subscriptions a
using public.subscriptions b
where a.id < b.id and a.user_id = b.user_id;

-- ── Step 2: Add unique constraint (required by RPC's ON CONFLICT) ─────────────
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'subscriptions_user_id_key'
      and conrelid = 'public.subscriptions'::regclass
  ) then
    alter table public.subscriptions
    add constraint subscriptions_user_id_key unique (user_id);
  end if;
end;
$$;

-- ── Step 3: Reset limits for the testing user ─────────────────────────────────
do $$
declare
  v_user_id uuid;
begin
  select id into v_user_id
  from public.profiles
  where email = 'nearsitedlabs@gmail.com';

  if not found then
    raise warning 'User nearsitedlabs@gmail.com not found in profiles — skipping limit reset';
    return;
  end if;

  insert into public.subscriptions (user_id, tier, searches_used, searches_limit, audits_used, audits_limit)
  values (v_user_id, 'free', 0, 3, 0, 20)
  on conflict (user_id) do update set
    searches_used = 0,
    searches_limit = 3,
    audits_used = 0,
    audits_limit = 20;

  raise notice 'Reset limits for user nearsitedlabs@gmail.com (id=%)', v_user_id;
end;
$$;
