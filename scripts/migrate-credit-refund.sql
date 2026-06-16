-- Nearsited — Atomic Credit Refund (Cost-Control Fix)
-- ===================================================
-- §5.14 — PostgreSQL functions for atomic audit/search credit refunds
--
-- Companion to migrate-atomic-credits.sql. The deduct_* functions are now
-- called BEFORE the expensive external API work (PageSpeed/ScreenshotCore/
-- Gemini/Places) runs, instead of after — this closes a race where
-- concurrent requests could all pass the non-atomic checkCredit()/
-- checkSearch() fast-path gate and each trigger a real, paid external call
-- before any of them reached the atomic deduction.
--
-- Reserving the credit upfront means a downstream failure (analysis didn't
-- complete, no results found, unexpected error) must give the credit back —
-- these refund functions do that atomically under the same row lock.
-- Run this in the Supabase SQL Editor AFTER §5.13 (migrate-atomic-credits.sql).

-- ── §5.14a — Atomic audit credit refund ─────────────────────────────────────

create or replace function public.refund_audit_credit(p_user_id uuid)
returns json
language plpgsql
security definer
as $$
declare
  v_audits_used  integer;
  v_audits_limit integer;
begin
  select audits_used, audits_limit
  into strict v_audits_used, v_audits_limit
  from public.subscriptions
  where user_id = p_user_id
  for update;

  update public.subscriptions
  set audits_used = greatest(0, audits_used - 1)
  where user_id = p_user_id;

  return json_build_object(
    'success',      true,
    'audits_used',  greatest(0, v_audits_used - 1),
    'audits_limit', v_audits_limit
  );
end;
$$;

-- ── §5.14b — Atomic search credit refund ────────────────────────────────────

create or replace function public.refund_search_credit(p_user_id uuid)
returns json
language plpgsql
security definer
as $$
declare
  v_searches_used  integer;
  v_searches_limit integer;
begin
  select searches_used, searches_limit
  into strict v_searches_used, v_searches_limit
  from public.subscriptions
  where user_id = p_user_id
  for update;

  update public.subscriptions
  set searches_used = greatest(0, searches_used - 1)
  where user_id = p_user_id;

  return json_build_object(
    'success',        true,
    'searches_used',  greatest(0, v_searches_used - 1),
    'searches_limit', v_searches_limit
  );
end;
$$;
