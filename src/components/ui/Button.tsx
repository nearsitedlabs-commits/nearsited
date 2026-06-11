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

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--color-accent)] text-white " +
    "hover:opacity-90 " +
    "shadow-[var(--brand-shadow-xs)] ",
  secondary:
    "border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] " +
    "hover:bg-[var(--color-bg-surface)] hover:text-[var(--color-text-primary)] ",
  ghost:
    "border border-transparent bg-transparent text-[var(--color-text-secondary)] " +
    "hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text-primary)] " +
    "focus-visible:border-[var(--color-accent)]/50 ",
  icon:
    "border border-transparent bg-transparent text-[var(--color-text-tertiary)] p-2.5 min-h-[44px] min-w-[44px] " +
    "hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text-primary)] " +
    "focus-visible:border-[var(--color-accent)]/50 ",
};

const SIZE_STYLES: Record<ButtonSize, string> = {
  sm:   "px-3 py-1.5 text-xs min-h-[44px]",
  base: "",
  lg:   "px-6 py-3 text-base",
};

const BASE =
  "inline-flex items-center justify-center gap-2 " +
  "rounded-[var(--radius-sm)] px-4 py-2.5 text-sm font-medium " +
  "transition-colors duration-150 ease-out " +
  "disabled:opacity-50 disabled:cursor-not-allowed " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-tint)]";

// ── Component ─────────────────────────────────────────────────────────────────

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size, icon, loading, disabled, children, ...props }, ref) => {
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
        className={cn(BASE, VARIANT_STYLES[variant], size ? SIZE_STYLES[size] : undefined, className)}
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
