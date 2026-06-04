"use client";

// ── Analyse Step List (unified progress for audit + design) ──
export const ANALYSE_STEPS: {
  key: string;
  label: string;
  phase: "audit" | "design";
}[] = [
  { key: "fetching", label: "Fetching site data", phase: "audit" },
  { key: "mobile", label: "Running Mobile PageSpeed", phase: "audit" },
  { key: "desktop", label: "Running Desktop PageSpeed", phase: "audit" },
  { key: "audit_complete", label: "Performance audit complete", phase: "audit" },
  { key: "screenshot_mobile", label: "Taking Mobile screenshot", phase: "design" },
  { key: "screenshot_desktop", label: "Taking Desktop screenshot", phase: "design" },
  { key: "analysing_mobile", label: "Analysing Mobile design", phase: "design" },
  { key: "analysing_desktop", label: "Analysing Desktop design", phase: "design" },
  { key: "design_complete", label: "Analysis complete", phase: "design" },
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

  return (
    <>
      <span className="text-xs text-[var(--text-tertiary)] whitespace-nowrap shrink-0">
        Analysing... step {stepNum} of {ANALYSE_STEPS.length}
      </span>
      <button
        type="button"
        onClick={onCancel}
        className="cursor-pointer text-[10px] font-medium text-[var(--text-tertiary)] underline-offset-2 hover:text-[var(--text-secondary)] underline transition-colors"
      >
        Cancel
      </button>
    </>
  );
}
