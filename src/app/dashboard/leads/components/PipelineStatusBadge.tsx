import { PIPELINE_LABELS, PIPELINE_BADGE_STYLES } from "@/lib/ui-constants";

export function PipelineStatusBadge({ status }: { status: string | undefined }) {
  if (!status) {
    return (
      <span className="inline-block whitespace-nowrap rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] px-2.5 py-1 text-[10px] font-medium text-[var(--text-tertiary)] transition-all duration-300">
        Not tracked
      </span>
    );
  }
  const badgeClass = PIPELINE_BADGE_STYLES[status] ?? "bg-[var(--bg-elevated)] text-[var(--text-tertiary)] border border-[var(--border)]";
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-medium transition-all duration-300 ${badgeClass}`}>
      {PIPELINE_LABELS[status] ?? status}
    </span>
  );
}
