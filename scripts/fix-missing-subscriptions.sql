-- Fix: Creates subscription rows for profiles that are missing them.
-- The auth callback's ensureSubscription should do this automatically,
-- but if the new code isn't deployed yet, this manual fix is needed.
--
-- Step 1: Add 'free_trial' to the tier check constraint if missing
-- ===================================================

ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_tier_check;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_tier_check
  CHECK (tier IN ('free_trial', 'solo', 'agency', 'scale'));

-- Step 2: Insert missing subscription rows
INSERT INTO public.subscriptions (user_id, tier, audits_used, audits_limit, searches_used, searches_limit, credits_reset_at)
SELECT id, 'free_trial', 0, 20, 0, 999999, NULL
FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;

-- Verify
SELECT p.id, p.email, s.tier, s.audits_used, s.audits_limit
FROM public.profiles p
LEFT JOIN public.subscriptions s ON s.user_id = p.id;
