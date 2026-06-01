"use client";

const PILL: Record<string, { bg: string; border: string; color: string; label: string }> = {
  has_website:   { bg: "var(--badge-green-bg)",    border: "var(--badge-green-border)",    color: "var(--badge-green-text)",    label: "Has Website" },
  no_website:    { bg: "var(--badge-red-bg)",      border: "var(--badge-red-border)",      color: "var(--badge-red-text)",      label: "No Website" },
  social_only:   { bg: "var(--badge-amber-bg)",    border: "var(--badge-amber-border)",    color: "var(--badge-amber-text)",    label: "Social Only" },
  platform_only: { bg: "var(--badge-indigo-bg)",   border: "var(--badge-indigo-border)",   color: "var(--badge-indigo-text)",   label: "Platform Only" },
  unknown:       { bg: "rgba(255,255,255,0.04)",    border: "rgba(255,255,255,0.10)",       color: "var(--text-tertiary)",       label: "Unknown" },
};

export function WebsiteBadge({ status }: { status: string }) {
  const p = PILL[status] ?? PILL.unknown;
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap"
      style={{ background: p.bg, border: `0.5px solid ${p.border}`, color: p.color }}
    >
      {p.label}
    </span>
  );
}
