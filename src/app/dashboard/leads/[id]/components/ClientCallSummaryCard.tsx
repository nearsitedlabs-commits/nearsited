"use client";

import { Copy } from "lucide-react";

type Props = {
  summary: string;
  onCopy: () => void;
};

export function ClientCallSummaryCard({ summary, onCopy }: Props) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Client Call Summary</h2>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">Read this 60 seconds before a sales call.</p>
        </div>
        <button
          onClick={onCopy}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-medium text-white transition-colors duration-150 hover:bg-[var(--accent-hover)] shrink-0"
        >
          <Copy className="h-3.5 w-3.5" /> Copy
        </button>
      </div>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 text-xs text-[var(--text-secondary)] whitespace-pre-line leading-relaxed">
        {summary}
      </div>
    </div>
  );
}
