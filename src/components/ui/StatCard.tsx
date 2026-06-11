"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Card, type CardVariant } from "./Card";
import { FadeUp } from "@/lib/motion";
import { useReducedMotion } from "@/lib/motion";

// ── Types ─────────────────────────────────────────────────────────────────────

export type StatCardProps = {
  /** Metric label */
  label: string;
  /** Primary value */
  value: string | number;
  /** Numeric change value (e.g. 12 for +12%) */
  change?: number;
  /** Change label (e.g. "vs last week") */
  changeLabel?: string;
  /** Optional icon */
  icon?: ReactNode;
  /** Card variant */
  variant?: CardVariant;
  /** Class override */
  className?: string;
};

// ── Component ─────────────────────────────────────────────────────────────────

export function StatCard({
  label,
  value,
  change,
  changeLabel,
  icon,
  variant = "default",
  className,
}: StatCardProps) {
  const prefersReduced = useReducedMotion();
  const isPositive = change != null && change > 0;
  const isNegative = change != null && change < 0;

  const card = (
    <Card variant={variant} padding="md" className={cn(className)}>
      {/* Label row */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--color-text-tertiary)]">{label}</span>
        {icon && (
          <span className="text-[var(--color-text-tertiary)]">{icon}</span>
        )}
      </div>

      {/* Value + change row */}
      <div className="mt-2 flex items-baseline gap-3">
        <span className="text-2xl font-medium text-[var(--color-text-primary)]">
          {value}
        </span>

        {change != null && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-medium",
              isPositive && "text-[var(--color-success)]",
              isNegative && "text-[var(--score-high)]",
              change === 0 && "text-[var(--color-text-tertiary)]",
            )}
          >
            <span aria-hidden="true">
              {isPositive ? "▲" : isNegative ? "▼" : "–"}
            </span>
            {Math.abs(change)}%
          </span>
        )}
      </div>

      {/* Change footnote */}
      {changeLabel && (
        <div className="mt-0.5 text-[11px] text-[var(--color-text-tertiary)]">
          {changeLabel}
        </div>
      )}
    </Card>
  );

  if (prefersReduced) return card;

  return <FadeUp>{card}</FadeUp>;
}
StatCard.displayName = "StatCard";
