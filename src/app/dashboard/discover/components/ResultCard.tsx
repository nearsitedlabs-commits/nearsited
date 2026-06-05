"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, Flag, MapPin, Globe, Phone } from "lucide-react";
import { WebsiteBadge } from "@/components/ui/WebsiteBadge";
import { businessTypes } from "@/lib/data/businessTypes";
import { OUTREACH_REASONS } from "@/lib/ui-constants";
import { estimatedOpportunity, computeOpportunityScore } from "@/lib/scoring";
import { AnimatedScoreRing } from "./AnimatedScoreRing";
import { ProgressPanel } from "./ProgressPanel";
import type { BusinessResult } from "./types";

// ── Muted reason tags when no audit/design actions are available ──
const NO_ACTION_LABEL: Record<string, string> = {
  no_website: "No site to audit",
  social_only: "Social profile only",
  platform_only: "Platform page only",
};

// ── Utility: get label for business type value ──
function getBusinessTypeLabel(value: string): string {
  const bt = businessTypes.find((t) => t.value === value);
  return bt?.label ?? value;
}

// ── Utility: extract city from address ──
function extractCity(address: string): string {
  return address?.split(",")[0]?.trim() ?? address;
}

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

export function ResultCard({
  business,
  analyseProgress,
  auditedIds,
  analysedIds,
  pipelineIds,
  pipelineLoadingId,
  selectedBusinessType,
  onAnalyseOpportunity,
  onCancelAnalysis,
  onAddToPipeline,
  onRemoveFromPipeline,
}: ResultCardProps) {
  const ap = analyseProgress.get(business.id);
  const isAnalyseDone =
    auditedIds.has(business.id) && analysedIds.has(business.id);
  const isInPipeline = pipelineIds.has(business.id);
  const showAnalyseButton =
    business.website_status === "has_website" ||
    business.website_status === "platform_only";
  const isAnalyseLoading =
    ap && ap.phase !== "done" && ap.phase !== "error";
  const cityDisplay = business.city ?? extractCity(business.address);
  const typeDisplay =
    business.business_type ??
    getBusinessTypeLabel(selectedBusinessType);

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 8 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.25,
            ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
          },
        },
      }}
      className="relative w-full flex items-center gap-4 px-5 py-0 min-h-[52px] transition-colors duration-150 hover:bg-[var(--bg-elevated)] cursor-default"
    >
      {/* Thin accent bar — analysis or outreach-flagged */}
      <div
        className={`w-[2px] self-stretch flex-shrink-0 ${
          isAnalyseLoading || business.flagged_for_outreach
            ? "bg-[var(--accent)]"
            : "bg-transparent"
        }`}
      />

      {/* Score ring — spinner during analysis, estimate/verified otherwise */}
      {isAnalyseLoading ? (
        <div className="flex items-center justify-center w-[52px] h-[52px] flex-shrink-0">
          <Loader2 className="h-5 w-5 animate-spin text-[var(--accent)]" />
        </div>
      ) : (() => {
        const verifiedPerf =
          business.audit?.mobile?.performance_score ?? null;
        if (verifiedPerf != null) {
          const oppScore = computeOpportunityScore(
            verifiedPerf,
            business.review_count ?? 0,
            business.rating ?? 0
          );
          return (
            <AnimatedScoreRing
              score={oppScore}
              size={52}
              variant="opportunity"
            />
          );
        }
        const est = estimatedOpportunity({
          website_status: business.website_status,
          website: business.website ?? null,
          rating: business.rating ?? null,
          user_ratings_total: business.review_count ?? null,
        });
        return <AnimatedScoreRing score={est} size={52} variant="estimate" />;
      })()}

      {/* Website-status badge */}
      <div className="w-[90px] flex-shrink-0 flex items-center">
        <WebsiteBadge status={business.website_status} />
      </div>

      {/* Name + meta */}
      <div className="flex-1 min-w-0 py-3.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[13px] font-medium tracking-[-0.01em] text-[var(--text-primary)] truncate leading-snug">
            {business.name}
          </span>
          {isAnalyseLoading && ap && (
            <ProgressPanel ap={ap} onCancel={() => onCancelAnalysis(business.id)} />
          )}
          {business.rating != null && !isAnalyseLoading && (
            <span className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-secondary)] whitespace-nowrap shrink-0">
              <span className="text-[var(--badge-amber-text)]">★</span>
              {business.rating.toFixed(1)}
              {business.review_count != null && business.review_count > 0 && (
                <span className="text-[var(--text-tertiary)]">
                  ({business.review_count})
                </span>
              )}
            </span>
          )}
        </div>
        <div className="mt-0.5 text-[11px] font-normal text-[var(--text-tertiary)] truncate tracking-wide">
          {typeDisplay}
          {typeDisplay && cityDisplay ? " · " : ""}
          {cityDisplay}
        </div>
      </div>

      {/* Icon links */}
      <div className="flex-shrink-0 w-[168px] flex items-center justify-end gap-3">
        {business.flagged_for_outreach && (
          <span
            title={
              business.outreach_reason
                ? OUTREACH_REASONS[business.outreach_reason] ??
                  "Flagged for outreach"
                : "Flagged for outreach"
            }
            className="flex-shrink-0"
          >
            <Flag className="size-[13px] text-[var(--accent)]" />
          </span>
        )}
        <div className="flex items-center gap-2.5 justify-end">
          {business.place_id && (
            <a
              href={`https://www.google.com/maps/place/?q=place_id:${business.place_id}`}
              target="_blank"
              rel="noreferrer"
              className="cursor-pointer text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors duration-150 flex-shrink-0"
              title="View on Google Maps"
            >
              <MapPin className="size-[15px]" />
            </a>
          )}
          {business.website && (
            <a
              href={business.website}
              target="_blank"
              rel="noreferrer"
              className="cursor-pointer text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors duration-150 flex-shrink-0"
              title={business.website}
            >
              <Globe className="size-[15px]" />
            </a>
          )}
          {business.phone && (
            <a
              href={`tel:${business.phone}`}
              className="cursor-pointer text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors duration-150 flex-shrink-0"
              title={business.phone}
            >
              <Phone className="size-[15px]" />
            </a>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div
        className="flex-shrink-0 flex items-center justify-end gap-2"
        style={{ minWidth: "216px" }}
      >
        {/* Analyse Opportunity */}
        {(() => {
          if (isAnalyseLoading)
            return (
              <button
                type="button"
                disabled
                className="cursor-not-allowed text-[11px] font-medium px-2.5 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-tertiary)] opacity-60 w-[120px] text-center"
              >
                <span className="inline-flex items-center justify-center gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Analysing…
                </span>
              </button>
            );
          if (ap?.phase === "error")
            return (
              <button
                type="button"
                onClick={() =>
                  onAnalyseOpportunity(business.id, business.website!)
                }
                className="cursor-pointer text-[11px] px-2.5 py-1.5 rounded-lg border border-red-500/30 text-[var(--badge-red-text)] hover:bg-red-500/10 transition-colors duration-150 w-[120px] text-center"
                title={ap.label}
              >
                Retry
              </button>
            );
          if (isAnalyseDone)
            return (
              <div className="flex items-center gap-1.5">
                <Link
                  href={`/dashboard/leads/${business.id}`}
                  className="inline-flex items-center justify-center text-[11px] font-medium px-2.5 py-1.5 rounded-lg border border-[var(--accent)]/40 text-[var(--accent)] hover:bg-[var(--accent-tint)] transition-all duration-150 w-[90px] text-center"
                >
                  View
                </Link>
                <button
                  type="button"
                  onClick={() =>
                    onAnalyseOpportunity(business.id, business.website!)
                  }
                  className="cursor-pointer text-[11px] font-medium px-2.5 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]/40 hover:text-[var(--accent)] transition-all duration-150 w-[90px] text-center"
                >
                  Re-analyse
                </button>
              </div>
            );
          if (showAnalyseButton)
            return (
              <button
                type="button"
                onClick={() =>
                  onAnalyseOpportunity(business.id, business.website!)
                }
                className="cursor-pointer text-[11px] font-medium px-2.5 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]/40 hover:text-[var(--accent)] transition-all duration-150 w-[120px] text-center"
              >
                Analyse Opportunity
              </button>
            );
          // No site to analyse — show "View" link for non-website lead types
          if (
            business.website_status === "no_website" ||
            business.website_status === "social_only"
          ) {
            return (
              <Link
                href={`/dashboard/leads/${business.id}`}
                className="inline-flex items-center justify-center text-[11px] font-medium px-2.5 py-1.5 rounded-lg border border-[var(--accent)]/40 text-[var(--accent)] hover:bg-[var(--accent-tint)] transition-all duration-150 w-[120px] text-center"
              >
                View Opportunity
              </Link>
            );
          }
          return (
            <span className="text-[11px] italic text-[var(--text-tertiary)] w-[120px] text-center leading-tight">
              {NO_ACTION_LABEL[business.website_status] ?? ""}
            </span>
          );
        })()}

        {/* Pipeline */}
        {isInPipeline ? (
          <button
            type="button"
            onClick={() => onRemoveFromPipeline(business.id)}
            disabled={pipelineLoadingId === business.id}
            className="cursor-pointer text-[11px] font-medium px-3 py-1.5 rounded-lg border border-red-500 text-red-500 hover:bg-red-500/10 transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 w-[90px] text-center"
          >
            {pipelineLoadingId === business.id ? (
              <span className="flex items-center justify-center gap-1.5">
                <div className="h-3 w-3 animate-spin rounded-full border-[1.5px] border-red-500 border-t-transparent" />
                Removing…
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
            className="cursor-pointer text-[11px] font-medium px-3 py-1.5 rounded-lg border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent-tint)] transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 w-[90px] text-center"
          >
            {pipelineLoadingId === business.id ? (
              <span className="flex items-center justify-center gap-1.5">
                <div className="h-3 w-3 animate-spin rounded-full border-[1.5px] border-[var(--accent)] border-t-transparent" />
                Adding…
              </span>
            ) : (
              "+ Add"
            )}
          </button>
        )}
      </div>
    </motion.div>
  );
}
