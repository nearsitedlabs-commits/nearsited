-- Nearsited — Soft-Delete Account Migration
-- ===================================================
-- §5.18 — Adds soft-delete support to prevent free-trial abuse.
--
-- When a user deletes their account, instead of hard-deleting the auth user
-- (which would free the email for re-registration + a fresh free trial), we:
--   1. Set profiles.deleted_at = now()  (soft-delete)
--   2. Cap the subscription audits_used = audits_limit  (no further usage)
--   3. Revoke all active sessions
--
-- The auth user remains in auth.users, so the email stays "taken" and
-- Supabase Auth will reject re-registration attempts.
--
-- Run this in the Supabase SQL Editor AFTER §5.17 (migrate-pricing-overhaul.sql).
-- ===================================================

-- ── §5.18a — Add deleted_at column to profiles ─────────────────────────────

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

COMMENT ON COLUMN public.profiles.deleted_at IS
  'Set to now() when the user soft-deletes their account. NULL means active. '
  'Used to block re-signup (auth user is kept, email stays taken) and to '
  'reject login/audit attempts for deleted accounts.';

-- ── §5.18b — cap_subscription_audits RPC function ───────────────────────────

-- Sets audits_used = audits_limit so the account can no longer run audits.
-- Called by the account deletion API route.
CREATE OR REPLACE FUNCTION public.cap_subscription_audits(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_audits_used  integer;
  v_audits_limit integer;
BEGIN
  -- Lock the subscription row
  SELECT audits_used, audits_limit
  INTO STRICT v_audits_used, v_audits_limit
  FROM public.subscriptions
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- Cap audits_used at audits_limit (no-op if already at or over limit)
  UPDATE public.subscriptions
  SET audits_used = GREATEST(audits_used, audits_limit)
  WHERE user_id = p_user_id;

  RETURN json_build_object(
    'success',       true,
    'audits_used',   GREATEST(v_audits_used, v_audits_limit),
    'audits_limit',  v_audits_limit
  );
END;
$$;
