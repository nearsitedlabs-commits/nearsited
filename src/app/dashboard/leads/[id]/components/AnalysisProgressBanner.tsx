"use client";

import { motion } from "@/lib/motion";
import { ANALYSE_STEPS } from "../hooks/useLeadAnalysis";

type Props = {
  running: boolean;
  completedKeys: string[];
  activeKeys: string[];
};

export function AnalysisProgressBanner({ running, completedKeys, activeKeys }: Props) {
  if (!running) return null;

  // Advance on every received step (activeKeys accumulates each NDJSON progress event)
  const advancedSteps = Math.max(completedKeys.length, activeKeys.length);
  const progressPercent = Math.min((advancedSteps / ANALYSE_STEPS.length) * 100, 97);
  const currentLabel =
    ANALYSE_STEPS.find((s) => s.key === activeKeys[activeKeys.length - 1])?.label ??
    ANALYSE_STEPS.find((s) => s.key === completedKeys[completedKeys.length - 1])?.label ??
    "Starting analysis…";

  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] px-5 py-4">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-sm font-medium text-[var(--color-text-primary)]">Analysing opportunity</span>
        <span className="text-xs tabular-nums text-[var(--color-text-tertiary)]">
          {advancedSteps} / {ANALYSE_STEPS.length}
        </span>
      </div>

      {/* Progress track */}
      <div className="h-1.5 w-full rounded-full bg-[var(--color-bg-elevated)] overflow-hidden">
        <motion.div
          className="relative h-full rounded-full bg-[var(--color-accent)]"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          {/* Leading shimmer */}
          <span className="absolute right-0 top-0 h-full w-6 rounded-full bg-gradient-to-r from-transparent to-white/25 pointer-events-none" />
        </motion.div>
      </div>

      <p className="mt-2 text-xs text-[var(--color-text-tertiary)]">{currentLabel}</p>
    </div>
  );
}
