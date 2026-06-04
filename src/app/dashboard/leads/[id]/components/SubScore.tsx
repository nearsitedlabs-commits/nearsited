export function SubScore({ label, score }: { label: string; score: number | null }) {
  const color = score === null
    ? "text-[var(--text-tertiary)]"
    : score >= 70 ? "text-[var(--score-good)]"
    : score >= 40 ? "text-[var(--score-mid)]"
    : "text-[var(--score-high)]";
  return (
    <div className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2">
      <span className="text-sm text-[var(--text-secondary)]">{label}</span>
      <span className={`text-sm font-bold ${color}`}>{score ?? "—"}</span>
    </div>
  );
}
