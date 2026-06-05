"use client";

import { FileDown, Share2 } from "lucide-react";

type LeadExportSectionProps = {
  businessId: string;
  handleShare: () => Promise<void>;
};

export function LeadExportSection({ businessId, handleShare }: LeadExportSectionProps) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 sm:p-6">
      <h2 className="mb-3 text-base font-semibold text-[var(--text-primary)]">Export</h2>
      <div className="flex flex-wrap gap-2">
        <a
          href={`/api/export/pdf?businessId=${businessId}`}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] transition-colors duration-150 hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
        >
          <FileDown className="h-3.5 w-3.5" /> PDF Report
        </a>
        <button
          onClick={handleShare}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] transition-colors duration-150 hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
        >
          <Share2 className="h-3.5 w-3.5" /> Share Link
        </button>
      </div>
    </div>
  );
}
