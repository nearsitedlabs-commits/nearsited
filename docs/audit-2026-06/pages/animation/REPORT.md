# Animation Audit
**Date:** 2026-06-18 · **Auditor:** Claude Code (Prompt 16) · **Source analysis** (no Playwright)

---

## Executive Summary

Nearsited has the best animation architecture of any system audited so far. `src/lib/motion.tsx` is a well-designed centralization layer: it re-exports Framer Motion through a single import point, defines canonical duration/easing constants that mirror the CSS tokens, provides `FadeUp`, `FadeIn`, `StaggerContainer`, `ScaleHover`, and `PageTransition` components, and exposes a `useSafeReducedMotion()` hook with SSR-safe hydration handling.

The two structural problems are: (1) the animation components (`FadeUp`, `FadeIn`, `StaggerContainer`) do not internally check `prefers-reduced-motion` — they always animate, deferring to the CSS `animation-duration: 0.01ms !important` fallback in globals.css instead of skipping the animation at the JS level; (2) 103 files use `transition-colors duration-150` as Tailwind utilities rather than CSS token values, creating a maintenance cliff if the design system needs to change animation speeds.

Additionally, three parallel skeleton loading animation systems exist side-by-side (`SkeletonLoader` Framer component, `.skeleton` CSS class, Tailwind `animate-pulse`), with no consolidation.

---

## Critical Issues

### C1 — `FadeUp`, `FadeIn`, `StaggerContainer` always animate — no internal reduced-motion check
**File:** [src/lib/motion.tsx:165,180,195](src/lib/motion.tsx#L165)

```tsx
export function FadeUp({ children, className }: MotionBoxProps) {
  return (
    <motion.div
      variants={fadeUpVariants}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      className={className}
    >
      {children}
    </motion.div>
  );
}
```

No `useSafeReducedMotion()` or `prefersReducedMotion()` call. These components animate on every use regardless of user preference.

The globals.css fallback at line 167 (`animation-duration: 0.01ms !important`) does suppress the visual animation for prefers-reduced-motion users — but the JS `initial` state still sets the element to `opacity: 0, y: 12` before any animation runs. On very slow connections or long page loads, this means users who prefer no motion momentarily see invisible/offset content before the browser applies the CSS override.

Compare with the correct pattern in [ProofBlocksSection.tsx:72](src/components/landing/ProofBlocksSection.tsx#L72):
```tsx
{prefersReducedMotion ? content : <FadeUp>{content}</FadeUp>}
```
This skips the animation component entirely and renders static content for reduced-motion users.

**Fix:** Add reduced-motion early exit to all animation components in motion.tsx:
```tsx
export function FadeUp({ children, className }: MotionBoxProps) {
  const shouldReduce = useSafeReducedMotion();
  if (shouldReduce) return <div className={className}>{children}</div>;
  return (
    <motion.div variants={fadeUpVariants} initial="hidden" whileInView="visible" viewport={viewportOnce} className={className}>
      {children}
    </motion.div>
  );
}
```

### C2 — Three parallel skeleton animation systems
Three different loading animation approaches coexist:

| System | File | Mechanism | Visual result |
|---|---|---|---|
| `SkeletonLoader` component | [src/lib/motion.tsx:250](src/lib/motion.tsx#L250) | Framer `animate: { opacity: [0.3, 0.5, 0.3] }` | Opacity pulse |
| `.skeleton` CSS class | [src/app/globals.css:262](src/app/globals.css#L262) | CSS `background-position` shimmer | Sliding shimmer |
| `animate-pulse` (Tailwind) | [src/components/ui/LoadingState.tsx:12](src/components/ui/LoadingState.tsx#L12) | CSS `@keyframes pulse` | Opacity pulse (different implementation) |

All three produce different visual effects. `SkeletonLoader` and `animate-pulse` both do opacity pulsing but via different mechanisms. `.skeleton` does a shimmer slide. A user loading different pages sees different loading animations.

The `.skeleton` CSS class is the best-implemented: it uses background-position (compositor-only, cheapest), respects `prefers-reduced-motion` via `animation: none`, and is already in globals.css for any element to use.

**Fix:** Deprecate `SkeletonLoader` (Framer overhead, no reduced-motion check) and `animate-pulse` (weaker than `.skeleton`). Standardize all skeleton loading on the `.skeleton` CSS class. Update `LoadingState.tsx` to use `className="skeleton"` instead of `animate-pulse`. Remove `SkeletonLoader` from motion.tsx.

---

## High Priority (fix within 2 weeks)

### H1 — 103 `transition-colors duration-150` instances bypass animation tokens
From grep results: `duration-150` appears 103 times across 43 files. All of these hardcode the 150ms duration as a Tailwind utility rather than using the CSS token `--duration-quick: 150ms`.

Current approach:
```
transition-colors duration-150 ease-out
```

Token-aligned approach (would require a custom Tailwind plugin or CSS class):
```
transition-[color,background-color,border-color] [transition-duration:var(--duration-quick)]
```

Or, since Tailwind v4 supports arbitrary CSS variables in utilities:
```
transition-colors [transition-duration:var(--duration-quick)]
```

This matters because if `--duration-quick` is ever changed (e.g., to 120ms for a snappier feel), updating the CSS token would do nothing to these 103 locations.

**Practical fix:** At minimum, add a comment in globals.css:
```css
/* KEEP IN SYNC: duration-150 Tailwind utility across 103 files = this value */
--duration-quick: 150ms;
```
Then create a Tailwind `duration-quick` utility that maps to the token, and do a one-time find-replace.

### H2 — CSS animation token naming doesn't match motion.tsx constant naming

| CSS token | Value | motion.tsx constant | Value |
|---|---|---|---|
| `--duration-instant` | 80ms | `DURATION.instant` | 0.08s ✅ |
| `--duration-quick` | 150ms | `DURATION.micro` | 0.15s — **name differs** |
| `--duration-standard` | 250ms | `DURATION.card` | 0.25s — **name differs** |
| `--duration-deliberate` | 400ms | `DURATION.deliberate` | 0.4s ✅ |
| *(none)* | — | `DURATION.page` | 0.35s — **no CSS equivalent** |

A developer reading `DURATION.card` can't easily find the CSS token that corresponds to it (`--duration-standard`). And `DURATION.page: 0.35` has no CSS token — the CSS scale jumps from 250ms to 400ms, skipping 350ms.

**Fix:** Rename motion.tsx constants to match CSS token names:
```ts
export const DURATION = {
  instant:   0.08,  // --duration-instant
  quick:     0.15,  // --duration-quick  (was: micro)
  standard:  0.25,  // --duration-standard (was: card)
  deliberate: 0.40, // --duration-deliberate
} as const;
```
And either add `--duration-page: 350ms` to globals.css or remove `DURATION.page`.

### H3 — `ScaleHover` component `whileHover` may sticky on touch
**File:** [src/lib/motion.tsx:212-222](src/lib/motion.tsx#L212)

```tsx
export function ScaleHover({ children, className, onClick }: MotionBoxProps) {
  return (
    <motion.div
      variants={hoverTapVariants}
      initial="rest"
      whileHover="hover"   // ← no media query gate
      whileTap="tap"
      className={className}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}
```

Framer Motion's `whileHover` listens to the CSS `:hover` pseudo-class. On touch devices, CSS hover is sticky (persists until a non-hover interaction occurs). `ScaleHover` will leave elements scaled up to 1.02 after a touch tap until the user taps elsewhere.

The fix is to conditionally omit `whileHover` on touch devices:
```tsx
const isTouch = typeof window !== "undefined" && !window.matchMedia("(hover: hover)").matches;
// ... in JSX:
whileHover={isTouch ? undefined : "hover"}
```

### H4 — `FilterPanel.tsx` mobile sheet uses non-token duration
**File:** [src/components/filters/FilterPanel.tsx:228](src/components/filters/FilterPanel.tsx#L228)

```
transition-transform duration-300 ease-out
```

`duration-300` (300ms) is not in the animation token scale (80/150/250/400ms). Closest is `--duration-standard: 250ms`. The bottom sheet entry motion is longer than the standard by 50ms, which may read as slightly sluggish compared to other panel transitions.

**Fix:** Change to `duration-250` (or `[transition-duration:var(--duration-standard)]`).

---

## Medium Priority (fix when refactoring nearby)

### M1 — `whileInView` without `viewport={{ once: true }}` on share report
**File:** [src/app/share/[token]/share-report-client.tsx](src/app/share/[token]/share-report-client.tsx)

Some `motion.li` and `motion.div` elements use `whileInView` without the `viewport={viewportOnce}` from motion.tsx. This means issues list items re-animate every time the user scrolls them in and out of view. The `once: true` pattern from motion.tsx's `viewportOnce` is the correct approach.

### M2 — `SkeletonLoader` uses hardcoded `radius` values that diverge from design tokens
**File:** [src/lib/motion.tsx:248-267](src/lib/motion.tsx#L248)

```tsx
export function SkeletonLoader({ radius = "8px" }: SkeletonProps) { ... }
```

Default radius is `8px` — not an allowed radius (only `--radius-sm: 6px` and `--radius-md: 10px`). Settings loading.tsx uses `radius="4px"`, `radius="6px"`, `radius="8px"`, `radius="12px"` (via the SkeletonLoader). If SkeletonLoader is kept (against recommendation), constrain radius to design tokens.

### M3 — `AnimatePresence` on `Toast.tsx` uses `x: 80` for slide direction
**File:** [src/components/ui/Toast.tsx:83-85](src/components/ui/Toast.tsx#L83)

```tsx
initial={{ opacity: 0, x: 80 }}
animate={{ opacity: 1, x: 0 }}
exit={{ opacity: 0, x: 80 }}
```

The toast slides in from the right. While this is visually reasonable, on RTL locales (Arabic, Hebrew) the toast should slide from the left. If internationalization is ever added, the `x` value should be direction-aware. Low risk now, but worth noting.

### M4 — `Button.tsx` uses `useReducedMotion()` but the pattern isn't documented
**File:** [src/components/ui/Button.tsx:66](src/components/ui/Button.tsx#L66)

```tsx
const prefersReduced = useReducedMotion();
const MotionTag = prefersReduced ? "button" : motion.button;
```

This correctly disables whileTap for reduced-motion users. But the hook is imported from `@/lib/motion` (correct) — not directly from `framer-motion`. The correct import path is documented nowhere except in the single comment at motion.tsx:5. New contributors might import directly from `framer-motion` and break the centralization.

### M5 — `useCountUp()` animation in shared-hooks.ts needs reduced-motion check
**File:** [src/lib/shared-hooks.ts](src/lib/shared-hooks.ts) (referenced in CLAUDE.md)

The shared `useCountUp()` hook animates number incrementing. This likely uses `requestAnimationFrame` or a timed loop. If it doesn't check `prefers-reduced-motion`, it will animate numbers for reduced-motion users.

---

## Low Priority / Nice-to-have

### L1 — `EASE.inOut` and `EASE.smooth` are "legacy aliases" with no usage documentation
**File:** [src/lib/motion.tsx:54-55](src/lib/motion.tsx#L54)

```tsx
inOut: [0.4, 0, 0.2, 1] as Easing as CubicBezier,   // legacy alias
smooth: [0.22, 1, 0.36, 1] as Easing as CubicBezier, // legacy alias
```

If these are legacy, they should either be removed or given a deprecation comment explaining what to use instead. "Legacy alias" without a migration path is a maintenance ambiguity.

### L2 — Delay classes `.d1` through `.d5` in globals.css are unused
**File:** [src/app/globals.css:172-176](src/app/globals.css#L172)

```css
.d1 { animation-delay: 0.1s; }
.d2 { animation-delay: 0.25s; }
...
.d5 { animation-delay: 0.7s; }
```

These animation delay utility classes don't appear to be used anywhere in the codebase. Dead CSS.

### L3 — `PageTransition` component is defined but not used in dashboard pages
**File:** [src/lib/motion.tsx:226](src/lib/motion.tsx#L226)

`PageTransition` provides `initial="initial" animate="enter" exit="exit"` for page-level transitions — but no dashboard page wraps its content in `PageTransition`. The component exists but the page transition system is effectively unused in the product's main workflows.

### L4 — `DURATION.page: 0.35` is a "legacy alias" but not labeled as such
The motion.tsx comment says "// legacy alias" for `DURATION.page` — but it looks like a first-class value. Clarify or remove.

---

## What's Actually Good

- **Single import point** — `@/lib/motion` re-exports all Framer Motion APIs. The comment "Do NOT import from 'framer-motion' directly" is correctly stated. This enables tree-shaking via `optimizePackageImports`.
- **Duration tokens synchronized** — all 4 CSS duration tokens have corresponding JS constants (even if named differently). Values are exactly correct.
- **`useSafeReducedMotion()` is SSR-safe** — the hook initializes to `false` on the server, avoids hydration mismatch, then updates post-mount. This is the technically correct implementation.
- **`Button.tsx` uses `useReducedMotion()`** — press feedback (`whileTap`) is correctly disabled for reduced-motion users.
- **`globals.css` reduced-motion CSS fallback** — the `animation-duration: 0.01ms !important` catch-all is a safety net that prevents most Framer animations from completing for reduced-motion users.
- **No `animate-bounce`** — CLAUDE.md rule "No bounce" is respected. Zero instances of `animate-bounce` in user-facing code.
- **No `easing-bounce` in routine UI** — `EASE.bounce` exists but is not used outside of the constant definition.
- **`SkeletonLoader` respects reduced-motion (partially)** — the opacity animation will be intercepted by the CSS fallback, though the Framer JS overhead still runs.
- **`StaggerContainer` stagger delay is 0.05s** — appropriately subtle. Not exaggerated.
- **`Card.tsx` and `OpportunityCard.tsx` wrap in `FadeUp`** — consistent entrance animation across card-like elements.
- **Toast uses `AnimatePresence`** — enter/exit animations properly handled with `AnimatePresence mode="wait"`.

---

## Quality Scorecard

| Criterion | Score | Notes |
|---|---|---|
| Architecture (centralization) | 9/10 | Excellent single-source motion system |
| Reduced-motion compliance | 5/10 | CSS fallback exists; JS components don't check it |
| Token synchronization | 7/10 | Values correct; naming diverges (quick vs micro) |
| Transition consistency | 5/10 | 103 hardcoded `duration-150` bypass tokens |
| Skeleton system coherence | 3/10 | Three parallel systems, different visual output |
| Touch hover (sticky prevention) | 5/10 | Button.tsx correct; ScaleHover may sticky |
| Animation purposefulness | 8/10 | No bounce, no exaggerated scale, no unnecessary effects |
| Dead code | 7/10 | .d1–.d5 CSS classes unused; legacy EASE aliases undocumented |
| **Overall** | **6.5/10** | Best-designed system in the audit; fixable gaps |
