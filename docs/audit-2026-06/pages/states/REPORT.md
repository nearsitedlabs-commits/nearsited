# Component States Audit
**Date:** 2026-06-18 · **Auditor:** Claude Code (Prompt 17) · **Source analysis** (no Playwright)

---

## Executive Summary

State handling in Nearsited is structurally well-provisioned: `loading.tsx` files exist for all primary dashboard routes, `error.tsx` files cover most routes, and the canonical `EmptyState`, `LoadingState`, and `ErrorState` components provide reusable primitives. The application handles partial analysis data (no audit/no design/no UX) gracefully within the lead detail page, and the `AIQuotaBanner` is a good example of a nuanced rate-limit state.

The three most significant gaps are: (1) three high-traffic pages lack `error.tsx` fallbacks (`/dashboard/leads/[id]`, `/dashboard/discover`, `/dashboard/audit`); (2) there is no design for offline or network-loss states anywhere in the product; (3) disabled state styling is inconsistent across inline buttons — some lack `cursor-not-allowed`, and a few lack `disabled:pointer-events-none`, meaning double-submission is possible.

---

## Critical Issues

### C1 — `/dashboard/leads/[id]` has no `error.tsx`
**Expected file:** `src/app/dashboard/leads/[id]/error.tsx`

The lead detail page is the deepest, most complex page in the app — 1492-line `lead-detail-client.tsx`, three workflow branches, async analysis calls, Gemini API calls. Any uncaught exception during data fetching or render throws to the nearest error boundary. Without `error.tsx`, it bubbles up to the parent route's error boundary — which shows a generic dashboard error, losing all the lead context.

**Impact:** Any server error during lead fetch shows a completely generic error page with no "Return to Opportunities" link, no lead name context.

**Fix:** Add `src/app/dashboard/leads/[id]/error.tsx` with lead-context-aware messaging and "Back to Opportunities" as the primary action.

### C2 — `/dashboard/discover` has no `error.tsx`
**Expected file:** `src/app/dashboard/discover/error.tsx`

The discover page makes external API calls (Google Places, geocoding, places_cache). Any uncaught server error during NDJSON streaming or initial data fetch throws to the parent. The NDJSON stream itself handles in-stream errors gracefully, but any pre-stream or server-render error has no fallback.

**Fix:** Add `src/app/dashboard/discover/error.tsx` with a "Try a different search" CTA and instructions for checking the API key.

### C3 — `/dashboard/audit` has no `error.tsx`
**Expected file:** `src/app/dashboard/audit/error.tsx`

The quick audit page calls PageSpeed API (60s timeout), ScreenshotCore (15s timeout), and Gemini (30s timeout). Any uncaught server error or timeout throws to parent. No error boundary catches it at the page level.

**Fix:** Add `src/app/dashboard/audit/error.tsx` with "Check the URL and try again" messaging.

---

## High Priority (fix within 2 weeks)

### H1 — No offline / network-loss state anywhere in the product
BASELINE.md §4 marks all offline states as `❓` (unknown). Source code confirms: zero instances of `navigator.onLine` checks, ServiceWorker fetch-with-fallback patterns, or retry-on-reconnect logic.

**Current behavior on network loss:**
- Discover search: the `fetch()` to `/api/discover` will error — the NDJSON reader will catch it and show an inline error. This is acceptable but accidental.
- Audit run: fetch to `/api/audit` fails — the `AbortController` may not catch a network drop (it catches timeouts, not disconnects). The user may see a frozen progress panel.
- Lead Detail audit/design buttons: fetch fails silently in `useLeadAnalysis` hook or triggers the error state in the analysis hook.
- Auth pages: form submit fails silently or shows an undifferentiated error.

No page shows a branded "You appear to be offline — check your connection" state. This is a P1 for a product that requires live API calls to function.

**Minimum fix:** Add a `useOnline()` hook that checks `navigator.onLine` + `online`/`offline` events, and render a toast or banner when the user goes offline during an active operation.

### H2 — `SkeletonLoader` component uses non-token border radii
**File:** [src/app/dashboard/settings/loading.tsx](src/app/dashboard/settings/loading.tsx), [src/app/dashboard/templates/loading.tsx](src/app/dashboard/templates/loading.tsx)

```tsx
<SkeletonLoader width="100px" height="12px" radius="4px" />
<SkeletonLoader ... radius="8px" />
<SkeletonLoader ... radius="12px" />
<SkeletonLoader ... radius="999px" />
```

The allowed radii are `--radius-sm: 6px` and `--radius-md: 10px`. `4px`, `8px`, and `12px` are all non-canonical. This means the loading state shapes don't match the shapes of the actual elements they're placeholding.

**Fix:** Constrain SkeletonLoader's `radius` prop to `"sm" | "md" | "pill"` that maps to the design tokens.

### H3 — Disabled state implementation is inconsistent across inline buttons

Looking at inline button patterns across the codebase:

**Good (Button.tsx standard):**
```
disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
```

**Inconsistent (inline buttons):**
- `settings/page.tsx:155-156`: `disabled:opacity-50` — **no `cursor-not-allowed`**
- `settings/page.tsx:567`: `disabled={emailLoading || !newEmail.trim()}` with no disabled class styling
- `settings/page.tsx:696-697`: `disabled={...}` but class only has `disabled:opacity-50`
- `LandingFooter.tsx:107`: `disabled:opacity-50` — no `cursor-not-allowed`

Without `disabled:cursor-not-allowed`, a disabled button shows a text cursor on hover — visually ambiguous. Without `disabled:pointer-events-none`, JavaScript `click` handlers may still fire if the button is triggered programmatically.

**Fix:** Add a shared disabled class string to use across all inline buttons, or replace these with `<Button>` component uses.

### H4 — Settings page has hand-crafted loading state instead of using `LoadingState`
**File:** [src/app/dashboard/settings/page.tsx:514](src/app/dashboard/settings/page.tsx#L514)

```tsx
<div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8 animate-pulse space-y-4">
```

The settings page renders an `animate-pulse` div for its client-side loading state. This doesn't use `SkeletonLoader`, `LoadingState`, or `.skeleton` — it's a plain pulse. This is the third different loading animation in the product (see Animation report C2).

### H5 — `LoadingState` component has 46px fixed height on skeleton rows
**File:** [src/components/ui/LoadingState.tsx:17](src/components/ui/LoadingState.tsx#L17)

```tsx
style={{ height: 46 }}
```

The CLAUDE.md row height spec is 42–48px (desktop). 46px is within range but hardcoded as inline style, bypassing the spacing scale. The mobile spec is 56px minimum. `LoadingState` doesn't adapt its skeleton row height for mobile — the loading placeholder will be shorter than the actual mobile list rows it's replacing.

---

## Medium Priority (fix when refactoring nearby)

### M1 — No `useOptimistic` / React 19 optimistic updates in pipeline status changes
**File:** [src/app/dashboard/leads/[id]/lead-detail-client.tsx](src/app/dashboard/leads/[id]/lead-detail-client.tsx)

The pipeline status dropdown uses local `useState` to optimistically update the UI before the API call completes — the right intent. But this is manual optimistic state rather than React 19's `useOptimistic` hook, which handles rollback on error automatically.

Current approach: if the PATCH to `/api/pipeline` fails, the local state is already changed and there's no rollback. The user sees the new status but the database still has the old one.

**Fix:** Use `useOptimistic` with rollback on error, or add explicit error handling that reverts `currentPipelineStatus` to the previous value on PATCH failure.

### M2 — `EmptyState` component has no icon — but per-page empty states add their own
**File:** [src/components/ui/EmptyState.tsx:18-29](src/components/ui/EmptyState.tsx#L18)

The canonical `EmptyState` component has no icon — correct per Rule B. But `LeadsEmptyState.tsx` and `dashboard-client.tsx`'s empty state add custom content above `EmptyState`, creating inconsistency in empty state visual structure across pages. Acceptable, but worth noting for the master report.

### M3 — Error states in `error.tsx` files all use the same template with no page context
All 7 `error.tsx` files render identical markup:
```
AlertTriangle icon → "Something went wrong" → "Please try again or contact support" → "Try Again" button
```

None include:
- The name of the page that failed (the user may not know where they are)
- Contextual recovery actions (e.g., error on Pipeline page should link to Pipeline, not just reload)
- Any distinction between server error vs. connection error vs. auth error

**Fix:** Customize the error message and recovery action per route. At minimum, the "Try Again" button should navigate to the page root rather than just reloading.

### M4 — Auth pages have no loading/error boundary for the form itself
Login and signup pages show inline form errors (via `AuthCard`) and inline loading states (`Loader2` spinner on submit button). There's no page-level loading or error component — acceptable for auth pages. But if the Supabase `auth.signInWithPassword()` call throws an unhandled exception (e.g., network timeout beyond the API's timeout), the error propagates to Next.js error page with no auth-specific context.

### M5 — Progress states during analysis don't have timeout error states
**Files:** [src/app/dashboard/leads/[id]/components/AnalysisProgressBanner.tsx](src/app/dashboard/leads/[id]/components/AnalysisProgressBanner.tsx), [src/app/dashboard/audit/components/AuditProgressPanel.tsx](src/app/dashboard/audit/components/AuditProgressPanel.tsx)

Both progress panels show a "Cancel" button but no timeout-aware error state. If the server-side AbortController triggers at 60s (PageSpeed) and the stream ends with `{"type":"error","message":"..."}`, the client receives the error. But if the browser connection itself times out (different from the server's AbortController), the stream may just close without an error event. The client would show a forever-spinning progress panel.

**Fix:** Add a client-side 90s maximum timeout on the fetch itself, with explicit error state if exceeded.

### M6 — `LeadsTable` has no error state if row-level actions fail
**File:** [src/app/dashboard/leads/components/LeadsTable.tsx](src/app/dashboard/leads/components/LeadsTable.tsx)

Pipeline status change and add-to-pipeline actions in the table use `window.location.href` navigation (confirmed in previous audits). These don't have error state — if the navigation fails or the pipeline API call fails, the user sees no feedback.

---

## Low Priority / Nice-to-have

### L1 — `error.tsx` files all use `bg-red-500/10` icon container (color token issue)
Already flagged in the Color audit as H1. Noted here for cross-reference — this is also a state UX issue because the error icon color (`#ef4444`) doesn't match `--color-danger` (#c4665a).

### L2 — No skeleton for the lead detail hero section
The `loading.tsx` for `/dashboard/leads/[id]` shows generic skeleton cards but not a skeleton that matches the `LeadHeaderStrip` structure (business name + address chips + action buttons). The loading state shape diverges significantly from the loaded content structure.

### L3 — No "rate limited" state design for Google Places API
`/api/discover` calls Google Places. If Places API rate limit (429) is hit, the NDJSON stream sends `{"type":"error"}`. The Discover page shows this as a generic error, not "Google Places rate limit reached — wait a few minutes." A contextual state here would be valuable.

### L4 — `ContactInfo` loading state in LeadHeroSection has two states (loading dot vs contact data)
The contact info fetch shows a pulsing dot when loading. This is subtle — a skeleton placeholder matching the layout would be clearer.

### L5 — `LeadsKPIStrip.tsx` has no loading state for its counts
**File:** [src/app/dashboard/leads/components/LeadsKPIStrip.tsx](src/app/dashboard/leads/components/LeadsKPIStrip.tsx)

The KPI strip above the leads table shows counts. If the server-rendered data isn't ready, it likely renders 0 or nothing. No skeleton placeholder for these metrics.

---

## What's Actually Good

- **`loading.tsx` for all primary routes** ✅ — Every dashboard page has a `loading.tsx` (dashboard, leads, leads/[id], discover, audit, pipeline, pitches, settings, radar, templates, auth pages).
- **`error.tsx` for most routes** ✅ — 7 of 10 dashboard-area routes have error boundaries.
- **`aria-busy="true" aria-label="Loading"` on `LoadingState`** ✅ — Correct ARIA live region semantics.
- **`AIQuotaBanner`** — exemplary state design for the rate-limit condition. Shows countdown, auto-retry logic, and fallback to Flash-Lite model. Clear, actionable, non-blocking.
- **`AnalysisProgressBanner`** — 9-step progress checklist with real-time updates during analysis. User always knows where they are in the process.
- **Partial analysis state handled** — Lead Detail correctly renders with zero, one, or both of audit/design data. Score rings show `variant="estimated"` (dotted) when no real data. No "all or nothing" requirement.
- **`disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none`** in `Button.tsx` ✅ — The canonical component handles all three disabled aspects correctly.
- **`LeadsEmptyState.tsx`** — multi-state empty state (different content per active filter tab) is well-thought-out.
- **No silent errors** on API routes that return `persisted: false` per CLAUDE.md Rule 3 — server-side failures surface to the client.
- **NDJSON stream error handling** — `readNdjsonStream()` in `src/lib/ndjson.ts` catches parse errors and surfaced stream errors.
- **`AbortController` on all external API calls** — PageSpeed 60s, ScreenshotCore 15s, Gemini 30s. No hanging routes.

---

## Quality Scorecard

| Criterion | Score | Notes |
|---|---|---|
| Loading state coverage | 8/10 | loading.tsx on all routes; inconsistent skeleton implementations |
| Error boundary coverage | 6/10 | 7/10 routes have error.tsx; 3 critical gaps |
| Empty state design | 7/10 | Consistent canonical component; per-page variants vary |
| Disabled state consistency | 6/10 | Button.tsx excellent; inline buttons inconsistent |
| Offline/network-loss state | 0/10 | No offline state anywhere in the product |
| Optimistic updates | 4/10 | Manual optimistic state without rollback |
| Rate-limit state | 7/10 | AIQuotaBanner excellent; Places API limit unhandled |
| Partial data state | 8/10 | Lead detail handles partial analysis well |
| Progress state during async ops | 7/10 | AnalysisProgressBanner good; no client-side timeout |
| **Overall** | **6/10** | Good coverage; offline gap and 3 missing error.tsx are critical |
