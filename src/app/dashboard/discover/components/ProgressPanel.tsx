"use client";

import { motion } from "@/lib/motion";

export const ANALYSE_STEPS: {
  key: string;
  label: string;
  phase: "audit" | "design";
}[] = [
  { key: "fetching",            label: "Fetching site data",          phase: "audit" },
  { key: "mobile",              label: "Running Mobile PageSpeed",    phase: "audit" },
  { key: "desktop",             label: "Running Desktop PageSpeed",   phase: "audit" },
  { key: "audit_complete",      label: "Performance audit complete",  phase: "audit" },
  { key: "screenshot_mobile",   label: "Taking Mobile screenshot",    phase: "design" },
  { key: "screenshot_desktop",  label: "Taking Desktop screenshot",   phase: "design" },
  { key: "analysing_mobile",    label: "Analysing Mobile design",     phase: "design" },
  { key: "analysing_desktop",   label: "Analysing Desktop design",    phase: "design" },
  { key: "design_complete",     label: "Analysis complete",           phase: "design" },
];

type ProgressInfo = {
  step: string;
  label: string;
  phase: "audit" | "design" | "done" | "error";
  error?: string;
};

type ProgressPanelProps = {
  ap: ProgressInfo;
  onCancel: () => void;
};

export function ProgressPanel({ ap, onCancel }: ProgressPanelProps) {
  const currentIdx = ANALYSE_STEPS.findIndex((s) => s.key === ap.step);
  const stepNum = currentIdx >= 0 ? currentIdx + 1 : ANALYSE_STEPS.length;
  const progressPercent = Math.min((stepNum / ANALYSE_STEPS.length) * 100, 97);
  const currentLabel = ANALYSE_STEPS[currentIdx]?.label ?? ap.label ?? "Analysing…";

  return (
    <div className="w-full mt-1.5 space-y-1.5">
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

      {/* Step label + cancel */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] text-[var(--color-text-tertiary)] truncate">{currentLabel}</span>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] tabular-nums text-[var(--color-text-tertiary)]">
            {stepNum}/{ANALYSE_STEPS.length}
          </span>
          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer text-[11px] font-medium text-[var(--color-text-tertiary)] underline underline-offset-2 hover:text-[var(--color-text-secondary)] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
