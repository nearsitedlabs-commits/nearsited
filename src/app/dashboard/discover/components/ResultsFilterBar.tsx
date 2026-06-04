"use client";

import { Info, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const SORT_OPTIONS = [
  { value: "opportunity-desc", label: "Estimated Opportunity" },
  { value: "rating-desc", label: "Rating (High to Low)" },
  { value: "outreach-first", label: "Flagged for Outreach First" },
];

const FILTER_TABS = [
  { value: "all", label: "All" },
  { value: "has_website", label: "Has Website" },
  { value: "platform_only", label: "Platform Only" },
  { value: "social_only", label: "Social Only" },
  { value: "no_website", label: "No Website" },
];

type ResultsFilterBarProps = {
  totalCount: number;
  flaggedCount: number;
  sortOption: string;
  sortDropdownOpen: boolean;
  websiteFilter: string;
  sortRef: React.RefObject<HTMLDivElement | null>;
  onSortChange: (value: string) => void;
  onSortToggle: () => void;
  onFilterChange: (value: string) => void;
};

export function ResultsFilterBar({
  totalCount,
  flaggedCount,
  sortOption,
  sortDropdownOpen,
  websiteFilter,
  sortRef,
  onSortChange,
  onSortToggle,
  onFilterChange,
}: ResultsFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] px-5 py-3.5 shadow-[var(--brand-shadow-sm)]">
      <span className="flex items-baseline gap-1">
        <span className="text-2xl font-normal text-[var(--text-primary)]">{totalCount}</span>
        <span className="text-sm text-[var(--text-secondary)]">business{totalCount === 1 ? "" : "es"}</span>
      </span>

      {flaggedCount > 0 && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-tint)] px-2.5 py-1 text-xs font-semibold text-[var(--accent)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
          {flaggedCount} flagged for outreach
          <span className="relative group inline-flex items-center">
            <Info className="size-3 cursor-help opacity-60" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-[var(--bg-surface-3)] text-[var(--text-primary)] text-xs rounded-xl px-3 py-2.5 w-64 shadow-xl z-50 leading-relaxed pointer-events-none">
              Businesses are flagged as outreach candidates when they have no website, rely only on social media or a third-party platform page, or score as a high opportunity after analysis.
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[var(--bg-surface-3)]" />
            </div>
          </span>
        </span>
      )}

      <div className="ml-auto flex items-center gap-2 flex-wrap">
        {/* Sort dropdown */}
        <div className="relative" ref={sortRef}>
          <button
            type="button"
            onClick={onSortToggle}
            className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] transition-all duration-150 hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
          >
            Sort
            <ChevronDown className={`h-3 w-3 transition-transform duration-150 ${sortDropdownOpen ? "rotate-180" : ""}`} />
          </button>
          <AnimatePresence>
            {sortDropdownOpen && (
              <motion.div
                className="absolute right-0 top-full z-40 mt-1.5 w-52 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-[var(--brand-shadow-lg)] overflow-hidden"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
              >
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { onSortChange(opt.value); }}
                    className={`cursor-pointer flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm transition-colors hover:bg-[var(--bg-elevated)] ${
                      sortOption === opt.value ? "font-semibold text-[var(--accent)]" : "text-[var(--text-secondary)]"
                    }`}
                  >
                    {sortOption === opt.value && (
                      <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--accent)]" />
                    )}
                    {opt.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Filter pills */}
        <div className="flex gap-1 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-1">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => onFilterChange(tab.value)}
              className={`relative cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors duration-150 ${
                websiteFilter === tab.value
                  ? "text-[var(--text-primary)] font-semibold"
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              }`}
            >
              {websiteFilter === tab.value && (
                <motion.div
                  layoutId="discover-filter-active"
                  className="absolute inset-0 rounded-lg bg-[var(--bg-surface)] shadow-[var(--brand-shadow-xs)]"
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
