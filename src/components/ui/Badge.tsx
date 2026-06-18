import { type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

// ── Types ─────────────────────────────────────────────────────────────────────

export type BadgeColor = "green" | "red" | "amber" | "indigo" | "neutral";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  /** Semantic color variant */
  color?: BadgeColor;
  /** Optional dot indicator */
  dot?: boolean;
};

// ── Style Map ──────────────────────────────────────────────────────────────────

const COLOR_STYLES: Record<BadgeColor, string> = {
  green:  "bg-[var(--color-success)]/10 border-[var(--color-success)]/30 text-[var(--color-success)]",
  red:    "bg-[var(--color-danger)]/10 border-[var(--color-danger)]/30 text-[var(--color-danger)]",
  amber:  "bg-[var(--color-warning)]/10 border-[var(--color-warning)]/30 text-[var(--color-warning)]",
  indigo: "bg-[var(--badge-indigo-bg)] border-[var(--badge-indigo-border)] text-[var(--badge-indigo-text)]",
  neutral: "bg-[var(--color-bg-elevated)] border-[var(--color-border-subtle)] text-[var(--color-text-tertiary)]",
};

const BASE =
  "inline-flex items-center gap-1.5 " +
  "rounded-[var(--radius-sm)] border px-2.5 py-0.5 " +
  "text-xs font-medium whitespace-nowrap";

const DOT: Record<BadgeColor, string> = {
  green:  "bg-[var(--badge-green-text)]",
  red:    "bg-[var(--badge-red-text)]",
  amber:  "bg-[var(--badge-amber-text)]",
  indigo: "bg-[var(--badge-indigo-text)]",
  neutral: "bg-[var(--text-tertiary)]",
};

// ── Component ─────────────────────────────────────────────────────────────────

export function Badge({ className, color = "neutral", dot = false, children, ...props }: BadgeProps) {
  return (
    <span className={cn(BASE, COLOR_STYLES[color], className)} {...props}>
      {dot && <span className={cn("h-1.5 w-1.5 rounded-[var(--radius-sm)]", DOT[color])} />}
      {children}
    </span>
  );
}
Badge.displayName = "Badge";