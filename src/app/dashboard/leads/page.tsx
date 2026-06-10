"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, ChevronLeft, ChevronRight, X, Loader2 } from "lucide-react";
import { useReducedMotion } from "@/lib/motion";
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
  const { leads, pipelineMap, pitchMap, loading, error } = useLeadsData();
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
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [page, setPage] = useState(() => {
    try { return parseInt(sessionStorage.getItem("nearsited_leads_page") ?? "1", 10); } catch { return 1; }
  });

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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
    const val = e.target.value;
    setSearchQuery(val);
    setPage(1);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => setDebouncedSearch(val), 300);
  }, []);

  // KPI click — filter the table to that subset
  const handleKpiClick = useCallback((type: string) => {
    setPage(1);
    switch (type) {
      case "unaudited":
        setFilters({ ...filters, auditedOnly: false, websiteStatus: [] });
        // Filter to unaudited only — we handle this client-side below
        break;
      case "flagged":
        setFilters({ ...filters, flaggedOnly: true, websiteStatus: [] });
        setActivePipelineTab("all_pipeline");
        break;
      case "pipeline":
        setActivePipelineTab("all_pipeline");
        setFilters({ ...filters, websiteStatus: [], flaggedOnly: false });
        break;
      default:
        setFilters({ ...filters, websiteStatus: [], flaggedOnly: false });
    }
  }, [filters, setFilters]);

  // Derived data
  const businessTypes = useMemo(
    () => [...new Set(leads.map(l => l.business_type).filter((t): t is string => !!t))].sort(),
    [leads],
  );

  const activeFilterCount = countActiveFilters(filters);
  const filtered = useMemo(
    () => applyFilters(leads, filters, debouncedSearch, pipelineMap, activePipelineTab),
    [leads, filters, debouncedSearch, pipelineMap, activePipelineTab],
  );

  // Handle "unaudited" KPI filter client-side
  const kpiFilterUnaudited = useMemo(() => {
    // Use the URL filter approach — set auditedOnly to true
    return filters.auditedOnly;
  }, [filters.auditedOnly]);

  const displayLeads = useMemo(() => {
    if (kpiFilterUnaudited) {
      return filtered.filter((l) => l.audited_at === null);
    }
    return filtered;
  }, [filtered, kpiFilterUnaudited]);

  const totalPages = Math.max(1, Math.ceil(displayLeads.length / PAGE_SIZE));
  const paginated = displayLeads.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // KPI counts with semantic logic
  const unauditedCount = leads.filter((l) => l.audited_at === null).length;
  const kpis = [
    {
      value: unauditedCount,
      label: "Un-audited",
      accentClass: "border-l-[var(--score-mid)]",
      onClick: () => handleKpiClick("unaudited"),
    },
    { value: leads.length, label: "Total", onClick: () => handleKpiClick("total") },
    {
      value: leads.filter((l) => l.flagged_for_outreach).length,
      label: "Ready to Pitch",
      onClick: () => handleKpiClick("flagged"),
    },
    { value: pipelineMap.size, label: "In Pipeline", onClick: () => handleKpiClick("pipeline") },
  ];

  // Bulk action helpers
  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleToggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      const allSelected = paginated.every((l) => prev.has(l.id));
      if (allSelected) {
        const next = new Set(prev);
        for (const l of paginated) next.delete(l.id);
        return next;
      }
      const next = new Set(prev);
      for (const l of paginated) next.add(l.id);
      return next;
    });
  }, [paginated]);

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Bulk: add to pipeline
  const [bulkLoading, setBulkLoading] = useState(false);
  const handleBulkPipeline = useCallback(async () => {
    setBulkLoading(true);
    let count = 0;
    for (const id of selectedIds) {
      try {
        const r = await fetch("/api/pipeline", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businessId: id }) });
        const d = await r.json();
        if (d.success || d.message === "Already in pipeline") count++;
      } catch {}
    }
    setBulkLoading(false);
    if (count > 0) {
      window.dispatchEvent(new CustomEvent("toast:show", { detail: `Added ${count} to pipeline` }));
      handleClearSelection();
    }
  }, [selectedIds, handleClearSelection]);

  // Bulk: audit all (simplified — sequential calls)
  const handleBulkAudit = useCallback(async () => {
    setBulkLoading(true);
    let count = 0;
    for (const id of selectedIds) {
      const lead = leads.find((l) => l.id === id);
      if (lead?.website && (lead.website_status === "has_website" || lead.website_status === "platform_only")) {
        await handleAnalyse(id, lead.website);
        count++;
      }
    }
    setBulkLoading(false);
    if (count > 0) {
      window.dispatchEvent(new CustomEvent("toast:show", { detail: `Started audit for ${count} businesses` }));
    }
  }, [selectedIds, leads, handleAnalyse]);

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

        {/* Header — removed "← Back to Dashboard" and "OPPORTUNITIES" eyebrow */}
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-normal tracking-tight text-[var(--text-primary)]">Your opportunities</h1>
          </div>
          <Link
            href="/dashboard/discover"
            className="self-start inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-[var(--accent-hover)]"
          >
            <Search className="h-4 w-4" /> + Find more
          </Link>
        </div>

        <LeadsKPIStrip kpis={kpis} />

        {/* Bulk action bar */}
        {selectedIds.size > 0 && (
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2.5 text-sm">
            <span className="font-medium text-blue-400">{selectedIds.size} selected</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkPipeline}
                disabled={bulkLoading}
                className="cursor-pointer inline-flex items-center gap-1 rounded-lg border border-[var(--accent)]/30 px-2.5 py-1 text-xs font-medium text-[var(--accent)] hover:bg-[var(--accent-tint)] transition-colors disabled:opacity-50"
              >
                {bulkLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                + Pipeline
              </button>
              <button
                onClick={handleBulkAudit}
                disabled={bulkLoading}
                aria-label={`Run website audit on ${selectedIds.size} selected ${selectedIds.size === 1 ? "business" : "businesses"} — uses ${selectedIds.size} ${selectedIds.size === 1 ? "credit" : "credits"}`}
                className="cursor-pointer inline-flex items-center gap-1 rounded-lg border border-[var(--border)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] hover:border-[var(--accent)]/40 hover:text-[var(--accent)] transition-colors disabled:opacity-50"
              >
                {bulkLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                Audit ({selectedIds.size} credits)
              </button>
            </div>
            <button
              onClick={handleClearSelection}
              className="ml-auto cursor-pointer text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <X className="h-3.5 w-3.5 inline" /> Clear
            </button>
          </div>
        )}

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
              pitchMap={pitchMap}
              analysingIds={analysingIds}
              analyseProgress={analyseProgress}
              onAnalyse={handleAnalyse}
              shouldReduce={shouldReduce}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onToggleSelectAll={handleToggleSelectAll}
            />

            <LeadsMobileCards
              paginated={paginated}
              pipelineMap={pipelineMap}
              pitchMap={pitchMap}
              analysingIds={analysingIds}
              analyseProgress={analyseProgress}
              onAnalyse={handleAnalyse}
              shouldReduce={shouldReduce}
            />

            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <p className="text-sm text-[var(--text-tertiary)]">
                  Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, displayLeads.length)} of {displayLeads.length}
                </p>
                <div className="flex items-center gap-2">
                  <button onClick={() => handlePageChange(Math.max(1, page - 1))} disabled={page === 1} aria-label="Previous page"
                    className="cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-2 text-[var(--text-secondary)] transition-colors duration-150 hover:bg-[var(--bg-surface)] disabled:cursor-not-allowed disabled:opacity-40">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="px-3 text-sm text-[var(--text-secondary)]">{page} / {totalPages}</span>
                  <button onClick={() => handlePageChange(Math.min(totalPages, page + 1))} disabled={page === totalPages} aria-label="Next page"
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
