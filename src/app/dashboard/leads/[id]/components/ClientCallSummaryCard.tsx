"use client";

import { Copy } from "lucide-react";

type Props = {
  summary: string;
  onCopy: () => void;
};

export function ClientCallSummaryCard({ summary, onCopy }: Props) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-5 sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Client Call Summary</h2>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">Read this 60 seconds before a sales call.</p>
        </div>
        <button
          onClick={onCopy}
          className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--color-accent)] px-3 py-2 text-xs font-medium text-white transition-colors duration-150 hover:opacity-90 shrink-0"
        >
          <Copy className="h-3.5 w-3.5" /> Copy
        </button>
      </div>
      <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] p-4 text-xs text-[var(--color-text-secondary)] whitespace-pre-line leading-relaxed">
        {summary}
      </div>
    </div>
  );
}
