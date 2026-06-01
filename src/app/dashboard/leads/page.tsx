"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { ArrowLeft, Search, Filter, ChevronLeft, ChevronRight, Info, Compass, Target, Lightbulb, Eye } from "lucide-react";
import type { WebsiteStatus } from "@/lib/types";
import { computeOpportunityScore, opportunityLabel, opportunityBadgeVariant } from "@/lib/scoring";
import { WebsiteBadge } from "@/components/ui/WebsiteBadge";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { SCORE_STATUS_PILLS, PIPELINE_LABELS } from "@/lib/ui-constants";

// ── Analyse Steps ──────────────────────────────────────────────────────────────

const ANALYSE_STEPS: { key: string; label: string }[] = [
  { key: "fetching",           label: "Fetching site data" },
  { key: "mobile",             label: "Running Mobile PageSpeed" },
  { key: "desktop",            label: "Running Desktop PageSpeed" },
  { key: "audit_complete",     label: "Performance audit complete" },
  { key: "screenshot_mobile",  label: "Taking Mobile screenshot" },
  { key: "screenshot_desktop", label: "Taking Desktop screenshot" },
  { key: "analysing_mobile",   label: "Analysing Mobile design" },
  { key: "analysing_desktop",  label: "Analysing Desktop design" },
  { key: "design_complete",    label: "Analysis complete" },
];

// ── Types ─────────────────────────────────────────────────────────────────────

type LeadRow = {
  id: string;
  name: string;
  business_type: string;
  address: string;
  city: string;
  place_id: string | null;
  website: string | null;
  website_status: WebsiteStatus;
  rating: number | null;
  review_count: number | null;
  performance_score: number | null;
  design_score: number | null;
  audited_at: string | null;
  design_analyzed_at: string | null;
  discovered_at: string;
  flagged_for_outreach: boolean;
  outreach_reason: string | null;
  issues_count: number;
  opportunity_score: number | null;
};

type TabFilter = "all" | "needs_improvement" | "strong_opportunity" | "contacted";

const PAGE_SIZE = 25;

const TAB_OPTIONS: { value: TabFilter; label: string; tooltip?: string }[] = [
  { value: "all", label: "All" },
  { value: "needs_improvement", label: "Needs Improvement", tooltip: "Leads with an overall score between 40–69" },
  { value: "strong_opportunity", label: "Strong Opportunity", tooltip: "Leads with score ≥70, or businesses with no website, social-only, or platform-only presence" },
  { value: "contacted", label: "Contacted", tooltip: `Leads with pipeline status: Contacted or ${PIPELINE_LABELS.in_conversation}` },
];

const WEBSITE_FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "has_website", label: "Opportunity Found" },
  { value: "no_website", label: "Website Opportunity" },
  { value: "social_only", label: "Social Presence" },
  { value: "platform_only", label: "Platform Presence" },
] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Compute effective score (opportunity_score with fallback for legacy rows). */
function effectiveOpportunityScore(lead: LeadRow): number {
  if (lead.opportunity_score != null) return lead.opportunity_score;
  // Fallback for businesses analysed before this change shipped
  const qualityScore = lead.performance_score ?? 50;
  return computeOpportunityScore(qualityScore, lead.review_count ?? 0, lead.rating ?? 0);
}

function scoreStatusLabel(lead: LeadRow): string {
  const oppScore = effectiveOpportunityScore(lead);
  return opportunityLabel(oppScore);
}

function scoreStatusStyle(lead: LeadRow): string {
  const oppScore = effectiveOpportunityScore(lead);
  const variant = opportunityBadgeVariant(oppScore);
  const map: Record<string, string> = {
    green:  "bg-[var(--badge-green-bg)] text-[var(--badge-green-text)] border border-[var(--badge-green-border)]",
    amber:  "bg-[var(--badge-amber-bg)] text-[var(--badge-amber-text)] border border-[var(--badge-amber-border)]",
    indigo: "bg-[var(--badge-indigo-bg)] text-[var(--badge-indigo-text)] border border-[var(--badge-indigo-border)]",
    red:    "bg-[var(--badge-red-bg)] text-[var(--badge-red-text)] border border-[var(--badge-red-border)]",
  };
  return map[variant] ?? "bg-[var(--bg-elevated)] text-[var(--text-tertiary)] border border-[var(--border)]";
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  const diffDays = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Compute a single "effective" score from available data */
function effectiveScore(lead: LeadRow): number | null {
  return lead.performance_score ?? lead.design_score ?? null;
}

// ── Tooltip Component ─────────────────────────────────────────────────────────

function TabTooltip({ text }: { text: string }) {
  return (
    <span className="relative group inline-flex items-center">
      <Info className="ml-1 size-3.5 cursor-help opacity-50 group-hover:opacity-80 transition-opacity" />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-[var(--bg-elevated)] text-[var(--text-primary)] text-xs rounded-lg px-3 py-2.5 w-64 shadow-[var(--brand-shadow-lg)] z-50 leading-relaxed pointer-events-none border border-[var(--border)]">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[var(--bg-elevated)]" />
      </div>
    </span>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────

const EMPTY_MESSAGES: Record<string, { icon: typeof Compass; title: string; description: string }> = {
  all: {
    icon: Compass,
    title: "No opportunities yet",
    description: "Hidden revenue is waiting to be uncovered. Start your first discovery search to find local businesses with redesign potential.",
  },
  needs_improvement: {
    icon: Target,
    title: "No opportunities need improvement",
    description: "All your scored leads are already in good shape — or you haven't scored any yet.",
  },
  strong_opportunity: {
    icon: Lightbulb,
    title: "No strong signals yet",
    description: "Score more leads to surface the strongest redesign candidates.",
  },
  contacted: {
    icon: Target,
    title: "No contacted leads",
    description: "Move leads through your pipeline to start tracking conversations.",
  },
};

function OpportunitiesEmptyState({ activeTab, searchQuery }: { activeTab: TabFilter; searchQuery: string }) {
  // If actively searching, show a search-specific message
  if (searchQuery.trim()) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--bg-elevated)]">
          <Search className="h-6 w-6 text-[var(--text-tertiary)]" />
        </div>
        <h3 className="text-xl font-normal text-[var(--text-primary)]">No results for &ldquo;{searchQuery}&rdquo;</h3>
        <p className="mt-2 max-w-xs text-xs leading-relaxed text-[var(--text-tertiary)]">
          Try a different search term or adjust your filters.
        </p>
      </div>
    );
  }

  const msg = EMPTY_MESSAGES[activeTab] ?? EMPTY_MESSAGES.all;
  const Icon = msg.icon;

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent-tint)]">
        <Icon className="h-6 w-6 text-[var(--accent)]" />
      </div>
      <h3 className="text-xl font-normal text-[var(--text-primary)]">{msg.title}</h3>
      <p className="mt-2 max-w-sm text-xs leading-relaxed text-[var(--text-tertiary)]">{msg.description}</p>
      {activeTab === "all" && (
        <Link
          href="/dashboard/discover"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-[var(--accent-hover)]"
        >
          <Compass className="h-4 w-4" /> Discover Businesses
        </Link>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LeadsPage() {
  const supabase = createClient();
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [pipelineMap, setPipelineMap] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [websiteFilter, setWebsiteFilter] = useState<string>("all");
  const [scoreRange, setScoreRange] = useState<[number, number]>([0, 100]);
  // ★ Smart Sorting: default to "opportunity" (highest score first)
  const [sortBy, setSortBy] = useState<string>("opportunity");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showFilters, setShowFilters] = useState(false);
  const [filterAudited, setFilterAudited] = useState(false);
  const [filterAnalysed, setFilterAnalysed] = useState(false);
  const [includeArchived, setIncludeArchived] = useState(false);
  // Restore pagination from sessionStorage via lazy initializer
  const [page, setPage] = useState(() => {
    const savedPage = sessionStorage.getItem("nearsited_leads_page");
    return savedPage ? parseInt(savedPage, 10) : 1;
  });

  // Save page to sessionStorage whenever it changes
  useEffect(() => {
    sessionStorage.setItem("nearsited_leads_page", page.toString());
  }, [page]);

  // Combined Analyse action state
  const [analysingIds, setAnalysingIds] = useState<Set<string>>(new Set());
  const [analysedIds, setAnalysedIds] = useState<Set<string>>(new Set());
  const [analyseProgress, setAnalyseProgress] = useState<Map<string, { step: number; phase: string; label: string; error?: string }>>(new Map());

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError("Please sign in to view leads"); setLoading(false); return; }

      const { data, error: fetchError } = await supabase
        .from("businesses")
        .select("id, name, business_type, address, city, place_id, website, website_status, rating, review_count, performance_score, design_score, audited_at, design_analyzed_at, discovered_at, flagged_for_outreach, outreach_reason")
        .eq("user_id", user.id)
        .order("discovered_at", { ascending: false });

      if (fetchError) { setError(fetchError.message); setLoading(false); return; }

      const { data: designRows } = await supabase
        .from("design_analyses").select("business_id, issues").eq("user_id", user.id);

      const issuesCountMap = new Map<string, number>();
      for (const row of designRows ?? []) {
        const issues = (row.issues as unknown[] | null) ?? [];
        issuesCountMap.set(row.business_id, (issuesCountMap.get(row.business_id) ?? 0) + issues.length);
      }

      setLeads((data ?? []).map((lead) => ({ ...lead, issues_count: issuesCountMap.get(lead.id) ?? 0, opportunity_score: (lead as Record<string, unknown>).opportunity_score as number | null ?? null })));

      const { data: pipelineRows } = await supabase
        .from("pipeline").select("business_id, status").eq("user_id", user.id);

      const pMap = new Map<string, string>();
      for (const row of pipelineRows ?? []) pMap.set(row.business_id, row.status);
      setPipelineMap(pMap);

      // Restore analysed set from business data (has both audit + design)
      const analysed = new Set<string>();
      for (const lead of data ?? []) {
        if (lead.audited_at && lead.design_analyzed_at) analysed.add(lead.id);
      }
      setAnalysedIds(analysed);

      setLoading(false);
    }
    init();
  }, [supabase]);

  /** Read NDJSON stream from a fetch Response, yielding progress events */
  const readStream = useCallback(async (
    res: Response,
    leadId: string,
    phase: string,
    onProgress: (stepIndex: number, key: string) => void,
  ): Promise<boolean> => {
    const reader = res.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let buffer = "";
    let hasQuotaError = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line);
          if (parsed.type === "progress" && parsed.step) {
            const key = parsed.step === "complete"
              ? (phase === "audit" ? "audit_complete" : "design_complete")
              : parsed.step;
            const idx = ANALYSE_STEPS.findIndex((s) => s.key === key);
            if (idx !== -1) onProgress(idx, key);
          } else if (parsed.type === "error" && parsed.error === "AI_QUOTA_EXCEEDED") {
            hasQuotaError = true;
          }
        } catch {
          // skip malformed lines
        }
      }
    }
    return hasQuotaError;
  }, []);

  // Combined Analyse handler (chains audit → analyse-design with NDJSON streaming)
  const handleAnalyse = useCallback(async (leadId: string, website: string) => {
    setAnalysingIds((prev) => new Set(prev).add(leadId));
    setAnalyseProgress((prev) => {
      const next = new Map(prev);
      next.set(leadId, { step: 0, phase: "audit", label: ANALYSE_STEPS[0].label });
      return next;
    });

    let quotaError = false;

    try {
      // ── Phase 1: /api/audit ──────────────────────────────────────────
      const auditRes = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: leadId, website, force: true }),
      });

      if (!auditRes.ok) throw new Error("Audit failed");

      quotaError = await readStream(auditRes, leadId, "audit", (idx, key) => {
        setAnalyseProgress((prev) => {
          const next = new Map(prev);
          next.set(leadId, { step: idx, phase: "audit", label: ANALYSE_STEPS[idx].label });
          return next;
        });
      });

      if (quotaError) {
        setAnalyseProgress((prev) => {
          const next = new Map(prev);
          next.set(leadId, { step: 0, phase: "audit", label: ANALYSE_STEPS[0].label, error: "AI quota exceeded — please wait a moment and try again" });
          return next;
        });
        return;
      }

      // ── Phase 2: /api/analyze-design ─────────────────────────────────
      const designRes = await fetch("/api/analyze-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: leadId, website, force: true }),
      });

      if (!designRes.ok) throw new Error("Design analysis failed");

      quotaError = await readStream(designRes, leadId, "design", (idx, key) => {
        setAnalyseProgress((prev) => {
          const next = new Map(prev);
          next.set(leadId, { step: idx, phase: "design", label: ANALYSE_STEPS[idx].label });
          return next;
        });
      });

      if (quotaError) {
        setAnalyseProgress((prev) => {
          const next = new Map(prev);
          next.set(leadId, { step: 0, phase: "design", label: ANALYSE_STEPS[0].label, error: "AI quota exceeded — please wait a moment and try again" });
          return next;
        });
        return;
      }

      // Both phases completed successfully
      setAnalysedIds((prev) => new Set(prev).add(leadId));
      setAnalyseProgress((prev) => {
        const next = new Map(prev);
        next.set(leadId, { step: ANALYSE_STEPS.length - 1, phase: "done", label: "Analysis complete" });
        return next;
      });
    } catch (err) {
      console.error("[LEADS] Analysis failed for", leadId, err);
      setAnalyseProgress((prev) => {
        const next = new Map(prev);
        next.set(leadId, { step: 0, phase: "error", label: "Analysis failed", error: err instanceof Error ? err.message : "Unknown error" });
        return next;
      });
    } finally {
      setAnalysingIds((prev) => {
        const next = new Set(prev);
        next.delete(leadId);
        return next;
      });
    }
  }, [readStream]);

  // ── Filtering + Smart Sorting ─────────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = [...leads];
    if (activeTab === "needs_improvement")  result = result.filter((l) => { const s = effectiveScore(l); return s !== null && s >= 40 && s <= 69; });
    else if (activeTab === "strong_opportunity") result = result.filter((l) => { const s = effectiveScore(l); return s !== null && s >= 70; });
    else if (activeTab === "contacted") result = result.filter((l) => { const s = pipelineMap.get(l.id); return s === "contacted" || s === "in_conversation"; });
    if (filterAudited) result = result.filter((l) => l.audited_at !== null);
    if (filterAnalysed) result = result.filter((l) => l.design_analyzed_at !== null);
    if (!includeArchived) result = result.filter((l) => { const s = pipelineMap.get(l.id); return !s || (s !== "won" && s !== "lost"); });
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((l) => l.name.toLowerCase().includes(q) || l.city?.toLowerCase().includes(q) || l.business_type?.toLowerCase().includes(q));
    }
    if (websiteFilter !== "all") result = result.filter((l) => l.website_status === websiteFilter);
    result = result.filter((l) => { const s = effectiveScore(l) ?? 0; return s >= scoreRange[0] && s <= scoreRange[1]; });

    // ★ Smart Sorting: default to "opportunity" (highest effective score first)
    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === "name") {
        cmp = a.name.localeCompare(b.name);
      } else if (sortBy === "score") {
        cmp = (effectiveScore(a) ?? -1) - (effectiveScore(b) ?? -1);
      } else if (sortBy === "opportunity") {
        // Sort by effective score descending (nulls last), then by flagged_for_outreach
        const aScore = effectiveScore(a);
        const bScore = effectiveScore(b);
        if (aScore === null && bScore === null) cmp = 0;
        else if (aScore === null) cmp = -1;
        else if (bScore === null) cmp = 1;
        else cmp = aScore - bScore;
        // Secondary sort: flagged businesses rise
        if (cmp === 0) cmp = (a.flagged_for_outreach ? 1 : 0) - (b.flagged_for_outreach ? 1 : 0);
      } else {
        cmp = new Date(a.discovered_at).getTime() - new Date(b.discovered_at).getTime();
      }
      return sortOrder === "asc" ? cmp : -cmp;
    });
    return result;
  }, [leads, activeTab, searchQuery, websiteFilter, scoreRange, sortBy, sortOrder, pipelineMap]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => { setSearchQuery(e.target.value); setPage(1); }, []);

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

  const needsImprovementCount = filtered.filter((l) => { const s = effectiveScore(l); return s !== null && s >= 40 && s <= 69; }).length;
  const strongCount           = filtered.filter((l) => { const s = effectiveScore(l); return s !== null && s >= 70; }).length;
  const contactedCount        = leads.filter((l) => { const s = pipelineMap.get(l.id); return s === "contacted" || s === "in_conversation"; }).length;

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

        {/* Stat strip */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { value: leads.length,         label: "Opportunities Spotted", valueClass: "text-[var(--text-primary)]" },
            { value: needsImprovementCount, label: "Needs Improvement",   valueClass: "text-[var(--score-mid)]" },
            { value: strongCount,           label: "Strong Signals",      valueClass: "text-[var(--score-good)]" },
            { value: contactedCount,        label: "Engaged",             valueClass: "text-[var(--accent)]" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4">
              <p className={`text-2xl font-bold ${s.valueClass}`}>{s.value}</p>
              <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs + filter toggle */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {TAB_OPTIONS.map((tab) => (
            <span key={tab.value} className="inline-flex items-center">
              <button
                onClick={() => { setActiveTab(tab.value); setPage(1); }}
                className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-150 ${
                  activeTab === tab.value
                    ? "bg-[var(--accent)] text-white"
                    : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
                }`}
              >
                {tab.label}
              </button>
              {tab.tooltip && (
                <TabTooltip text={tab.tooltip} />
              )}
            </span>
          ))}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`ml-auto cursor-pointer rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-150 ${
              showFilters
                ? "bg-[var(--accent)] text-white"
                : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]"
            }`}
          >
            <Filter className="mr-1.5 inline h-4 w-4" />Filters
          </button>
        </div>

        {/* Search + sort bar */}
        <div className="mb-4 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Search by name, city, or business type…"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] py-2.5 pl-10 pr-4 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] transition-colors duration-150 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
            <span>Sorted by</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-2.5 py-2 text-sm text-[var(--text-secondary)] outline-none focus:border-[var(--accent)]"
            >
              <option value="opportunity">Opportunity Score</option>
              <option value="score">Raw Score</option>
              <option value="name">Name</option>
              <option value="discovered_at">Discovered</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-2.5 py-2 text-xs text-[var(--text-secondary)] transition-colors duration-150 hover:bg-[var(--bg-surface)]"
            >
              {sortOrder === "desc" ? "↓ Desc" : "↑ Asc"}
            </button>
          </div>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="mb-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4">
            <div className="grid gap-4 sm:grid-cols-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-tertiary)]">Website</label>
                <select value={websiteFilter} onChange={(e) => setWebsiteFilter(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-secondary)] outline-none focus:border-[var(--accent)]">
                  {WEBSITE_FILTER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-tertiary)]">Order</label>
                <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-secondary)] outline-none focus:border-[var(--accent)]">
                  <option value="desc">Highest First</option>
                  <option value="asc">Lowest First</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-tertiary)]">
                  Sort by
                </label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-secondary)] outline-none focus:border-[var(--accent)]">
                  <option value="opportunity">Opportunity Score</option>
                  <option value="score">Raw Score</option>
                  <option value="name">Name</option>
                  <option value="discovered_at">Discovered</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-tertiary)]">
                  Score Range — {scoreRange[0]}–{scoreRange[1]}
                </label>
                <input type="range" min={0} max={100} value={scoreRange[0]}
                  onChange={(e) => setScoreRange([Number(e.target.value), scoreRange[1]])}
                  className="w-full accent-[var(--accent)]" />
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-[var(--border)] pt-4">
                <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filterAudited}
                    onChange={(e) => { setFilterAudited(e.target.checked); setPage(1); }}
                    className="accent-[var(--accent)] rounded"
                  />
                  Show only audited
                </label>
                <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filterAnalysed}
                    onChange={(e) => { setFilterAnalysed(e.target.checked); setPage(1); }}
                    className="accent-[var(--accent)] rounded"
                  />
                  Show only analysed
                </label>
                <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeArchived}
                    onChange={(e) => { setIncludeArchived(e.target.checked); setPage(1); }}
                    className="accent-[var(--accent)] rounded"
                  />
                  Include archived
                </label>
              </div>
            </div>
          </div>
        )}

        {/* ★ Opportunities Table */}
        {paginated.length === 0 ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]">
            <OpportunitiesEmptyState activeTab={activeTab} searchQuery={searchQuery} />
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--bg-elevated)]">
                      <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Score</th>
                      <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Business</th>
                      <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Website</th>
                      <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Last Analysed</th>
                      <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Status</th>
                      <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {paginated.map((lead) => {
                      const score = effectiveScore(lead);
                      const isAnalysing = analysingIds.has(lead.id);
                      const isAnalysed = analysedIds.has(lead.id);
                      const progress = analyseProgress.get(lead.id);
                      const hasError = progress?.error;
                      const isDone = isAnalysed && !isAnalysing;
                      const pipelineStatus = pipelineMap.get(lead.id);
                      const canAnalyse = lead.website && (lead.website_status === "has_website" || lead.website_status === "platform_only");
                      const isFullyAnalysed = lead.audited_at !== null && lead.design_analyzed_at !== null;

                      return (
                        <tr key={lead.id} className="transition-colors duration-150 hover:bg-[var(--bg-elevated)]">
                          {/* Score Ring */}
                          <td className="px-5 py-4">
                            <ScoreRing score={score} size={44} />
                          </td>

                          {/* Business: name + type + city */}
                          <td className="px-5 py-4">
                            <p className="font-medium text-[var(--text-primary)]">{lead.name}</p>
                            <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">{lead.business_type} · {lead.city}</p>
                          </td>

                          {/* Website Status */}
                          <td className="px-5 py-4">
                            <WebsiteBadge status={lead.website_status} />
                          </td>

                          {/* Last Analysed */}
                          <td className="px-5 py-4 text-sm text-[var(--text-secondary)]">
                            {formatDate(lead.audited_at ?? lead.design_analyzed_at)}
                          </td>

                          {/* Pipeline Status */}
                          <td className="px-5 py-4">
                            {pipelineStatus ? (
                              <span className="text-sm text-[var(--text-secondary)]">
                                {PIPELINE_LABELS[pipelineStatus] ?? pipelineStatus}
                              </span>
                            ) : (
                              <span className="text-sm text-[var(--text-tertiary)]">—</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-4">
                            <div className="flex flex-wrap items-center gap-2">
                              {/* Analyse button */}
                              {canAnalyse && !isFullyAnalysed ? (
                                isAnalysing ? (
                                  <span className="inline-flex items-center gap-1.5 text-xs text-[var(--accent)]">
                                    <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Analysing…
                                  </span>
                                ) : hasError ? (
                                  <button
                                    onClick={() => handleAnalyse(lead.id, lead.website!)}
                                    className="cursor-pointer rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20"
                                  >
                                    Retry
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleAnalyse(lead.id, lead.website!)}
                                    className="cursor-pointer rounded-lg border border-[var(--accent)]/30 bg-[var(--accent-tint)] px-2.5 py-1 text-xs font-medium text-[var(--accent)] transition-colors hover:bg-[var(--accent)] hover:text-white"
                                  >
                                    Analyse Opportunity
                                  </button>
                                )
                              ) : canAnalyse && isFullyAnalysed ? (
                                <button
                                  onClick={() => handleAnalyse(lead.id, lead.website!)}
                                  className="cursor-pointer rounded-lg border border-[var(--border)] px-2.5 py-1 text-xs font-medium text-[var(--text-tertiary)] transition-colors hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
                                >
                                  Re-analyse
                                </button>
                              ) : (
                                <span className="text-xs text-[var(--text-tertiary)]">—</span>
                              )}

                              {/* View button */}
                              <Link
                                href={`/dashboard/leads/${lead.id}`}
                                className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] px-2.5 py-1 text-xs font-medium text-[var(--text-tertiary)] transition-colors hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
                              >
                                <Eye className="h-3 w-3" />
                                View
                              </Link>
                            </div>

                            {/* Progress tooltip while analysing */}
                            {isAnalysing && progress && (
                              <div className="mt-2 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-2">
                                <div className="flex items-center gap-1.5">
                                  <svg className="h-3 w-3 animate-spin shrink-0 text-[var(--accent)]" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                  </svg>
                                  <span className="text-[11px] text-[var(--text-primary)]">{progress.label}</span>
                                </div>
                              </div>
                            )}

                            {/* Error message */}
                            {hasError && !isAnalysing && (
                              <p className="mt-1 text-[11px] text-red-400">{progress!.error}</p>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <p className="text-sm text-[var(--text-tertiary)]">
                  Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                </p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                    className="cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-2 text-[var(--text-secondary)] transition-colors duration-150 hover:bg-[var(--bg-surface)] disabled:cursor-not-allowed disabled:opacity-40">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="px-3 text-sm text-[var(--text-secondary)]">{page} / {totalPages}</span>
                  <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
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
