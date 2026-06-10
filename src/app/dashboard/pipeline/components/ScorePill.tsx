"use client";

import { opportunityLabel } from "@/lib/scoring";

interface ScorePillProps {
  score: number;
}

/**
 * Compact score badge showing the opportunity score number.
 * Color tier: >=70 green, >=40 amber, <40 red.
 * Shows a tooltip with the opportunity label on hover.
 */
export function ScorePill({ score }: ScorePillProps) {
  const label = opportunityLabel(score);

  const colorClass =
    score >= 70
      ? "text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/30"
      : score >= 40
        ? "text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30"
        : "text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30";

  return (
    <span
      title={label}
      className={`inline-flex items-center text-[11px] px-1.5 py-0.5 rounded-full font-semibold whitespace-nowrap ${colorClass}`}
    >
      {score}
    </span>
  );
}
