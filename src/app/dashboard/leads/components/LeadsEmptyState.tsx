import Link from "next/link";
import type { TabFilter } from "./types";

const EMPTY_COPY: Partial<Record<TabFilter, { title: string; description: string }>> = {
  all: {
    title: "No opportunities yet.",
    description: "Find businesses worth reaching out to.",
  },
  no_website: {
    title: "No leads without a website.",
    description: "Discover local businesses with no web presence.",
  },
  has_website: {
    title: "No leads with a website.",
    description: "Discover businesses whose site could be improved.",
  },
  social_platform: {
    title: "No social or platform-only leads.",
    description: "Discover businesses whose only presence is a social profile or third-party platform.",
  },
  social_only: {
    title: "No social-only leads.",
    description: "Discover businesses whose only online presence is a social profile.",
  },
  platform_only: {
    title: "No platform-only leads.",
    description: "Discover businesses whose only online presence is a third-party platform.",
  },
  in_pipeline: {
    title: "No leads in pipeline.",
    description: "Add discovered opportunities to your pipeline to track them here.",
  },
  all_pipeline: {
    title: "No leads in pipeline.",
    description: "Add discovered opportunities to your pipeline to start tracking conversations.",
  },
  flagged: {
    title: "No flagged leads.",
    description: "Leads flagged for outreach will appear here.",
  },
  pipeline_in: {
    title: "No pipeline leads.",
    description: "Add discovered opportunities to track them here.",
  },
  pipeline_prospect: {
    title: "No prospects yet.",
    description: "Add opportunities to your pipeline to start tracking progress.",
  },
  pipeline_contacted: {
    title: "No contacted leads.",
    description: "Move leads through your pipeline to start tracking conversations.",
  },
  pipeline_in_conversation: {
    title: "No active conversations.",
    description: "Leads marked In Conversation will appear here.",
  },
  pipeline_won: {
    title: "No won deals yet.",
    description: "Keep working your pipeline.",
  },
};

export function LeadsEmptyState({
  activeTab,
  searchQuery,
}: {
  activeTab: TabFilter;
  searchQuery: string;
}) {
  if (searchQuery.trim()) {
    return (
      <div className="flex min-h-[240px] flex-col items-center justify-center py-16 text-center">
        <p className="text-sm font-medium text-[var(--color-text-primary)]">
          Nothing matches &ldquo;{searchQuery}&rdquo;.
        </p>
        <p className="mx-auto mt-1 max-w-sm text-[13px] text-[var(--color-text-secondary)]">
          Try a different search term or adjust your filters.
        </p>
      </div>
    );
  }

  const copy = EMPTY_COPY[activeTab] ?? EMPTY_COPY.all!;

  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center py-16 text-center">
      <p className="text-sm font-medium text-[var(--color-text-primary)]">{copy.title}</p>
      <p className="mx-auto mt-1 max-w-sm text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
        {copy.description}
      </p>
      {activeTab === "all" && (
        <Link
          href="/dashboard/discover"
          className="mt-4 inline-flex cursor-pointer items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] px-3 py-2 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-accent)]/40 hover:text-[var(--color-accent)]"
        >
          + Find leads
        </Link>
      )}
    </div>
  );
}
