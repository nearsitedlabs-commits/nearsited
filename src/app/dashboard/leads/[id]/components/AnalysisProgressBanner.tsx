"use client";

import { Loader2 } from "lucide-react";
import { ANALYSE_STEPS } from "../hooks/useLeadAnalysis";

type Props = {
  running: boolean;
  completedKeys: string[];
  activeKeys: string[];
};

export function AnalysisProgressBanner({ running, completedKeys, activeKeys }: Props) {
  if (!running) return null;
  return (
    <div className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4">
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-[var(--accent)]" />
        <span className="text-sm font-medium text-[var(--text-primary)]">Analysing...</span>
      </div>
      <div className="mt-2 h-[4px] w-full rounded-full bg-[var(--border)] overflow-hidden">
        <div
          className="h-full rounded-full bg-[var(--accent)] transition-all duration-500 ease-out"
          style={{ width: `${(completedKeys.length / ANALYSE_STEPS.length) * 100}%` }}
        />
      </div>
      {activeKeys.length > 0 && (
        <p className="mt-1.5 text-xs text-[var(--text-tertiary)]">
          {ANALYSE_STEPS.find((s) => s.key === activeKeys[activeKeys.length - 1])?.label ?? ""}
        </p>
      )}
    </div>
  );
}
