"use client";

type EmptyStateProps = {
  type: "no-search" | "no-results";
};

export function EmptyState({ type }: EmptyStateProps) {
  if (type === "no-search") {
    return (
      <div className="flex min-h-[240px] flex-col items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] py-16 text-center">
        <p className="text-sm font-medium text-[var(--color-text-primary)]">
          Hidden revenue is waiting.
        </p>
        <p className="mx-auto mt-1 max-w-xs text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
          Pick a city and business type above to find businesses worth reaching out to.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] py-16 text-center">
      <p className="text-sm font-medium text-[var(--color-text-primary)]">
        No businesses found in this area.
      </p>
      <p className="mx-auto mt-1 max-w-xs text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
        Try a different city, expand your radius, or choose another business type.
      </p>
    </div>
  );
}
