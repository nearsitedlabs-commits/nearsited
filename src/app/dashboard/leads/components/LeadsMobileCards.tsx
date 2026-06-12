"use client";

import { useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Zap, X } from "lucide-react";
import { StaggerContainer, FadeUp } from "@/lib/motion";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { WebsiteStatusPill } from "@/components/ui/WebsiteStatusPill";
import { PipelineStatusBadge } from "./PipelineStatusBadge";
import { LeadActionCell } from "./LeadActionCell";
import { effectiveOpportunityScore, deriveOpportunityStatus, formatRelativeTime } from "./helpers";
import type { LeadRow, OpportunityStatus } from "./types";

type AnalyseProgress = { step: number; phase: string; label: string; error?: string };

type Props = {
  paginated: LeadRow[];
  pipelineMap: Map<string, string>;
  pitchMap: Map<string, boolean>;
  analysingIds: Set<string>;
  analyseProgress: Map<string, AnalyseProgress>;
  onAnalyse: (leadId: string, website: string) => void;
  shouldReduce: boolean;
  bulkMode: boolean;
  onEnterBulkMode: () => void;
  onExitBulkMode: () => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onBulkPipeline: () => void;
  onBulkAudit: () => void;
  bulkLoading: boolean;
  hasMoreOnMobile: boolean;
  onLoadMore: () => void;
};

function MobileLeadCard({
  lead,
  pipelineStatus,
  hasPitch,
  isAnalysing,
  progress,
  onAnalyse,
  bulkMode,
  onEnterBulkMode,
  selected,
  onToggleSelect,
}: {
  lead: LeadRow;
  pipelineStatus?: string;
  hasPitch: boolean;
  isAnalysing: boolean;
  progress?: AnalyseProgress;
  onAnalyse: (leadId: string, website: string) => void;
  bulkMode: boolean;
  onEnterBulkMode: () => void;
  selected: boolean;
  onToggleSelect: (id: string) => void;
}) {
  const router = useRouter();
  const status: OpportunityStatus = deriveOpportunityStatus(lead, pipelineStatus, hasPitch);
  const ringScore = effectiveOpportunityScore(lead);
  const ringVariant =
    lead.website_status === "has_website" && lead.audited_at ? "opportunity" : "estimate";
  const auditTime = lead.audited_at ?? lead.design_analyzed_at ?? null;
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const meta = [
    lead.city,
    lead.business_type,
    lead.rating != null ? `${lead.rating.toFixed(1)}★` : null,
    lead.review_count != null && lead.review_count > 0 ? `${lead.review_count}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const handlePointerDown = useCallback(() => {
    if (bulkMode) return;
    longPressTimer.current = setTimeout(() => {
      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(10);
      onEnterBulkMode();
      onToggleSelect(lead.id);
    }, 300);
  }, [bulkMode, lead.id, onEnterBulkMode, onToggleSelect]);

  const handlePointerUp = useCallback(() => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }, []);

  const handleClick = useCallback(() => {
    if (bulkMode) {
      onToggleSelect(lead.id);
      return;
    }
    router.push(`/dashboard/leads/${lead.id}?from=leads`);
  }, [bulkMode, lead.id, onToggleSelect, router]);

  return (
    <div
      className={`min-h-[80px] cursor-pointer select-none p-4 transition-colors active:bg-[var(--color-bg-elevated)] ${
        selected
          ? "bg-[var(--color-accent)]/[0.05]"
          : "[@media(hover:hover)]:hover:bg-[var(--color-bg-elevated)]"
      }`}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      role={bulkMode ? "checkbox" : "button"}
      aria-checked={bulkMode ? selected : undefined}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* Top row: [checkbox/score] | name | action */}
      <div className="flex items-center gap-3">
        {bulkMode ? (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center">
            <div
              className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
                selected
                  ? "border-[var(--color-accent)] bg-[var(--color-accent)]"
                  : "border-[var(--color-border-strong)] bg-transparent"
              }`}
            >
              {selected && (
                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 12 12">
                  <path
                    d="M2 6l3 3 5-5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
          </div>
        ) : (
          <div className="shrink-0">
            <ScoreRing score={ringScore} size={32} variant={ringVariant} />
          </div>
        )}
        <p
          dir="auto"
          className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--color-text-primary)]"
        >
          {lead.name}
        </p>
        {!bulkMode && (
          <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
            <LeadActionCell
              lead={lead}
              status={status}
              isAnalysing={isAnalysing}
              progress={progress}
              onAnalyse={onAnalyse}
            />
          </div>
        )}
      </div>

      {/* Middle row: metadata */}
      {meta && (
        <p className="ml-[44px] mt-0.5 truncate text-[11px] text-[var(--color-text-tertiary)]">
          {meta}
        </p>
      )}

      {/* Bottom row: pills | last audit */}
      <div className="ml-[44px] mt-2 flex items-center gap-1.5">
        <WebsiteStatusPill status={lead.website_status} size="sm" />
        <PipelineStatusBadge status={status} />
        <span className="ml-auto shrink-0 text-[10px] text-[var(--color-text-tertiary)]">
          {auditTime ? formatRelativeTime(auditTime) : "New"}
        </span>
      </div>
    </div>
  );
}

export function LeadsMobileCards({
  paginated,
  pipelineMap,
  pitchMap,
  analysingIds,
  analyseProgress,
  onAnalyse,
  shouldReduce,
  bulkMode,
  onEnterBulkMode,
  onExitBulkMode,
  selectedIds,
  onToggleSelect,
  onBulkPipeline,
  onBulkAudit,
  bulkLoading,
  hasMoreOnMobile,
  onLoadMore,
}: Props) {
  const cards = paginated.map((lead) => {
    const card = (
      <MobileLeadCard
        key={lead.id}
        lead={lead}
        pipelineStatus={pipelineMap.get(lead.id)}
        hasPitch={pitchMap.get(lead.id) ?? false}
        isAnalysing={analysingIds.has(lead.id)}
        progress={analyseProgress.get(lead.id)}
        onAnalyse={onAnalyse}
        bulkMode={bulkMode}
        onEnterBulkMode={onEnterBulkMode}
        selected={selectedIds.has(lead.id)}
        onToggleSelect={onToggleSelect}
      />
    );

    return shouldReduce ? (
      <div key={lead.id} className="border-b border-[var(--color-border-subtle)] last:border-b-0">
        {card}
      </div>
    ) : (
      <FadeUp key={lead.id} className="border-b border-[var(--color-border-subtle)] last:border-b-0">
        {card}
      </FadeUp>
    );
  });

  return (
    <div className="md:hidden">
      {/* Card list */}
      <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)]">
        {shouldReduce ? (
          <div>{cards}</div>
        ) : (
          <StaggerContainer>
            <div>{cards}</div>
          </StaggerContainer>
        )}
      </div>

      {/* Load more */}
      {hasMoreOnMobile && (
        <button
          onClick={onLoadMore}
          className="mt-3 w-full rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] py-3 text-sm font-medium text-[var(--color-text-secondary)] transition-colors active:bg-[var(--color-bg-surface)] [@media(hover:hover)]:hover:bg-[var(--color-bg-surface)] [@media(hover:hover)]:hover:text-[var(--color-text-primary)]"
        >
          Load more
        </button>
      )}

      {/* Bulk FAB — fixed above bottom nav */}
      {bulkMode && (
        <div
          className="fixed inset-x-4 z-40"
          style={{
            bottom:
              "calc(var(--mobile-nav-height, 56px) + var(--mobile-safe-bottom, 0px) + 12px)",
          }}
        >
          <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-accent)]/30 bg-[var(--color-bg-elevated)] shadow-xl">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--color-border-subtle)]">
              <span className="flex-1 text-sm font-medium text-[var(--color-text-primary)]">
                {selectedIds.size} selected
              </span>
              <button
                onClick={onExitBulkMode}
                className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-text-tertiary)] transition-colors active:bg-[var(--color-bg-surface)]"
                aria-label="Exit selection mode"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-px bg-[var(--color-border-subtle)]">
              <button
                onClick={onBulkPipeline}
                disabled={bulkLoading || selectedIds.size === 0}
                className="flex min-h-[48px] items-center justify-center gap-2 bg-[var(--color-bg-elevated)] px-4 py-3 text-sm font-medium text-[var(--color-accent)] transition-colors active:bg-[var(--color-bg-surface)] disabled:opacity-50"
              >
                {bulkLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Pipeline
              </button>
              <button
                onClick={onBulkAudit}
                disabled={bulkLoading || selectedIds.size === 0}
                className="flex min-h-[48px] items-center justify-center gap-2 bg-[var(--color-bg-elevated)] px-4 py-3 text-sm font-medium text-[var(--color-text-secondary)] transition-colors active:bg-[var(--color-bg-surface)] disabled:opacity-50"
              >
                {bulkLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4" />
                )}
                Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
