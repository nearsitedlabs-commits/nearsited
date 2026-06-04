"use client";

import { Compass } from "lucide-react";

type EmptyStateProps = {
  type: "no-search" | "no-results";
};

export function EmptyState({ type }: EmptyStateProps) {
  if (type === "no-search") {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] py-20 shadow-[var(--brand-shadow-sm)]">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-tint)]">
          <Compass className="h-6 w-6 text-[var(--accent)]" />
        </div>
        <h3 className="text-xl font-normal text-[var(--text-primary)] mb-1.5">Hidden revenue is waiting.</h3>
        <p className="text-xs text-[var(--text-tertiary)] max-w-xs text-center leading-relaxed">
          Every city has businesses with outdated websites, poor mobile performance, and no online presence. Pick a city and business type above to uncover redesign opportunities ready for outreach.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] py-20 shadow-[var(--brand-shadow-sm)]">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--bg-elevated)]">
        <Compass className="h-6 w-6 text-[var(--text-tertiary)]" />
      </div>
      <h3 className="text-xl font-normal text-[var(--text-primary)] mb-1.5">No opportunities in this area.</h3>
      <p className="text-xs text-[var(--text-tertiary)] max-w-xs text-center leading-relaxed">
        Try a different city, expand your radius, or choose another business type. Undiscovered revenue is out there.
      </p>
    </div>
  );
}
