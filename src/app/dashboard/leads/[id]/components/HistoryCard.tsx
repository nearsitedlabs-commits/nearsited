"use client";

import type { AuditRow, DesignAnalysisRow } from "@/lib/db-types";

type Props = {
  audits: AuditRow[];
  designAnalyses: DesignAnalysisRow[];
};

export function HistoryCard({ audits, designAnalyses }: Props) {
  const events: { date: string; label: string; score?: number }[] = [];

  if (audits.length > 0) {
    const latest = audits.reduce((a, b) =>
      new Date(a.created_at as string).getTime() > new Date(b.created_at as string).getTime() ? a : b
    );
    events.push({
      date: latest.created_at as string,
      label: "Performance Audit",
      score: (latest.performance_score as number | null) ?? undefined,
    });
  }

  if (designAnalyses.length > 0) {
    const latest = designAnalyses.reduce((a, b) =>
      new Date(a.analyzed_at as string).getTime() > new Date(b.analyzed_at as string).getTime() ? a : b
    );
    events.push({
      date: latest.analyzed_at as string,
      label: "Design Analysis",
      score: (latest.design_score as number | null) ?? undefined,
    });
  }

  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-5 sm:p-6">
      <h2 className="mb-4 text-base font-semibold text-[var(--color-text-primary)]">History</h2>
      {events.length === 0 ? (
        <p className="text-sm text-[var(--color-text-tertiary)]">No history yet.</p>
      ) : (
        <div className="space-y-2">
          {events.map((ev, i) => {
            const scoreColor = ev.score === undefined
              ? ""
              : ev.score >= 70
                ? "text-[var(--color-success)]"
                : ev.score >= 40
                  ? "text-[var(--color-info)]"
                  : "text-[var(--score-high)]";
            return (
              <div key={i} className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] p-3">
                <div className="h-2 w-2 shrink-0 rounded-full bg-[var(--color-accent)]" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[var(--color-text-primary)]">{ev.label}</p>
                  <p className="text-[10px] text-[var(--color-text-tertiary)]">
                    {new Date(ev.date).toLocaleDateString("en-US", {
                      month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>
                {ev.score !== undefined && (
                  <span className={`text-xs font-bold ${scoreColor}`}>{ev.score}</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
