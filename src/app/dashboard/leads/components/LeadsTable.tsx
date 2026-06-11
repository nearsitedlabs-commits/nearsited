import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { motion, fadeUpVariants, staggerVariants } from "@/lib/motion";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { WebsiteStatusPill } from "@/components/ui/WebsiteStatusPill";
import { ActionMenu, type ActionMenuItem } from "@/components/ui/ActionMenu";
import { PipelineStatusBadge } from "./PipelineStatusBadge";
import { LeadActionCell } from "./LeadActionCell";
import { effectiveOpportunityScore, deriveOpportunityStatus, scoreTier, formatRelativeTime } from "./helpers";
import type { LeadRow, OpportunityStatus } from "./types";
import Link from "next/link";

type AnalyseProgress = { step: number; phase: string; label: string; error?: string };

type Props = {
  paginated: LeadRow[];
  pipelineMap: Map<string, string>;
  pitchMap: Map<string, boolean>;
  analysingIds: Set<string>;
  analyseProgress: Map<string, AnalyseProgress>;
  onAnalyse: (leadId: string, website: string) => void;
  shouldReduce: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onAddToPipeline: (id: string) => Promise<void>;
  onMoveStatus: (id: string, status: "won" | "lost") => Promise<void>;
};

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
  _setExpandedClusters: React.Dispatch<React.SetStateAction<Set<number>>>
): (LeadRow | { cluster: ClusterInfo; rows: LeadRow[] })[] {
  const result: (LeadRow | { cluster: ClusterInfo; rows: LeadRow[] })[] = [];
  let i = 0;
  const minClusterSize = 5;

  while (i < rows.length) {
    const lead = rows[i];
    const score = effectiveOpportunityScore(lead);
    const tier = scoreTier(score);
    const industry = lead.business_type?.toLowerCase() ?? "";
    const city = lead.city?.toLowerCase() ?? "";

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
  onAddToPipeline,
  onMoveStatus,
}: Props) {
  const [expandedClusters, setExpandedClusters] = useState<Set<number>>(new Set());
  const allSelected = paginated.length > 0 && paginated.every((l) => selectedIds.has(l.id));

  const clustered = buildClusters(paginated, expandedClusters, setExpandedClusters);

  const buildRowMenu = (lead: LeadRow, pipelineStatus: string | undefined, hasPitch: boolean, status: OpportunityStatus): ActionMenuItem[] => {
    const canAnalyse = !!lead.website && (lead.website_status === "has_website" || lead.website_status === "platform_only");
    const isInPipeline = !!pipelineStatus;

    const items: ActionMenuItem[] = [
      {
        label: "View opportunity",
        onClick: () => { window.location.href = `/dashboard/leads/${lead.id}`; },
      },
    ];

    if (hasPitch) {
      items.push({
        label: "View pitch",
        onClick: () => { window.location.href = `/dashboard/leads/${lead.id}?tab=pitch`; },
      });
    }

    if (canAnalyse) {
      items.push({
        label: status === "audited" ? "Re-audit" : "Audit",
        onClick: () => onAnalyse(lead.id, lead.website!),
      });
    }

    items.push({
      label: "Generate pitch",
      onClick: () => { window.location.href = `/dashboard/leads/${lead.id}`; },
    });

    if (!isInPipeline) {
      items.push({
        label: "Move to pipeline",
        onClick: () => { void onAddToPipeline(lead.id); },
      });
    }

    items.push(
      {
        label: "Mark as Won",
        onClick: () => { void onMoveStatus(lead.id, "won"); },
      },
      {
        label: "Mark as Lost",
        danger: true,
        onClick: () => { void onMoveStatus(lead.id, "lost"); },
      },
    );

    return items;
  };

  const renderRow = (lead: LeadRow, animated: boolean) => {
    const pipelineStatus = pipelineMap.get(lead.id);
    const hasPitch = pitchMap.get(lead.id) ?? false;
    const status: OpportunityStatus = deriveOpportunityStatus(lead, pipelineStatus, hasPitch);
    const ringScore = effectiveOpportunityScore(lead);
    const menuItems = buildRowMenu(lead, pipelineStatus, hasPitch, status);

    const cells = (
      <>
        {/* Checkbox */}
        <td className="w-10 px-3 py-3 align-middle">
          <input
            type="checkbox"
            checked={selectedIds.has(lead.id)}
            onChange={() => onToggleSelect(lead.id)}
            className="h-4 w-4 cursor-pointer rounded border-[var(--color-border-subtle)] text-[var(--color-accent)] focus:ring-[var(--color-accent)]/30"
          />
        </td>
        {/* Score */}
        <td className="w-12 px-2 py-3 align-middle">
          <ScoreRing score={ringScore} size={36} variant={
            lead.website_status === "has_website" && lead.audited_at ? "opportunity"
            : lead.website_status === "has_website" ? "estimate"
            : "opportunity"
          } />
        </td>
        {/* Business */}
        <td className="px-3 py-3 align-middle">
          <Link href={`/dashboard/leads/${lead.id}`} className="block hover:opacity-80 transition-opacity">
            <p dir="auto" className="text-sm font-medium text-[var(--color-text-primary)] truncate max-w-[240px]">
              {lead.name}
            </p>
            <p className="text-[10px] text-[var(--color-text-tertiary)] mt-0.5 truncate max-w-[240px]">
              {lead.city}{lead.city && lead.business_type ? " · " : ""}{lead.business_type}
              {lead.rating != null ? ` · ${lead.rating.toFixed(1)}★` : ""}
              {lead.review_count != null && lead.review_count > 0 ? ` · ${lead.review_count}` : ""}
            </p>
          </Link>
        </td>
        {/* Site */}
        <td className="w-[90px] px-3 py-3 align-middle">
          <WebsiteStatusPill status={lead.website_status} size="sm" />
        </td>
        {/* Last audit */}
        <td className="w-[90px] px-3 py-3 align-middle">
          <span className="text-xs text-[var(--color-text-secondary)]" title={lead.audited_at ?? undefined}>
            {formatRelativeTime(lead.audited_at ?? lead.design_analyzed_at)}
          </span>
        </td>
        {/* Status */}
        <td className="w-[100px] px-3 py-3 align-middle">
          <PipelineStatusBadge status={status} />
        </td>
        {/* Action */}
        <td className="w-[90px] px-3 py-3 align-middle">
          <div className="flex items-center gap-1">
            <LeadActionCell
              lead={lead}
              status={status}
              isAnalysing={analysingIds.has(lead.id)}
              progress={analyseProgress.get(lead.id)}
              onAnalyse={onAnalyse}
            />
            <ActionMenu items={menuItems} align="end" />
          </div>
        </td>
      </>
    );

    if (animated) {
      return (
        <motion.tr key={lead.id} variants={fadeUpVariants} className="transition-colors duration-150 hover:bg-[var(--color-bg-elevated)]">
          {cells}
        </motion.tr>
      );
    }
    return (
      <tr key={lead.id} className="transition-colors duration-150 hover:bg-[var(--color-bg-elevated)]">
        {cells}
      </tr>
    );
  };

  const renderClusterHeader = (cluster: ClusterInfo, idx: number) => {
    const expanded = expandedClusters.has(idx);
    return (
      <tr key={`cluster-${idx}`} className="bg-[var(--color-bg-elevated)]/50">
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
              <ChevronDown className="h-3.5 w-3.5 text-[var(--color-text-tertiary)]" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-[var(--color-text-tertiary)]" />
            )}
            <span className="text-xs font-medium text-[var(--color-text-secondary)]">
              {cluster.count} in cluster · {cluster.industry} · {cluster.city} · scored ~{cluster.scoreRange}
            </span>
            <span className="ml-auto text-[10px] text-[var(--color-text-tertiary)]">
              {expanded ? "Collapse ▴" : "Expand ▾"}
            </span>
          </button>
        </td>
      </tr>
    );
  };

  return (
    <div className="hidden overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] md:block">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)]">
              <th className="w-10 px-3 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleSelectAll}
                  className="h-4 w-4 cursor-pointer rounded border-[var(--color-border-subtle)] text-[var(--color-accent)] focus:ring-[var(--color-accent)]/30"
                />
              </th>
              <th className="w-12 px-2 py-3 text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">Score</th>
              <th className="px-3 py-3 text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">Business</th>
              <th className="w-[90px] px-3 py-3 text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">Site</th>
              <th className="w-[90px] px-3 py-3 text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">Last audit</th>
              <th className="w-[100px] px-3 py-3 text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">Status</th>
              <th className="w-[90px] px-3 py-3 text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">Action</th>
            </tr>
          </thead>
          {shouldReduce ? (
            <tbody className="divide-y divide-[var(--color-border-subtle)]">
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
              className="divide-y divide-[var(--color-border-subtle)]"
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
