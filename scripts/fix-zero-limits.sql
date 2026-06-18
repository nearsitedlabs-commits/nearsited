-- Nearsited — Fix Zero Limits for User
-- =======================================
--
-- Resets searches_limit and audits_limit from 0 to the free-tier defaults
-- for the user 'nearsitedlabs@gmail.com'.
--
-- The race condition: getSubscription() backfills zero→default in JS and
-- writes to DB, but the deduct_*_credit RPC reads the limit directly from
-- the row in a separate transaction — if it sees 0, it rejects immediately.
--
-- Run this in the Supabase SQL Editor after deploying the RPC fix in
-- scripts/migrate-atomic-credits.sql (which adds COALESCE(NULLIF(..., 0), default)
-- to both RPC functions).

do $$
declare
  v_user_id uuid;
begin
  -- Find the user by email in the profiles table
  select id into strict v_user_id
  from public.profiles
  where email = 'nearsitedlabs@gmail.com';

  -- Reset search credits to free-tier defaults
  update public.subscriptions
  set searches_used = 0,
      searches_limit = 3   -- FREE_SEARCH_LIMIT
  where user_id = v_user_id;

  -- Reset audit credits to free-tier defaults
  update public.subscriptions
  set audits_used = 0,
      audits_limit = 20    -- FREE_AUDIT_LIMIT
  where user_id = v_user_id;

  raise notice 'Reset limits for user % (id=%)', 'nearsitedlabs@gmail.com', v_user_id;
end;
$$;
