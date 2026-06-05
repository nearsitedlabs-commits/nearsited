import { Phone } from "lucide-react";
import { motion, fadeUpVariants, staggerVariants } from "@/lib/motion";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { WebsiteBadge } from "@/components/ui/WebsiteBadge";
import { PipelineStatusBadge } from "./PipelineStatusBadge";
import { LeadActionCell } from "./LeadActionCell";
import { effectiveOpportunityScore, getOpportunityContext, formatDate } from "./helpers";
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

export function LeadsTable({
  paginated,
  pipelineMap,
  analysingIds,
  analyseProgress,
  onAnalyse,
  shouldReduce,
}: Props) {
  return (
    <div className="hidden overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] md:block">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--bg-elevated)]">
              <th className="w-16 px-5 py-3 text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Opportunity</th>
              <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Business</th>
              <th className="w-28 px-5 py-3 text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Website</th>
              <th className="w-28 px-5 py-3 text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Last Analysed</th>
              <th className="w-32 px-5 py-3 text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Status</th>
              <th className="w-44 px-5 py-3 text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Actions</th>
            </tr>
          </thead>
          {shouldReduce ? (
            <tbody className="divide-y divide-[var(--border)]">
              {paginated.map((lead) => (
                <LeadTableRow
                  key={lead.id}
                  lead={lead}
                  pipelineMap={pipelineMap}
                  analysingIds={analysingIds}
                  analyseProgress={analyseProgress}

                  onAnalyse={onAnalyse}
                  animated={false}
                />
              ))}
            </tbody>
          ) : (
            <motion.tbody
              variants={staggerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="divide-y divide-[var(--border)]"
            >
              {paginated.map((lead) => (
                <LeadTableRow
                  key={lead.id}
                  lead={lead}
                  pipelineMap={pipelineMap}
                  analysingIds={analysingIds}
                  analyseProgress={analyseProgress}

                  onAnalyse={onAnalyse}
                  animated={true}
                />
              ))}
            </motion.tbody>
          )}
        </table>
      </div>
    </div>
  );
}

type RowProps = {
  lead: LeadRow;
  pipelineMap: Map<string, string>;
  analysingIds: Set<string>;
  analyseProgress: Map<string, AnalyseProgress>;
  onAnalyse: (leadId: string, website: string) => void;
  animated: boolean;
};

function LeadTableRow({ lead, pipelineMap, analysingIds, analyseProgress, onAnalyse, animated }: RowProps) {
  const pipelineStatus = pipelineMap.get(lead.id);
  const oppCtx    = getOpportunityContext(lead);
  const ringScore = effectiveOpportunityScore(lead);

  const cells = (
    <>
      <td className="w-16 px-5 py-4 align-top">
        <ScoreRing score={ringScore} size={52} variant={
          lead.website_status === "has_website" && lead.audited_at ? "opportunity"
          : lead.website_status === "has_website" ? "estimate"
          : "opportunity"
        } />
      </td>
      <td className="px-5 py-4 align-top">
        <p dir="auto" className="font-medium text-[var(--text-primary)]">{lead.name}</p>
        <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">{lead.business_type} · {lead.city}</p>
        {lead.phone && (
          <a href={`tel:${lead.phone}`} className="mt-0.5 inline-flex items-center gap-1 text-xs text-[var(--text-tertiary)] transition-colors hover:text-[var(--accent)]">
            <Phone className="h-3 w-3" />{lead.phone}
          </a>
        )}
        <p className={`mt-1 text-xs font-medium ${oppCtx.color}`}>{oppCtx.text}</p>
      </td>
      <td className="w-28 px-5 py-4 align-top">
        <WebsiteBadge status={lead.website_status} />
      </td>
      <td className="w-28 px-5 py-4 align-top text-sm text-[var(--text-secondary)]">
        {formatDate(lead.audited_at ?? lead.design_analyzed_at)}
      </td>
      <td className="w-32 px-5 py-4 align-top">
        <PipelineStatusBadge status={pipelineStatus} />
      </td>
      <td className="w-44 px-5 py-4 align-top">
        <LeadActionCell
          lead={lead}
          isAnalysing={analysingIds.has(lead.id)}
          progress={analyseProgress.get(lead.id)}
          onAnalyse={onAnalyse}
        />
      </td>
    </>
  );

  if (animated) {
    return (
      <motion.tr variants={fadeUpVariants} className="transition-colors duration-150 hover:bg-[var(--bg-elevated)]">
        {cells}
      </motion.tr>
    );
  }
  return (
    <tr className="transition-colors duration-150 hover:bg-[var(--bg-elevated)]">
      {cells}
    </tr>
  );
}
