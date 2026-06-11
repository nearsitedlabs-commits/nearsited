import { useState } from "react";
import { Search, Filter, X } from "lucide-react";
import type { FilterState } from "@/lib/filters";
import type { OpportunityTab, PipelineTab } from "./types";
import { OPPORTUNITY_FILTER_OPTIONS } from "./types";

type Props = {
  filters: FilterState;
  activeFilterCount: number;
  activePipelineTab: PipelineTab;
  searchQuery: string;
  onFilterTabClick: (tab: OpportunityTab) => void;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearSearch: () => void;
  onOpenFilterDrawer: () => void;
};

export function LeadsFilterBar({
  filters,
  activeFilterCount,
  activePipelineTab,
  searchQuery,
  onFilterTabClick,
  onSearchChange,
  onClearSearch,
  onOpenFilterDrawer,
}: Props) {
  const [searchOpen, setSearchOpen] = useState(false);

  function handleToggleSearch() {
    if (searchOpen) {
      setSearchOpen(false);
      onClearSearch();
    } else {
      setSearchOpen(true);
    }
  }

  return (
    <div className="mb-4 space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {/* "Filter:" label */}
        <span className="text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--color-text-tertiary)] mr-1">
          Filter:
        </span>

        {/* Filter chips — text-based active state */}
        {OPPORTUNITY_FILTER_OPTIONS.map((tab) => {
          const isActive =
            tab.value === "all"
              ? filters.websiteStatus.length === 0 && !filters.flaggedOnly && activePipelineTab === "all_pipeline"
              : tab.value === "flagged"
              ? filters.flaggedOnly
              : tab.value === "in_pipeline"
              ? activePipelineTab !== "all_pipeline"
              : tab.value === "social_platform"
              ? filters.websiteStatus.length > 0 && filters.websiteStatus.every(s => s === "social_only" || s === "platform_only")
              : filters.websiteStatus.length === 1 && filters.websiteStatus[0] === tab.value;

          return (
            <button
              key={tab.value}
              onClick={() => onFilterTabClick(tab.value)}
              className={`cursor-pointer rounded-[var(--radius-sm)] px-2.5 py-1 text-xs transition-colors duration-150 ${
                isActive
                  ? "font-medium text-[var(--color-text-primary)] border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)]"
                  : "font-normal text-[var(--color-text-tertiary)] border border-transparent hover:text-[var(--color-text-secondary)]"
              }`}
            >
              {tab.label}
            </button>
          );
        })}

        <div className="flex-1" />

        {/* Search icon toggle */}
        <button
          onClick={handleToggleSearch}
          aria-label={searchOpen ? "Close search" : "Open search"}
          className={`cursor-pointer inline-flex items-center justify-center h-7 w-7 rounded-[var(--radius-sm)] transition-colors duration-150 ${
            searchOpen || searchQuery
              ? "text-[var(--color-text-primary)] bg-[var(--color-bg-elevated)]"
              : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)]"
          }`}
        >
          <Search className="h-3.5 w-3.5" />
        </button>

        {/* Filters drawer button */}
        <button
          onClick={onOpenFilterDrawer}
          className={`cursor-pointer inline-flex items-center gap-1 rounded-[var(--radius-sm)] px-2.5 py-1 text-xs font-medium transition-colors duration-150 ${
            activeFilterCount > 0
              ? "text-[var(--color-text-primary)] border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)]"
              : "text-[var(--color-text-tertiary)] border border-transparent hover:text-[var(--color-text-secondary)]"
          }`}
        >
          <Filter className="h-3 w-3" />
          Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""} ▾
        </button>
      </div>

      {/* Collapsible inline search */}
      {(searchOpen || searchQuery) && (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={onSearchChange}
            autoFocus
            placeholder="Search businesses, cities, industries…"
            className="w-full rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] py-2 pl-9 pr-9 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-tertiary)] transition-colors duration-150 focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20"
          />
          {searchQuery && (
            <button
              onClick={() => { onClearSearch(); setSearchOpen(false); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
