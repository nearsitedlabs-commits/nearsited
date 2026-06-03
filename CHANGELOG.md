# Nearsited — Change Log
*Session: Launch Readiness Audit + Scoring Unification · June 2026*

---

## 1. src/app/page.tsx — Landing Page

- Hero trust bar + CTA: "Audit **100** businesses free" → "Audit **50** businesses free" (3 placements)
- Footer: removed dead "Blog" link; "Contact" now links to `mailto:nearsitedlabs@gmail.com`
- Hero opportunity feed: `ScoreRing score={41}` → `score={87} variant="opportunity"` (shows opportunity score, not quality score)
- Sample report badge: `<Badge color="amber">Score: 41/100</Badge>` → `<Badge color="green">Opportunity: 87/100</Badge>`
- FAQ Q3 answer: "leads scoring below 50 convert at 3× the rate of leads above 70" → "leads with an opportunity score above 70 convert at 3× the rate of those below 30"
- All `hello@nearsited.com` references → `nearsitedlabs@gmail.com`

---

## 2. src/app/dashboard/layout.tsx — Dashboard Shell

- Credits widget: replaced hardcoded "50 / 50" and full progress bar with "Free Beta · Full access · Paid plans launching soon"
- User plan label: "Starter · Trial" → "Free Beta"
- Removed "Upgrade plan →" button from credits widget
- Added email verification gate: `if (!user.email_confirmed_at) redirect("/signup?verify=1")`

---

## 3. src/app/terms/page.tsx — Terms of Service

- Section 3 renamed "Payments & Subscriptions" → "Beta Access & Future Billing"
- Removed false auto-billing claim: "your subscription automatically converts to the paid Starter plan at $19/month. Payments are processed securely by Lemon Squeezy."
- Replaced with honest free-beta language: "Paid plans launching soon; you will never be charged without explicit opt-in; indicative pricing shown for planning purposes; early beta users receive preferential pricing"
- Email: `hello@nearsited.com` → `nearsitedlabs@gmail.com`

---

## 4. src/app/privacy/page.tsx — Privacy Policy

- Section 5 (Your Rights): removed fabricated claim "You can export your data from the dashboard at any time" (feature doesn't exist); replaced with "email us within 30 days" process
- Email: `hello@nearsited.com` → `nearsitedlabs@gmail.com`

---

## 5. src/app/pricing/page.tsx — Pricing Page

- Email in footer: `hello@nearsited.com` → `nearsitedlabs@gmail.com`

---

## 6. src/app/api/pipeline/route.ts — Pipeline API

- Added `createAdminClient` import (server-side writes must bypass RLS per Rule 4)
- POST handler: pipeline `insert` now uses `createAdminClient()` instead of session client
- PATCH handler: added `"pitch_generated"` to `validStatuses` (was missing from canonical enum list); upsert insert fallback also uses `createAdminClient()`
- DELETE handler: rewrote broken query-chain pattern to clean single chain:
  ```ts
  .eq(businessId ? "business_id" : "id", (businessId ?? pipelineId) as string)
  ```

---

## 7. src/app/api/pitch/route.ts — Pitch Generation API

- Added `resolvedPerfScore: number | null = null` hoisted variable (scope fix)
- Persisted mode: assigns `resolvedPerfScore = perfScore` (DB-fetched score)
- Ephemeral desktop mode: assigns `resolvedPerfScore = perfScore`
- Ephemeral mobile-only mode: assigns `resolvedPerfScore = perfScore`
- `buildAngle()` call: replaced IIFE that always returned `null` in persisted mode with `buildAngle(leadType, resolvedPerfScore)` — fixes wrong pitch angle for all persisted leads

---

## 8. src/app/dashboard/settings/page.tsx — Settings Page

- Plan section: "Starter / Trial / 50 audits/mo / $19/mo after trial" → "Free Beta / Full access / Paid plans launching soon"
- Plan badge: "Trial" → "Beta"
- Upgrade button: "Upgrade to Agency — $49/mo →" removed; replaced with "See upcoming plans" link to `/pricing`
- Integrations section: hardcoded "Configured"/"Connected" status rows removed; replaced with honest paragraph + contact link
- Email: `hello@nearsited.com` → `nearsitedlabs@gmail.com`

---

## 9. src/app/(auth)/signup/page.tsx — Signup Page

- Added `useSearchParams` import
- Added `needsVerification` flag from `?verify=1` URL param (used by dashboard email-verification redirect)
- Added client-side password validation: passwords under 6 characters blocked with friendly message before Supabase call
- Success/verify screen: shows for both post-signup (`success`) and redirect-from-dashboard (`needsVerification`); copy adapts to each case

---

## 10. src/components/landing/Pricing.tsx — Pricing Component

- Removed "Compare plans side by side → /signup" button (was navigating to signup, not a comparison)
- Replaced with plain text: "Both plans include a 14-day free trial. No credit card required."
- Removed unused `ArrowRight` import

---

## 11. src/app/dashboard/discover/page.tsx — Opportunity Discovery Page

- Save search dialog: "Saved searches appear in Settings under Saved Searches" → "Saved searches appear in the search bar above"
- Filter tabs: added "Platform Only" tab; simplified filter logic to exact `website_status` match (previously "Has Website" silently included `platform_only`)
- `saveToSession()`: added `onQuotaExceeded?` callback; both result-save call sites now show a toast on storage quota exceeded instead of failing silently
- Outreach tooltip: "score below 50 on performance or design after auditing" → "score as a high opportunity after analysis"
- Helper note: "Analyse any business for the verified score" → "Analyse any business for the verified opportunity score"
- Added `computeOpportunityScore` to import from `@/lib/scoring`
- Sort by "Estimated Opportunity": for audited businesses now uses `computeOpportunityScore(performance_score, reviews, rating)` instead of raw `performance_score` — fixes reversed sort (bad sites now rank first, not last)
- ScoreRing for audited businesses: shows opportunity score (not quality score); variant `"verified"` → `"opportunity"`

---

## 12. src/lib/scoring.ts — Scoring Library

- `estimatedOpportunity()` redesign weights reordered to match product positioning:

  | Status | Old weight | New weight | Reason |
  |---|---|---|---|
  | `no_website` | 0.40 | **0.95** | Biggest opportunity per product positioning |
  | `social_only` | 0.50 | **0.85** | High-value pitch: owns no platform |
  | `platform_only` | 0.70 | **0.75** | Good pitch: renting on third-party |
  | `has_website` + HTTP | 0.90 | **0.65** | Reduced from top; still strong signal |
  | `has_website` + Wix/GoDaddy | 0.80 | **0.60** | Good redesign candidate |
  | `has_website` + generic | 0.50 | **0.40** | Lowest — unknown quality |

---

## 13. src/app/dashboard/leads/page.tsx — Opportunities Page

- Filter tab "Strong Opportunity" tooltip corrected: was "Leads with score ≥ 70" (good sites!) → "websites scoring below 40 (very weak)" (bad sites)
- "Strong Opportunity" filter logic: `s >= 70` → `s < 40` (was completely backwards)
- Sort by "Opportunity": uses `effectiveOpportunityScore()` instead of `effectiveScore()` — fixes reversed sort
- Desktop table ScoreRing: shows `effectiveOpportunityScore(lead)`, `variant={audited_at ? "opportunity" : "estimate"}`
- Mobile card ScoreRing: same change
- Table column header: "Score" → "Opportunity"

---

## 14. src/components/ui/ScoreRing.tsx — Score Ring Component

- Added `variant="opportunity"`: solid ring (like `verified`) with opportunity-score thresholds:
  - `< 40` → red (`var(--score-high)`)
  - `< 70` → amber (`var(--score-mid)`)
  - `≥ 70` → green (`var(--score-good)`)
- Existing `verified` variant (quality-score thresholds ≤55=red, ≤74=amber) unchanged — still used in Lead Detail, Audit, Share pages
- Updated JSDoc comment to document all three variants and their intended contexts

---

## 15. src/app/dashboard/pipeline/page.tsx — Pipeline Page

- Added `computeOpportunityScore` import from `@/lib/scoring`
- `getOpportunityContext()` rewritten: replaced quality-score framing "Score 42 → 67 · +25 pts" with opportunity-score framing "High opportunity · site score 42/100"

---

## 16. docs/legal/TERMS_OF_SERVICE.md

- Email: `hello@nearsited.com` → `nearsitedlabs@gmail.com` (2 occurrences)

---

## 17. docs/legal/PRIVACY_POLICY.md

- Email: `hello@nearsited.com` → `nearsitedlabs@gmail.com` (2 occurrences)

---

## Files intentionally NOT changed

| File | Reason |
|---|---|
| `src/app/dashboard/leads/[id]/lead-detail-client.tsx` | Quality sub-scores (Performance, SEO, Design) are correct in analysis context |
| `src/app/dashboard/audit/page.tsx` | Same — quality scores in analysis/breakdown context |
| `src/app/share/[token]/page.tsx` | Public share report uses quality sub-scores correctly |
| `src/app/dashboard/pitches/page.tsx` | Already uses opportunity framing in context labels |
| `src/app/dashboard/dashboard-client.tsx` | Already uses `opportunityLabel()` correctly |

---

## Outstanding (not in scope this session)

- **Billing integration** — Lemon Squeezy onboarding in progress; blocks first revenue
- **Rate limiting** — implement per-user throttle on `/api/audit`, `/api/analyze-design`, `/api/pitch`, `/api/discover`; will naturally double as credit enforcement gate once billing ships
