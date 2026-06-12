"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { motion, useReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/cn";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ButtonVariant = "primary" | "secondary" | "ghost" | "icon";
export type ButtonSize = "sm" | "base" | "lg";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  loading?: boolean;
};

// ── Style Map ──────────────────────────────────────────────────────────────────
// Hover styles gated with [@media(hover:hover)] so touch devices never see them.
// Active/press feedback is handled by Framer whileTap (works on touch too).

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--color-accent)] text-white shadow-[var(--brand-shadow-xs)] " +
    "[@media(hover:hover)]:hover:opacity-90 " +
    "active:opacity-90 ",
  secondary:
    "border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] " +
    "[@media(hover:hover)]:hover:border-[var(--color-border-strong)] [@media(hover:hover)]:hover:text-[var(--color-text-primary)] " +
    "active:bg-[var(--color-bg-surface)] ",
  ghost:
    "border border-transparent bg-transparent text-[var(--color-text-secondary)] " +
    "[@media(hover:hover)]:hover:bg-[var(--color-bg-elevated)] [@media(hover:hover)]:hover:text-[var(--color-text-primary)] " +
    "active:bg-[var(--color-bg-elevated)] " +
    "focus-visible:border-[var(--color-accent)]/50 ",
  icon:
    "border border-transparent bg-transparent text-[var(--color-text-tertiary)] " +
    "p-2.5 min-h-[44px] min-w-[44px] " +
    "[@media(hover:hover)]:hover:bg-[var(--color-bg-elevated)] [@media(hover:hover)]:hover:text-[var(--color-text-primary)] " +
    "active:bg-[var(--color-bg-elevated)] " +
    "focus-visible:border-[var(--color-accent)]/50 ",
};

const SIZE_STYLES: Record<ButtonSize, string> = {
  sm:   "px-3 py-1.5 text-xs min-h-[44px]",
  base: "min-h-[44px] lg:min-h-[36px]",
  lg:   "px-6 py-3 text-base min-h-[44px]",
};

const BASE =
  "inline-flex items-center justify-center gap-2 " +
  "rounded-[var(--radius-sm)] px-4 py-2.5 text-sm font-medium " +
  "transition-colors duration-150 ease-out " +
  "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-page)]";

// ── Component ─────────────────────────────────────────────────────────────────

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size, icon, loading, disabled, children, ...props }, ref) => {
    const prefersReduced = useReducedMotion();
    const isDisabled = disabled || loading;

    const MotionTag = prefersReduced
      ? "button"
      : (motion.button as React.ComponentType<
          ButtonHTMLAttributes<HTMLButtonElement> & {
            whileTap?: object;
            transition?: object;
          }
        >);

    const motionProps = prefersReduced
      ? {}
      : {
          whileTap: isDisabled ? {} : { scale: 0.98 },
          transition: { duration: 0.08, ease: "easeOut" as const },
        };

    return (
      <MotionTag
        ref={ref}
        disabled={isDisabled}
        aria-disabled={isDisabled || undefined}
        aria-busy={loading || undefined}
        className={cn(BASE, VARIANT_STYLES[variant], size ? SIZE_STYLES[size] : SIZE_STYLES.base, className)}
        {...motionProps}
        {...props}
      >
        {loading ? (
          <span
            aria-hidden="true"
            className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
        ) : icon ? (
          <span aria-hidden="true" className="flex h-4 w-4 shrink-0 items-center justify-center">
            {icon}
          </span>
        ) : null}
        {children && <span className={cn(variant === "icon" && "sr-only")}>{children}</span>}
      </MotionTag>
    );
  },
);
Button.displayName = "Button";

// ── Named semantic aliases ────────────────────────────────────────────────────
// Use these instead of <Button variant="..."> to enforce the one-primary-per-section rule.
// Primary  → accent bg, white text. Used at most ONCE per page section.
// Secondary → bordered, transparent bg. Non-primary actions.
// Ghost    → text-only. Cancel / dismiss / low-emphasis actions.

export function PrimaryButton(props: Omit<ButtonProps, "variant">) {
  return <Button variant="primary" {...props} />;
}
PrimaryButton.displayName = "PrimaryButton";

export function SecondaryButton(props: Omit<ButtonProps, "variant">) {
  return <Button variant="secondary" {...props} />;
}
SecondaryButton.displayName = "SecondaryButton";

export function GhostButton(props: Omit<ButtonProps, "variant">) {
  return <Button variant="ghost" {...props} />;
}
GhostButton.displayName = "GhostButton";
