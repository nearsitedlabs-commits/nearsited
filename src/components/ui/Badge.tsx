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
  green:  "bg-[var(--badge-green-bg)] border-[var(--badge-green-border)] text-[var(--badge-green-text)]",
  red:    "bg-[var(--badge-red-bg)] border-[var(--badge-red-border)] text-[var(--badge-red-text)]",
  amber:  "bg-[var(--badge-amber-bg)] border-[var(--badge-amber-border)] text-[var(--badge-amber-text)]",
  indigo: "bg-[var(--badge-indigo-bg)] border-[var(--badge-indigo-border)] text-[var(--badge-indigo-text)]",
  neutral: "bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-tertiary)]",
};

const BASE =
  "inline-flex items-center gap-1.5 " +
  "rounded-full border px-2.5 py-0.5 " +
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
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", DOT[color])} />}
      {children}
    </span>
  );
}
Badge.displayName = "Badge";
