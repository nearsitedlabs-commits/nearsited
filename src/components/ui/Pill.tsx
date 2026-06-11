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
  info:    "bg-[rgba(96,165,250,0.12)] border-[rgba(96,165,250,0.25)] text-[var(--color-info)]",
  warning: "bg-[rgba(196,152,74,0.12)] border-[rgba(196,152,74,0.25)] text-[var(--color-warning)]",
  success: "bg-[rgba(74,143,90,0.12)] border-[rgba(74,143,90,0.25)] text-[var(--color-success)]",
  danger:  "bg-[rgba(196,102,90,0.12)] border-[rgba(196,102,90,0.25)] text-[var(--color-danger)]",
  neutral: "bg-[var(--color-bg-elevated)] border-[var(--color-border-subtle)] text-[var(--color-text-tertiary)]",
};

const DOT_STYLES: Record<PillVariant, string> = {
  info:    "bg-[var(--color-info)]",
  warning: "bg-[var(--color-warning)]",
  success: "bg-[var(--color-success)]",
  danger:  "bg-[var(--color-danger)]",
  neutral: "bg-[var(--color-text-tertiary)]",
};

const SIZE_STYLES: Record<PillSize, string> = {
  sm: "px-2 py-0.5 text-[10px]",
  md: "px-2.5 py-1 text-xs",
};

const BASE =
  "inline-flex items-center gap-1.5 " +
  "rounded-[var(--radius-sm)] border whitespace-nowrap font-medium";

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
