-- Migration: Add contact_info JSONB column to businesses
-- This stores cached contact data (email, phone, scraped_at) scraped by /api/contact-info
alter table public.businesses add column if not exists contact_info jsonb default '{}'::jsonb;

-- Migration: Add channel column to pitches
-- Stores the outreach channel (email/whatsapp) used for pitch generation
alter table public.pitches add column if not exists channel text default 'email';

-- Add CHECK constraint for channel values
alter table public.pitches drop constraint if exists pitches_channel_check;
alter table public.pitches add constraint pitches_channel_check check (channel in ('email', 'whatsapp'));

-- Update existing pitches to have channel = 'email' where NULL
update public.pitches set channel = 'email' where channel is null;
