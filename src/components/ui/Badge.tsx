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
  green:  "text-[var(--color-success)] decoration-[var(--color-success)]/50",
  red:    "text-[var(--color-danger)] decoration-[var(--color-danger)]/50",
  amber:  "text-[var(--color-warning)] decoration-[var(--color-warning)]/50",
  indigo: "text-[var(--badge-indigo-text)] decoration-[var(--badge-indigo-border)]",
  neutral: "text-[var(--color-text-tertiary)] decoration-[var(--color-border-subtle)]",
};

const BASE =
  "inline-flex items-center gap-1.5 " +
  "underline decoration-2 underline-offset-2 " +
  "text-xs font-medium whitespace-nowrap";

const DOT: Record<BadgeColor, string> = {
  green:  "bg-[var(--color-success)]",
  red:    "bg-[var(--color-danger)]",
  amber:  "bg-[var(--color-warning)]",
  indigo: "bg-[var(--badge-indigo-text)]",
  neutral: "bg-[var(--color-text-tertiary)]",
};

// ── Component ─────────────────────────────────────────────────────────────────

export function Badge({ className, color = "neutral", dot = false, children, ...props }: BadgeProps) {
  return (
    <span className={cn(BASE, COLOR_STYLES[color], className)} {...props}>
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", DOT[color])} />}
      {children}
    </span>
  );
}
Badge.displayName = "Badge";