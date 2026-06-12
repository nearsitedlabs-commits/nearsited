/**
 * Nearsited Motion System
 *
 * Reusable animation primitives built on Framer Motion.
 * Do NOT import from "framer-motion" directly — import from this module instead.
 * This ensures proper tree-shaking via optimizePackageImports.
 *
 * Brand: Professional · Modern · Confident · Fast · Premium
 *
 * Timing:
 *   150ms — micro interactions (hover, tap, color shift)
 *   250ms — card/panel transitions
 *   350ms — page-level transitions
 *
 * Easing:
 *   ease-out     — entrances (things appearing)
 *   ease-in-out  — state changes (things transforming)
 *
 * Rules:
 *   ✓ Respect prefers-reduced-motion
 *   ✓ Subtle, invisible polish
 *   ✗ No bounce
 *   ✗ No flashy entrances
 *   ✗ No exaggerated scale
 *   ✗ No spinning loaders
 */

import { motion, AnimatePresence, LayoutGroup, animate, useReducedMotion as _useReducedMotion, type Variants, type Easing } from "framer-motion";

// ── Duration & Easing Tokens ──────────────────────────────────────────────────
// Mirrors the CSS custom properties in globals.css (--duration-*, --easing-*).
// Always use these constants — never hardcode ms values.

export const DURATION = {
  instant:    0.08,  // --duration-instant: button press feedback
  micro:      0.15,  // --duration-quick:   hover, focus, most UI feedback
  card:       0.25,  // --duration-standard: modal entrance, layout changes
  deliberate: 0.4,   // --duration-deliberate: page entrances, large reveals
  // legacy alias
  page: 0.35,
} as const;

type CubicBezier = [number, number, number, number];

export const EASE: Record<string, CubicBezier> = {
  // --easing-standard: most UI feedback (accelerate fast, decelerate to rest)
  out: [0.25, 0.1, 0.25, 1] as Easing as CubicBezier,
  // --easing-emphasized: entrances and reveals (smooth deceleration)
  emphasized: [0.16, 1, 0.3, 1] as Easing as CubicBezier,
  // --easing-bounce: celebratory moments only — never routine UI
  bounce: [0.34, 1.56, 0.64, 1] as Easing as CubicBezier,
  // legacy aliases
  inOut: [0.4, 0, 0.2, 1] as Easing as CubicBezier,
  smooth: [0.22, 1, 0.36, 1] as Easing as CubicBezier,
};

// ── Reduced Motion ────────────────────────────────────────────────────────────

/** True if the user prefers reduced motion. Call in useEffect or use once. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Returns a sanitised duration that respects reduced-motion preferences. */
export function safeDuration(base: number): number {
  return prefersReducedMotion() ? 0 : base;
}

// ── Variants ──────────────────────────────────────────────────────────────────

const viewportOnce = { once: true, margin: "-40px" as const };

export const fadeUpVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 12,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATION.card,
      ease: EASE.out,
    },
  },
};

export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: DURATION.card,
      ease: EASE.out,
    },
  },
};

export const staggerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

export const hoverTapVariants: Variants = {
  rest: { scale: 1 },
  hover: {
    scale: 1.02,
    transition: { duration: DURATION.micro, ease: EASE.out },
  },
  tap: {
    scale: 0.98,
    transition: { duration: DURATION.micro, ease: EASE.out },
  },
};

export const pageEnterVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  enter: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.page, ease: EASE.out },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: DURATION.card, ease: EASE.smooth },
  },
};

// ── Components ────────────────────────────────────────────────────────────────

interface MotionBoxProps {
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

/** Fade in + slide up 12px. Default entrance for cards, sections, rows. */
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

/** Simple opacity fade-in. For subtle reveals like badges or secondary content. */
export function FadeIn({ children, className }: MotionBoxProps) {
  return (
    <motion.div
      variants={fadeInVariants}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Staggers entrance of child FadeUp/FadeIn elements. Wrap around a list. */
export function StaggerContainer({ children, className }: MotionBoxProps) {
  return (
    <motion.div
      variants={staggerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Subtle scale-up on hover (cards, panels, clickable rows). */
export function ScaleHover({ children, className, onClick }: MotionBoxProps) {
  return (
    <motion.div
      variants={hoverTapVariants}
      initial="rest"
      whileHover="hover"
      whileTap="tap"
      className={className}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}

/** Page-level transition wrapper. Use as the outermost wrapper in page components. */
export function PageTransition({ children, className }: MotionBoxProps) {
  return (
    <motion.div
      variants={pageEnterVariants}
      initial="initial"
      animate="enter"
      exit="exit"
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Skeleton Loader ───────────────────────────────────────────────────────────

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  radius?: string;
}

/** Animated shimmer placeholder for loading states. */
export function SkeletonLoader({
  className = "",
  width = "100%",
  height = "16px",
  radius = "8px",
}: SkeletonProps) {
  return (
    <motion.div
      className={`bg-[var(--bg-elevated)] ${className}`}
      style={{ width, height, borderRadius: radius }}
      animate={{ opacity: [0.3, 0.5, 0.3] }}
      transition={{
        duration: 1.5,
        ease: "easeInOut",
        repeat: Infinity,
      }}
    />
  );
}

// ── Re-exports — always import from here, never directly from "framer-motion" ──

export { motion, AnimatePresence, LayoutGroup, animate, _useReducedMotion as useReducedMotion, type Variants };
