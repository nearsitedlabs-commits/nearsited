"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Card, type CardVariant } from "./Card";
import { FadeUp } from "@/lib/motion";
import { useReducedMotion } from "@/lib/motion";

// ── Types ─────────────────────────────────────────────────────────────────────

export type MetricCardProps = {
  /** Icon element (lucide-react icon) */
  icon?: ReactNode;
  /** Primary metric value */
  value: string | number;
  /** Metric label shown below the value */
  label: string;
  /** Optional trend direction */
  trend?: "up" | "down" | "neutral";
  /** Trend value text (e.g. "+12%") */
  trendValue?: string;
  /** Card variant */
  variant?: CardVariant;
  /** Class override */
  className?: string;
  /** Click handler */
  onClick?: () => void;
};

// ── Style Map ──────────────────────────────────────────────────────────────────

const TREND_COLORS: Record<string, string> = {
  up: "text-[var(--color-success)]",
  down: "text-[var(--score-high)]",
  neutral: "text-[var(--color-text-tertiary)]",
};

const TREND_ICONS: Record<string, string> = {
  up: "▲",
  down: "▼",
  neutral: "–",
};

// ── Component ─────────────────────────────────────────────────────────────────

export function MetricCard({
  icon,
  value,
  label,
  trend,
  trendValue,
  variant = "default",
  className,
  onClick,
}: MetricCardProps) {
  const prefersReduced = useReducedMotion();

  const card = (
    <Card
      variant={onClick ? "interactive" : variant}
      padding="md"
      className={cn(className)}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e: React.KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      <div className="flex items-start justify-between">
        {/* Icon */}
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
            {icon}
          </div>
        )}

        {/* Trend indicator */}
        {trend && trendValue && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-medium",
              TREND_COLORS[trend],
            )}
          >
            <span className="text-[10px]" aria-hidden="true">
              {TREND_ICONS[trend]}
            </span>
            {trendValue}
          </span>
        )}
      </div>

      {/* Value */}
      <div className="mt-3 text-2xl font-medium text-[var(--color-text-primary)]">
        {value}
      </div>

      {/* Label */}
      <div className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">{label}</div>
    </Card>
  );

  if (prefersReduced) return card;

  return <FadeUp>{card}</FadeUp>;
}
MetricCard.displayName = "MetricCard";
