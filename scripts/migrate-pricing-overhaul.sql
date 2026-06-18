-- Nearsited — Pricing Tier Overhaul Migration
-- ===================================================
-- §5.17 — Migrates from 2-tier credit/search-metered model to 4-tier audit-metered model.
--
-- Since there are no existing users, this is a clean schema update:
--   1. Make searches unlimited (set searches_limit to high sentinel)
--   2. Update RPC functions for new tier values and unlimited searches
--   3. Ensure credits_reset_at is NULL for free_trial rows (lifetime, no reset)
--
-- Run this in the Supabase SQL Editor AFTER §5.1–§5.16.
-- ===================================================

-- ── §5.17a — Make searches unlimited ─────────────────────────────────────

-- Keep searches_used/searches_limit columns for analytics but set limit high.
-- Application code no longer enforces search limits.
UPDATE public.subscriptions
SET searches_limit = 999999
WHERE searches_limit < 999999 OR searches_limit IS NULL;

-- Free trial users should not have monthly resets (lifetime allowance).
UPDATE public.subscriptions
SET credits_reset_at = NULL
WHERE tier = 'free_trial' AND credits_reset_at IS NOT NULL;

-- ── §5.17b — Update deduct_audit_credit function for new tier values ──────

create or replace function public.deduct_audit_credit(p_user_id uuid)
returns json
language plpgsql
security definer
as $$
declare
  v_audits_used    integer;
  v_audits_limit   integer;
  v_tier           text;
  v_credits_reset_at timestamptz;
  v_now            timestamptz := now();
  v_next_reset     timestamptz;
begin
  -- Ensure a subscription row exists (upsert with free-trial defaults)
  insert into public.subscriptions (user_id, tier, audits_used, audits_limit, searches_used, searches_limit)
  values (p_user_id, 'free_trial', 0, 20, 0, 999999)
  on conflict (user_id) do nothing;

  -- Lock the subscription row so no concurrent transaction can read or write it
  select audits_used, audits_limit, tier, credits_reset_at
  into strict v_audits_used, v_audits_limit, v_tier, v_credits_reset_at
  from public.subscriptions
  where user_id = p_user_id
  for update;

  -- Monthly reset: only for paid tiers that have credits_reset_at set
  if v_tier != 'free_trial' and v_credits_reset_at is not null and v_credits_reset_at <= v_now then
    v_next_reset := date_trunc('month', v_now) + interval '1 month';
    update public.subscriptions
    set audits_used = 0,
        credits_reset_at = v_next_reset
    where user_id = p_user_id;
    v_audits_used := 0;
  end if;

  -- Treat zero limit as the default free-trial limit (20)
  v_audits_limit := coalesce(nullif(v_audits_limit, 0), 20);

  -- Check if the user has reached their audit limit
  if v_audits_used >= v_audits_limit then
    return json_build_object(
      'success',      false,
      'audits_used',  v_audits_used,
      'audits_limit', v_audits_limit
    );
  end if;

  -- Atomic increment: SET col = col + 1 is safe within the locked transaction
  update public.subscriptions
  set audits_used = audits_used + 1
  where user_id = p_user_id;

  return json_build_object(
    'success',       true,
    'audits_used',   v_audits_used + 1,
    'audits_limit',  v_audits_limit
  );
end;
$$;

-- ── §5.17c — Update refund_audit_credit function ──────────────────────────

create or replace function public.refund_audit_credit(p_user_id uuid)
returns json
language plpgsql
security definer
as $$
declare
  v_audits_used integer;
  v_audits_limit integer;
begin
  -- Lock the subscription row
  select audits_used, audits_limit
  into strict v_audits_used, v_audits_limit
  from public.subscriptions
  where user_id = p_user_id
  for update;

  -- Only refund if at least 1 audit has been used
  if v_audits_used > 0 then
    update public.subscriptions
    set audits_used = audits_used - 1
    where user_id = p_user_id;
    v_audits_used := v_audits_used - 1;
  end if;

  return json_build_object(
    'success',      true,
    'audits_used',  v_audits_used,
    'audits_limit', v_audits_limit
  );
end;
$$;

-- ── §5.17d — Deprecate search credit functions ────────────────────────────
-- Searches are now unlimited for all tiers. The deduct_search_credit and
-- refund_search_credit functions are kept but modified to always succeed
-- (they no longer enforce limits). Application code no longer calls them.

create or replace function public.deduct_search_credit(p_user_id uuid)
returns json
language plpgsql
security definer
as $$
begin
  -- Searches are unlimited. Always succeed.
  return json_build_object(
    'success',        true,
    'searches_used',  0,
    'searches_limit', 999999
  );
end;
$$;

create or replace function public.refund_search_credit(p_user_id uuid)
returns json
language plpgsql
security definer
as $$
begin
  -- Searches are unlimited. No-op.
  return json_build_object(
    'success',        true,
    'searches_used',  0,
    'searches_limit', 999999
  );
end;
$$;
