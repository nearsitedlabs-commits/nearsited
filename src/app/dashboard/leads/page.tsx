"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { FilterPanel } from "@/components/filters/FilterPanel";
import {
  type FilterState, DEFAULT_FILTERS, countActiveFilters,
  filtersToParams, paramsToFilters, applyFilters,
} from "@/lib/filters";
import { useLeadsData } from "./hooks/useLeadsData";
import { useLeadInlineAnalysis } from "./hooks/useLeadInlineAnalysis";
import { LeadsKPIStrip } from "./components/LeadsKPIStrip";
import { LeadsFilterBar } from "./components/LeadsFilterBar";
import { LeadsEmptyState } from "./components/LeadsEmptyState";
import { LeadsTable } from "./components/LeadsTable";
import { LeadsMobileCards } from "./components/LeadsMobileCards";
import type { PipelineTab, TabFilter, OpportunityTab } from "./components/types";
import { PAGE_SIZE } from "./components/types";

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LeadsPage() {
  const { leads, pipelineMap, loading, error } = useLeadsData();
  const { analysingIds, analyseProgress, handleAnalyse } = useLeadInlineAnalysis();

  const router = useRouter();
  const shouldReduce = useReducedMotion() ?? false;

  const [filters, setFiltersState] = useState<FilterState>(() =>
    typeof window !== "undefined"
      ? paramsToFilters(new URLSearchParams(window.location.search))
      : DEFAULT_FILTERS
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activePipelineTab, setActivePipelineTab] = useState<PipelineTab>("all_pipeline");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(() => {
    try { return parseInt(sessionStorage.getItem("nearsited_leads_page") ?? "1", 10); } catch { return 1; }
  });

  // Persist page to sessionStorage on change
  const handlePageChange = useCallback((next: number) => {
    setPage(next);
    try { sessionStorage.setItem("nearsited_leads_page", next.toString()); } catch { /* ignore */ }
  }, []);

  const setFilters = useCallback((f: FilterState) => {
    setFiltersState(f);
    setPage(1);
    const params = filtersToParams(f);
    router.replace(`${window.location.pathname}${params.toString() ? `?${params}` : ""}`, { scroll: false });
  }, [router]);

  // Opportunity filter tab clicks
  const handleFilterTabClick = useCallback((tab: OpportunityTab) => {
    setPage(1);
    if (tab === "all")                  setFilters({ ...filters, websiteStatus: [], flaggedOnly: false });
    else if (tab === "flagged")         setFilters({ ...filters, flaggedOnly: true, websiteStatus: [] });
    else if (tab === "social_platform") setFilters({ ...filters, websiteStatus: ["social_only", "platform_only"], flaggedOnly: false });
    else                                setFilters({ ...filters, websiteStatus: [tab], flaggedOnly: false });
  }, [filters, setFilters]);

  const handlePipelineTabClick = useCallback((tab: PipelineTab) => {
    setActivePipelineTab(tab);
    setPage(1);
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1);
  }, []);

  // Derived data
  const businessTypes = useMemo(
    () => [...new Set(leads.map(l => l.business_type).filter((t): t is string => !!t))].sort(),
    [leads],
  );

  const activeFilterCount = countActiveFilters(filters);
  const filtered = useMemo(
    () => applyFilters(leads, filters, searchQuery, pipelineMap, activePipelineTab),
    [leads, filters, searchQuery, pipelineMap, activePipelineTab],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // KPI counts
  const kpis = [
    { value: leads.length,                                       label: "Total Opportunities", valueClass: "text-[var(--text-primary)]" },
    { value: leads.filter((l) => l.audited_at !== null).length,  label: "Audited",             valueClass: "text-[var(--score-mid)]" },
    { value: leads.filter((l) => l.flagged_for_outreach).length, label: "Ready To Pitch",      valueClass: "text-[var(--score-good)]" },
    { value: pipelineMap.size,                                   label: "In Pipeline",         valueClass: "text-[var(--accent)]" },
  ];

  // Active tab resolver (for empty state)
  const resolvedActiveTab: TabFilter =
    activePipelineTab !== "all_pipeline" ? activePipelineTab :
    filters.flaggedOnly ? "flagged" :
    filters.websiteStatus.length === 1 && filters.websiteStatus[0] === "no_website" ? "no_website" :
    filters.websiteStatus.length === 1 && filters.websiteStatus[0] === "has_website" ? "has_website" :
    filters.websiteStatus.length > 0 ? "social_platform" :
    "all";

  // ── Loading / Error states ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] p-6">
        <div className="mx-auto max-w-7xl animate-pulse space-y-6">
          <div className="h-10 w-64 rounded-xl bg-[var(--bg-elevated)]" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-44 rounded-xl bg-[var(--bg-elevated)]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-base)]">
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-6 py-4 text-sm text-red-400">{error}</div>
      </div>
    );
  }

  // ── Page render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <div className="mx-auto max-w-7xl px-6 py-8">

        {/* Header */}
        <div className="mb-2">
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] transition-colors duration-150 hover:text-[var(--text-primary)]">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
        </div>
        <div className="mb-8 flex items-start justify-between">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Opportunities</p>
            <h1 className="mt-1 text-3xl font-normal tracking-tight text-[var(--text-primary)]">Your opportunities</h1>
          </div>
          <Link
            href="/dashboard/discover"
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-[var(--accent-hover)]"
          >
            <Search className="h-4 w-4" /> New Search
          </Link>
        </div>

        <LeadsKPIStrip kpis={kpis} />

        <LeadsFilterBar
          filters={filters}
          activeFilterCount={activeFilterCount}
          activePipelineTab={activePipelineTab}
          searchQuery={searchQuery}
          onFilterTabClick={handleFilterTabClick}
          onPipelineTabClick={handlePipelineTabClick}
          onSearchChange={handleSearchChange}
          onOpenFilterDrawer={() => setDrawerOpen(true)}
        />

        <FilterPanel
          filters={filters}
          onChange={setFilters}
          onReset={() => setFilters(DEFAULT_FILTERS)}
          businessTypes={businessTypes}
          mobileOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        />

        {/* Results */}
        {paginated.length === 0 ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]">
            <LeadsEmptyState activeTab={resolvedActiveTab} searchQuery={searchQuery} />
          </div>
        ) : (
          <>
            <LeadsTable
              paginated={paginated}
              pipelineMap={pipelineMap}
              analysingIds={analysingIds}
              analyseProgress={analyseProgress}
              onAnalyse={handleAnalyse}
              shouldReduce={shouldReduce}
            />

            <LeadsMobileCards
              paginated={paginated}
              pipelineMap={pipelineMap}
              analysingIds={analysingIds}
              analyseProgress={analyseProgress}
              onAnalyse={handleAnalyse}
              shouldReduce={shouldReduce}
            />

            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <p className="text-sm text-[var(--text-tertiary)]">
                  Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                </p>
                <div className="flex items-center gap-2">
                  <button onClick={() => handlePageChange(Math.max(1, page - 1))} disabled={page === 1}
                    className="cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-2 text-[var(--text-secondary)] transition-colors duration-150 hover:bg-[var(--bg-surface)] disabled:cursor-not-allowed disabled:opacity-40">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="px-3 text-sm text-[var(--text-secondary)]">{page} / {totalPages}</span>
                  <button onClick={() => handlePageChange(Math.min(totalPages, page + 1))} disabled={page === totalPages}
                    className="cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-2 text-[var(--text-secondary)] transition-colors duration-150 hover:bg-[var(--bg-surface)] disabled:cursor-not-allowed disabled:opacity-40">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}
