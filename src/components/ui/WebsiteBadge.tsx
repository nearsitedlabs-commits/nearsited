"use client";

const PILL: Record<string, { label: string }> = {
  has_website:   { label: "Has site" },
  no_website:    { label: "No site" },
  social_only:   { label: "Social only" },
  platform_only: { label: "Platform only" },
  unknown:       { label: "Unknown" },
};

export function WebsiteBadge({ status }: { status: string }) {
  const p = PILL[status] ?? PILL.unknown;
  return (
    <span className="inline-flex items-center rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-text-tertiary)] whitespace-nowrap">
      {p.label}
    </span>
  );
}