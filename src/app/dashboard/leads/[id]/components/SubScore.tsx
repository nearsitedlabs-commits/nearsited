export function SubScore({ label, score }: { label: string; score: number | null }) {
  const color = score === null
    ? "text-[var(--color-text-tertiary)]"
    : score >= 70 ? "text-[var(--color-success)]"
    : score >= 40 ? "text-[var(--color-info)]"
    : "text-[var(--score-high)]";
  return (
    <div className="flex items-center justify-between rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-3 py-2">
      <span className="text-sm text-[var(--color-text-secondary)]">{label}</span>
      <span className={`text-sm font-bold ${color}`}>{score ?? "—"}</span>
    </div>
  );
}
