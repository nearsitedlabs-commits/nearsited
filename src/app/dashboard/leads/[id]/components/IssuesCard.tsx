"use client";

import { motion } from "@/lib/motion";
import { ImpactPill } from "./ImpactPill";

type Issue = { title: string; detail: string; point_deduction?: number; impact: "High" | "Medium" | "Low" };

const EASE_OUT = [0.25, 0.1, 0.25, 1] as const;

const issueContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const issueItem = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: EASE_OUT } },
};

type Props = {
  issues: Issue[];
  showAll: boolean;
  onToggleShowAll: () => void;
  reducedMotion: boolean;
  projDelta?: number;
};

export function IssuesCard({ issues, showAll, onToggleShowAll, reducedMotion, projDelta }: Props) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-5 sm:p-6">
      <h2 className="mb-4 text-base font-semibold text-[var(--color-text-primary)]">Top Issues Impacting Score</h2>
      {issues.length === 0 ? (
        <p className="text-sm text-[var(--color-text-tertiary)]">Run a design analysis to see issues.</p>
      ) : (
        <motion.div
          className="space-y-3"
          variants={issueContainer}
          initial={reducedMotion ? "visible" : "hidden"}
          animate="visible"
        >
          {(showAll ? issues : issues.slice(0, 3)).map((issue, i) => (
            <motion.div key={i} variants={issueItem} className="rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">{issue.title}</p>
                  <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">{issue.detail}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <ImpactPill impact={issue.impact ?? "Medium"} />
                  {issue.point_deduction && (
                    <span className="text-xs font-bold text-[var(--score-high)]">−{issue.point_deduction}pts</span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
          {issues.length > 3 && (
            <button
              onClick={onToggleShowAll}
              className="w-full cursor-pointer pt-1 text-xs text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-accent)]"
            >
              {showAll ? "Show less" : `+${issues.length - 3} more issue${issues.length - 3 !== 1 ? "s" : ""}`}
            </button>
          )}
          {projDelta != null && projDelta > 0 && (
            <p className="pt-1 text-xs text-[var(--color-text-tertiary)]">
              Fix these issues → <span className="font-semibold text-[var(--color-success)]">+{projDelta} pts</span> site quality improvement
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
}
