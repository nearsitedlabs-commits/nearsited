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
          <h2 className="text-[13px] font-medium text-[var(--color-text-primary)]">
            {businessTypeLabel}s near {locationLabel}
          </h2>
          <p className="text-[11px] text-[var(--color-text-tertiary)]">
            {totalCount} result{totalCount === 1 ? "" : "s"}
            {flaggedCount > 0 && (
              <> · {flaggedCount} flagged
                <Tooltip content="Flagged when a business has no website, uses only social media (Facebook, Instagram, etc.), or is listed only on a third-party platform (Fresha, Booksy, etc.) — meaning they don't own their digital presence.">
                  <span className="inline-flex cursor-help ml-0.5 align-text-bottom">
                    <Info className="size-3 text-[var(--color-text-tertiary)]" />
                  </span>
                </Tooltip>
              </>
            )}
            {" · "}
            Sort:{" "}
            <button
              type="button"
              onClick={onSortToggle}
              className="inline-flex items-center gap-0.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors duration-150 cursor-pointer"
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
                className="absolute right-0 top-full z-40 mt-1 w-48 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] shadow-[var(--brand-shadow-lg)] overflow-hidden"
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
                    className={`cursor-pointer flex w-full items-center gap-2.5 px-4 py-2 text-left text-xs transition-colors hover:bg-[var(--color-bg-elevated)] ${
                      sortOption === opt.value ? "font-semibold text-[var(--color-accent)]" : "text-[var(--color-text-secondary)]"
                    }`}
                  >
                    {sortOption === opt.value && (
                      <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--color-accent)]" />
                    )}
                    {opt.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Filter chips — horizontal scroll on mobile so chips never wrap */}
      <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <span className="shrink-0 mr-1 text-[var(--color-text-tertiary)]">Filter:</span>
        {FILTER_OPTIONS.map((opt) => {
          const isActive = websiteFilter === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onFilterChange(opt.value)}
              className={`shrink-0 cursor-pointer transition-colors duration-150 px-2.5 py-1 min-h-[44px] flex items-center rounded-[var(--radius-sm)] ${
                isActive
                  ? "text-[var(--color-text-primary)] font-medium"
                  : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
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
