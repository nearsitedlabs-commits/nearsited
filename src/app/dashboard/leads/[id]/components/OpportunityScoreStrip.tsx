"use client";

import { opportunityLabel } from "@/lib/scoring";
import { ScoreRingWithLabel } from "./ScoreRingWithLabel";

type Props = {
  opportunityScore: number;
  isVerified: boolean;
  hasAudit: boolean;
  hasWebsite: boolean;
};

export function OpportunityScoreStrip({ opportunityScore, isVerified, hasAudit, hasWebsite }: Props) {
  const chip = isVerified
    ? { label: "Verified", cls: "text-[var(--badge-green-text)] bg-[var(--badge-green-bg)] border-[var(--badge-green-border)]" }
    : hasAudit
    ? { label: "Partial", cls: "text-[var(--badge-amber-text)] bg-[var(--badge-amber-bg)] border-[var(--badge-amber-border)]" }
    : { label: "Estimated", cls: "text-[var(--text-tertiary)] bg-[var(--bg-elevated)] border-[var(--border)]" };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-8 py-6 flex flex-col items-center gap-2">
      <p className="text-[10px] uppercase tracking-[0.2em] font-medium text-[var(--text-tertiary)]">Opportunity Score</p>
      <ScoreRingWithLabel score={opportunityScore} size={88} label={opportunityLabel(opportunityScore)} />
      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${chip.cls}`}>
        {chip.label}
      </span>
      {!hasAudit && (
        <p className="text-xs text-[var(--text-tertiary)]">Run an audit to get a verified score</p>
      )}
      {hasAudit && !isVerified && hasWebsite && (
        <p className="text-xs text-[var(--text-tertiary)]">Run a design analysis above to refine</p>
      )}
    </div>
  );
}
