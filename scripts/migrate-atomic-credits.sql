-- Nearsited — Atomic Credit Deduction (Race-Condition Fix)
-- ===================================================
-- §5.13 — PostgreSQL functions for atomic audit/search credit deduction
--
-- Replaces the read-check-write pattern in src/lib/credits.ts with a single
-- atomic SQL operation using SELECT ... FOR UPDATE + SET col = col + 1.
-- Run this in the Supabase SQL Editor AFTER §5.1–§5.12.
--
-- Both functions are SECURITY DEFINER so they bypass RLS (the admin client
-- is already service-role, but this ensures correct behaviour regardless of
-- how the function is invoked in the future).

-- ── §5.13a — Atomic audit credit deduction ──────────────────────────────────

create or replace function public.deduct_audit_credit(p_user_id uuid)
returns json
language plpgsql
security definer
as $$
declare
  v_audits_used    integer;
  v_audits_limit   integer;
  v_credits_reset_at timestamptz;
  v_now            timestamptz := now();
  v_next_reset     timestamptz;
begin
  -- Ensure a subscription row exists (upsert with free-tier defaults)
  insert into public.subscriptions (user_id, tier, audits_used, audits_limit, searches_used, searches_limit)
  values (p_user_id, 'free', 0, 20, 0, 3)
  on conflict (user_id) do nothing;

  -- Lock the subscription row so no concurrent transaction can read or write it
  select audits_used, audits_limit, credits_reset_at
  into strict v_audits_used, v_audits_limit, v_credits_reset_at
  from public.subscriptions
  where user_id = p_user_id
  for update;

  -- Monthly reset: if credits_reset_at is in the past, reset the counter
  if v_credits_reset_at is not null and v_credits_reset_at <= v_now then
    v_next_reset := date_trunc('month', v_now) + interval '1 month';
    update public.subscriptions
    set audits_used = 0,
        credits_reset_at = v_next_reset
    where user_id = p_user_id;
    v_audits_used := 0;
  end if;

  -- Check if the user has reached their audit limit
  if v_audits_used >= v_audits_limit then
    return json_build_object(
      'success',     false,
      'audits_used', v_audits_used,
      'audits_limit', v_audits_limit
    );
  end if;

  -- Atomic increment: SET col = col + 1 is safe within the locked transaction
  update public.subscriptions
  set audits_used = audits_used + 1
  where user_id = p_user_id;

  return json_build_object(
    'success',      true,
    'audits_used',  v_audits_used + 1,
    'audits_limit', v_audits_limit
  );
end;
$$;

-- ── §5.13b — Atomic search credit deduction ─────────────────────────────────

create or replace function public.deduct_search_credit(p_user_id uuid)
returns json
language plpgsql
security definer
as $$
declare
  v_searches_used  integer;
  v_searches_limit integer;
  v_credits_reset_at timestamptz;
  v_now            timestamptz := now();
  v_next_reset     timestamptz;
begin
  -- Ensure a subscription row exists
  insert into public.subscriptions (user_id, tier, audits_used, audits_limit, searches_used, searches_limit)
  values (p_user_id, 'free', 0, 20, 0, 3)
  on conflict (user_id) do nothing;

  -- Lock the subscription row
  select searches_used, searches_limit, credits_reset_at
  into strict v_searches_used, v_searches_limit, v_credits_reset_at
  from public.subscriptions
  where user_id = p_user_id
  for update;

  -- Monthly reset (paid plans only — free tier has lifetime allowance via checkSearch)
  if v_credits_reset_at is not null and v_credits_reset_at <= v_now then
    v_next_reset := date_trunc('month', v_now) + interval '1 month';
    update public.subscriptions
    set searches_used = 0,
        credits_reset_at = v_next_reset
    where user_id = p_user_id;
    v_searches_used := 0;
  end if;

  -- Check if the user has reached their search limit
  if v_searches_used >= v_searches_limit then
    return json_build_object(
      'success',       false,
      'searches_used',  v_searches_used,
      'searches_limit', v_searches_limit
    );
  end if;

  -- Atomic increment
  update public.subscriptions
  set searches_used = searches_used + 1
  where user_id = p_user_id;

  return json_build_object(
    'success',       true,
    'searches_used',  v_searches_used + 1,
    'searches_limit', v_searches_limit
  );
end;
$$;
