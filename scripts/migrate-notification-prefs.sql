-- Add notification_prefs JSON column to profiles table
-- Stores user notification preference toggles as a JSON object
-- Default: all notifications ON

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS notification_prefs JSONB DEFAULT jsonb_build_object(
  'audit_complete', true,
  'pitch_generated', true,
  'low_credits', true,
  'weekly_digest', true
);

-- Ensure RLS still applies (profiles already has RLS, column inherits it)
