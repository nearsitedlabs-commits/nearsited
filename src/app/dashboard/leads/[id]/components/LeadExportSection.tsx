"use client";

import { FileDown, Share2 } from "lucide-react";

type LeadExportSectionProps = {
  businessId: string;
  handleShare: () => Promise<void>;
};

export function LeadExportSection({ businessId, handleShare }: LeadExportSectionProps) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-5 sm:p-6">
      <h2 className="mb-3 text-base font-semibold text-[var(--color-text-primary)]">Export</h2>
      <div className="flex flex-wrap gap-2">
        <a
          href={`/api/export/pdf?businessId=${businessId}`}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-3 py-2 text-xs font-medium text-[var(--color-text-secondary)] transition-colors duration-150 hover:border-[var(--color-accent)]/40 hover:text-[var(--color-accent)]"
        >
          <FileDown className="h-3.5 w-3.5" /> PDF Report
        </a>
        <button
          onClick={handleShare}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-3 py-2 text-xs font-medium text-[var(--color-text-secondary)] transition-colors duration-150 hover:border-[var(--color-accent)]/40 hover:text-[var(--color-accent)]"
        >
          <Share2 className="h-3.5 w-3.5" /> Share Link
        </button>
      </div>
    </div>
  );
}
