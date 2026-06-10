"use client";

import { motion } from "@/lib/motion";
import { WebsiteBadge } from "@/components/ui/WebsiteBadge";
import { PIPELINE_SALES_STATUSES } from "@/lib/ui-constants";
import { ScorePill } from "./ScorePill";
import { TimeInStage } from "./TimeInStage";
import { CardActionsMenu } from "./CardActionsMenu";
import type { PipelineBusiness } from "@/lib/db-types";

interface PipelineCardProps {
  item: PipelineBusiness;
  score: number | null;
  draggingId: string | null;
  onDragStart: (id: string) => void;
  onDragEnd: (id: string, stage: string) => void;
  onCardClick: (id: string) => void;
  onStatusChange: (pipelineId: string, status: string) => void;
  onDelete?: (pipelineId: string) => void;
}

/**
 * Compact pipeline card (~80px height).
 * Header row: name + overflow button.
 * Sub row: type · city.
 * Footer row: WebsiteBadge + ScorePill + TimeInStage.
 * Supports drag-and-drop between columns via Framer Motion.
 */
export function PipelineCard({
  item,
  score,
  draggingId,
  onDragStart,
  onDragEnd,
  onCardClick,
  onStatusChange,
  onDelete,
}: PipelineCardProps) {
  return (
    <motion.div
      key={item.pipeline_id}
      layout
      layoutId={item.id}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{
        opacity: 1,
        scale: 1,
        transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] },
      }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
      whileHover={{ y: -1 }}
      drag
      dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
      dragElastic={0.1}
      dragMomentum={false}
      onDragStart={() => onDragStart(item.pipeline_id)}
      onDragEnd={(_, info) => {
        const dx = info.offset.x;
        if (Math.abs(dx) > 80) {
          const currentIdx = PIPELINE_SALES_STATUSES.indexOf(item.pipeline_status);
          const dir = dx > 0 ? 1 : -1;
          const nextIdx = Math.max(0, Math.min(PIPELINE_SALES_STATUSES.length - 1, currentIdx + dir));
          const nextStage = PIPELINE_SALES_STATUSES[nextIdx];
          if (nextStage !== item.pipeline_status) {
            onDragEnd(item.pipeline_id, nextStage);
            return;
          }
        }
      }}
      onClick={() => onCardClick(item.id)}
      className={`cursor-grab active:cursor-grabbing rounded-lg border border-[var(--border)] border-t-[3px] bg-[var(--bg-elevated)] p-2.5 transition-shadow ${
        draggingId === item.pipeline_id
          ? "shadow-[var(--brand-shadow-lg)] z-10"
          : "shadow-[var(--brand-shadow-xs)] hover:shadow-[var(--brand-shadow-sm)]"
      }`}
      style={{ touchAction: "none" }}
    >
      {/* Header row: name + overflow menu */}
      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 truncate text-sm font-medium text-[var(--text-primary)]" dir="auto">
          {item.name}
        </p>
        <CardActionsMenu
          pipelineId={item.pipeline_id}
          businessId={item.id}
          onStatusChange={onStatusChange}
          onDelete={onDelete}
        />
      </div>

      {/* Sub row: type · city */}
      {item.business_type && item.city && (
        <p className="mt-0.5 truncate text-[11px] text-[var(--text-tertiary)]">
          {item.business_type} · {item.city}
        </p>
      )}

      {/* Footer row: badges */}
      <div className="mt-1.5 flex items-center gap-1.5">
        <WebsiteBadge status={item.website_status ?? "unknown"} />
        {score != null && <ScorePill score={score} />}
        <TimeInStage enteredAt={item.stage_entered_at} status={item.pipeline_status} />
      </div>
    </motion.div>
  );
}
