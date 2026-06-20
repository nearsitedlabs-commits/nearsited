"use client";

import { Clock } from "lucide-react";
import type { AuditRow, DesignAnalysisRow } from "@/lib/db-types";

type Props = {
  audits: AuditRow[];
  designAnalyses: DesignAnalysisRow[];
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  if (h < 48) return `yesterday at ${new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

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
    <div className="rounded-[var(--radius-md)] bg-[var(--color-bg-surface)] p-5 sm:p-6">
      <h2 className="mb-4 text-base font-semibold text-[var(--color-text-primary)]">History</h2>
      {events.length === 0 ? (
        <div className="py-4 text-center">
          <Clock className="mx-auto mb-2 h-8 w-8 text-[var(--color-text-tertiary)]" aria-hidden="true" />
          <p className="text-sm text-[var(--color-text-tertiary)]">No history yet.</p>
        </div>
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
              <div key={i} className="flex items-center gap-3 rounded-[var(--radius-sm)] bg-[var(--color-bg-elevated)] px-3 py-2.5">
                <div className="h-2 w-2 shrink-0 rounded-full bg-[var(--color-accent)]" aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[var(--color-text-primary)]">{ev.label}</p>
                  <p className="text-[10px] text-[var(--color-text-tertiary)]">{timeAgo(ev.date)}</p>
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
