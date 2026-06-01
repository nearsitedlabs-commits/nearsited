-- Nearsited Database Migrations
-- From docs/SCHEMA.md §5 — Run in order
-- ===================================================

-- §5.1 — Businesses cleanup
alter table if exists public.businesses drop constraint if exists businesses_website_type_check;
alter table public.businesses
  drop column if exists website_url,
  drop column if exists gmb_place_id,
  drop column if exists gmb_rating,
  drop column if exists gmb_review_count,
  drop column if exists category,
  drop column if exists website_type,
  drop column if exists country,
  drop column if exists cached_at;

-- §5.2 — Add SEO score to audits
alter table public.audits add column if not exists seo_score integer;

-- §5.3 — Add pitch metadata
alter table public.pitches
  add column if not exists tone text,
  add column if not exists lead_type text,
  add column if not exists pitch_status text default 'draft';

-- §5.4 — Ensure RLS on pitches and mockups
alter table public.pitches enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='pitches' and policyname='users manage own pitches') then
    create policy "users manage own pitches" on public.pitches
      for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
end $$;

alter table public.mockups enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='mockups' and policyname='users manage own mockups') then
    create policy "users manage own mockups" on public.mockups
      for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
end $$;

-- §5.5 — Realign pipeline stages
-- First update existing rows to canonical values
update public.pipeline set status='new_lead'  where status in ('prospect', 'new');
update public.pipeline set status='analysed'  where status='interested';
update public.pipeline set status='won'       where status='closed';
update public.pipeline set status='lost'      where status='rejected';
update public.pipeline set status='new_lead'  where status is null or status = '';

-- Then drop old constraints and add new one
alter table public.pipeline drop constraint if exists pipeline_stage_check;
alter table public.pipeline drop constraint if exists pipeline_status_check;
alter table public.pipeline add constraint pipeline_status_check check (status in (
  'new_lead','analysed','pitch_generated','contacted','in_conversation','won','lost'));

alter table public.pipeline drop column if exists stage;

-- §5.6 — Territories column rename
alter table public.territories rename column category to business_type;

-- §5.7 — Businesses UX columns (add now, build later)
alter table public.businesses
  add column if not exists ux_score integer,
  add column if not exists ux_analyzed_at timestamptz;

-- §5.10 — Share links table (public read-only URLs for leads)
create table if not exists public.share_links (
  id          uuid primary key default extensions.uuid_generate_v4(),
  business_id uuid references public.businesses(id) on delete cascade,
  user_id     uuid references public.profiles(id) on delete cascade,
  token       text not null unique,
  created_at  timestamptz default now(),
  expires_at  timestamptz
);

alter table public.share_links enable row level security;

-- Insert: done via admin client (service role) since server-side auth.uid() is null
-- Select: public read access by token — anyone with the link can view
create policy "public read share_links by token" on public.share_links
  for select to anon, authenticated
  using (true);

create index if not exists share_links_token_idx on public.share_links (token);

-- §5.11 — Add opportunity_score to businesses
alter table public.businesses
  add column if not exists opportunity_score integer;

create index if not exists idx_businesses_opportunity_score
  on public.businesses (opportunity_score desc nulls last);
