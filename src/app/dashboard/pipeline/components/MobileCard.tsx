"use client";

import { useRouter } from "next/navigation";
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

export function MobileCard({ item, score, onStatusChange }: MobileCardProps) {
  const router = useRouter();
  const borderClass = STAGE_BORDER_COLORS[item.pipeline_status] ?? "border-l-[var(--border)]";

  return (
    <div
      className={`min-h-[72px] cursor-pointer rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] border-l-[3px] bg-[var(--color-bg-surface)] p-3 transition-colors hover:bg-[var(--color-bg-elevated)] active:bg-[var(--color-bg-elevated)] ${borderClass}`}
      onClick={() => router.push(`/dashboard/leads/${item.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          router.push(`/dashboard/leads/${item.id}`);
        }
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">{item.name}</p>

          {item.business_type && item.city && (
            <p className="mt-0.5 truncate text-xs text-[var(--color-text-tertiary)]">
              {item.business_type} · {item.city}
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <WebsiteBadge status={item.website_status ?? "unknown"} />
            {score != null && <ScorePill score={score} />}
            <TimeInStage enteredAt={item.stage_entered_at} status={item.pipeline_status} />
          </div>
        </div>

        {/* Stage dropdown — stopPropagation so it doesn't trigger card nav */}
        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
          <select
            value={item.pipeline_status}
            onChange={(e) => onStatusChange(item.pipeline_id, e.target.value)}
            className="min-h-[44px] rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-2 py-1.5 text-[11px] text-[var(--color-text-secondary)] focus:outline-none"
          >
            {PIPELINE_SALES_STATUSES.map((s) => (
              <option key={s} value={s}>
                {PIPELINE_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
