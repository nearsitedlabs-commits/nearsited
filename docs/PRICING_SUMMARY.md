# Pricing System — Complete Summary

**Last updated:** June 2026
**Status:** Live in production

---

## The Model

Audit-metered. Searches unlimited across all tiers. No artificial caps.

```
                Free Trial     Solo          Agency        Scale
                              $29/mo        $89/mo        $249/mo

AUDITS          20 lifetime    100/mo        500/mo        2,000/mo
SEARCHES        unlimited      unlimited     unlimited     unlimited
PITCH GENERATION bundled       bundled       bundled       bundled
PIPELINE LEADS  10 saved       unlimited     unlimited     unlimited
SAVED SEARCHES  —              5             unlimited     unlimited
SEATS           1              1             3             10
WORKSPACE       —              —             ✓             ✓
API ACCESS      —              —             read-only     full
TEMPLATES       3 defaults     3 defaults    custom        custom
WHITE-LABEL     —              —             —             ✓
SUPPORT         email          email         priority      Slack/Discord
```

---

## Key Design Rules

1. **Searches are free reconnaissance.** No limit, no deduction, no cost to user. Run 50 searches — only pay for audits.
2. **Audits are the metered action.** Deducted atomically via PostgreSQL RPC when a performance audit or design analysis runs on a persisted lead.
3. **No artificial caps.** Pipeline storage is cheap — unlimited on paid tiers. Saved searches capped on Solo (5) purely as tier differentiator.
4. **Features differentiate tiers, not limits.** Seats, team workspace, API access, custom templates, white-label — these are the upgrade drivers.

---

## Edge Cases

| Feature | Detail |
|---------|--------|
| Overage | $0.50/audit beyond plan limit |
| Booster pack | 100 audits, one-time $19 |
| Extra seats | $20/mo per seat on any paid plan |
| Annual discount | ~17% off (2 months free) |
| Money-back | 14-day guarantee on first payment |
| Downgrade | Allowed mid-cycle, takes effect next billing |

---

## Implementation

### Backend

| File | Purpose |
|------|---------|
| [`src/lib/dodo.ts`](../src/lib/dodo.ts) | Product → tier mapping, `PlanTier` type, `FREE_TRIAL_AUDIT_LIMIT` (20) |
| [`src/lib/tier-features.ts`](../src/lib/tier-features.ts) | Single source of truth for all tier capabilities |
| [`src/lib/credits.ts`](../src/lib/credits.ts) | `checkAudit`, `deductAudit`, `refundAudit` — atomic PostgreSQL operations |
| [`src/lib/products.ts`](../src/lib/products.ts) | Validates 6 Dodo product IDs |
| [`src/lib/rate-limit.ts`](../src/lib/rate-limit.ts) | `anonymousAuditLimiter` — 3/week per IP |
| [`src/app/api/quick-audit/route.ts`](../src/app/api/quick-audit/route.ts) | Public endpoint, PageSpeed only, returns partial results |
| [`scripts/migrate-pricing-overhaul.sql`](../scripts/migrate-pricing-overhaul.sql) | Updates RPC functions for new tiers + unlimited searches |

### API Routes (updated)

| Route | Change |
|-------|--------|
| [`discover/route.ts`](../src/app/api/discover/route.ts) | Search limit checks removed entirely |
| [`audit/route.ts`](../src/app/api/audit/route.ts) | `checkAudit`/`deductAudit` naming, new error messages |
| [`analyze-design/route.ts`](../src/app/api/analyze-design/route.ts) | Same |
| [`webhooks/dodo/route.ts`](../src/app/api/webhooks/dodo/route.ts) | Cancel → `free_trial`, uses `FREE_TRIAL_AUDIT_LIMIT` |
| [`check-subscription/route.ts`](../src/app/api/check-subscription/route.ts) | Clean tier handling |
| [`auth/callback/route.ts`](../src/app/auth/callback/route.ts) | New users → `free_trial` |

### Frontend

| Component | Shows |
|-----------|-------|
| [`Pricing.tsx`](../src/components/landing/Pricing.tsx) | 4-column grid, annual toggle, anchor value statement |
| [`QuickAuditSection.tsx`](../src/components/landing/QuickAuditSection.tsx) | URL input, score + top 4 issues free, signup gate |
| [`CreditsWidget.tsx`](../src/components/ui/CreditsWidget.tsx) | Sidebar: tier label, audit usage bar |
| [`settings/page.tsx`](../src/app/dashboard/settings/page.tsx) | Upgrade buttons, usage display, tier colors |

### Legal

| Page | Update |
|------|--------|
| [`terms/page.tsx`](../src/app/terms/page.tsx) | 4 tiers with limits |
| [`privacy/page.tsx`](../src/app/privacy/page.tsx) | "Solo, Agency, and Scale" |
| [`CTASection.tsx`](../src/components/landing/CTASection.tsx) | "20 free audits" |

---

## Env Vars

All 12 variables set in `.env.local`:

```
DODO_PRODUCT_SOLO_MONTHLY      = pdt_0NgKrmYBX9pAp9NhbeMqp
DODO_PRODUCT_SOLO_ANNUAL       = pdt_0NgKs5x6MXKvmMOQemKP2
DODO_PRODUCT_AGENCY_MONTHLY    = pdt_0NgKsF0ROmm9U603GRqMm
DODO_PRODUCT_AGENCY_ANNUAL     = pdt_0NgKsQO5UXCVGZskhrv89
DODO_PRODUCT_SCALE_MONTHLY     = pdt_0NhKvqNpqaZMYDq7sx4vy
DODO_PRODUCT_SCALE_ANNUAL      = pdt_0NhKw2lUTXdOlXshALq9C

NEXT_PUBLIC_DODO_PRODUCT_*     = same IDs (for client-side)
```

---

## Quick Audit (Anonymous)

Placed after hero on landing page. User pastes URL → gets score + top 4 issues. Full audit (revenue estimates, pitch angles, competitor data) gated behind signup.

**Cost:** $0 per scan — uses Google PageSpeed Insights free API (25,000/day quota).

**Rate limit:** 3 scans per week per IP via Upstash Redis.
