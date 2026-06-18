# State Coverage — Proposed Fixes
**Date:** 2026-06-18T03:37:13.628Z · **Auditor:** Playwright (Prompt 17)

---

## Critical Gaps

### C1 — Add offline/online detection
**Current:** No `navigator.onLine` checks, no offline banner, no retry-on-reconnect logic.

**Proposed:**
```tsx
// src/lib/useOnline.ts
export function useOnline(): boolean {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  return online;
}
```

Render a dismissable banner when offline during active operations.

### C2 — Add error.tsx for 3 critical pages
- `/dashboard/leads/[id]/error.tsx` — Lead-context-aware error with "Back to Opportunities"
- `/dashboard/discover/error.tsx` — "Try a different search" CTA
- `/dashboard/audit/error.tsx` — "Check the URL and try again"

### C3 — Fix disabled state consistency
Add `disabled:cursor-not-allowed disabled:pointer-events-none` to all inline buttons that are missing these classes.

---

## Medium Priority

- Add page-context-aware error messages (`error.tsx` templates are generic)
- Fix `LoadingState` row height (46px hardcoded; should adapt for mobile 56px)
- Replace hand-crafted `animate-pulse` loading in settings page with `LoadingState` or `.skeleton`
- Add `aria-live` region to error banners for screen reader announcements

---

## Coverage Scorecard

| State Type | Coverage | Priority |
|-----------|:--------:|:--------:|
| Loading (RSC) | 8/10 | ✅ Good |
| Error boundary | 7/10 | ⚠️ Add 3 missing |
| Empty state | 6/10 | ⚠️ Inconsistent per page |
| 404 (custom) | 10/10 | ✅ Excellent |
| Offline | 0/10 | 🔴 Critical gap |
| Auth guard | 9/10 | ✅ Middleware correct |
| Disabled | 6/10 | ⚠️ Inline buttons inconsistent |
