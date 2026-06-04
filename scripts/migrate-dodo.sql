-- Migrate subscriptions table from Stripe to Dodo Payments

-- 1. Add Dodo columns (keep old Stripe cols in case they have data)
alter table public.subscriptions
  add column if not exists dodo_customer_id     text,
  add column if not exists dodo_subscription_id text unique,
  add column if not exists audits_used          integer not null default 0,
  add column if not exists audits_limit         integer not null default 10;

-- 2. Ensure tier has the right values (free | starter | agency)
--    Existing rows default to free tier
update public.subscriptions set tier = 'free' where tier is null or tier = '';

-- 3. Ensure every user has a subscription row (free tier at signup)
--    Run this once to backfill existing users
insert into public.subscriptions (user_id, tier, audits_limit, audits_used)
select p.id, 'free', 10, 0
from public.profiles p
where not exists (
  select 1 from public.subscriptions s where s.user_id = p.id
);

-- 4. RLS: users can read their own subscription
alter table public.subscriptions enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'subscriptions' and policyname = 'users read own subscription'
  ) then
    create policy "users read own subscription"
      on public.subscriptions for select
      to authenticated
      using (user_id = auth.uid());
  end if;
end $$;
