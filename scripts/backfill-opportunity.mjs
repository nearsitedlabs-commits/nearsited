/**
 * Add opportunity_score column + backfill for existing analysed businesses.
 * Run in: https://supabase.com/dashboard/project/lbitlmishpmlkwosqmof/sql/new
 */

const SQL = `
-- Step 1: Add the column + index (safe to run multiple times)
alter table public.businesses
  add column if not exists opportunity_score integer;

create index if not exists idx_businesses_opportunity_score
  on public.businesses (opportunity_score desc nulls last);

-- Step 2: Backfill for businesses already analysed
update public.businesses
set opportunity_score = round(
  case
    when performance_score < 40 then 40 + (performance_score::numeric / 40) * 60
    when performance_score <= 60 then 100 - ((performance_score::numeric - 40) / 20) * 25
    else greatest(0, 75 - ((performance_score::numeric - 60) / 40) * 75)
  end
  *
  (
    (case
      when coalesce(review_count, 0) >= 100 then 1.0
      when coalesce(review_count, 0) >= 50  then 0.9
      when coalesce(review_count, 0) >= 20  then 0.75
      when coalesce(review_count, 0) >= 10  then 0.6
      when coalesce(review_count, 0) >= 5   then 0.45
      when coalesce(review_count, 0) >= 1   then 0.3
      else 0.2
    end) * 0.7
    +
    (case
      when coalesce(rating, 0) >= 4.0 then 1.0
      when coalesce(rating, 0) >= 3.5 then 0.85
      when coalesce(rating, 0) >= 3.0 then 0.65
      when coalesce(rating, 0) >= 2.0 then 0.4
      else 0.25
    end) * 0.3
  )
)
where performance_score is not null
  and opportunity_score is null;

-- Verify
select
  count(*) filter (where opportunity_score is not null) as backfilled,
  count(*) filter (where performance_score is not null and opportunity_score is null) as still_null
from public.businesses;
`;

console.log("📋 Paste ALL of this into your Supabase SQL editor:");
console.log("   https://supabase.com/dashboard/project/lbitlmishpmlkwosqmof/sql/new");
console.log("");
console.log(SQL);
