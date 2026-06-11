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
    opportunityScore >= 75
      ? "text-[var(--color-success)]"
      : opportunityScore >= 50
        ? "text-[var(--color-info)]"
        : "text-[var(--score-high)]";

  const stats = [
    {
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
    },
    {
      icon: DollarSign,
      label: "Est. Project Value",
      value: estimatedValue
        ? `${estimatedValue.currency}${estimatedValue.low.toLocaleString()}–${estimatedValue.high.toLocaleString()}`
        : "Pending analysis",
      sub: estimatedValue ? "Based on industry & size" : undefined,
    },
    {
      icon: MessageSquare,
      label: "Review Velocity (30d)",
      value: reviewVelocity30d != null
        ? `${reviewVelocity30d} new`
        : "N/A",
      sub: reviewVelocity30d != null ? "from Google Places" : "Run audit to track",
    },
    {
      icon: Building2,
      label: "Local Competition",
      value: localCompetitors
        ? `${localCompetitors.total} nearby / ${localCompetitors.withWebsite} with sites`
        : "N/A",
      sub: localCompetitors ? "in this category" : "Run audit to compare",
    },
  ];

  return (
    <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] px-3.5 py-3 sm:px-4 sm:py-3.5"
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
