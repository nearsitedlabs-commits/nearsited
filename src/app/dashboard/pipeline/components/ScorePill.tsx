"use client";

import { opportunityLabel } from "@/lib/scoring";

interface ScorePillProps {
  score: number;
}

export function ScorePill({ score }: ScorePillProps) {
  const label = opportunityLabel(score);

  const colorClass =
    score >= 70
      ? "text-[var(--color-success)] bg-[var(--color-success)]/10"
      : score >= 40
        ? "text-[var(--color-warning)] bg-[var(--color-warning)]/10"
        : "text-[var(--color-danger)] bg-[var(--color-danger)]/10";

  return (
    <span
      title={label}
      className={`inline-flex items-center text-[11px] px-1.5 py-0.5 rounded-[var(--radius-sm)] font-semibold whitespace-nowrap ${colorClass}`}
    >
      {score}
    </span>
  );
}
