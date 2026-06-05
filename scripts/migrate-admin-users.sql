-- Nearsited — Admin Users Table
-- ===================================================
-- Replaces the previous email-comparison pattern with a proper
-- database-backed role check.
--
-- Run this migration via psql or Supabase SQL Editor.
-- Then insert your admin user_id (found in auth.users or profiles table).
--
-- Example:
--   INSERT INTO public.admin_users (user_id) VALUES ('<user-uuid-here>');

-- Create admin_users table
create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  
  -- Each user can only be an admin once
  constraint admin_users_user_id_key unique (user_id)
);

-- Enable RLS
alter table public.admin_users enable row level security;

-- Only the owning user (or service role) can see admin rows
create policy "admin_users_select_own" on public.admin_users
  for select to authenticated
  using (user_id = auth.uid());

-- Only service role can manage admin users
create policy "admin_users_insert_service" on public.admin_users
  for insert to service_role
  with check (true);

create policy "admin_users_delete_service" on public.admin_users
  for delete to service_role
  using (true);

-- Grant read access to authenticated users
grant select on public.admin_users to authenticated;
grant insert, delete on public.admin_users to service_role;
