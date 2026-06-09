"use client";

import { CheckCircle2, Circle, Loader2 } from "lucide-react";

// ── Step definitions ────────────────────────────────────────────────────────────

export const AUDIT_STEP_KEYS = ["fetching", "mobile", "desktop", "audit_complete"] as const;

export const ALL_STEPS: { key: string; label: string }[] = [
  { key: "fetching",             label: "Fetching site data" },
  { key: "mobile",               label: "Running Mobile PageSpeed" },
  { key: "desktop",              label: "Running Desktop PageSpeed" },
  { key: "audit_complete",       label: "Performance audit complete" },
  { key: "mobile-screenshot",    label: "Taking Mobile screenshot" },
  { key: "desktop-screenshot",   label: "Taking Desktop screenshot" },
  { key: "analysing_mobile",     label: "Analysing Mobile design" },
  { key: "analysing_desktop",    label: "Analysing Desktop design" },
  { key: "design_complete",      label: "Analysis complete" },
];

// ── Component ───────────────────────────────────────────────────────────────────

type AuditProgressPanelProps = {
  /** Array of completed step keys */
  completedKeys: string[];
  /** Array of currently active step keys */
  activeKeys: string[];
  /** Whether to show the progress panel at all */
  showProgress: boolean;
  /** Cancel button click handler (shown when running) */
  onCancel?: () => void;
  /** Whether an audit is currently running */
  running: boolean;
};

export function AuditProgressPanel({
  completedKeys,
  activeKeys,
  showProgress,
  onCancel,
  running,
}: AuditProgressPanelProps) {
  if (!showProgress) return null;

  return (
    <div className="mt-4">
      <div className="relative rounded-xl border border-[var(--border)] bg-[var(--bg-surface-2)] p-3 sm:p-4">
        {running && onCancel && (
          <button
            onClick={onCancel}
            className="absolute right-3 top-3 sm:right-4 sm:top-4 inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors duration-150 hover:border-red-500/40 hover:text-red-400"
          >
            <span className="h-3.5 w-3.5 flex items-center justify-center">
              <span className="sr-only">×</span>
              ✕
            </span>{" "}
            Cancel
          </button>
        )}
        <div>
          {ALL_STEPS.map((stepDef) => {
            const isDone = completedKeys.includes(stepDef.key);
            const isActive = !isDone && activeKeys.includes(stepDef.key);
            return (
              <div key={stepDef.key} className="flex items-center gap-2.5 py-0.5">
                {isDone ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--score-good)]" />
                ) : isActive ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[var(--accent)]" />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                )}
                <span
                  className={`text-sm ${
                    isDone
                      ? "text-[var(--text-tertiary)] line-through"
                      : isActive
                        ? "font-medium text-[var(--text-primary)]"
                        : "text-[var(--text-tertiary)]"
                  }`}
                >
                  {stepDef.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
