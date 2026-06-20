"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { X, Loader2 } from "lucide-react";
import { useSafeReducedMotion } from "@/lib/motion";
import { useToast } from "@/lib/shared-hooks";
import { Toast } from "@/components/ui/Toast";
import { FilterPanel } from "@/components/filters/FilterPanel";
import { StatTile } from "@/components/ui/StatTile";
import {
  type FilterState, DEFAULT_FILTERS, countActiveFilters,
  filtersToParams, paramsToFilters, applyFilters,
} from "@/lib/filters";
import { useLeadsData } from "./hooks/useLeadsData";
import { useLeadInlineAnalysis } from "./hooks/useLeadInlineAnalysis";
import { LeadsFilterBar } from "./components/LeadsFilterBar";
import { LeadsEmptyState } from "./components/LeadsEmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LeadsTable } from "./components/LeadsTable";
import { LeadsMobileCards } from "./components/LeadsMobileCards";
import type { PipelineTab, TabFilter, OpportunityTab } from "./components/types";
import { PAGE_SIZE } from "./components/types";

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LeadsPage() {
  const { leads, pipelineMap, pitchMap, loading, error } = useLeadsData();
  const { analysingIds, analyseProgress, handleAnalyse } = useLeadInlineAnalysis();

  const router = useRouter();
  const shouldReduce = useSafeReducedMotion();
  const { toast: toastMsg, showToast, setToast } = useToast();

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
  const [bulkMode, setBulkMode] = useState(false);

  // Mobile "load more" — accumulates results; reset via filter handlers (not useEffect)
  const [mobileLoadCount, setMobileLoadCount] = useState(PAGE_SIZE);

  const handlePageChange = useCallback((next: number) => {
    setPage(next);
    try { sessionStorage.setItem("nearsited_leads_page", next.toString()); } catch { /* ignore */ }
  }, []);

  const setFilters = useCallback((f: FilterState) => {
    setFiltersState(f);
    handlePageChange(1);
    setMobileLoadCount(PAGE_SIZE);
    const params = filtersToParams(f);
    router.replace(`${window.location.pathname}${params.toString() ? `?${params}` : ""}`, { scroll: false });
  }, [router, setMobileLoadCount, handlePageChange]);

  // Opportunity filter tab clicks — handles new split tabs + in_pipeline chip
  const handleFilterTabClick = useCallback((tab: OpportunityTab) => {
    if (tab === "all") {
      setActivePipelineTab("all_pipeline");
      setFilters({ ...filters, websiteStatus: [], flaggedOnly: false, auditedOnly: false, analysedOnly: false });
    } else if (tab === "flagged") {
      setActivePipelineTab("all_pipeline");
      setFilters({ ...filters, flaggedOnly: true, websiteStatus: [], auditedOnly: false, analysedOnly: false });
    } else if (tab === "in_pipeline") {
      setActivePipelineTab(activePipelineTab === "all_pipeline" ? "pipeline_in" : "all_pipeline");
      setFilters({ ...filters, websiteStatus: [], flaggedOnly: false, auditedOnly: false, analysedOnly: false });
    } else if (tab === "audited") {
      setActivePipelineTab("all_pipeline");
      setFilters({ ...filters, auditedOnly: true, analysedOnly: false, websiteStatus: [], flaggedOnly: false });
    } else if (tab === "analysed") {
      setActivePipelineTab("all_pipeline");
      setFilters({ ...filters, analysedOnly: true, auditedOnly: false, websiteStatus: [], flaggedOnly: false });
    } else if (tab === "social_platform") {
      setActivePipelineTab("all_pipeline");
      setFilters({ ...filters, websiteStatus: ["social_only", "platform_only"], flaggedOnly: false, auditedOnly: false, analysedOnly: false });
    } else {
      // single-status tabs: no_website, has_website, social_only, platform_only
      setActivePipelineTab("all_pipeline");
      setFilters({ ...filters, websiteStatus: [tab as string], flaggedOnly: false, auditedOnly: false, analysedOnly: false });
    }
  }, [filters, setFilters, activePipelineTab]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    handlePageChange(1);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => setDebouncedSearch(val), 300);
  }, [handlePageChange]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    setDebouncedSearch("");
    setMobileLoadCount(PAGE_SIZE);
  }, [setMobileLoadCount]);

  // KPI tile click — filter table to subset
  const handleKpiClick = useCallback((type: string) => {
    handlePageChange(1);
    switch (type) {
      case "unaudited":
        setFilters({ ...filters, auditedOnly: true, websiteStatus: [] });
        break;
      case "flagged":
        setActivePipelineTab("all_pipeline");
        setFilters({ ...filters, flaggedOnly: true, websiteStatus: [] });
        break;
      case "pipeline":
        setActivePipelineTab("pipeline_in");
        setFilters({ ...filters, websiteStatus: [], flaggedOnly: false });
        break;
      default:
        setActivePipelineTab("all_pipeline");
        setFilters({ ...filters, websiteStatus: [], flaggedOnly: false, auditedOnly: false });
    }
  }, [filters, setFilters, handlePageChange]);

  // Row-level pipeline actions
  const handleRowAddToPipeline = useCallback(async (id: string) => {
    try {
      const r = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: id }),
      });
      const d = await r.json();
      if (d.success || d.message === "Already in pipeline") {
        showToast("Added to pipeline");
      }
    } catch { /* ignore */ }
  }, [showToast]);

  const handlePhoneCopied = useCallback((msg: string) => {
    showToast(msg);
  }, [showToast]);

  const handleRowMoveStatus = useCallback(async (id: string, status: "won" | "lost") => {
    try {
      const r = await fetch("/api/pipeline", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: id, status }),
      });
      const d = await r.json();
      if (d.success) {
        const label = status === "won" ? "Marked as Won" : "Marked as Lost";
        showToast(label);
      }
    } catch { /* ignore */ }
  }, [showToast]);

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

  const kpiFilterUnaudited = useMemo(() => filters.auditedOnly, [filters.auditedOnly]);

  const displayLeads = useMemo(() => {
    if (kpiFilterUnaudited) return filtered.filter((l) => l.audited_at === null);
    return filtered;
  }, [filtered, kpiFilterUnaudited]);

  const totalPages = Math.max(1, Math.ceil(displayLeads.length / PAGE_SIZE));
  // Clamp page to valid range — handles stale sessionStorage, filter changes shrinking results
  const safePage = Math.min(page, totalPages);
  const paginated = displayLeads.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Mobile accumulates results via "load more" (not page flipping)
  const mobilePaginated = displayLeads.slice(0, mobileLoadCount);
  const hasMoreOnMobile = mobileLoadCount < displayLeads.length;

  // KPI counts
  const unauditedCount = leads.filter((l) => l.audited_at === null).length;
  const readyToPitchCount = leads.filter((l) => l.flagged_for_outreach).length;

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

  const handleClearSelection = useCallback(() => setSelectedIds(new Set()), []);

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
      showToast(`Added ${count} to pipeline`);
      handleClearSelection();
    }
  }, [selectedIds, handleClearSelection, showToast]);

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
      showToast(`Started audit for ${count} businesses`);
    }
  }, [selectedIds, leads, handleAnalyse, showToast]);

  // Active tab resolver (for empty state)
  const resolvedActiveTab: TabFilter =
    activePipelineTab !== "all_pipeline" ? activePipelineTab :
    filters.flaggedOnly ? "flagged" :
    filters.websiteStatus.length === 1 && filters.websiteStatus[0] === "no_website" ? "no_website" :
    filters.websiteStatus.length === 1 && filters.websiteStatus[0] === "has_website" ? "has_website" :
    filters.websiteStatus.length === 1 && filters.websiteStatus[0] === "social_only" ? "social_only" :
    filters.websiteStatus.length === 1 && filters.websiteStatus[0] === "platform_only" ? "platform_only" :
    filters.websiteStatus.length > 0 ? "social_platform" :
    "all";

  // ── Loading / Error states ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-page)] px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-7xl animate-pulse space-y-6">
          <div className="h-9 w-52 rounded-[var(--radius-md)] bg-[var(--color-bg-elevated)]" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 rounded-[var(--radius-md)] bg-[var(--color-bg-elevated)]" />
            ))}
          </div>
          <div className="h-8 w-full rounded-[var(--radius-sm)] bg-[var(--color-bg-elevated)]" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 rounded-[var(--radius-sm)] bg-[var(--color-bg-elevated)]" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-page)]">
        <ErrorState description={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  // ── Page render ───────────────────────────────────────────────────────────────
  return (
    <>
    <div className="min-h-screen bg-[var(--color-bg-page)]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-medium sm:text-2xl text-[var(--color-text-primary)]">Your opportunities</h1>
          <Link
            href="/dashboard/discover"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-accent)]/20 bg-[var(--color-bg-elevated)] px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition-colors duration-150 [@media(hover:hover)]:hover:border-[var(--color-accent)]/45 [@media(hover:hover)]:hover:text-[var(--color-text-primary)]"
          >
            + Find more
          </Link>
        </div>

        {/* KPI tiles — StatTile grid */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <button onClick={() => handleKpiClick("total")} className="cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]/40 rounded-[var(--radius-md)]">
            <StatTile label="Total" value={leads.length} className="w-full hover:border-[var(--color-border-strong)] transition-colors" />
          </button>
          <button onClick={() => handleKpiClick("unaudited")} className="cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]/40 rounded-[var(--radius-md)]">
            <StatTile label="Un-audited" value={unauditedCount} accent="warning" className="w-full hover:border-[var(--color-border-strong)] transition-colors" />
          </button>
          <button onClick={() => handleKpiClick("flagged")} className="cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]/40 rounded-[var(--radius-md)]">
            <StatTile label="Ready to Pitch" value={readyToPitchCount} className="w-full hover:border-[var(--color-border-strong)] transition-colors" />
          </button>
          <button onClick={() => handleKpiClick("pipeline")} className="cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]/40 rounded-[var(--radius-md)]">
            <StatTile label="In Pipeline" value={pipelineMap.size} className="w-full hover:border-[var(--color-border-strong)] transition-colors" />
          </button>
        </div>

        {/* Bulk action bar */}
        {selectedIds.size > 0 && (
          <div className="mb-4 flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-info)]/30 bg-[var(--color-info)]/10 px-4 py-2.5 text-sm">
            <span className="font-medium text-[var(--color-info)]">{selectedIds.size} selected</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkPipeline}
                disabled={bulkLoading}
                className="cursor-pointer inline-flex items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--color-accent)]/30 px-3 py-1.5 text-xs font-medium text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 transition-colors disabled:opacity-50"
              >
                {bulkLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                + Pipeline
              </button>
              <button
                onClick={handleBulkAudit}
                disabled={bulkLoading}
                aria-label={`Run website audit on ${selectedIds.size} selected ${selectedIds.size === 1 ? "business" : "businesses"} — uses ${selectedIds.size} ${selectedIds.size === 1 ? "credit" : "credits"}`}
                className="cursor-pointer inline-flex items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--color-accent)]/20 px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] [@media(hover:hover)]:hover:border-[var(--color-accent)]/45 [@media(hover:hover)]:hover:text-[var(--color-accent)] transition-colors disabled:opacity-50"
              >
                {bulkLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                Audit ({selectedIds.size} credits)
              </button>
            </div>
            <button
              onClick={handleClearSelection}
              className="ml-auto cursor-pointer text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
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
          onSearchChange={handleSearchChange}
          onClearSearch={handleClearSearch}
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
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)]">
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
              onAddToPipeline={handleRowAddToPipeline}
              onMoveStatus={handleRowMoveStatus}
              onPhoneCopied={handlePhoneCopied}
              pagination={{
                page: safePage,
                totalPages,
                totalItems: displayLeads.length,
                pageSize: PAGE_SIZE,
                onPageChange: handlePageChange,
              }}
            />

            <LeadsMobileCards
              paginated={mobilePaginated}
              pipelineMap={pipelineMap}
              pitchMap={pitchMap}
              analysingIds={analysingIds}
              analyseProgress={analyseProgress}
              onAnalyse={handleAnalyse}
              shouldReduce={shouldReduce}
              bulkMode={bulkMode}
              onEnterBulkMode={() => setBulkMode(true)}
              onExitBulkMode={() => { setBulkMode(false); handleClearSelection(); }}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onBulkPipeline={handleBulkPipeline}
              onBulkAudit={handleBulkAudit}
              bulkLoading={bulkLoading}
              hasMoreOnMobile={hasMoreOnMobile}
              onLoadMore={() => setMobileLoadCount((c) => c + PAGE_SIZE)}
              onPhoneCopied={handlePhoneCopied}
            />
          </>
        )}

      </div>
    </div>
    {toastMsg && <Toast message={toastMsg} onClose={() => setToast(null)} />}
    </>
  );
}
