"use client";

import { AnimatePresence, motion } from "@/lib/motion";
import { PIPELINE_LABELS } from "@/lib/ui-constants";
import { PipelineCard } from "./PipelineCard";
import type { PipelineBusiness } from "@/lib/db-types";

const STAGE_DOT_COLORS: Record<string, string> = {
  new_lead:        "var(--pipeline-new)",
  contacted:       "var(--pipeline-contacted)",
  in_conversation: "var(--pipeline-conversation)",
  won:             "var(--pipeline-won)",
  lost:            "var(--pipeline-lost)",
};

const STAGE_TEXT_COLORS: Record<string, string> = {
  new_lead:        "text-[var(--pipeline-new)]",
  contacted:       "text-[var(--pipeline-contacted)]",
  in_conversation: "text-[var(--pipeline-conversation)]",
  won:             "text-[var(--pipeline-won)]",
  lost:            "text-[var(--pipeline-lost)]",
};

interface StageColumnProps {
  stage: string;
  cards: PipelineBusiness[];
  draggingId: string | null;
  scores: Record<string, number | null>;
  onDragStart: (id: string) => void;
  onDragEnd: (id: string, stage: string) => void;
  onCardClick: (id: string) => void;
  onStatusChange: (pipelineId: string, status: string) => void;
  onDelete?: (pipelineId: string) => void;
}

/**
 * Pipeline stage column with empty-state collapse.
 *
 * When empty: collapses to a 48px vertical rail with stage name and count.
 * On hover over empty column: expands to full width (220px).
 * When non-empty: full width column with header + cards.
 */
export function StageColumn({
  stage,
  cards,
  draggingId,
  scores,
  onDragStart,
  onDragEnd,
  onCardClick,
  onStatusChange,
  onDelete,
}: StageColumnProps) {
  const isEmpty = cards.length === 0;
  const dotColor = STAGE_DOT_COLORS[stage] ?? "var(--text-tertiary)";

  return (
    <div
      className={`shrink-0 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] overflow-hidden transition-all duration-200 ease-in-out ${
        isEmpty
          ? "w-[48px] hover:w-[220px] group"
          : "w-[220px]"
      }`}
    >
      {isEmpty ? (
        /* ── Collapsed empty state ── */
        <div className="flex h-full flex-col items-center gap-3 py-3">
          <span
            className="h-2 w-2 rounded-full shrink-0"
            style={{ backgroundColor: dotColor }}
          />
          <span
            className="text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap group-hover:hidden"
            style={{ writingMode: "vertical-rl" as const, textOrientation: "mixed" as const }}
          >
            {PIPELINE_LABELS[stage] ?? stage}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider hidden group-hover:block text-center">
            {PIPELINE_LABELS[stage] ?? stage}
          </span>
          <span className="text-xs tabular-nums text-[var(--color-text-tertiary)]">
            0
          </span>
        </div>
      ) : (
        /* ── Full column ── */
        <>
          {/* Column header */}
          <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] px-3 py-2">
            <div className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: dotColor }}
              />
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${STAGE_TEXT_COLORS[stage] ?? ""}`}>
                {PIPELINE_LABELS[stage] ?? stage}
              </span>
            </div>
            <motion.span
              className="text-xs font-semibold tabular-nums text-[var(--color-text-tertiary)]"
              key={cards.length}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {cards.length}
            </motion.span>
          </div>

          {/* Cards area */}
          <div className="flex min-h-[100px] flex-col gap-2 p-2">
            <AnimatePresence>
              {cards.map((item) => (
                <PipelineCard
                  key={item.pipeline_id}
                  item={item}
                  score={scores[item.pipeline_id] ?? null}
                  draggingId={draggingId}
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                  onCardClick={onCardClick}
                  onStatusChange={onStatusChange}
                  onDelete={onDelete}
                />
              ))}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  );
}
