import { FadeUp, StaggerContainer } from "@/lib/motion";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { PipelineStatusBadge } from "./PipelineStatusBadge";
import { LeadActionCell } from "./LeadActionCell";
import { effectiveOpportunityScore, deriveOpportunityStatus } from "./helpers";
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
};

export function LeadsMobileCards({
  paginated,
  pipelineMap,
  pitchMap,
  analysingIds,
  analyseProgress,
  onAnalyse,
  shouldReduce,
}: Props) {
  const cards = paginated.map((lead) => {
    const pipelineStatus = pipelineMap.get(lead.id);
    const hasPitch = pitchMap.get(lead.id) ?? false;
    const status: OpportunityStatus = deriveOpportunityStatus(lead, pipelineStatus, hasPitch);
    const ringScore = effectiveOpportunityScore(lead);

    const card = (
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 pt-0.5">
            <ScoreRing score={ringScore} size={44} variant={
              lead.website_status === "has_website" && lead.audited_at ? "opportunity"
              : lead.website_status === "has_website" ? "estimate"
              : "opportunity"
            } />
          </div>
          <div className="min-w-0 flex-1">
            <p dir="auto" className="font-medium text-[var(--text-primary)]">{lead.name}</p>
            <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">
              {lead.city}{lead.city && lead.business_type ? " · " : ""}{lead.business_type}
              {lead.rating != null ? ` · ${lead.rating.toFixed(1)}★` : ""}
              {lead.review_count != null && lead.review_count > 0 ? ` · ${lead.review_count}` : ""}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <PipelineStatusBadge status={status} />
            </div>
            <div className="mt-3">
              <LeadActionCell
                lead={lead}
                status={status}
                isAnalysing={analysingIds.has(lead.id)}
                progress={analyseProgress.get(lead.id)}
                onAnalyse={onAnalyse}
              />
            </div>
          </div>
        </div>
      </div>
    );

    return shouldReduce ? (
      <div key={lead.id}>{card}</div>
    ) : (
      <FadeUp key={lead.id}>{card}</FadeUp>
    );
  });

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] md:hidden">
      {shouldReduce ? (
        <div className="divide-y divide-[var(--border)]">{cards}</div>
      ) : (
        <StaggerContainer>
          <div className="divide-y divide-[var(--border)]">{cards}</div>
        </StaggerContainer>
      )}
    </div>
  );
}
