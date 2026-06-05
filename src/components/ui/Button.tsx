"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ButtonVariant = "primary" | "secondary" | "ghost" | "icon";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  icon?: ReactNode;
  loading?: boolean;
};

// ── Style Map ──────────────────────────────────────────────────────────────────

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--accent)] text-white " +
    "hover:bg-[var(--accent-hover)] " +
    "shadow-[var(--brand-shadow-xs)] ",
  secondary:
    "border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] " +
    "hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] ",
  ghost:
    "border border-transparent bg-transparent text-[var(--text-secondary)] " +
    "hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] ",
  icon:
    "border border-transparent bg-transparent text-[var(--text-tertiary)] p-2 " +
    "hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] ",
};

const BASE =
  "inline-flex items-center justify-center gap-2 " +
  "rounded-lg px-4 py-2.5 text-sm font-medium " +
  "transition-colors duration-150 ease-out " +
  "disabled:opacity-50 disabled:cursor-not-allowed " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-tint)]";

// ── Component ─────────────────────────────────────────────────────────────────

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", icon, loading, disabled, children, ...props }, ref) => {
    const prefersReduced = useReducedMotion();

    const MotionTag = prefersReduced ? "button" : (motion.button as React.ComponentType<ButtonHTMLAttributes<HTMLButtonElement> & { whileHover?: object; whileTap?: object; transition?: object }>);

    const motionProps = prefersReduced
      ? {}
      : {
          whileHover: { scale: 1.02 },
          whileTap: { scale: 0.98 },
          transition: { duration: 0.15, ease: "easeOut" as const },
        };

    return (
      <MotionTag
        ref={ref}
        disabled={disabled || loading}
        className={cn(BASE, VARIANT_STYLES[variant], className)}
        {...motionProps}
        {...props}
      >
        {loading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : icon ? (
          <span className="flex h-4 w-4 shrink-0 items-center justify-center">{icon}</span>
        ) : null}
        {children && <span className={cn(variant === "icon" && "sr-only")}>{children}</span>}
      </MotionTag>
    );
  },
);
Button.displayName = "Button";
