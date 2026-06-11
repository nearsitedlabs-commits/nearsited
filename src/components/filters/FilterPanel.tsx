"use client";

import { useEffect, useRef } from "react";
import { X, RotateCcw } from "lucide-react";
import { RangeSlider } from "./RangeSlider";
import type { FilterState } from "@/lib/filters";
import { countActiveFilters, trackFilter } from "@/lib/filters";

const WEBSITE_STATUS_OPTIONS = [
  { value: "no_website",    label: "No Website" },
  { value: "has_website",   label: "Has Website" },
  { value: "social_only",   label: "Social Only" },
  { value: "platform_only", label: "Platform Only" },
];

const ACTIVITY_OPTIONS = [
  { value: "all",      label: "All Activity Levels" },
  { value: "active",   label: "Active (20+ reviews)" },
  { value: "moderate", label: "Moderate (5–19 reviews)" },
  { value: "low",      label: "Low (<5 reviews)" },
];

const DATE_OPTIONS = [
  { value: "all",   label: "All Time" },
  { value: "today", label: "Today" },
  { value: "7d",    label: "Last 7 Days" },
  { value: "30d",   label: "Last 30 Days" },
];

const SORT_OPTIONS = [
  { value: "score_desc",   label: "Highest Opportunity" },
  { value: "score_asc",    label: "Lowest Opportunity" },
  { value: "date_desc",    label: "Newest Added" },
  { value: "date_asc",     label: "Oldest Added" },
  { value: "health_desc",  label: "Best Website Health" },
  { value: "reviews_desc", label: "Most Reviews" },
  { value: "reviews_asc",  label: "Fewest Reviews" },
];

const selectClass = "w-full rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-3 py-2 text-xs text-[var(--color-text-secondary)] outline-none focus:border-[var(--color-accent)] cursor-pointer [font-family:var(--font-sans)]";
const inputClass  = "w-full rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-3 py-2 text-xs text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-accent)]";
const labelClass  = "mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]";

interface FilterPanelProps {
  filters: FilterState;
  onChange: (f: FilterState) => void;
  onReset: () => void;
  businessTypes: string[];
  /** If true, render as a mobile full-screen drawer overlay */
  mobileOpen?: boolean;
  onClose?: () => void;
}

function FilterBody({ filters, onChange, onReset, businessTypes }: Omit<FilterPanelProps, "mobileOpen" | "onClose">) {
  function set<K extends keyof FilterState>(key: K, value: FilterState[K]) {
    onChange({ ...filters, [key]: value });
  }

  function toggleStatus(status: string) {
    const current = filters.websiteStatus;
    const next = current.includes(status)
      ? current.filter(s => s !== status)
      : [...current, status];
    set("websiteStatus", next);
    trackFilter("filter_applied", { key: "websiteStatus", value: next });
  }

  return (
    <div className="space-y-5 p-4">
      {/* Sort */}
      <div>
        <label className={labelClass}>Sort by</label>
        <select value={filters.sortBy} onChange={e => { set("sortBy", e.target.value as FilterState["sortBy"]); trackFilter("sort_changed", { value: e.target.value }); }} className={selectClass}>
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <div className="border-t border-[var(--color-border-subtle)]" />

      {/* Opportunity Score */}
      <div>
        <label className={labelClass}>Opportunity Score</label>
        <RangeSlider
          label="Range"
          min={0} max={100} step={5}
          value={[filters.scoreMin, filters.scoreMax]}
          onChange={([lo, hi]) => onChange({ ...filters, scoreMin: lo, scoreMax: hi })}
        />
      </div>

      {/* Website Status */}
      <div>
        <label className={labelClass}>Website Status</label>
        <div className="flex flex-wrap gap-1.5">
          {WEBSITE_STATUS_OPTIONS.map(o => (
            <button
              key={o.value}
              onClick={() => toggleStatus(o.value)}
              className={`cursor-pointer rounded-[var(--radius-sm)] border px-3 py-1.5 text-xs font-medium transition-colors ${
                filters.websiteStatus.includes(o.value)
                  ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                  : "border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]/40"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-[var(--color-border-subtle)]" />

      {/* Website Health */}
      <div>
        <label className={labelClass}>Website Health Score</label>
        <RangeSlider
          label="Range"
          min={0} max={100} step={5}
          value={[filters.healthMin, filters.healthMax]}
          onChange={([lo, hi]) => onChange({ ...filters, healthMin: lo, healthMax: hi })}
        />
      </div>

      <div className="border-t border-[var(--color-border-subtle)]" />

      {/* Industry */}
      <div>
        <label className={labelClass}>Industry</label>
        {businessTypes.length > 0 ? (
          <select value={filters.industry} onChange={e => set("industry", e.target.value)} className={selectClass}>
            <option value="">All Industries</option>
            {businessTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        ) : (
          <input type="text" value={filters.industry} onChange={e => set("industry", e.target.value)} placeholder="Search industry…" className={inputClass} />
        )}
      </div>

      {/* City */}
      <div>
        <label className={labelClass}>City</label>
        <input type="text" value={filters.city} onChange={e => set("city", e.target.value)} placeholder="Filter by city…" className={inputClass} />
      </div>

      <div className="border-t border-[var(--color-border-subtle)]" />

      {/* Business Activity */}
      <div>
        <label className={labelClass}>Business Activity</label>
        <select value={filters.activity} onChange={e => set("activity", e.target.value)} className={selectClass}>
          {ACTIVITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Date Added */}
      <div>
        <label className={labelClass}>Date Added</label>
        <select value={filters.dateRange} onChange={e => set("dateRange", e.target.value)} className={selectClass}>
          {DATE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <div className="border-t border-[var(--color-border-subtle)]" />

      {/* Checkboxes */}
      <div className="space-y-2">
        {[
          { key: "flaggedOnly" as const, label: "Flagged for outreach only" },
          { key: "auditedOnly" as const, label: "Audited businesses only" },
        ].map(({ key, label }) => (
          <label key={key} className="flex cursor-pointer items-center gap-2 text-xs text-[var(--color-text-secondary)]">
            <input
              type="checkbox"
              checked={filters[key]}
              onChange={e => set(key, e.target.checked)}
              className="h-3.5 w-3.5 rounded accent-[var(--accent)] cursor-pointer"
            />
            {label}
          </label>
        ))}
      </div>

      {/* Reset */}
      {countActiveFilters(filters) > 0 && (
        <button
          onClick={() => { onReset(); trackFilter("filter_reset"); }}
          className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] py-2 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:border-red-500/30 hover:text-red-400"
        >
          <RotateCcw className="h-3 w-3" /> Reset all filters
        </button>
      )}
    </div>
  );
}

export function FilterPanel({ filters, onChange, onReset, businessTypes, mobileOpen, onClose }: FilterPanelProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on backdrop click
  useEffect(() => {
    if (!mobileOpen) return;
    function handler(e: MouseEvent) {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) onClose?.();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [mobileOpen, onClose]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) { document.body.style.overflow = "hidden"; trackFilter("filter_opened"); }
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  // ── Mobile drawer ──────────────────────────────────────────────────────────
  if (mobileOpen !== undefined) {
    return (
      <>
        {/* Backdrop */}
        {mobileOpen && (
          <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        )}

        {/* Bottom sheet */}
        <div
          ref={drawerRef}
          className={`fixed bottom-0 left-0 right-0 z-50 max-h-[85dvh] overflow-y-auto rounded-t-2xl border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] shadow-2xl transition-transform duration-300 ease-out ${mobileOpen ? "translate-y-0" : "translate-y-full"}`}
        >
          {/* Handle + header */}
          <div className="sticky top-0 z-20 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] px-4 py-3">
            <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-[var(--border)]" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                Filters {countActiveFilters(filters) > 0 && <span className="ml-1 rounded-full bg-[var(--color-accent)] px-2 py-0.5 text-[10px] text-white">{countActiveFilters(filters)}</span>}
              </span>
              <button onClick={onClose} className="cursor-pointer rounded-[var(--radius-sm)] p-2.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <FilterBody filters={filters} onChange={onChange} onReset={onReset} businessTypes={businessTypes} />

          {/* Apply button */}
          <div className="sticky bottom-0 z-20 border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-4">
            <button
              onClick={() => { onClose?.(); trackFilter("filter_applied"); }}
              className="w-full cursor-pointer rounded-[var(--radius-sm)] bg-[var(--color-accent)] py-3 text-sm font-semibold text-white transition-colors hover:opacity-90"
            >
              Apply Filters {countActiveFilters(filters) > 0 && `(${countActiveFilters(filters)} active)`}
            </button>
          </div>
        </div>
      </>
    );
  }

  // ── Desktop sidebar ────────────────────────────────────────────────────────
  return (
    <div className="hidden lg:block">
      <div className="mb-3 flex items-center justify-between px-4 pt-4">
        <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">Filters</span>
        {countActiveFilters(filters) > 0 && (
          <button onClick={() => { onReset(); trackFilter("filter_reset"); }} className="cursor-pointer text-[10px] text-[var(--color-text-tertiary)] hover:text-red-400 transition-colors">
            Reset
          </button>
        )}
      </div>
      <FilterBody filters={filters} onChange={onChange} onReset={onReset} businessTypes={businessTypes} />
    </div>
  );
}
