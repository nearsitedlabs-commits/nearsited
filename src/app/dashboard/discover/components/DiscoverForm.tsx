"use client";

import { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Building2,
  Info,
  Search,
  Shuffle,
  Loader2,
} from "lucide-react";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { businessTypes } from "@/lib/data/businessTypes";
import type { CityOption } from "@/lib/data/cities";

type SavedSearch = {
  id: string;
  name: string;
  city: string;
  business_type: string;
  radius?: number;
};

type DiscoverFormProps = {
  selectedCity: string;
  selectedBusinessType: string;
  radiusMeters: number;
  submitting: boolean;
  loadingAuth: boolean;
  error: string | null;
  cities: CityOption[];
  savedSearches: SavedSearch[];
  savedSearchesOpen: boolean;
  onCityChange: (value: string) => void;
  onBusinessTypeChange: (value: string) => void;
  onRadiusChange: (value: number) => void;
  onCitySearchChange: (query: string) => void;
  onSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
  onRandomize: () => void;
  onSaveSearchClick: () => void;
  onLoadSearch: (search: SavedSearch) => void;
  onSavedSearchesToggle: () => void;
};

export function DiscoverForm({
  selectedCity,
  selectedBusinessType,
  radiusMeters,
  submitting,
  loadingAuth,
  error,
  cities,
  savedSearches,
  savedSearchesOpen,
  onCityChange,
  onBusinessTypeChange,
  onRadiusChange,
  onCitySearchChange,
  onSubmit,
  onRandomize,
  onSaveSearchClick,
  onLoadSearch,
  onSavedSearchesToggle,
}: DiscoverFormProps) {
  const savedSearchesRef = useRef<HTMLDivElement>(null);

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 sm:p-5 shadow-[var(--brand-shadow-sm)]">
      <form onSubmit={onSubmit}>
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-2.5 sm:items-end">
          <div className="relative flex-1 min-w-0">
            <label className="sr-only">City</label>
            <MapPin className="pointer-events-none absolute left-3.5 top-1/2 z-10 size-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <SearchableSelect
              options={cities}
              value={selectedCity}
              onChange={onCityChange}
              placeholder="City…"
              displayKey="label"
              valueKey="value"
              onSearchChange={onCitySearchChange}
              inputClassName="!pl-10 !h-11 !rounded-xl !border-[var(--border)] !bg-[var(--bg-elevated)] !text-sm !text-[var(--text-primary)] !shadow-none placeholder:!text-[var(--text-tertiary)] !text-ellipsis !overflow-hidden !whitespace-nowrap"
            />
          </div>
          <div className="relative flex-1 min-w-0">
            <label className="sr-only">Business Type</label>
            <Building2 className="pointer-events-none absolute left-3.5 top-1/2 z-10 size-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <SearchableSelect
              options={businessTypes}
              value={selectedBusinessType}
              onChange={onBusinessTypeChange}
              placeholder="Business type…"
              displayKey="label"
              valueKey="value"
              groupKey="category"
              inputClassName="!pl-10 !h-11 !rounded-xl !border-[var(--border)] !bg-[var(--bg-elevated)] !text-sm !text-[var(--text-primary)] !shadow-none placeholder:!text-[var(--text-tertiary)] !text-ellipsis !overflow-hidden !whitespace-nowrap"
            />
          </div>
          <div className="flex-1 sm:flex-shrink-0 sm:min-w-[140px]">
            <label className="mb-1 flex items-center gap-1 text-[10px] uppercase tracking-[0.15em] font-medium text-[var(--text-tertiary)]">
              <span className="hidden sm:inline">Radius:</span>
              <span className="sm:hidden">R:</span>
              <span>
                {radiusMeters >= 1000
                  ? `${(radiusMeters / 1000).toFixed(0)} km`
                  : `${radiusMeters} m`}
              </span>
              <span className="relative group inline-flex items-center">
                <Info className="size-3 cursor-help opacity-60" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-[var(--bg-surface-3)] text-[var(--text-primary)] text-xs font-normal normal-case tracking-normal rounded-xl px-3 py-2.5 w-64 shadow-xl z-50 leading-relaxed pointer-events-none">
                  Radius is measured from the city center coordinates.
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[var(--bg-surface-3)]" />
                </div>
              </span>
            </label>
            <input
              type="range"
              min={1000}
              max={100000}
              step={1000}
              value={radiusMeters}
              onChange={(e) => onRadiusChange(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-[var(--bg-elevated)] accent-[var(--accent)] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--accent)] [&::-webkit-slider-thumb]:shadow-[var(--brand-shadow-sm)] [&::-webkit-slider-thumb]:cursor-pointer"
            />
          </div>
          <div className="flex gap-2.5">
            <button
              type="submit"
              disabled={!!(submitting || loadingAuth)}
              className="flex-1 sm:flex-shrink-0 inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 sm:px-5 text-sm font-semibold text-white shadow-[var(--brand-shadow-sm)] transition-all duration-150 hover:bg-[var(--accent-hover)] hover:shadow-[var(--brand-shadow-md)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <AnimatePresence mode="wait" initial={false}>
                {submitting ? (
                  <motion.span
                    key="loading"
                    className="flex items-center gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.12 }}
                  >
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="hidden sm:inline">Finding…</span>
                  </motion.span>
                ) : (
                  <motion.span
                    key="idle"
                    className="flex items-center gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.12 }}
                  >
                    <Search className="h-4 w-4" />
                    <span className="hidden sm:inline">Find Businesses</span>
                    <span className="sm:hidden">Find</span>
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
            <button
              type="button"
              onClick={onRandomize}
              disabled={!!(submitting || loadingAuth)}
              title="Random city + business type"
              className="inline-flex h-11 w-11 flex-shrink-0 cursor-pointer items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-tertiary)] transition-all duration-150 hover:border-[var(--accent)]/50 hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Shuffle className="h-4 w-4" />
            </button>
          </div>
        </div>
      </form>

      <div className="mt-3 flex items-center gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onSaveSearchClick}
            disabled={!selectedCity || !selectedBusinessType || submitting}
            className="cursor-pointer text-xs text-[var(--text-tertiary)] transition-colors hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            + Save this search
          </button>
          {savedSearches.length > 0 && (
            <div className="relative" ref={savedSearchesRef}>
              <button
                type="button"
                onClick={onSavedSearchesToggle}
                className="cursor-pointer text-xs text-[var(--text-tertiary)] transition-colors hover:text-[var(--accent)]"
              >
                Saved ({savedSearches.length})
              </button>
              {savedSearchesOpen && (
                <div className="absolute left-0 top-full z-40 mt-1.5 w-64 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-[var(--brand-shadow-lg)] overflow-hidden">
                  <div className="px-3 py-2 text-[10px] uppercase tracking-[0.15em] font-medium text-[var(--text-tertiary)] border-b border-[var(--border)]">
                    Saved Searches
                  </div>
                  <div className="max-h-48 overflow-y-auto divide-y divide-[var(--border)]">
                    {savedSearches.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => onLoadSearch(s)}
                        className="w-full text-left px-3 py-2.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
                      >
                        <span className="font-medium text-[var(--text-primary)]">
                          {s.name}
                        </span>
                        <span className="ml-1.5 text-[var(--text-tertiary)]">
                          · {s.city} · {s.business_type}
                          {s.radius
                            ? ` · ${
                                s.radius >= 1000
                                  ? `${(s.radius / 1000).toFixed(0)}km`
                                  : `${s.radius}m`
                              }`
                            : ""}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        {loadingAuth && (
          <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
            Verifying…
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-[var(--badge-red-text)]">
          {error}
        </div>
      )}
    </div>
  );
}
