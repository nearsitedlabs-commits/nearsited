"use client";

import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

// ── Types ─────────────────────────────────────────────────────────────────────

export type CardVariant = "default" | "interactive" | "dashed";
export type Elevation = 1 | 2 | 3;

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant;
  elevation?: Elevation;
  padding?: "sm" | "md" | "lg";
  /** When true, fades in on mount via CSS animation */
  animate?: boolean;
  /** Optional delay (seconds) before the animation triggers */
  animationDelay?: number;
};

// ── Style Map ──────────────────────────────────────────────────────────────────

const ELEVATION_BG: Record<Elevation, string> = {
  1: "bg-[var(--color-bg-surface)]",
  2: "bg-[var(--color-bg-elevated)]",
  3: "bg-[var(--bg-surface-3)]",
};

const VARIANT_STYLES: Record<CardVariant, string> = {
  default:
    "shadow-[var(--brand-shadow-sm)]",
  interactive:
    "shadow-[var(--brand-shadow-sm)] " +
    "[@media(hover:hover)]:hover:shadow-[var(--brand-shadow-md)] " +
    "transition-all duration-150 ease-out cursor-pointer",
  dashed:
    "bg-[var(--color-bg-surface)]",
};

const PADDING: Record<string, string> = {
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

const BASE = "rounded-[var(--radius-md)]";

// ── Component ─────────────────────────────────────────────────────────────────

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", elevation = 1, padding = "md", animate, animationDelay, style, children, ...props }, ref) => {
    const animStyle = animate
      ? {
          ...style,
          animationDelay: animationDelay != null ? `${animationDelay}s` : undefined,
        }
      : style;

    return (
      <div
        ref={ref}
        className={cn(
          BASE,
          ELEVATION_BG[elevation],
          VARIANT_STYLES[variant],
          PADDING[padding],
          animate && "motion-safe:animate-fadeUp",
          className,
        )}
        style={animStyle}
        {...props}
      >
        {children}
      </div>
    );
  },
);
Card.displayName = "Card";
