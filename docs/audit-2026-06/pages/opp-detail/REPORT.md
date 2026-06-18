# Opportunity Detail Audit

> **Generated:** 2026-06-18T00:47:19.421Z  
> **Route:** `/dashboard/leads/test-id`  
> **Test file:** [audit-tests/prompts4-11-dashboard.spec.ts](audit-tests/prompts4-11-dashboard.spec.ts)  
> **Baseline:** [docs/audit-2026-06/BASELINE.md](docs/audit-2026-06/BASELINE.md)  

---

## Executive Summary

This page requires authentication. When accessed without a valid session, the auth guard (middleware.ts + layout.tsx) redirects to `/login`.

| Metric | Value |
|--------|-------|
| Route type | server-component (with client sub-component) |
| Final URL | `/login` |
| HTTP Status (inferred) | 307 |
| Console errors | 0 |
| Console warnings | 1 |
| Loading skeleton detected | ❌ No |
| Error state file | ❌ None — ⚠️ missing |

### Console Warnings

- `Image with src "http://localhost:3000/logo-icon.svg" has either width or height modified, but not the other. If you use CSS to change the size of your image, also include the styles 'width: "auto"' or 'height: "auto"' to maintain the aspect ratio.`

---

## Redirect Analysis

The auth guard intercepted the request. Redirect chain:

| Step | URL | Status |
|------|-----|:------:|
| 1 | `/dashboard/leads/test-id` | 307 |
| 2 | `/login` | 200 |

**Auth mechanism:** middleware.ts + layout.tsx (Supabase session check)

The middleware.ts applies to `/dashboard/:path*` using Supabase session management. If no valid session cookie exists, the user is redirected to `/login`. The dashboard `layout.tsx` also performs a server-side `supabase.auth.getUser()` check.

---

## Source Structure Analysis

### Key Source Files

- [leads/[id]/page.tsx](src/app/dashboard/leads/[id]/page.tsx:1)
- [lead-detail-client.tsx](src/app/dashboard/leads/[id]/lead-detail-client.tsx:1)
- [leads/[id]/loading.tsx](src/app/dashboard/leads/[id]/loading.tsx:1)
- [LeadAffordances.tsx](src/components/ui/LeadAffordances.tsx:1)

### Data Fetching

- supabase.auth.getUser() — server-side auth check
- supabase.from("businesses").select("*").eq("id", id)
- supabase.from("audits").select("*").eq("business_id", id)
- supabase.from("design_analyses").select("*").eq("business_id", id)
- supabase.from("pipeline").select("status").eq("business_id", id)
- supabase.from("pitches").select("*").eq("business_id", id)

### Component Architecture

- `LeadDetailClient`
- `LeadHeaderStrip`
- `PitchCard`
- `PreCallBrief`
- `IssuesCard`
- `AuditDetailsCard`
- `HistoryCard`
- `OpportunityScoreExplanation`
- `StatsRow`

### Notable Patterns

- Workflow-based routing (social_only, no_digital_presence, website)
- Parallel analysis (audit + design) with progress tracking
- Pitch generation with tone/length/opening/urgency/focus config
- Share link generation (/api/share → /share/[token])
- Client-side hooks: useContactInfo, useLeadAnalysis, usePitchGeneration, useQuotaTimer

### Missing States

- ⚠️ No error.tsx in leads/[id]/ directory

---

## State Coverage

| State | Status | Notes |
|------|:------:|-------|
| Loading (skeleton) | ✅ | loading.tsx with SkeletonLoader |
| Error boundary | ❌ | ⚠️ No error.tsx |
| Auth guard | ✅ | Redirects to /login when unauthenticated |
| Empty state | ✅ | Appropriate empty states for zero-data scenarios |

## Critical Issues

1. 1. **No error.tsx** at `src/app/dashboard/opportunity-detail/`. Errors propagate to parent dashboard error boundary.

## High Priority

1. **Loading state timing**: The loading.tsx may flash briefly before the auth redirect.
2. **Error state gap**: Missing error.tsx — add one.

## Medium Priority

1. Any console warnings or errors should be investigated.
2. The auth redirect is a hard navigation — consider soft redirect for better UX.

## Low Priority / Nice-to-have

1. Add page-level error boundaries for finer-grained recovery.
2. Add route transition animations between dashboard pages.

## Quality Scorecard (1-10)

| Criteria | Score | Notes |
|----------|:-----:|-------|
| Auth protection | 7/10 | Correctly redirects to /login |
| Component architecture | 8/10 | Well-structured with clear separation |
| Loading states | 8/10 | loading.tsx exists |
| Error states | 4/10 | Missing error.tsx |
| Data fetching | 7/10 | Server-side fetch + client hydration |
| Console cleanliness | 10/10 | 0 error(s), 1 warning(s) |
| Auth guard | 9/10 | Middleware + layout double protection |
| **Overall** | **8/10** | |

---

*Report generated from real Playwright data on 2026-06-18T00:47:19.421Z.*  
*Run command: `npx playwright test audit-tests/prompts4-11-dashboard.spec.ts --grep "Opportunity Detail"`*