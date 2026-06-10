"use client";

import { ChevronDown, Info } from "lucide-react";
import { motion, AnimatePresence } from "@/lib/motion";
import { Tooltip } from "@/components/ui/Tooltip";

const SORT_OPTIONS = [
  { value: "score-desc", label: "Score", short: "Score" },
  { value: "reviews-desc", label: "Review count", short: "Review count" },
  { value: "rating-desc", label: "Rating", short: "Rating" },
  { value: "recency-desc", label: "Recency", short: "Recency" },
  { value: "name-asc", label: "Alphabetical", short: "Alphabetical" },
];

const FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "has_website", label: "Has site" },
  { value: "no_website", label: "No site" },
  { value: "social_only", label: "Social only" },
  { value: "platform_only", label: "Platform only" },
];

type ResultsFilterBarProps = {
  businessTypeLabel: string;
  locationLabel: string;
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
  businessTypeLabel,
  locationLabel,
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
  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === sortOption)?.label ?? "Score";

  return (
    <div className="space-y-3">
      {/* Header strip — two lines */}
      <div className="flex items-end justify-between">
        <div className="space-y-0.5">
          <h2 className="text-[13px] font-medium text-[var(--text-primary)]">
            {businessTypeLabel}s near {locationLabel}
          </h2>
          <p className="text-[11px] text-[var(--text-tertiary)]">
            {totalCount} result{totalCount === 1 ? "" : "s"}
            {flaggedCount > 0 && (
              <> · {flaggedCount} flagged
                <Tooltip content="Flagged when a business has no website, uses only social media (Facebook, Instagram, etc.), or is listed only on a third-party platform (Fresha, Booksy, etc.) — meaning they don't own their digital presence.">
                  <span className="inline-flex cursor-help ml-0.5 align-text-bottom">
                    <Info className="size-3 text-[var(--text-tertiary)]" />
                  </span>
                </Tooltip>
              </>
            )}
            {" · "}
            Sort:{" "}
            <button
              type="button"
              onClick={onSortToggle}
              className="inline-flex items-center gap-0.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-150 cursor-pointer"
            >
              {currentSortLabel}
              <ChevronDown className={`h-2.5 w-2.5 transition-transform duration-150 ${sortDropdownOpen ? "rotate-180" : ""}`} />
            </button>
          </p>
        </div>

        {/* Sort dropdown */}
        <div className="relative" ref={sortRef}>
          <AnimatePresence>
            {sortDropdownOpen && (
              <motion.div
                className="absolute right-0 top-full z-40 mt-1 w-48 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-[var(--brand-shadow-lg)] overflow-hidden"
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
                    className={`cursor-pointer flex w-full items-center gap-2.5 px-4 py-2 text-left text-xs transition-colors hover:bg-[var(--bg-elevated)] ${
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
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-1.5 text-[11px]">
        <span className="text-[var(--text-tertiary)] mr-1">Filter:</span>
        {FILTER_OPTIONS.map((opt) => {
          const isActive = websiteFilter === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onFilterChange(opt.value)}
              className={`cursor-pointer transition-colors duration-150 px-2 py-0.5 rounded-md ${
                isActive
                  ? "text-[var(--text-primary)] font-medium"
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
