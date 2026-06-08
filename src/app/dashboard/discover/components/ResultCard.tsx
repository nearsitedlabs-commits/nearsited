"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, Flag, MapPin, Globe, Phone } from "lucide-react";
import { WebsiteBadge } from "@/components/ui/WebsiteBadge";
import { businessTypes } from "@/lib/data/businessTypes";
import { OUTREACH_REASONS } from "@/lib/ui-constants";
import { estimatedOpportunity, computeOpportunityScore, blendQualityForOpportunity } from "@/lib/scoring";
import { safeHref } from "@/lib/url-security";
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
      className="relative w-full flex flex-wrap md:flex-nowrap items-center gap-x-4 gap-y-2 px-4 md:px-5 py-3 md:py-0 min-h-[auto] md:min-h-[52px] transition-colors duration-150 hover:bg-[var(--bg-elevated)] cursor-default"
    >
      {/* Thin accent bar — analysis or outreach-flagged */}
      <div
        className={`block w-[2px] self-stretch flex-shrink-0 ${
          isAnalyseLoading || business.flagged_for_outreach
            ? "bg-[var(--accent)]"
            : "bg-transparent"
        }`}
      />

      {/* Score ring — spinner during analysis, estimate/verified otherwise */}
      {isAnalyseLoading ? (
        <div className="flex items-center justify-center w-10 h-10 md:w-[52px] md:h-[52px] flex-shrink-0">
          <Loader2 className="h-5 w-5 animate-spin text-[var(--accent)]" />
        </div>
      ) : (() => {
        const mobilePf  = business.audit?.mobile?.performance_score ?? null;
        const desktopPf = business.audit?.desktop?.performance_score ?? null;
        const designPf  = business.design_score ?? null;
        const hasData   = mobilePf != null || desktopPf != null || designPf != null;
        if (hasData) {
          const oppScore = computeOpportunityScore(
            blendQualityForOpportunity(mobilePf, desktopPf, designPf),
            business.review_count ?? 0,
            business.rating ?? 0,
            business.business_type ?? undefined
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
        const canBeAnalysed =
          business.website_status !== "no_website" &&
          business.website_status !== "social_only";
        return (
          <AnimatedScoreRing
            score={est}
            size={52}
            variant={canBeAnalysed ? "estimate" : "opportunity"}
          />
        );
      })()}

      {/* Website-status badge — mobile: next to score ring; desktop: own column */}
      <div className="md:hidden flex-shrink-0">
        <WebsiteBadge status={business.website_status} />
      </div>
      <div className="hidden md:flex w-[90px] flex-shrink-0 items-center">
        <WebsiteBadge status={business.website_status} />
      </div>

      {/* Name + meta */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium tracking-[-0.01em] text-[var(--text-primary)] truncate leading-snug">
            {business.name}
          </span>
          {business.rating != null && !isAnalyseLoading && (
            <span className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-secondary)] whitespace-nowrap shrink-0">
              <span className="text-[var(--badge-amber-text)]">★</span>
              {business.rating.toFixed(1)}
              {business.review_count != null && business.review_count > 0 && (
                <span className="text-[var(--text-tertiary)]">({business.review_count})</span>
              )}
            </span>
          )}
        </div>
        {isAnalyseLoading && ap ? (
          <ProgressPanel ap={ap} onCancel={() => onCancelAnalysis(business.id)} />
        ) : (
          <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-normal text-[var(--text-tertiary)] truncate tracking-wide">
              {typeDisplay}
              {typeDisplay && cityDisplay ? " · " : ""}
              {cityDisplay}
            </span>
            {business.flagged_for_outreach && (
              <span className="md:hidden inline-flex items-center gap-1 rounded-md border border-[var(--accent)]/30 bg-[var(--accent-tint)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--accent)]">
                <Flag className="h-2.5 w-2.5" />
                Outreach
              </span>
            )}
          </div>
        )}
      </div>

      {/* Icon links — desktop only, fixed 4-slot grid so columns always align */}
      <div className="hidden md:grid grid-cols-4 flex-shrink-0 w-[112px] items-center gap-0">
        {/* Flag slot */}
        <div className="flex items-center justify-center w-7 h-7">
          {business.flagged_for_outreach && (
            <span title={business.outreach_reason ? OUTREACH_REASONS[business.outreach_reason] ?? "Flagged for outreach" : "Flagged for outreach"}>
              <Flag className="size-[13px] text-[var(--accent)]" />
            </span>
          )}
        </div>
        {/* Maps slot */}
        <div className="flex items-center justify-center w-7 h-7">
          {business.place_id && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query_place_id=${business.place_id}&query=${encodeURIComponent(business.name)}`}
              target="_blank"
              rel="noreferrer"
              className="cursor-pointer text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors duration-150"
              title="View on Google Maps"
            >
              <MapPin className="size-[15px]" />
            </a>
          )}
        </div>
        {/* Globe slot */}
        <div className="flex items-center justify-center w-7 h-7">
          {business.website && safeHref(business.website) && (
            <a
              href={safeHref(business.website)!}
              target="_blank"
              rel="noreferrer"
              className="cursor-pointer text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors duration-150"
              title={business.website}
            >
              <Globe className="size-[15px]" />
            </a>
          )}
        </div>
        {/* Phone slot */}
        <div className="flex items-center justify-center w-7 h-7">
          {business.phone && (
            <a
              href={`tel:${business.phone}`}
              className="cursor-pointer text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors duration-150"
              title={business.phone}
            >
              <Phone className="size-[15px]" />
            </a>
          )}
        </div>
      </div>

      {/* Action buttons — full-width on mobile (forces wrap), fixed on desktop */}
      <div className="flex items-center gap-2 w-full md:w-auto md:flex-shrink-0 md:min-w-[260px] md:justify-end">
        {/* Analyse Opportunity */}
        {(() => {
          if (isAnalyseLoading)
            return (
              <div className="flex items-center gap-1.5">
                <Link
                  href={`/dashboard/leads/${business.id}?from=discover&analyze=1`}
                  className="inline-flex items-center justify-center whitespace-nowrap text-xs font-medium px-2.5 py-2 rounded-lg border border-[var(--accent)]/40 text-[var(--accent)] hover:bg-[var(--accent-tint)] transition-all duration-150 flex-1 md:w-[72px] md:flex-none text-center"
                >
                  View
                </Link>
                <button
                  type="button"
                  disabled
                  className="cursor-not-allowed whitespace-nowrap text-xs font-medium px-2.5 py-2 rounded-lg border border-[var(--border)] text-[var(--text-tertiary)] opacity-60 flex-1 md:w-[100px] md:flex-none text-center"
                >
                  <span className="inline-flex items-center justify-center gap-1.5">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Analysing…
                  </span>
                </button>
              </div>
            );
          if (ap?.phase === "error")
            return (
              <button
                type="button"
                onClick={() =>
                  onAnalyseOpportunity(business.id, business.website!)
                }
                className="cursor-pointer text-xs px-2.5 py-2 rounded-lg border border-red-500/30 text-[var(--badge-red-text)] hover:bg-red-500/10 transition-colors duration-150 flex-1 md:w-[120px] md:flex-none text-center"
                title={ap.label}
              >
                Retry
              </button>
            );
          if (isAnalyseDone)
            return (
              <div className="flex items-center gap-1.5">
                <Link
                  href={`/dashboard/leads/${business.id}?from=discover`}
                  className="inline-flex items-center justify-center whitespace-nowrap text-xs font-medium px-2.5 py-2 rounded-lg border border-[var(--accent)]/40 text-[var(--accent)] hover:bg-[var(--accent-tint)] transition-all duration-150 flex-1 md:w-[72px] md:flex-none text-center"
                >
                  View
                </Link>
                <button
                  type="button"
                  onClick={() =>
                    onAnalyseOpportunity(business.id, business.website!)
                  }
                  className="cursor-pointer whitespace-nowrap text-xs font-medium px-2.5 py-2 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]/40 hover:text-[var(--accent)] transition-all duration-150 flex-1 md:w-[100px] md:flex-none text-center"
                >
                  Re-analyse
                </button>
              </div>
            );
          if (showAnalyseButton)
            return (
              <div className="flex items-center gap-1.5">
                <Link
                  href={`/dashboard/leads/${business.id}?from=discover`}
                  className="inline-flex items-center justify-center whitespace-nowrap text-xs font-medium px-2.5 py-2 rounded-lg border border-[var(--accent)]/40 text-[var(--accent)] hover:bg-[var(--accent-tint)] transition-all duration-150 flex-1 md:w-[72px] md:flex-none text-center"
                >
                  View
                </Link>
                <button
                  type="button"
                  onClick={() =>
                    onAnalyseOpportunity(business.id, business.website!)
                  }
                  className="cursor-pointer whitespace-nowrap text-xs font-medium px-2.5 py-2 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]/40 hover:text-[var(--accent)] transition-all duration-150 flex-1 md:w-[100px] md:flex-none text-center"
                >
                  Analyse
                </button>
              </div>
            );
          // No site to analyse — show "View" link for non-website lead types
          if (
            business.website_status === "no_website" ||
            business.website_status === "social_only" ||
            business.website_status === "unknown"
          ) {
            return (
              <Link
                href={`/dashboard/leads/${business.id}?from=discover`}
                className="inline-flex items-center justify-center whitespace-nowrap text-xs font-medium px-2.5 py-2 rounded-lg border border-[var(--accent)]/40 text-[var(--accent)] hover:bg-[var(--accent-tint)] transition-all duration-150 flex-1 md:w-[172px] md:flex-none text-center"
              >
                View Opportunity
              </Link>
            );
          }
          return (
            <span className="text-xs italic text-[var(--text-tertiary)] flex-1 md:w-[120px] md:flex-none text-center leading-tight">
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
            className="cursor-pointer text-xs font-medium px-3 py-2 rounded-lg border border-red-500 text-red-500 hover:bg-red-500/10 transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 flex-1 md:w-[90px] md:flex-none text-center"
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
            className="cursor-pointer text-xs font-medium px-3 py-2 rounded-lg border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent-tint)] transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 flex-1 md:w-[90px] md:flex-none text-center"
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
