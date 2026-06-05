import { Search, Filter } from "lucide-react";
import { FadeUp } from "@/lib/motion";
import type { FilterState } from "@/lib/filters";
import type { OpportunityTab, PipelineTab } from "./types";
import { OPPORTUNITY_FILTER_OPTIONS } from "./types";

type Props = {
  filters: FilterState;
  activeFilterCount: number;
  activePipelineTab: PipelineTab;
  searchQuery: string;
  onFilterTabClick: (tab: OpportunityTab) => void;
  onPipelineTabClick: (tab: PipelineTab) => void;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenFilterDrawer: () => void;
};

export function LeadsFilterBar({
  filters,
  activeFilterCount,
  activePipelineTab,
  searchQuery,
  onFilterTabClick,
  onPipelineTabClick,
  onSearchChange,
  onOpenFilterDrawer,
}: Props) {
  return (
    <FadeUp>
    <div className="mb-4 space-y-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {OPPORTUNITY_FILTER_OPTIONS.map((tab) => {
          const isActive =
            tab.value === "all"
              ? filters.websiteStatus.length === 0 && !filters.flaggedOnly
              : tab.value === "flagged"
              ? filters.flaggedOnly
              : tab.value === "social_platform"
              ? filters.websiteStatus.length > 0 && filters.websiteStatus.every(s => s === "social_only" || s === "platform_only")
              : filters.websiteStatus.length === 1 && filters.websiteStatus[0] === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => onFilterTabClick(tab.value)}
              className={`cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${
                isActive
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
              }`}
            >
              {tab.label}
            </button>
          );
        })}

        <div className="hidden h-5 w-px bg-[var(--border)] sm:block" />

        <button
          onClick={() => onPipelineTabClick(activePipelineTab === "all_pipeline" ? "pipeline_in" : "all_pipeline")}
          className={`cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${
            activePipelineTab !== "all_pipeline"
              ? "bg-[var(--accent)] text-white"
              : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
          }`}
        >
          Pipeline
        </button>

        <button
          onClick={onOpenFilterDrawer}
          className={`ml-auto cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${
            activeFilterCount > 0
              ? "bg-[var(--accent)] text-white"
              : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]"
          }`}
        >
          <Filter className="mr-1.5 inline h-3.5 w-3.5" />Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
        </button>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
        <input
          type="text"
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Search businesses, cities, industries…"
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] py-2.5 pl-10 pr-4 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] transition-colors duration-150 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
        />
      </div>
    </div>
    </FadeUp>
  );
}
