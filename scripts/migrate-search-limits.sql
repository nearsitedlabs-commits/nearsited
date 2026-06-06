-- Add search limit columns to subscriptions table
-- Run this in the Supabase SQL editor

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS searches_used  integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS searches_limit integer NOT NULL DEFAULT 1;

-- Back-fill existing paid rows with correct search limits
UPDATE subscriptions SET searches_limit = 3  WHERE tier = 'starter';
UPDATE subscriptions SET searches_limit = 10 WHERE tier = 'agency';
-- free rows already default to 1

-- Reduce free-tier trial from 10 to 4 credits (2 full workflows)
UPDATE subscriptions
SET audits_limit = 4
WHERE tier = 'free' AND audits_used < 4;
