# Performance Audit — Proposed Fixes
**Date:** 2026-06-18T03:37:13.655Z · **Auditor:** Playwright (Prompt 20)

---

## Executive Summary

Nearsited's performance is conservatively built with strong foundations: `next/font` self-hosts Geist, `optimizePackageImports` tree-shakes heavy dependencies, NDJSON streaming keeps long operations responsive, and `AbortController` timeouts prevent hanging routes. The two main opportunities are removing Framer Motion from the dashboard bundle and cleaning up the unused `recharts` dependency.

---

## Bundle Analysis

| Metric | Value |
|--------|-------|
| JS chunks per page | ~5-8 |
| Largest JS chunk | ~40KB (framer-motion in dashboard) |
| `optimizePackageImports` | lucide-react, framer-motion, recharts |

### Key Finding: recharts unused
`recharts` is listed in `optimizePackageImports` but is **never imported** anywhere in the codebase. It adds 0KB to runtime bundles but is dead configuration.

### Key Finding: Framer Motion in dashboard
`@/lib/motion` is imported by `Card.tsx`, which transitively pulls Framer Motion (~40KB gzipped) into every dashboard page bundle. Most dashboard animations are simple CSS transitions that don't need Framer Motion.

---

## Font Loading

| Font | Strategy | Status |
|------|----------|:------:|
| Geist (sans) | `next/font/google` → self-hosted, `display: swap` | ✅ Correct |
| Geist Mono | `next/font/google` → self-hosted | ✅ Correct |
| Switzer | Declared in CLAUDE.md | ❌ Not loaded anywhere |

---

## Image Optimization

| Metric | Value |
|--------|-------|
| Total images on landing | ~5-10 |
| Images using `next/image` | ~90% |
| Lazy loaded | ~80% |
| Explicit `sizes` prop | Most images missing `sizes` |

---

## Proposed Fixes

1. **Remove `recharts`** from `optimizePackageImports` (and `package.json` if not planned)
2. **Replace `motion.div` in `Card.tsx`** with CSS `transition-transform` to remove Framer Motion from dashboard bundle (~40KB saving)
3. **Add `sizes` prop** to `next/image` logo renders (sidebar, header)
4. **Add `<link rel="preconnect">`** for Supabase WebSocket URL
5. **Verify `dynamic()` imports** have correct `ssr` flag

---

## Performance Scorecard

| Criterion | Score | Notes |
|-----------|:-----:|-------|
| JavaScript bundle | 6/10 | Framer Motion in dashboard; recharts listed unused |
| Image optimization | 7/10 | next/image used; sizes prop missing on key images |
| Font loading | 8/10 | next/font self-hosting correct; Switzer missing |
| API streaming | 9/10 | NDJSON on all long routes |
| Caching | 9/10 | 7-day cache on audit/design results |
| Security headers | 9/10 | Comprehensive CSP, HSTS, etc. |
| **Overall** | **7.5/10** | Strong server-side; client bundle can be optimized |
