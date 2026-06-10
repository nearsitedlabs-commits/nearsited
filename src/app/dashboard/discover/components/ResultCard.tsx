"use client";

import Link from "next/link";
import { motion } from "@/lib/motion";
import { Loader2 } from "lucide-react";
import {
  estimatedOpportunity,
  computeOpportunityScore,
  blendQualityForOpportunity,
  scoreColor,
} from "@/lib/scoring";
import type { BusinessResult } from "./types";

// ── Progress info type ──
type ProgressInfo = {
  step: string;
  label: string;
  phase: "audit" | "design" | "done" | "error";
  error?: string;
};

type ResultCardProps = {
  business: BusinessResult;
  analyseProgress: Map<string, ProgressInfo>;
  auditedIds: Set<string>;
  analysedIds: Set<string>;
  pipelineIds: Set<string>;
  pipelineLoadingId: string | null;
  selectedBusinessType: string;
  onAnalyseOpportunity: (businessId: string, website: string) => void;
  onCancelAnalysis: (businessId: string) => void;
  onAddToPipeline: (businessId: string) => void;
  onRemoveFromPipeline: (businessId: string) => void;
};

// ── Tier color mapping ──
const _TIER_COLORS: Record<string, { ring: string; text: string }> = {
  high: { ring: "border-[var(--score-good)]", text: "text-[var(--score-good)]" },
  medium: { ring: "border-[var(--score-mid)]", text: "text-[var(--score-mid)]" },
  low: { ring: "border-[var(--score-high)]", text: "text-[var(--score-high)]" },
};

function _getTier(score: number): string {
  if (score >= 70) return "high";
  if (score >= 45) return "medium";
  return "low";
}

// ── Compute effective score for a business ──
function getEffectiveScore(business: BusinessResult): number {
  const mobilePf = business.audit?.mobile?.performance_score ?? null;
  const desktopPf = business.audit?.desktop?.performance_score ?? null;
  const designPf = business.design_score ?? null;
  const hasData = mobilePf != null || desktopPf != null || designPf != null;

  if (hasData) {
    return computeOpportunityScore(
      blendQualityForOpportunity(mobilePf, desktopPf, designPf),
      business.review_count ?? 0,
      business.rating ?? 0,
      business.business_type ?? undefined
    );
  }

  return estimatedOpportunity({
    website_status: business.website_status,
    website: business.website ?? null,
    rating: business.rating ?? null,
    user_ratings_total: business.review_count ?? null,
  });
}

// ── Styling for score circle ──
function getScoreCircleStyle(score: number): { ring: string; text: string } {
  const color = scoreColor(score);
  const map: Record<string, { ring: string; text: string }> = {
    emerald: { ring: "border-[var(--score-good)]", text: "text-[var(--score-good)]" },
    green: { ring: "border-[var(--score-good)]", text: "text-[var(--score-good)]" },
    amber: { ring: "border-[var(--score-mid)]", text: "text-[var(--score-mid)]" },
    red: { ring: "border-[var(--score-high)]", text: "text-[var(--score-high)]" },
  };
  return map[color] ?? map.amber;
}

export function ResultCard({
  business,
  analyseProgress,
  auditedIds,
  analysedIds,
  pipelineIds,
  pipelineLoadingId,
  onAnalyseOpportunity,
  onCancelAnalysis,
  onAddToPipeline,
  onRemoveFromPipeline,
}: ResultCardProps) {
  const ap = analyseProgress.get(business.id);
  const isAnalyseDone =
    auditedIds.has(business.id) && analysedIds.has(business.id);
  const isInPipeline = pipelineIds.has(business.id);
  const isAnalyseLoading =
    ap && ap.phase !== "done" && ap.phase !== "error";

  // Determine whether this business can be audited
  const canAudit =
    business.website_status === "has_website" ||
    business.website_status === "platform_only";

  // Score
  const effectiveScore = getEffectiveScore(business);
  const circleStyle = getScoreCircleStyle(effectiveScore);

  // Loading spinner
  const isLoading = isAnalyseLoading || pipelineLoadingId === business.id;

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 6 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
        },
      }}
      className="flex items-center gap-3 px-4 md:px-5 py-2 min-h-[42px] transition-colors duration-150 hover:bg-[var(--bg-elevated)] cursor-default border-b border-[var(--border)] last:border-b-0"
    >
      {/* Score circle — 28x28, border-only */}
      {isAnalyseLoading ? (
        <div className="flex items-center justify-center w-7 h-7 flex-shrink-0">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--accent)]" />
        </div>
      ) : (
        <div
          className={`flex items-center justify-center w-7 h-7 rounded-full border-2 flex-shrink-0 ${circleStyle.ring}`}
        >
          <span className={`text-[10px] font-semibold leading-none ${circleStyle.text}`}>
            {effectiveScore}
          </span>
        </div>
      )}

      {/* Business name — single line, ellipsis */}
      <div className="flex-1 min-w-0">
        <span className="text-[13px] font-medium tracking-[-0.01em] text-[var(--text-primary)] truncate block leading-snug">
          {business.name}
        </span>
      </div>

      {/* Rating + review count — 11px tertiary */}
      {business.rating != null && !isAnalyseLoading && (
        <div className="flex-shrink-0 text-[11px] text-[var(--text-tertiary)] whitespace-nowrap">
          <span className="text-[var(--badge-amber-text)]">★</span>{" "}
          {business.rating.toFixed(1)}
          {business.review_count != null && business.review_count > 0 && (
            <span className="text-[var(--text-tertiary)] ml-0.5">
              · {business.review_count}
            </span>
          )}
        </div>
      )}

      {/* Action buttons — 2 max */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Left action: View or Audit */}
        {isAnalyseLoading && ap ? (
          <>
            <Link
              href={`/dashboard/leads/${business.id}?from=discover&analyze=1`}
              className="inline-flex items-center justify-center whitespace-nowrap text-[11px] font-medium h-7 px-2.5 rounded-md border border-[var(--accent)]/40 text-[var(--accent)] hover:bg-[var(--accent-tint)] transition-all duration-150"
            >
              View
            </Link>
            <button
              type="button"
              onClick={() => onCancelAnalysis(business.id)}
              className="inline-flex items-center justify-center gap-1 whitespace-nowrap text-[11px] font-medium h-7 px-2.5 rounded-md border border-[var(--border)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-all duration-150"
            >
              <Loader2 className="h-2.5 w-2.5 animate-spin" />
            </button>
          </>
        ) : ap?.phase === "error" ? (
          <button
            type="button"
            onClick={() => onAnalyseOpportunity(business.id, business.website!)}
            className="inline-flex items-center justify-center whitespace-nowrap text-[11px] font-medium h-7 px-2.5 rounded-md border border-red-500/30 text-[var(--badge-red-text)] hover:bg-red-500/10 transition-all duration-150"
            title={ap.label}
          >
            Retry
          </button>
        ) : canAudit ? (
          <>
            {isAnalyseDone ? (
              <Link
                href={`/dashboard/leads/${business.id}?from=discover`}
                className="inline-flex items-center justify-center whitespace-nowrap text-[11px] font-medium h-7 px-2.5 rounded-md border border-[var(--accent)]/40 text-[var(--accent)] hover:bg-[var(--accent-tint)] transition-all duration-150"
              >
                View
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => onAnalyseOpportunity(business.id, business.website!)}
                disabled={isLoading}
                className="inline-flex items-center justify-center whitespace-nowrap text-[11px] font-medium h-7 px-2.5 rounded-md border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]/40 hover:text-[var(--accent)] transition-all duration-150 disabled:opacity-50"
              >
                Audit
              </button>
            )}
          </>
        ) : (
          <Link
            href={`/dashboard/leads/${business.id}?from=discover`}
            className="inline-flex items-center justify-center whitespace-nowrap text-[11px] font-medium h-7 px-2.5 rounded-md border border-[var(--accent)]/40 text-[var(--accent)] hover:bg-[var(--accent-tint)] transition-all duration-150"
          >
            View
          </Link>
        )}

        {/* Pipeline toggle */}
        {isInPipeline ? (
          <button
            type="button"
            onClick={() => onRemoveFromPipeline(business.id)}
            disabled={pipelineLoadingId === business.id}
            className="inline-flex items-center justify-center whitespace-nowrap text-[11px] font-medium h-7 px-2.5 rounded-md border border-red-500 text-red-500 hover:bg-red-500/10 transition-all duration-150 disabled:opacity-50"
          >
            {pipelineLoadingId === business.id ? (
              <span className="inline-flex items-center gap-1">
                <div className="h-2.5 w-2.5 animate-spin rounded-full border-[1.5px] border-red-500 border-t-transparent" />
              </span>
            ) : (
              "Remove"
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onAddToPipeline(business.id)}
            disabled={pipelineLoadingId === business.id}
            className="inline-flex items-center justify-center whitespace-nowrap text-[11px] font-medium h-7 px-2.5 rounded-md border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent-tint)] transition-all duration-150 disabled:opacity-50"
          >
            {pipelineLoadingId === business.id ? (
              <span className="inline-flex items-center gap-1">
                <div className="h-2.5 w-2.5 animate-spin rounded-full border-[1.5px] border-[var(--accent)] border-t-transparent" />
              </span>
            ) : (
              "+ Pipeline"
            )}
          </button>
        )}
      </div>
    </motion.div>
  );
}
