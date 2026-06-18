"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ButtonVariant = "primary" | "secondary" | "ghost" | "icon" | "destructive";
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
    "border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] " +
    "[@media(hover:hover)]:hover:border-[var(--color-accent)]/30 [@media(hover:hover)]:hover:text-[var(--color-text-primary)] " +
    "active:bg-[var(--accent-tint)] ",
  ghost:
    "bg-transparent text-[var(--color-text-secondary)] " +
    "[@media(hover:hover)]:hover:bg-[var(--color-bg-elevated)] [@media(hover:hover)]:hover:text-[var(--color-text-primary)] " +
    "active:bg-[var(--color-bg-elevated)] " +
    "focus-visible:ring-[var(--color-accent)]/30 ",
  icon:
    "bg-transparent text-[var(--color-text-tertiary)] " +
    "p-2.5 min-h-[44px] min-w-[44px] " +
    "[@media(hover:hover)]:hover:bg-[var(--color-bg-elevated)] [@media(hover:hover)]:hover:text-[var(--color-text-primary)] " +
    "active:bg-[var(--color-bg-elevated)] " +
    "focus-visible:ring-[var(--color-accent)]/30 ",
  destructive:
    "border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 text-[var(--color-danger)] " +
    "[@media(hover:hover)]:hover:border-[var(--color-danger)]/50 [@media(hover:hover)]:hover:bg-[var(--color-danger)]/20 " +
    "active:bg-[var(--color-danger)]/25 " +
    "focus-visible:ring-[var(--color-danger)] ",
};

const SIZE_STYLES: Record<ButtonSize, string> = {
  sm:   "px-3 py-1.5 text-xs min-h-[36px] lg:min-h-[32px] gap-1.5",
  base: "px-4 py-2.5 text-sm min-h-[44px] lg:min-h-[36px] gap-2",
  lg:   "px-6 py-3 text-base min-h-[44px] lg:min-h-[44px] gap-2.5",
};

const BASE =
  "inline-flex items-center justify-center gap-2 " +
  "rounded-[var(--radius-sm)] px-4 py-2.5 text-sm font-medium " +
  "transition-colors duration-150 ease-out " +
  "motion-safe:active:scale-[0.98] motion-safe:transition-transform motion-safe:duration-[80ms] " +
  "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-page)]";

// ── Component ─────────────────────────────────────────────────────────────────

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size, icon, loading, disabled, children, ...props }, ref) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-disabled={isDisabled || undefined}
        aria-busy={loading || undefined}
        className={cn(BASE, VARIANT_STYLES[variant], size ? SIZE_STYLES[size] : SIZE_STYLES.base, className)}
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
      </button>
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

export function DestructiveButton(props: Omit<ButtonProps, "variant">) {
  return <Button variant="destructive" {...props} />;
}
DestructiveButton.displayName = "DestructiveButton";
