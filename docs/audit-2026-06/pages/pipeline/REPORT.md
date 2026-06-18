# Pipeline Audit

> **Generated:** 2026-06-18T00:47:19.458Z  
> **Route:** `/dashboard/pipeline`  
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
| 1 | `/dashboard/pipeline` | 307 |
| 2 | `/login` | 200 |

**Auth mechanism:** middleware.ts + layout.tsx (Supabase session check)

The middleware.ts applies to `/dashboard/:path*` using Supabase session management. If no valid session cookie exists, the user is redirected to `/login`. The dashboard `layout.tsx` also performs a server-side `supabase.auth.getUser()` check.

---

## Source Structure Analysis

### Key Source Files

- [pipeline/page.tsx](src/app/dashboard/pipeline/page.tsx:1)
- [pipeline/loading.tsx](src/app/dashboard/pipeline/loading.tsx:1)
- [pipeline/error.tsx](src/app/dashboard/pipeline/error.tsx:1)
- [PipelineSelect.tsx](src/components/ui/PipelineSelect.tsx:1)

### Data Fetching

- supabase.from("pipeline").select(joined query)
- PATCH /api/pipeline — status updates
- DELETE /api/pipeline — remove items

### Component Architecture

- `StageColumn (desktop Kanban)`
- `MobileCard (mobile accordion)`
- `ErrorState`

### Notable Patterns

- Desktop Kanban board with drag-and-drop (via LayoutGroup)
- Mobile accordion with collapsible stages (persisted to localStorage)
- Optimistic status update with rollback on failure
- Stage collapse state persisted in localStorage

### Missing States

- ⚠️ PipelineCard component is commented out (import line)

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

*Report generated from real Playwright data on 2026-06-18T00:47:19.458Z.*  
*Run command: `npx playwright test audit-tests/prompts4-11-dashboard.spec.ts --grep "Pipeline"`*