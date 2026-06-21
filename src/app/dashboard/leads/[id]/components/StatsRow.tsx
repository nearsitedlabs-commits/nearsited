"use client";

import { TrendingUp, DollarSign, MessageSquare, Building2 } from "lucide-react";
import { opportunityLabel } from "@/lib/scoring";

type StatsRowProps = {
  /** Opportunity score (0–100) */
  opportunityScore: number;
  /** Whether score is verified vs estimated */
  isVerified: boolean;
  /** Estimated project value range */
  estimatedValue?: { low: number; high: number; currency: string } | null;
  /** New reviews in last 30 days */
  reviewVelocity30d?: number | null;
  /** Local competitors data */
  localCompetitors?: { total: number; withWebsite: number } | null;
};

/**
 * 4-card stats row replacing the standalone opportunity score hero.
 * Shows: Opportunity Score, Estimated Project Value, Review Velocity, Local Competition.
 */
export function StatsRow({
  opportunityScore,
  isVerified,
  estimatedValue,
  reviewVelocity30d,
  localCompetitors,
}: StatsRowProps) {
  const label = opportunityLabel(opportunityScore);
  const scoreColor =
    opportunityScore >= 70
      ? "text-[var(--color-success)]"
      : opportunityScore >= 45
        ? "text-[var(--color-warning)]"
        : opportunityScore >= 25
          ? "text-[var(--color-info)]"
          : "text-[var(--color-danger)]";

  type StatItem = {
    icon: typeof TrendingUp;
    label: string;
    value: React.ReactNode;
    sub?: string;
  };

  const stats: StatItem[] = [];

  // Always show the opportunity score
  stats.push({
    icon: TrendingUp,
    label: "Opportunity Score",
    value: (
      <span className={scoreColor}>
        {opportunityScore}
        <span className="ml-1 text-xs font-normal text-[var(--color-text-tertiary)]">
          · {label}{isVerified ? "" : " (est.)"}
        </span>
      </span>
    ),
  });

  if (estimatedValue) {
    stats.push({
      icon: DollarSign,
      label: "Est. Project Value",
      value: `${estimatedValue.currency}${estimatedValue.low.toLocaleString()}–${estimatedValue.high.toLocaleString()}`,
      sub: "Based on industry & size",
    });
  }

  if (reviewVelocity30d != null) {
    stats.push({
      icon: MessageSquare,
      label: "Review Velocity (30d)",
      value: `${reviewVelocity30d} new`,
      sub: "from Google Places",
    });
  }

  if (localCompetitors) {
    stats.push({
      icon: Building2,
      label: "Local Competition",
      value: `${localCompetitors.total} nearby / ${localCompetitors.withWebsite} with sites`,
      sub: "in this category",
    });
  }

  const gridCols =
    stats.length === 1
      ? "grid-cols-1 sm:grid-cols-1"
      : stats.length === 2
        ? "grid-cols-2 sm:grid-cols-2"
        : stats.length === 3
          ? "grid-cols-2 sm:grid-cols-3"
          : "grid-cols-2 sm:grid-cols-4";

  return (
    <div className={`mb-6 grid gap-2 sm:gap-3 ${gridCols}`}>
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="rounded-[var(--radius-md)] bg-[var(--color-bg-surface-raised)] px-3.5 py-3 sm:px-4 sm:py-3.5"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Icon className="h-3.5 w-3.5 text-[var(--color-text-tertiary)]" />
              <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
                {stat.label}
              </span>
            </div>
            <p className="text-sm font-semibold text-[var(--color-text-primary)] leading-tight">
              {stat.value}
            </p>
            {stat.sub && (
              <p className="mt-0.5 text-[10px] text-[var(--color-text-tertiary)]">{stat.sub}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
