import Link from "next/link";
import { Eye } from "lucide-react";
import { AnimatePresence, motion } from "@/lib/motion";
import { fadeUpVariants } from "@/lib/motion";
import type { LeadRow } from "./types";

type AnalyseProgress = { step: number; phase: string; label: string; error?: string };

type Props = {
  lead: LeadRow;
  isAnalysing: boolean;
  progress: AnalyseProgress | undefined;
  onAnalyse: (leadId: string, website: string) => void;
};

export function LeadActionCell({ lead, isAnalysing, progress, onAnalyse }: Props) {
  const isFullyAnalysed = lead.audited_at !== null && lead.design_analyzed_at !== null;
  const hasError = !!progress?.error;
  const canAnalyse = !!lead.website && (lead.website_status === "has_website" || lead.website_status === "platform_only");

  const viewBtn = (
    <Link
      href={`/dashboard/leads/${lead.id}?from=leads`}
      className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] px-2.5 py-1 text-xs font-medium text-[var(--text-tertiary)] transition-colors hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
    >
      <Eye className="h-3 w-3" /> View
    </Link>
  );

  if (lead.website_status === "no_website") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={`/dashboard/leads/${lead.id}?from=leads`}
          className="inline-flex items-center gap-1 rounded-lg bg-[var(--accent)] px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-[var(--accent-hover)]"
        >
          Generate Outreach
        </Link>
        {viewBtn}
      </div>
    );
  }

  if (lead.website_status === "social_only" || lead.website_status === "platform_only") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={`/dashboard/leads/${lead.id}?from=leads`}
          className="inline-flex items-center gap-1 rounded-lg border border-[var(--accent)]/30 bg-[var(--accent-tint)] px-2.5 py-1 text-xs font-medium text-[var(--accent)] transition-colors hover:bg-[var(--accent)] hover:text-white"
        >
          Review Opportunity
        </Link>
        {viewBtn}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-2">
        {isAnalysing ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-[var(--accent)]">
            <Spinner /> Analysing…
          </span>
        ) : hasError ? (
          <button
            onClick={() => onAnalyse(lead.id, lead.website!)}
            className="cursor-pointer rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20"
          >
            Retry
          </button>
        ) : canAnalyse && !isFullyAnalysed ? (
          <button
            onClick={() => onAnalyse(lead.id, lead.website!)}
            className="cursor-pointer rounded-lg border border-[var(--accent)]/30 bg-[var(--accent-tint)] px-2.5 py-1 text-xs font-medium text-[var(--accent)] transition-colors hover:bg-[var(--accent)] hover:text-white"
          >
            Analyse
          </button>
        ) : canAnalyse && isFullyAnalysed ? (
          <button
            onClick={() => onAnalyse(lead.id, lead.website!)}
            className="cursor-pointer rounded-lg border border-[var(--border)] px-2.5 py-1 text-xs font-medium text-[var(--text-tertiary)] transition-colors hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
          >
            Re-analyse
          </button>
        ) : null}
        {viewBtn}
      </div>

      <AnimatePresence mode="wait">
        {isAnalysing && progress && (
          <motion.div
            key="analysis-progress"
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-2"
          >
            <div className="flex items-center gap-1.5">
              <Spinner className="shrink-0" />
              <span className="text-[11px] text-[var(--text-primary)]">{progress.label}</span>
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

function Spinner({ className = "" }: { className?: string }) {
  return (
    <svg className={`h-3 w-3 animate-spin text-[var(--accent)] ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
