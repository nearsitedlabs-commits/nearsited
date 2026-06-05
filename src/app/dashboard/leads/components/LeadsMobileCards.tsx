import { Phone } from "lucide-react";
import { FadeUp, StaggerContainer } from "@/lib/motion";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { WebsiteBadge } from "@/components/ui/WebsiteBadge";
import { WebPresenceBadge } from "./WebPresenceBadge";
import { PipelineStatusBadge } from "./PipelineStatusBadge";
import { LeadActionCell } from "./LeadActionCell";
import { effectiveOpportunityScore, getOpportunityContext } from "./helpers";
import type { LeadRow } from "./types";

type AnalyseProgress = { step: number; phase: string; label: string; error?: string };

type Props = {
  paginated: LeadRow[];
  pipelineMap: Map<string, string>;
  analysingIds: Set<string>;
  analyseProgress: Map<string, AnalyseProgress>;
  onAnalyse: (leadId: string, website: string) => void;
  shouldReduce: boolean;
};

export function LeadsMobileCards({
  paginated,
  pipelineMap,
  analysingIds,
  analyseProgress,
  onAnalyse,
  shouldReduce,
}: Props) {
  const cards = paginated.map((lead) => {
    const pipelineStatus = pipelineMap.get(lead.id);
    const oppCtx         = getOpportunityContext(lead);
    const showScoreRing  = lead.website_status === "has_website" || lead.website_status === "unknown";
    const ringScore      = showScoreRing ? effectiveOpportunityScore(lead) : null;

    const card = (
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 pt-0.5">
            {showScoreRing
              ? <ScoreRing score={ringScore} size={52} variant={lead.audited_at ? "opportunity" : "estimate"} />
              : <WebPresenceBadge status={lead.website_status} />
            }
          </div>
          <div className="min-w-0 flex-1">
            <p dir="auto" className="font-medium text-[var(--text-primary)]">{lead.name}</p>
            <p className="text-xs text-[var(--text-tertiary)]">{lead.business_type} · {lead.city}</p>
            {lead.phone && (
              <a href={`tel:${lead.phone}`} className="inline-flex items-center gap-1 text-xs text-[var(--text-tertiary)] transition-colors hover:text-[var(--accent)]">
                <Phone className="h-3 w-3" />{lead.phone}
              </a>
            )}
            <p className={`mt-0.5 text-xs font-medium ${oppCtx.color}`}>{oppCtx.text}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <WebsiteBadge status={lead.website_status} />
              <PipelineStatusBadge status={pipelineStatus} />
            </div>
            <div className="mt-3">
              <LeadActionCell
                lead={lead}
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
