"use client";

import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { FadeUp, DURATION, EASE } from "@/lib/motion";
import { useReducedMotion, motion } from "framer-motion";

// ── Types ─────────────────────────────────────────────────────────────────────

export type CardVariant = "default" | "interactive" | "dashed";
export type Elevation = 1 | 2 | 3;

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant;
  elevation?: Elevation;
  padding?: "sm" | "md" | "lg";
  /** When true, wraps content in a scroll-triggered fade-up animation */
  animate?: boolean;
  /** Optional delay (seconds) before the animation triggers */
  animationDelay?: number;
};

// ── Style Map ──────────────────────────────────────────────────────────────────

const ELEVATION_BG: Record<Elevation, string> = {
  1: "bg-[var(--bg-surface-1)]",
  2: "bg-[var(--bg-surface-2)]",
  3: "bg-[var(--bg-surface-3)]",
};

const VARIANT_STYLES: Record<CardVariant, string> = {
  default:
    "border border-[var(--border)] shadow-[var(--brand-shadow-sm)]",
  interactive:
    "border border-[var(--border)] shadow-[var(--brand-shadow-sm)] " +
    "hover:shadow-[var(--brand-shadow-md)] hover:border-[var(--border-strong)] " +
    "transition-all duration-150 ease-out cursor-pointer",
  dashed:
    "border border-dashed border-[var(--border)]",
};

const PADDING: Record<string, string> = {
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

const BASE = "rounded-xl";

// ── Component ─────────────────────────────────────────────────────────────────

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", elevation = 1, padding = "md", animate, animationDelay, children, ...props }, ref) => {
    const prefersReduced = useReducedMotion();

    const cardContent = (
      <div
        ref={ref}
        className={cn(BASE, ELEVATION_BG[elevation], VARIANT_STYLES[variant], PADDING[padding], className)}
        {...props}
      >
        {children}
      </div>
    );

    if (prefersReduced || !animate) return cardContent;

    if (animationDelay !== undefined) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: DURATION.card, ease: EASE.out, delay: animationDelay }}
        >
          {cardContent}
        </motion.div>
      );
    }

    return <FadeUp>{cardContent}</FadeUp>;
  },
);
Card.displayName = "Card";
