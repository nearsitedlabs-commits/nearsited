"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { PIPELINE_SALES_STATUSES, PIPELINE_LABELS } from "@/lib/ui-constants";
import { WebsiteBadge } from "@/components/ui/WebsiteBadge";
import { ScorePill } from "./ScorePill";
import { TimeInStage } from "./TimeInStage";
import type { PipelineBusiness } from "@/lib/db-types";

const STAGE_BORDER_COLORS: Record<string, string> = {
  new_lead:        "border-l-[var(--pipeline-new)]",
  contacted:       "border-l-[var(--pipeline-contacted)]",
  in_conversation: "border-l-[var(--pipeline-conversation)]",
  won:             "border-l-[var(--pipeline-won)]",
  lost:            "border-l-[var(--pipeline-lost)]",
};

interface MobileCardProps {
  item: PipelineBusiness;
  score: number | null;
  onStatusChange: (pipelineId: string, status: string) => void;
}

/**
 * Mobile card for pipeline items.
 * Compact layout with stage dropdown and view link.
 */
export function MobileCard({ item, score, onStatusChange }: MobileCardProps) {
  const borderClass = STAGE_BORDER_COLORS[item.pipeline_status] ?? "border-l-[var(--border)]";

  return (
    <div className={`rounded-xl border border-[var(--border)] border-l-[3px] bg-[var(--bg-surface)] p-3 ${borderClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* Name */}
          <p className="truncate text-sm font-medium text-[var(--text-primary)]">{item.name}</p>

          {/* Type · City */}
          {item.business_type && item.city && (
            <p className="mt-0.5 truncate text-xs text-[var(--text-tertiary)]">
              {item.business_type} · {item.city}
            </p>
          )}

          {/* Footer badges */}
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <WebsiteBadge status={item.website_status ?? "unknown"} />
            {score != null && <ScorePill score={score} />}
            <TimeInStage enteredAt={item.stage_entered_at} status={item.pipeline_status} />
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          {/* Stage dropdown */}
          <select
            value={item.pipeline_status}
            onChange={(e) => onStatusChange(item.pipeline_id, e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1.5 text-[11px] text-[var(--text-secondary)] focus:outline-none"
          >
            {PIPELINE_SALES_STATUSES.map((s) => (
              <option key={s} value={s}>
                {PIPELINE_LABELS[s]}
              </option>
            ))}
          </select>

          {/* View link */}
          <Link
            href={`/dashboard/leads/${item.id}`}
            className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-[11px] font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
          >
            <ExternalLink className="h-3 w-3" /> View
          </Link>
        </div>
      </div>
    </div>
  );
}
