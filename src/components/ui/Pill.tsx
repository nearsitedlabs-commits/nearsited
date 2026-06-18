import { type ReactNode } from "react";
import { cn } from "@/lib/cn";

// ── Types ─────────────────────────────────────────────────────────────────────

export type PillVariant = "info" | "warning" | "success" | "danger" | "neutral";
export type PillSize = "sm" | "md";

export type PillProps = {
  variant?: PillVariant;
  size?: PillSize;
  /**
   * "status"  — sentence-case, used for status labels (e.g. "In pipeline")
   * "column"  — uppercase + letter-spacing microcopy, used for column headers / tier labels
   */
  display?: "status" | "column";
  dot?: boolean;
  children: ReactNode;
  className?: string;
};

// ── Style maps ────────────────────────────────────────────────────────────────

const VARIANT_STYLES: Record<PillVariant, string> = {
  info:    "text-[var(--color-info)] decoration-[var(--color-info)]/50",
  warning: "text-[var(--color-warning)] decoration-[var(--color-warning)]/50",
  success: "text-[var(--color-success)] decoration-[var(--color-success)]/50",
  danger:  "text-[var(--color-danger)] decoration-[var(--color-danger)]/50",
  neutral: "text-[var(--color-text-tertiary)] decoration-[var(--color-border-subtle)]",
};

const DOT_STYLES: Record<PillVariant, string> = {
  info:    "bg-[var(--color-info)]",
  warning: "bg-[var(--color-warning)]",
  success: "bg-[var(--color-success)]",
  danger:  "bg-[var(--color-danger)]",
  neutral: "bg-[var(--color-text-tertiary)]",
};

const SIZE_STYLES: Record<PillSize, string> = {
  sm: "text-[10px]",
  md: "text-xs",
};

const BASE =
  "inline-flex items-center gap-1.5 " +
  "underline decoration-2 underline-offset-2 " +
  "whitespace-nowrap font-medium";

// ── Component ─────────────────────────────────────────────────────────────────

export function Pill({
  variant = "neutral",
  size = "sm",
  display = "status",
  dot = false,
  children,
  className,
}: PillProps) {
  const isColumn = display === "column";
  return (
    <span
      className={cn(
        BASE,
        VARIANT_STYLES[variant],
        SIZE_STYLES[size],
        isColumn && "uppercase tracking-[0.04em]",
        className,
      )}
    >
      {dot && (
        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", DOT_STYLES[variant])} />
      )}
      {children}
    </span>
  );
}
Pill.displayName = "Pill";
