# Animation System — Proposed System
**Date:** 2026-06-18T03:37:13.541Z · **Auditor:** Playwright (Prompt 16)

---

## Executive Summary

Nearsited has a well-structured animation architecture centered on `src/lib/motion.tsx` with canonical duration/easing tokens in `globals.css`. The system uses Framer Motion for complex animations (staggered entrances, page transitions, sheet animations) and CSS transitions for simple interactions (hover, focus, color shifts).

---

## Animation Token Inventory

| Token | Value | Category |
|-------|-------|----------|
| `--duration-instant` | 80ms | Button press feedback |
| `--duration-quick` | .15s | Hover, focus, row highlight |
| `--duration-standard` | .25s | Modal entrance, layout changes |
| `--duration-deliberate` | .4s | Page entrances, large reveals |
| `--easing-standard` | ease-out | Most UI feedback |
| `--easing-emphasized` | cubic-bezier(.16, 1, .3, 1) | Entrances and reveals |

**Assessment:** Duration values (80/150/250/400ms) follow UX best practices for micro-interactions. The 80ms instant token enables sub-100ms feedback. All values are within the 100–300ms ideal range for UI feedback, with deliberate (400ms) reserved for larger transitions.

---

## Framer Motion Usage

- **`@/lib/motion`** — Single re-export point importing from `framer-motion`
- **Provided components:** `FadeUp`, `FadeIn`, `StaggerContainer`, `ScaleHover`, `PageTransition`
- **`Card.tsx`** — Uses `useReducedMotion()` and `motion.div` for animated entrances
- **`BottomSheet.tsx`** — Uses `motion.div` with `AnimatePresence` for sheet slide-up
- **Landing page sections** — `LandingHero`, `Pricing`, `HowItWorksSection`, `WhyNearsitedSection`, etc.
- **`Toast.tsx`** — Uses `motion.div` with `AnimatePresence` for enter/exit

---

## prefers-reduced-motion Compliance

| Component | JS-Level Check | CSS Fallback | Status |
|-----------|---------------|--------------|--------|
| `globals.css` @media | — | `animation-duration: 0.01ms !important` | ✅ Present |
| `Card.tsx` | `useReducedMotion()` → skips `motion.div` | CSS fallback | ✅ |
| `BottomSheet.tsx` | `useReducedMotion()` → duration=0 | CSS fallback | ✅ |
| `Button.tsx` | `useReducedMotion()` → static button | CSS fallback | ✅ |
| `Pricing.tsx` | `shouldReduce` check | CSS fallback | ✅ |
| `FadeUp`/ `FadeIn`/ `StaggerContainer` | ❌ No internal check | CSS fallback only | ⚠️ See C1 |

**C1:** The three animation primitives (`FadeUp`, `FadeIn`, `StaggerContainer`) don't check reduced-motion preferences internally. The CSS fallback suppresses the visual animation but the JS initial state (`opacity: 0, y: 12`) still applies before the CSS override takes effect.

---

## Skeleton Loading Systems

Three parallel skeleton systems exist:

1. **`SkeletonLoader`** (Framer Motion) — Opacity pulse via `animate: { opacity: [0.3, 0.5, 0.3] }`
2. **`.skeleton` CSS class** — Background-position shimmer via CSS `@keyframes`
3. **`animate-pulse` (Tailwind)** — CSS opacity pulse

**Recommendation:** Standardize on the `.skeleton` CSS class (compositor-only, respects `prefers-reduced-motion`, no Framer overhead).

---

## Proposed Changes

1. Add `useSafeReducedMotion()` early exit to `FadeUp`, `FadeIn`, `StaggerContainer`
2. Deprecate `SkeletonLoader` in favor of `.skeleton` CSS class
3. Update `LoadingState.tsx` to use `.skeleton` instead of `animate-pulse`
4. Add `--duration-page: 350ms` CSS token or remove `DURATION.page`
5. Rename `DURATION.micro` → `DURATION.quick` and `DURATION.card` → `DURATION.standard`
6. Add hover media query gate to `ScaleHover` `whileHover` prop
