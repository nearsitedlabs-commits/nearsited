# Pricing Tier Overhaul — Implementation Plan

## Overview

Replace the current 2-tier credit/search-metered model with a 4-tier audit-metered model. Searches become unlimited across all tiers. The product shifts from "credits" (abstract unit) to "audits" (value unit).

## Current State Reference

| Aspect | Current | Target |
|--------|---------|--------|
| Tiers | Free / Starter ($19) / Agency ($49) | Free Trial / Solo ($29) / Agency ($89) / Scale ($249) |
| Audit limits | Free: 20 lifetime / Starter: 50/mo / Agency: 200/mo | Free: 20 lifetime / Solo: 100/mo / Agency: 500/mo / Scale: 2,000/mo |
| Search limits | Free: 3 lifetime / Starter: 3/mo / Agency: 10/mo | Unlimited (all tiers) |
| Pipeline limits | Unlimited | Free Trial: 10 saved leads; Paid: unlimited |
| Saved searches | Unlimited (no limit enforced) | Solo: 5; Agency/Scale: unlimited |
| Seats | 1 (all) | Solo: 1, Agency: 3, Scale: 10 |
| Pricing | $19 / $49 | $29 / $89 / $249 |
| Beta migration | — | Grandfather $19→Solo, $49→Agency at current prices |
| Edge cases | — | Overage ($0.50/audit), booster packs ($19/100), extra seats ($20/mo) |

## Files to Modify

### 1. Configuration Layer

| File | Changes |
|------|---------|
| [`src/lib/dodo.ts`](src/lib/dodo.ts) | Add `solo` + `scale` tiers to `ProductTier` type; add `scale` products; update limits: free=20, solo=100, agency=500, scale=2000; remove `FREE_SEARCH_LIMIT` |
| [`src/lib/products.ts`](src/lib/products.ts) | Add Scale monthly+annual product IDs; validate all 6 products (solo monthly/annual, agency monthly/annual, scale monthly/annual) |
| [`src/lib/db-types.ts`](src/lib/db-types.ts) | Update `SubData` tier type to include `solo` + `scale` |

### 2. Database / RPC Layer

| File | Changes |
|------|---------|
| [`scripts/migrate-atomic-credits.sql`](scripts/migrate-atomic-credits.sql) | Add new migration: add `saved_searches_used`, `saved_searches_limit`, `pipeline_limit`, `seats`, `team_workspace`, `api_access` columns to `subscriptions` table; update RPC functions to handle unlimited searches (remove search deduction); add `deduct_audit_credit` updated for new tier values |
| [`docs/SCHEMA.md`](docs/SCHEMA.md) | Update subscriptions table schema with new columns/remarks |
| New migration: [`scripts/migrate-pricing-overhaul.sql`](scripts/migrate-pricing-overhaul.sql) | Full migration: ALTER subscriptions table (add columns, remove searches columns if desired), create migration record |

**Important DB design decision:** Rather than storing all tier features in the DB (seats, saved search limits, pipeline limits, API access, white-label, etc.), compute them from the `tier` string in code. Only store values that change per-billing-cycle (`audits_used`, `audits_limit`). The DB only needs:
- `tier` → `free_trial | solo | agency | scale`
- `audits_used`, `audits_limit` (monthly counters)
- `credits_reset_at`
- Optional: `searches_used` kept for analytics but no longer enforced

### 3. Credit/Audit System

| File | Changes |
|------|---------|
| [`src/lib/credits.ts`](src/lib/credits.ts) | • Rename `FREE_AUDIT_LIMIT` → `FREE_TRIAL_AUDIT_LIMIT` • Remove all search-related functions (`checkSearch`, `deductSearch`, `refundSearch`) • `getSubscription`: remove search backfill, update tier defaults to `free_trial` • `checkCredit`: rename to `checkAudit`, update messaging • `deductCredit`: rename to `deductAudit` • Add `getTierFeature(userId)` function that returns computed feature set from `tier` |
| New: [`src/lib/tier-features.ts`](src/lib/tier-features.ts) | Pure function that maps `tier → { auditsLimit, pipelineLimit, savedSearchLimit, seats, teamWorkspace, apiAccess, whiteLabel, customTemplates, supportLevel }`. Single source of truth for what each tier includes. |

### 4. API Routes

| File | Changes |
|------|---------|
| [`src/app/api/checkout/route.ts`](src/app/api/checkout/route.ts) | Update product ID validation to include new Scale products |
| [`src/app/api/webhooks/dodo/route.ts`](src/app/api/webhooks/dodo/route.ts) | • Update `getDodoProducts()` to include Scale • Update cancellation handler to use `FREE_TRIAL_AUDIT_LIMIT` • Update tier mapping for `solo` / `scale` |
| [`src/app/api/check-subscription/route.ts`](src/app/api/check-subscription/route.ts) | Update tier handling, remove search references |
| [`src/app/api/audit/route.ts`](src/app/api/audit/route.ts) | Update credit limit error messages for new tier names |
| [`src/app/api/analyze-design/route.ts`](src/app/api/analyze-design/route.ts) | Same — update error messaging |
| [`src/app/api/discover/route.ts`](src/app/api/discover/route.ts) | **Remove all search limit checks** — searches are now unlimited for all tiers |
| [`src/app/api/saved-searches/route.ts`](src/app/api/saved-searches/route.ts) | Add saved search limit enforcement: check `tierFeatures.savedSearchLimit` on POST; reject if limit reached |
| [`src/app/api/pipeline/route.ts`](src/app/api/pipeline/route.ts) | Add pipeline lead limit enforcement: check `tierFeatures.pipelineLimit` on POST; reject if limit reached |

### 5. UI — Pricing Page

| File | Changes |
|------|---------|
| [`src/components/landing/Pricing.tsx`](src/components/landing/Pricing.tsx) | Complete rewrite of `PLANS` array: replace Starter/Agency with Free Trial/Solo/Agency/Scale. New 4-column grid layout. New features list per tier. New pricing ($29/$89/$249). Add annual pricing. Remove search-related shared features. |
| [`src/app/pricing/page.tsx`](src/app/pricing/page.tsx) | Update FAQ items for new pricing model (audits instead of credits). Update "How credits work" section to "How audits work". Update CTA text. Update hero message. Remove beta pricing notice. |

### 6. UI — Dashboard

| File | Changes |
|------|---------|
| [`src/components/ui/CreditsWidget.tsx`](src/components/ui/CreditsWidget.tsx) | Rename to `AuditsWidget.tsx`. Update terminology (credits → audits). Update tier labels (Free Trial, Solo, Agency, Scale). Update low-balance toast messaging. Add "Free Trial" specific messaging. |
| [`src/app/dashboard/settings/page.tsx`](src/app/dashboard/settings/page.tsx) | • Update `TIER_LABELS` and `TIER_COLORS` for new tiers • Update upgrade buttons (Solo $29, Agency $89, Scale $249) • Update usage display text (audits vs credits) • Add Scale upgrade option • Update feature descriptions for each tier |

### 7. Migration Script

| File | Content |
|------|---------|
| New: [`scripts/migrate-pricing-overhaul.sql`](scripts/migrate-pricing-overhaul.sql) | • Add new tier values to subscriptions table (if using enum) • Add `pipeline_limit`, `saved_searches_limit`, `seats` columns (if storing in DB — see DB decision note above) • Migrate existing `free` → `free_trial`, `starter` → `solo`, `agency` → `agency` (Agency stays same name but gets new limits) • Remove search limit enforcement (set `searches_limit` to a high sentinel value or null) • Update RPC functions |

### 8. Beta User Migration

| Component | Detail |
|-----------|--------|
| Logic | Check if user's `created_at` is before a cutoff date or has a `beta_tier` flag in metadata |
| Mapping | Current `starter` ($19) → Solo features at $19/mo. Current `agency` ($49) → Agency features at $49/mo. |
| Implementation | Store `grandfathered_price` in subscriptions table or user metadata. Override pricing display in settings/pricing page for grandfathered users. Dodo webhook needs to handle different product IDs for grandfathered pricing (or use discount coupons). |

## Implementation Order

### Phase 1: Foundation (Backend)
- [x] 1.1 — Add new tier configuration to [`src/lib/dodo.ts`](src/lib/dodo.ts) (solo, scale tiers, updated limits)
- [x] 1.2 — Update [`src/lib/products.ts`](src/lib/products.ts) for Scale product IDs
- [x] 1.3 — Create [`src/lib/tier-features.ts`](src/lib/tier-features.ts) as the single source of truth for tier capabilities
- [x] 1.4 — Update [`src/lib/credits.ts`](src/lib/credits.ts): remove search functions, rename credits→audits, add tier-feature integration
- [x] 1.5 — Create [`scripts/migrate-pricing-overhaul.sql`](scripts/migrate-pricing-overhaul.sql) DB migration
- [x] 1.6 — Run migration against production database
- [x] 1.7 — Update [`docs/SCHEMA.md`](docs/SCHEMA.md) subscriptions section

### Phase 2: API Routes (Backend)
- [x] 2.1 — Remove search limit enforcement from [`src/app/api/discover/route.ts`](src/app/api/discover/route.ts) (and any search-related endpoints)
- [x] 2.2 — Update [`src/app/api/webhooks/dodo/route.ts`](src/app/api/webhooks/dodo/route.ts) for new tiers
- [x] 2.3 — Update [`src/app/api/checkout/route.ts`](src/app/api/checkout/route.ts) for Scale products
- [x] 2.4 — Update [`src/app/api/check-subscription/route.ts`](src/app/api/check-subscription/route.ts) for new tiers
- [x] 2.5 — Update [`src/app/api/audit/route.ts`](src/app/api/audit/route.ts) and [`src/app/api/analyze-design/route.ts`](src/app/api/analyze-design/route.ts) error messaging
- [x] 2.6 — Add saved search limit enforcement to [`src/app/api/saved-searches/route.ts`](src/app/api/saved-searches/route.ts)
- [x] 2.7 — Add pipeline lead limit enforcement to [`src/app/api/pipeline/route.ts`](src/app/api/pipeline/route.ts)
- [x] 2.8 — Update Dodo RPC functions for new tier values and unlimited searches

### Phase 3: UI — Pricing Page
- [x] 3.1 — Rewrite [`src/components/landing/Pricing.tsx`](src/components/landing/Pricing.tsx) with 4-tier grid
- [x] 3.2 — Update [`src/app/pricing/page.tsx`](src/app/pricing/page.tsx) FAQ and copy

### Phase 4: UI — Dashboard
- [x] 4.1 — Rename and rewrite [`src/components/ui/CreditsWidget.tsx`](src/components/ui/CreditsWidget.tsx) → AuditsWidget
- [x] 4.2 — Update [`src/app/dashboard/settings/page.tsx`](src/app/dashboard/settings/page.tsx) plan section

### Phase 5: Beta Migration & Edge Cases
- [x] 5.1 — Implement beta user detection (grandfather logic)
- [x] 5.2 — Add overage handling ($0.50/audit beyond plan limit)
- [x] 5.3 — Add booster pack infrastructure ($19/100 audits one-time)
- [x] 5.4 — Add extra seat purchasing ($20/mo per seat)
- [x] 5.5 — Add annual discount pricing logic

### Phase 6: Cleanup & Docs
- [x] 6.1 — Update [`docs/SCHEMA.md`](docs/SCHEMA.md)
- [x] 6.2 — Update [`.env.local`](.env.local) with new product ID variables for Scale
- [x] 6.3 — Remove any dead code (search limit remnants)
- [x] 6.4 — Verify all credit→audit terminology is consistent

## Key Design Decisions

### 1. Tier Features as Code, Not DB
Tier capabilities (seats, API access, white-label, etc.) are computed from the `tier` string in [`src/lib/tier-features.ts`](src/lib/tier-features.ts), not stored in the DB. The DB only stores the tier name and the audit counter. This avoids schema changes for every feature toggle and keeps the data model simple.

### 2. Unlimited Searches = No Search Deduction
The simplest implementation of "unlimited searches" is to not check or deduct search credits at all. Remove the `deduct_search_credit` RPC calls from the discover endpoint. The `searches_used` / `searches_limit` columns can remain in the DB for analytics but are never enforced.

### 3. 10-Lead Pipeline Cap for Free Trial
Add a `pipeline_limit` column to subscriptions (or compute from tier). On POST to pipeline, check if `count(*) where user_id = X` is below limit. Free Trial gets 10; all paid tiers get `null` (unlimited).

### 4. Saved Search Limit for Solo
Solo tier gets 5 saved searches. Agency/Scale get unlimited. Check on POST to saved-searches endpoint. Count existing saved searches for the user and compare against `tierFeatures.savedSearchLimit`.

### 5. Overage Model
Overage ($0.50/audit) is a future Dodo Payments integration (usage-based billing or invoice). For now, at 90% usage show soft prompt "You're almost out of audits — upgrade to avoid overage." At 100%, show hard prompt with "Upgrade plan" or "Buy booster pack ($19/100 audits)" options. Booster packs can be implemented as separate Dodo products.

### 6. Beta Migration
Store `grandfathered` flag in user metadata or subscriptions table. Check this flag when displaying pricing in settings. Pass a different product ID (or discount code) to Dodo checkout for grandfathered users. The simplest approach: create separate Dodo products for grandfathered pricing (e.g., `DODO_PRODUCT_SOLO_GRANDFATHERED` at $19).

## Dodo Product ID Layout

```
Current env vars to keep (repurposed):
  DODO_PRODUCT_STARTER_MONTHLY → DODO_PRODUCT_SOLO_MONTHLY
  DODO_PRODUCT_STARTER_ANNUAL  → DODO_PRODUCT_SOLO_ANNUAL
  DODO_PRODUCT_AGENCY_MONTHLY  → (stay as agency but new price $89)
  DODO_PRODUCT_AGENCY_ANNUAL   → (stay as agency but new price)
  
New env vars to add:
  DODO_PRODUCT_SCALE_MONTHLY   → Scale $249/mo product ID
  DODO_PRODUCT_SCALE_ANNUAL    → Scale annual product ID
  
Optional (for booster packs / overage):
  DODO_PRODUCT_BOOSTER_100     → One-time $19 for 100 additional audits
  DODO_PRODUCT_EXTRA_SEAT      → $20/mo per additional seat
  DODO_PRODUCT_SOLO_GRANDFATHERED  → $19/mo (old price, for beta users)
  DODO_PRODUCT_AGENCY_GRANDFATHERED → $49/mo (old price, for beta users)
```

## Risk Areas

| Risk | Mitigation |
|------|-----------|
| Existing users on "free" with credits used > 20 | Cap `audits_used` to `FREE_TRIAL_AUDIT_LIMIT` (20) on migration. They keep their pipeline data but can't audit more without upgrading. |
| Existing $19/$49 users angry about pricing change | Grandfather pricing as outlined. Communicate clearly about audit metering vs search metering. |
| Search deduction code scattered across codebase | Use `search_files` for `deductSearch`, `checkSearch`, `refundSearch`, `FREE_SEARCH_LIMIT` to find all references |
| Dodo product IDs changing in production | Keep old product IDs mapped to new tiers during transition period. The webhook handler maps product_id → tier, so old IDs still resolve. |
| Race conditions on pipeline/saved search limits | Use atomic PostgreSQL RPC (same pattern as `deduct_audit_credit`) or application-level locking |
