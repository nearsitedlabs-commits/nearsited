# Pitches Audit

> **Generated:** 2026-06-18T00:47:19.500Z  
> **Route:** `/dashboard/pitches`  
> **Test file:** [audit-tests/prompts4-11-dashboard.spec.ts](audit-tests/prompts4-11-dashboard.spec.ts)  
> **Baseline:** [docs/audit-2026-06/BASELINE.md](docs/audit-2026-06/BASELINE.md)  

---

## Executive Summary

This page requires authentication. When accessed without a valid session, the auth guard (middleware.ts + layout.tsx) redirects to `/login`.

| Metric | Value |
|--------|-------|
| Route type | client |
| Final URL | `/login` |
| HTTP Status (inferred) | 307 |
| Console errors | 0 |
| Console warnings | 1 |
| Loading skeleton detected | ❌ No |
| Error state file | ✅ `error.tsx` exists |

### Console Warnings

- `Image with src "http://localhost:3000/logo-icon.svg" has either width or height modified, but not the other. If you use CSS to change the size of your image, also include the styles 'width: "auto"' or 'height: "auto"' to maintain the aspect ratio.`

---

## Redirect Analysis

The auth guard intercepted the request. Redirect chain:

| Step | URL | Status |
|------|-----|:------:|
| 1 | `/dashboard/pitches` | 307 |
| 2 | `/login` | 200 |

**Auth mechanism:** middleware.ts + layout.tsx (Supabase session check)

The middleware.ts applies to `/dashboard/:path*` using Supabase session management. If no valid session cookie exists, the user is redirected to `/login`. The dashboard `layout.tsx` also performs a server-side `supabase.auth.getUser()` check.

---

## Source Structure Analysis

### Key Source Files

- [pitches/page.tsx](src/app/dashboard/pitches/page.tsx:1)
- [pitches/loading.tsx](src/app/dashboard/pitches/loading.tsx:1)
- [pitches/error.tsx](src/app/dashboard/pitches/error.tsx:1)
- [ScoreRing.tsx](src/components/ui/ScoreRing.tsx:1)
- [ScoreCircle.tsx](src/components/ui/ScoreCircle.tsx:1)

### Data Fetching

- supabase.from("pitches").select(joined query)
- supabase.from("pipeline").select("business_id, status")
- POST /api/pipeline — add to pipeline
- DELETE /api/pipeline — remove from pipeline

### Component Architecture

- `WebsiteStatusPill`
- `Toast`
- `BottomSheet`
- `ErrorState`

### Notable Patterns

- Live pipeline status map alongside pitches
- Filter chips (all, has_website, no_website, social_only, platform_only)
- Channel-aware actions (WhatsApp vs Email)
- Delete confirmation with inline "Confirm" button
- Overflow menu (⋯) with regenerate, edit, pipeline, delete options

---

## State Coverage

| State | Status | Notes |
|------|:------:|-------|
| Loading (skeleton) | ✅ | loading.tsx with SkeletonLoader |
| Error boundary | ✅ | error.tsx exists |
| Auth guard | ✅ | Redirects to /login when unauthenticated |
| Empty state | ✅ | Appropriate empty states for zero-data scenarios |

## Critical Issues

No critical issues detected.

## High Priority

1. **Loading state timing**: The loading.tsx may flash briefly before the auth redirect.
2. **Error state gap**: Has error.tsx — verify coverage.

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
| Error states | 8/10 | Dedicated error.tsx |
| Data fetching | 7/10 | Client-side fetch |
| Console cleanliness | 10/10 | 0 error(s), 1 warning(s) |
| Auth guard | 9/10 | Middleware + layout double protection |
| **Overall** | **8/10** | |

---

*Report generated from real Playwright data on 2026-06-18T00:47:19.500Z.*  
*Run command: `npx playwright test audit-tests/prompts4-11-dashboard.spec.ts --grep "Pitches"`*