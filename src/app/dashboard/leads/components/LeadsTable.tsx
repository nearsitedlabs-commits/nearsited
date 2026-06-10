import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { motion, fadeUpVariants, staggerVariants } from "@/lib/motion";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { PipelineStatusBadge } from "./PipelineStatusBadge";
import { LeadActionCell } from "./LeadActionCell";
import { effectiveOpportunityScore, deriveOpportunityStatus, scoreTier, formatRelativeTime } from "./helpers";
import { SITE_LABEL } from "./types";
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
  // Bulk selection
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
};

/**
 * Cluster header for collapsing groups of same-industry + same-city + same-tier leads.
 */
type ClusterInfo = {
  type: "cluster";
  count: number;
  industry: string;
  city: string;
  tier: string;
  scoreRange: string;
  expanded: boolean;
};

function buildClusters(
  rows: LeadRow[],
  expandedClusters: Set<number>,
  setExpandedClusters: React.Dispatch<React.SetStateAction<Set<number>>> // eslint-disable-line @typescript-eslint/no-unused-vars
): (LeadRow | { cluster: ClusterInfo; rows: LeadRow[] })[] {
  const result: (LeadRow | { cluster: ClusterInfo; rows: LeadRow[] })[] = [];
  let i = 0;
  const minClusterSize = 5; // Collapse if >5 consecutive

  while (i < rows.length) {
    const lead = rows[i];
    const score = effectiveOpportunityScore(lead);
    const tier = scoreTier(score);
    const industry = lead.business_type?.toLowerCase() ?? "";
    const city = lead.city?.toLowerCase() ?? "";

    // Find consecutive matching rows
    let j = i + 1;
    while (j < rows.length) {
      const next = rows[j];
      const nextScore = effectiveOpportunityScore(next);
      if (
        (next.business_type?.toLowerCase() ?? "") !== industry ||
        (next.city?.toLowerCase() ?? "") !== city ||
        scoreTier(nextScore) !== tier
      ) break;
      j++;
    }

    const count = j - i;
    if (count > minClusterSize) {
      const scores = rows.slice(i, j).map((r) => effectiveOpportunityScore(r));
      const minS = Math.min(...scores);
      const maxS = Math.max(...scores);
      const range = minS === maxS ? `${minS}` : `${minS}-${maxS}`;
      const clusterIdx = result.length;
      const expanded = expandedClusters.has(clusterIdx);

      result.push({
        cluster: {
          type: "cluster",
          count,
          industry: rows[i].business_type ?? "",
          city: rows[i].city ?? "",
          tier,
          scoreRange: range,
          expanded,
        },
        rows: rows.slice(i, j),
      });
    } else {
      // Add individual rows
      for (let k = i; k < j; k++) result.push(rows[k]);
    }

    i = j;
  }

  return result;
}

export function LeadsTable({
  paginated,
  pipelineMap,
  pitchMap,
  analysingIds,
  analyseProgress,
  onAnalyse,
  shouldReduce,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
}: Props) {
  const [expandedClusters, setExpandedClusters] = useState<Set<number>>(new Set());
  const allSelected = paginated.length > 0 && paginated.every((l) => selectedIds.has(l.id));

  // Build clustered rows
  const clustered = buildClusters(paginated, expandedClusters, setExpandedClusters);

  const renderRow = (lead: LeadRow, animated: boolean) => {
    const pipelineStatus = pipelineMap.get(lead.id);
    const hasPitch = pitchMap.get(lead.id) ?? false;
    const status: OpportunityStatus = deriveOpportunityStatus(lead, pipelineStatus, hasPitch);
    const ringScore = effectiveOpportunityScore(lead);
    const siteLabel = SITE_LABEL[lead.website_status] ?? SITE_LABEL.unknown;

    const cells = (
      <>
        {/* Checkbox */}
        <td className="w-10 px-3 py-3 align-middle">
          <input
            type="checkbox"
            checked={selectedIds.has(lead.id)}
            onChange={() => onToggleSelect(lead.id)}
            className="h-4 w-4 cursor-pointer rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]/30"
          />
        </td>
        {/* Score */}
        <td className="w-14 px-2 py-3 align-middle">
          <ScoreRing score={ringScore} size={40} variant={
            lead.website_status === "has_website" && lead.audited_at ? "opportunity"
            : lead.website_status === "has_website" ? "estimate"
            : "opportunity"
          } />
        </td>
        {/* Business */}
        <td className="px-3 py-3 align-middle">
          <p dir="auto" className="text-sm font-medium text-[var(--text-primary)] truncate max-w-[240px]">
            {lead.name}
          </p>
          <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5 truncate max-w-[240px]">
            {lead.city}{lead.city && lead.business_type ? " · " : ""}{lead.business_type}
            {lead.rating != null ? ` · ${lead.rating.toFixed(1)}★` : ""}
            {lead.review_count != null && lead.review_count > 0 ? ` · ${lead.review_count}` : ""}
          </p>
        </td>
        {/* Site */}
        <td className="w-20 px-3 py-3 align-middle">
          <span className={`text-xs ${siteLabel.color}`}>{siteLabel.label}</span>
        </td>
        {/* Last audit */}
        <td className="w-24 px-3 py-3 align-middle">
          <span className="text-xs text-[var(--text-secondary)]" title={lead.audited_at ?? undefined}>
            {formatRelativeTime(lead.audited_at ?? lead.design_analyzed_at)}
          </span>
        </td>
        {/* Status */}
        <td className="w-28 px-3 py-3 align-middle">
          <PipelineStatusBadge status={status} />
        </td>
        {/* Action */}
        <td className="w-36 px-3 py-3 align-middle">
          <LeadActionCell
            lead={lead}
            status={status}
            isAnalysing={analysingIds.has(lead.id)}
            progress={analyseProgress.get(lead.id)}
            onAnalyse={onAnalyse}
          />
        </td>
      </>
    );

    if (animated) {
      return (
        <motion.tr key={lead.id} variants={fadeUpVariants} className="transition-colors duration-150 hover:bg-[var(--bg-elevated)]">
          {cells}
        </motion.tr>
      );
    }
    return (
      <tr key={lead.id} className="transition-colors duration-150 hover:bg-[var(--bg-elevated)]">
        {cells}
      </tr>
    );
  };

  const renderClusterHeader = (cluster: ClusterInfo, idx: number) => {
    const expanded = expandedClusters.has(idx);
    return (
      <tr key={`cluster-${idx}`} className="bg-[var(--bg-elevated)]/50">
        <td colSpan={7} className="px-5 py-2">
          <button
            onClick={() => setExpandedClusters((prev) => {
              const next = new Set(prev);
              if (expanded) next.delete(idx);
              else next.add(idx);
              return next;
            })}
            className="flex w-full items-center gap-2 text-left cursor-pointer"
          >
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
            )}
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              {cluster.count} in cluster · {cluster.industry} · {cluster.city} · scored ~{cluster.scoreRange}
            </span>
            <span className="ml-auto text-[10px] text-[var(--text-tertiary)]">
              {expanded ? "Collapse ▴" : "Expand ▾"}
            </span>
          </button>
        </td>
      </tr>
    );
  };

  return (
    <div className="hidden overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] md:block">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--bg-elevated)]">
              <th className="w-10 px-3 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleSelectAll}
                  className="h-4 w-4 cursor-pointer rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]/30"
                />
              </th>
              <th className="w-14 px-2 py-3 text-[10px] font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Score</th>
              <th className="px-3 py-3 text-[10px] font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Business</th>
              <th className="w-20 px-3 py-3 text-[10px] font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Site</th>
              <th className="w-24 px-3 py-3 text-[10px] font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Last audit</th>
              <th className="w-28 px-3 py-3 text-[10px] font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Status</th>
              <th className="w-36 px-3 py-3 text-[10px] font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Action</th>
            </tr>
          </thead>
          {shouldReduce ? (
            <tbody className="divide-y divide-[var(--border)]">
              {clustered.map((item, idx) => {
                if ("cluster" in item) {
                  return (
                    <>
                      {renderClusterHeader(item.cluster, idx)}
                      {item.cluster.expanded && item.rows.map((lead) => renderRow(lead, false))}
                    </>
                  );
                }
                return renderRow(item, false);
              })}
            </tbody>
          ) : (
            <motion.tbody
              variants={staggerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="divide-y divide-[var(--border)]"
            >
              {clustered.map((item, idx) => {
                if ("cluster" in item) {
                  return (
                    <motion.tbody key={`cluster-group-${idx}`} variants={fadeUpVariants}>
                      {renderClusterHeader(item.cluster, idx)}
                      {item.cluster.expanded && item.rows.map((lead) => renderRow(lead, true))}
                    </motion.tbody>
                  );
                }
                return renderRow(item, true);
              })}
            </motion.tbody>
          )}
        </table>
      </div>
    </div>
  );
}
