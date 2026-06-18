-- ⚠️ DESTRUCTIVE SCRIPT — Deletes ALL user accounts and data
-- Use only for testing from scratch.
-- Run in Supabase SQL Editor.
--
-- NOTE: places_cache is intentionally NOT deleted — it's a shared global
-- cache of Google Places results that benefits all users and has no
-- relationship to user accounts.
-- ===================================================

BEGIN;

-- 1. Delete child data explicitly (safety net — cascades should handle it)
DELETE FROM public.share_links;
DELETE FROM public.territories;
DELETE FROM public.pitches;
DELETE FROM public.pipeline;
DELETE FROM public.mockups;
DELETE FROM public.design_analyses;
DELETE FROM public.audits;
DELETE FROM public.businesses;

-- 2. Delete subscriptions (FK to profiles)
DELETE FROM public.subscriptions;

-- 3. Delete profiles
DELETE FROM public.profiles;

-- 4. Delete auth users (this is what actually frees up emails for re-registration)
DELETE FROM auth.users;

COMMIT;

-- Verify everything is clean
SELECT 'profiles' AS tbl, count(*) AS remaining FROM public.profiles
UNION ALL
SELECT 'businesses', count(*) FROM public.businesses
UNION ALL
SELECT 'subscriptions', count(*) FROM public.subscriptions
UNION ALL
SELECT 'auth.users', count(*) FROM auth.users;
