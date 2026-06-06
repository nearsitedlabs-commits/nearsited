"use client";

import { Loader2, TrendingUp } from "lucide-react";
import { ScoreRingWithLabel } from "./ScoreRingWithLabel";

type Props = {
  hasDesign: boolean;
  hasAudit: boolean;
  hasWebsite: boolean;
  overall: number;
  projScore: number;
  opportunityDelta: number;
  runningDesign: boolean;
  runningFullAnalysis: boolean;
  onRunDesign: () => void;
};

export function OpportunityScoreStrip({ hasDesign, hasAudit, hasWebsite, overall, projScore, opportunityDelta, runningDesign, runningFullAnalysis, onRunDesign }: Props) {
  if (hasDesign) {
    return (
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 lg:gap-16 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-4 sm:px-8 py-6">
        <div className="flex flex-col items-center gap-1">
          <p className="text-[10px] uppercase tracking-[0.2em] font-medium text-[var(--text-tertiary)]">Current Score</p>
          <ScoreRingWithLabel score={overall} size={72} />
        </div>
        <div className="hidden sm:flex items-center"><TrendingUp className="h-6 w-6 text-[var(--accent)]" /></div>
        <div className="flex sm:hidden text-[var(--text-tertiary)] text-xs">↓</div>
        <div className="flex flex-col items-center gap-1">
          <p className="text-[10px] uppercase tracking-[0.2em] font-medium text-[var(--text-tertiary)]">Potential Score</p>
          <ScoreRingWithLabel score={projScore} size={72} />
        </div>
        <div className="hidden sm:flex items-center"><TrendingUp className="h-6 w-6 text-[var(--accent)]" /></div>
        <div className="flex sm:hidden text-[var(--text-tertiary)] text-xs">↓</div>
        <div className="flex flex-col items-center gap-1">
          <p className="text-[10px] uppercase tracking-[0.2em] font-medium text-[var(--text-tertiary)]">Opportunity</p>
          <span className="text-[clamp(2rem,5vw,3.5rem)] font-bold text-[var(--score-good)] leading-none">+{opportunityDelta}</span>
          <span className="text-xs text-[var(--text-tertiary)]">point{opportunityDelta !== 1 ? "s" : ""} to gain</span>
        </div>
      </div>
    );
  }

  if (hasAudit) {
    return (
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-8 py-6">
        <div className="flex flex-col items-center gap-1">
          <p className="text-[10px] uppercase tracking-[0.2em] font-medium text-[var(--text-tertiary)]">Current Score</p>
          <ScoreRingWithLabel score={overall} size={72} />
        </div>
        <div className="text-center">
          <p className="text-xs text-[var(--text-tertiary)]">Run a design analysis to see your improvement potential.</p>
          {hasWebsite && (
            <button
              onClick={onRunDesign}
              disabled={runningDesign || runningFullAnalysis}
              className="mt-2 inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--accent)]/40 bg-[var(--accent-tint)] px-3 py-1.5 text-xs font-medium text-[var(--accent)] transition-colors duration-150 hover:bg-[var(--accent)] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {(runningDesign || runningFullAnalysis) ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              {(runningDesign || runningFullAnalysis) ? "Analysing…" : "Analyse Design"}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-8 py-6 text-center">
      <p className="text-sm text-[var(--text-tertiary)]">Run an audit to see scores.</p>
    </div>
  );
}
