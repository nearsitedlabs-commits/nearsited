import Link from "next/link";
import { Search, Compass, Target, Lightbulb } from "lucide-react";
import { FadeUp } from "@/lib/motion";
import type { TabFilter } from "./types";

const EMPTY_MESSAGES: Record<TabFilter, { icon: typeof Compass; title: string; description: string }> = {
  all: {
    icon: Compass,
    title: "No opportunities yet",
    description: "Hidden revenue is waiting to be uncovered. Start your first discovery search to find local businesses with redesign potential.",
  },
  all_pipeline: {
    icon: Compass,
    title: "No leads in pipeline",
    description: "Add discovered opportunities to your pipeline to start tracking them from prospect to won deal.",
  },
  no_website: {
    icon: Lightbulb,
    title: "No leads without a website",
    description: "Discover businesses in your area to find opportunities with no web presence.",
  },
  has_website: {
    icon: Target,
    title: "No leads with a website",
    description: "Discover businesses that have a website you could audit and improve.",
  },
  social_platform: {
    icon: Target,
    title: "No social or platform-only leads",
    description: "Discover businesses whose only presence is a social profile or third-party platform.",
  },
  flagged: {
    icon: Lightbulb,
    title: "No flagged leads",
    description: "Leads flagged for outreach will appear here.",
  },
  pipeline_prospect: {
    icon: Target,
    title: "No prospects yet",
    description: "Add opportunities to your pipeline to start tracking progress.",
  },
  pipeline_contacted: {
    icon: Target,
    title: "No contacted leads",
    description: "Move leads through your pipeline to start tracking conversations.",
  },
  pipeline_in_conversation: {
    icon: Target,
    title: "No active conversations",
    description: "Leads marked In Conversation will appear here.",
  },
  pipeline_won: {
    icon: Lightbulb,
    title: "No won deals yet",
    description: "Keep working your pipeline — won deals will appear here.",
  },
};

export function LeadsEmptyState({ activeTab, searchQuery }: { activeTab: TabFilter; searchQuery: string }) {
  if (searchQuery.trim()) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--bg-elevated)]">
          <Search className="h-6 w-6 text-[var(--text-tertiary)]" />
        </div>
        <h3 className="text-xl font-normal text-[var(--text-primary)]">No results for &ldquo;{searchQuery}&rdquo;</h3>
        <p className="mt-2 max-w-xs text-xs leading-relaxed text-[var(--text-tertiary)]">
          Try a different search term or adjust your filters.
        </p>
      </div>
    );
  }

  const msg = EMPTY_MESSAGES[activeTab] ?? EMPTY_MESSAGES.all;
  const Icon = msg.icon;

  return (
    <FadeUp>
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent-tint)]">
        <Icon className="h-6 w-6 text-[var(--accent)]" />
      </div>
      <h3 className="text-xl font-normal text-[var(--text-primary)]">{msg.title}</h3>
      <p className="mt-2 max-w-sm text-xs leading-relaxed text-[var(--text-tertiary)]">{msg.description}</p>
      {activeTab === "all" && (
        <Link
          href="/dashboard/discover"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-[var(--accent-hover)]"
        >
          <Compass className="h-4 w-4" /> Discover Businesses
        </Link>
      )}
    </div>
    </FadeUp>
  );
}
