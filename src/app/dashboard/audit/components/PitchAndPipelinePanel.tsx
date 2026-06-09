"use client";

import { CheckCircle2, Loader2, Mail, Plus } from "lucide-react";
import Link from "next/link";
import type { StrategyResult, DesignResult } from "./types";

// ── Component ───────────────────────────────────────────────────────────────────

type PitchAndPipelinePanelProps = {
  /** The audit result */
  auditResult: { mobile: StrategyResult; desktop: StrategyResult } | null;
  /** The design result */
  designResult: { mobile: DesignResult; desktop: DesignResult } | null;
  /** Whether to show the pitch result */
  showPitchResult: boolean;
  /** The generated pitch text */
  pitchResult: string | null;
  /** Whether pitch generation is loading */
  pitchLoading: boolean;
  /** Callback to generate a pitch */
  onGeneratePitch: () => void;
  /** Callback to retry design analysis */
  onRetryDesign: (strategy: "mobile" | "desktop") => void;
  /** Whether pipeline add is loading */
  pipelineLoading: boolean;
  /** Whether pipeline add succeeded */
  pipelineAdded: boolean;
  /** Pipeline error message */
  pipelineError: string | null;
  /** Callback to add to pipeline */
  onAddToPipeline: () => void;
  /** Saved business ID from pipeline add */
  savedBusinessId: string | null;
};

export function PitchAndPipelinePanel({
  auditResult,
  designResult,
  showPitchResult,
  pitchResult,
  pitchLoading,
  onGeneratePitch,
  onRetryDesign,
  pipelineLoading,
  pipelineAdded,
  pipelineError,
  onAddToPipeline,
  savedBusinessId,
}: PitchAndPipelinePanelProps) {
  if (!auditResult) return null;

  // ── Determine if pitch should note that design data is missing ────────────────
  const designMissing =
    !designResult ||
    (designResult.mobile.status !== "ok" && designResult.desktop.status !== "ok");

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/* Design missing notice */}
      {designMissing && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-400 sm:col-span-2">
          Pitch will be based on performance data only.{" "}
          <button
            onClick={() => {
              if (designResult?.mobile.status !== "ok") onRetryDesign("mobile");
              if (designResult?.desktop.status !== "ok") onRetryDesign("desktop");
            }}
            className="cursor-pointer underline hover:text-amber-300"
          >
            Retry design analysis
          </button>{" "}
          above for a richer pitch.
        </div>
      )}

      {/* Generate Pitch */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface-1)] p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch sm:justify-between">
          <div>
            <h3 className="text-base font-medium text-[var(--text-primary)]">
              Generate Pitch
            </h3>
          </div>
          {auditResult.mobile.status === "timeout" &&
          auditResult.desktop.status === "timeout" ? (
            <div
              className="inline-flex w-full sm:w-auto cursor-not-allowed items-center gap-2 rounded-lg bg-[var(--bg-surface-2)] px-5 py-2.5 text-sm font-medium text-[var(--text-tertiary)]"
              title="Generate Pitch (unavailable — audit failed)"
            >
              <Mail className="h-4 w-4" />
              Generate Pitch (unavailable — audit failed)
            </div>
          ) : (
            <button
              onClick={onGeneratePitch}
              disabled={pitchLoading}
              className="inline-flex w-full sm:w-auto cursor-pointer items-center gap-2 rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pitchLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mail className="h-4 w-4" />
              )}
              {pitchLoading ? "Generating…" : "Generate Pitch"}
            </button>
          )}
        </div>

        {showPitchResult && pitchResult && (
          <div className="mt-4 space-y-2">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface-2)] p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-medium text-[var(--text-tertiary)]">
                  Pitch Preview
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(pitchResult);
                  }}
                  className="cursor-pointer text-xs font-medium text-[var(--accent)] hover:underline"
                >
                  Copy to clipboard
                </button>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-secondary)]">
                {pitchResult}
              </p>
            </div>
            <p className="text-xs text-[var(--text-tertiary)]">
              {savedBusinessId ? (
                <>
                  Customise tone, channel & format on the{" "}
                  <Link
                    href={`/dashboard/leads/${savedBusinessId}`}
                    className="text-[var(--accent)] hover:underline"
                  >
                    lead page →
                  </Link>
                </>
              ) : (
                "Save as lead to unlock tone, channel & format options."
              )}
            </p>
          </div>
        )}
      </div>

      {/* Add to Pipeline */}
      {pipelineAdded ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--score-good)]/30 bg-[var(--score-good-tint)] px-5 py-4 text-sm text-[var(--badge-green-text)]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Added to pipeline.</span>
          </div>
          {savedBusinessId && (
            <Link
              href={`/dashboard/leads/${savedBusinessId}`}
              className="shrink-0 font-medium underline hover:opacity-80"
            >
              View Opportunity →
            </Link>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface-1)] p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-base font-medium text-[var(--text-primary)]">
              Add to Pipeline
            </h3>
            <button
              type="button"
              onClick={onAddToPipeline}
              disabled={pipelineLoading}
              className="inline-flex w-full sm:w-auto cursor-pointer items-center gap-2 rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pipelineLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {pipelineLoading ? "Adding…" : "Add to Pipeline"}
            </button>
          </div>
          {pipelineError && (
            <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {pipelineError}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
