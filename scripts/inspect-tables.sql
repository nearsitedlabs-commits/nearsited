-- Shows all tables and their row counts — run this first to verify schema
-- Paste the result back so I can confirm the cleanup script matches.
-- ===================================================

SELECT 'public.profiles' AS tbl, count(*) FROM public.profiles
UNION ALL SELECT 'public.subscriptions', count(*) FROM public.subscriptions
UNION ALL SELECT 'public.businesses', count(*) FROM public.businesses
UNION ALL SELECT 'public.audits', count(*) FROM public.audits
UNION ALL SELECT 'public.design_analyses', count(*) FROM public.design_analyses
UNION ALL SELECT 'public.mockups', count(*) FROM public.mockups
UNION ALL SELECT 'public.pipeline', count(*) FROM public.pipeline
UNION ALL SELECT 'public.pitches', count(*) FROM public.pitches
UNION ALL SELECT 'public.share_links', count(*) FROM public.share_links
UNION ALL SELECT 'public.territories', count(*) FROM public.territories
UNION ALL SELECT 'public.places_cache', count(*) FROM public.places_cache
UNION ALL SELECT 'auth.users', count(*) FROM auth.users
ORDER BY tbl;
