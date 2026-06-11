import Link from "next/link";
import { Eye, Loader2 } from "lucide-react";
import { AnimatePresence, motion, fadeUpVariants } from "@/lib/motion";
import type { LeadRow, OpportunityStatus } from "./types";

type AnalyseProgress = { step: number; phase: string; label: string; error?: string };

type Props = {
  lead: LeadRow;
  status: OpportunityStatus;
  isAnalysing: boolean;
  progress: AnalyseProgress | undefined;
  onAnalyse: (leadId: string, website: string) => void;
  onPitch?: (leadId: string) => void;
};

/**
 * Single context-aware action button per row.
 * - New → "Audit" (if can audit) or "View" (if no website)
 * - Audited → "View" (pitch generation is on the detail page)
 * - Pitched → "Send" (link to detail page with pitch focus)
 * - In pipeline → "View"
 * - Won/Lost/Archived → "View"
 */
export function LeadActionCell({ lead, status, isAnalysing, progress, onAnalyse, onPitch: _onPitch }: Props) {
  const canAnalyse = !!lead.website && (lead.website_status === "has_website" || lead.website_status === "platform_only");
  const hasError = !!progress?.error;

  // View button — used as fallback for most statuses
  const viewBtn = (
    <Link
      href={`/dashboard/leads/${lead.id}?from=leads`}
      className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--color-accent)]/30 px-2.5 py-1 text-xs font-medium text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent)]/10"
    >
      <Eye className="h-3 w-3" /> View
    </Link>
  );

  // Analyse button
  const analyseBtn = (
    <button
      onClick={() => onAnalyse(lead.id, lead.website!)}
      className="cursor-pointer inline-flex items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 px-2.5 py-1 text-xs font-medium text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent)] hover:text-white"
    >
      Audit
    </button>
  );

  // Retry button (after error)
  const retryBtn = (
    <button
      onClick={() => onAnalyse(lead.id, lead.website!)}
      className="cursor-pointer inline-flex items-center gap-1 rounded-[var(--radius-sm)] border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20"
    >
      Retry
    </button>
  );

  // Spinner during analysis
  const spinner = (
    <span className="inline-flex items-center gap-1.5 text-xs text-[var(--color-accent)]">
      <Loader2 className="h-3 w-3 animate-spin" /> Analysing…
    </span>
  );

  // Determine which button to show
  let primaryBtn = viewBtn;

  if (isAnalysing) {
    primaryBtn = spinner;
  } else if (hasError) {
    primaryBtn = retryBtn;
  } else if (status === "new" && canAnalyse) {
    primaryBtn = analyseBtn;
  } else if (status === "pitched") {
    primaryBtn = (
      <Link
        href={`/dashboard/leads/${lead.id}?from=leads&tab=pitch`}
        className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 px-2.5 py-1 text-xs font-medium text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent)] hover:text-white"
      >
        Send
      </Link>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        {primaryBtn}
      </div>

      <AnimatePresence mode="wait">
        {isAnalysing && progress && (
          <motion.div
            key="analysis-progress"
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] p-2"
          >
            <div className="flex items-center gap-1.5">
              <Loader2 className="h-2.5 w-2.5 animate-spin shrink-0 text-[var(--color-accent)]" />
              <span className="text-[11px] text-[var(--color-text-primary)]">{progress.label}</span>
            </div>
          </motion.div>
        )}

        {hasError && !isAnalysing && (
          <motion.p
            key="analysis-error"
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="text-[11px] text-red-400"
          >
            {progress!.error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
