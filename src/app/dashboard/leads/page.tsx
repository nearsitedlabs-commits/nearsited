"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { ArrowLeft, Search, Filter, ChevronLeft, ChevronRight, Compass, Target, Lightbulb, Eye, Phone } from "lucide-react";
import type { WebsiteStatus } from "@/lib/types";
import { computeOpportunityScore } from "@/lib/scoring";
import { WebsiteBadge } from "@/components/ui/WebsiteBadge";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { PIPELINE_LABELS, PIPELINE_BADGE_STYLES } from "@/lib/ui-constants";

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
  phone: string | null;
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

type OpportunityTab = "all" | "no_website" | "has_website" | "social_platform" | "flagged";
type PipelineTab = "all_pipeline" | "pipeline_prospect" | "pipeline_contacted" | "pipeline_in_conversation" | "pipeline_won";
type TabFilter = OpportunityTab | PipelineTab;

const PAGE_SIZE = 25;

const OPPORTUNITY_FILTER_OPTIONS: { value: OpportunityTab; label: string }[] = [
  { value: "all",            label: "All" },
  { value: "no_website",     label: "No Website" },
  { value: "has_website",    label: "Has Website" },
  { value: "social_platform",label: "Social / Platform" },
  { value: "flagged",        label: "Flagged" },
];

const PIPELINE_FILTER_OPTIONS: { value: PipelineTab; label: string }[] = [
  { value: "all_pipeline",             label: "All Pipeline" },
  { value: "pipeline_prospect",        label: "Prospect" },
  { value: "pipeline_contacted",       label: "Contacted" },
  { value: "pipeline_in_conversation", label: "In Conversation" },
  { value: "pipeline_won",             label: "Won" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function effectiveOpportunityScore(lead: LeadRow): number {
  if (lead.opportunity_score != null) return lead.opportunity_score;
  const qualityScore = lead.performance_score ?? 50;
  return computeOpportunityScore(qualityScore, lead.review_count ?? 0, lead.rating ?? 0);
}

function effectiveScore(lead: LeadRow): number | null {
  return lead.performance_score ?? lead.design_score ?? null;
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

function getOpportunityContext(lead: LeadRow): { text: string; color: string } {
  if (lead.website_status === "no_website") {
    return { text: "No Website Opportunity", color: "text-[var(--score-high)]" };
  }
  if (lead.website_status === "social_only") {
    return { text: "Social Presence Opportunity", color: "text-[var(--score-mid)]" };
  }
  if (lead.website_status === "platform_only") {
    return { text: "Platform Dependency Opportunity", color: "text-[var(--text-tertiary)]" };
  }
  const oppScore = effectiveOpportunityScore(lead);
  if (oppScore >= 70) return { text: "High Website Opportunity",  color: "text-[var(--score-good)]" };
  if (oppScore >= 40) return { text: `+${oppScore} Opportunity`,  color: "text-[var(--score-mid)]" };
  return                     { text: "Low Website Opportunity",    color: "text-[var(--text-tertiary)]" };
}

// ── Sub-components ─────────────────────────────────────────────────────────────


/** Score column replacement for non-has_website leads — matches ScoreRing dimensions */
function WebPresenceBadge({ status }: { status: WebsiteStatus }) {
  const color =
    status === "no_website"    ? "var(--score-high)" :
    status === "social_only"   ? "var(--score-mid)" :
    status === "platform_only" ? "var(--badge-indigo-text)" :
    "var(--text-tertiary)";

  const R = 18;
  const DIM = 44;

  return (
    <svg width={DIM} height={DIM} viewBox={`0 0 ${DIM} ${DIM}`} className="flex-shrink-0">
      {/* Dashed track */}
      <circle
        cx="22" cy="22" r={R}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeDasharray="3 3"
        opacity="0.35"
      />
      {/* Dash symbol */}
      <text
        x="22" y="26" textAnchor="middle"
        fontSize="14" fontWeight="600"
        fill={color}
        fontFamily="var(--font-sans, Geist)"
      >
        —
      </text>
    </svg>
  );
}

/** Pipeline badge or "Not Tracked" fallback */
function PipelineStatusBadge({ status }: { status: string | undefined }) {
  if (!status) {
    return (
      <span className="inline-block whitespace-nowrap rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] px-2.5 py-1 text-[10px] font-medium text-[var(--text-tertiary)]">
        Not tracked
      </span>
    );
  }
  const badgeClass = PIPELINE_BADGE_STYLES[status] ?? "bg-[var(--bg-elevated)] text-[var(--text-tertiary)] border border-[var(--border)]";
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-medium ${badgeClass}`}>
      {PIPELINE_LABELS[status] ?? status}
    </span>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────

const EMPTY_MESSAGES: Record<TabFilter, { icon: typeof Compass; title: string; description: string }> = {
  all: {
    icon: Compass,
    title: "No opportunities yet",
    description: "Hidden revenue is waiting to be uncovered. Start your first discovery search to find local businesses with redesign potential.",
  },
  all_pipeline: {
    icon: Compass,
    title: "No leads in pipeline",
    description: "Add discovered opportunities to your pipeline to start tracking them from prospect to won deal.",
  },
  no_website: {
    icon: Lightbulb,
    title: "No leads without a website",
    description: "Discover businesses in your area to find opportunities with no web presence.",
  },
  has_website: {
    icon: Target,
    title: "No leads with a website",
    description: "Discover businesses that have a website you could audit and improve.",
  },
  social_platform: {
    icon: Target,
    title: "No social or platform-only leads",
    description: "Discover businesses whose only presence is a social profile or third-party platform.",
  },
  flagged: {
    icon: Lightbulb,
    title: "No flagged leads",
    description: "Leads flagged for outreach will appear here.",
  },
  pipeline_prospect: {
    icon: Target,
    title: "No prospects yet",
    description: "Add opportunities to your pipeline to start tracking progress.",
  },
  pipeline_contacted: {
    icon: Target,
    title: "No contacted leads",
    description: "Move leads through your pipeline to start tracking conversations.",
  },
  pipeline_in_conversation: {
    icon: Target,
    title: "No active conversations",
    description: "Leads marked In Conversation will appear here.",
  },
  pipeline_won: {
    icon: Lightbulb,
    title: "No won deals yet",
    description: "Keep working your pipeline — won deals will appear here.",
  },
};

function OpportunitiesEmptyState({ activeTab, searchQuery }: { activeTab: TabFilter; searchQuery: string }) {
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

  const [activeOpportunityTab, setActiveOpportunityTab] = useState<OpportunityTab>("all");
  const [activePipelineTab, setActivePipelineTab] = useState<PipelineTab>("all_pipeline");
  const [searchQuery, setSearchQuery] = useState("");
  const [scoreRange, setScoreRange] = useState<[number, number]>([0, 100]);
  const [sortBy, setSortBy] = useState<string>("opportunity");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showFilters, setShowFilters] = useState(false);
  const [filterAudited, setFilterAudited] = useState(false);
  const [filterAnalysed, setFilterAnalysed] = useState(false);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [page, setPage] = useState(() => {
    try { return parseInt(sessionStorage.getItem("nearsited_leads_page") ?? "1", 10); } catch { return 1; }
  });

  useEffect(() => {
    try { sessionStorage.setItem("nearsited_leads_page", page.toString()); } catch { /* ignore */ }
  }, [page]);

  const [analysingIds, setAnalysingIds] = useState<Set<string>>(new Set());
  const [analyseProgress, setAnalyseProgress] = useState<Map<string, { step: number; phase: string; label: string; error?: string }>>(new Map());

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError("Please sign in to view leads"); setLoading(false); return; }

      const { data, error: fetchError } = await supabase
        .from("businesses")
        .select("id, name, business_type, address, city, place_id, website, phone, website_status, rating, review_count, performance_score, design_score, opportunity_score, audited_at, design_analyzed_at, discovered_at, flagged_for_outreach, outreach_reason")
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

      setLeads((data ?? []).map((lead) => ({
        ...lead,
        phone: (lead as Record<string, unknown>).phone as string | null ?? null,
        issues_count: issuesCountMap.get(lead.id) ?? 0,
        opportunity_score: (lead as Record<string, unknown>).opportunity_score as number | null ?? null,
      })));

      const { data: pipelineRows } = await supabase
        .from("pipeline").select("business_id, status").eq("user_id", user.id);

      const pMap = new Map<string, string>();
      for (const row of pipelineRows ?? []) pMap.set(row.business_id, row.status);
      setPipelineMap(pMap);

      setLoading(false);
    }
    init();
  }, [supabase]);

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

  const handleAnalyse = useCallback(async (leadId: string, website: string) => {
    setAnalysingIds((prev) => new Set(prev).add(leadId));
    setAnalyseProgress((prev) => {
      const next = new Map(prev);
      next.set(leadId, { step: 0, phase: "audit", label: ANALYSE_STEPS[0].label });
      return next;
    });

    let quotaError = false;

    try {
      const auditRes = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: leadId, website, force: true }),
      });

      if (!auditRes.ok) throw new Error("Audit failed");

      quotaError = await readStream(auditRes, leadId, "audit", (idx) => {
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

      const designRes = await fetch("/api/analyze-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: leadId, website, force: true }),
      });

      if (!designRes.ok) throw new Error("Design analysis failed");

      quotaError = await readStream(designRes, leadId, "design", (idx) => {
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

    if (activeOpportunityTab === "no_website") {
      result = result.filter((l) => l.website_status === "no_website");
    } else if (activeOpportunityTab === "has_website") {
      result = result.filter((l) => l.website_status === "has_website");
    } else if (activeOpportunityTab === "social_platform") {
      result = result.filter((l) => l.website_status === "social_only" || l.website_status === "platform_only");
    } else if (activeOpportunityTab === "flagged") {
      result = result.filter((l) => l.flagged_for_outreach);
    }

    const PIPELINE_TAB_TO_STATUS: Record<string, string> = {
      pipeline_prospect:        "new_lead",
      pipeline_contacted:       "contacted",
      pipeline_in_conversation: "in_conversation",
      pipeline_won:             "won",
    };
    if (activePipelineTab === "all_pipeline") {
      result = result.filter((l) => pipelineMap.has(l.id));
    } else {
      const dbStatus = PIPELINE_TAB_TO_STATUS[activePipelineTab];
      result = result.filter((l) => dbStatus && pipelineMap.get(l.id) === dbStatus);
    }

    if (filterAudited)   result = result.filter((l) => l.audited_at !== null);
    if (filterAnalysed)  result = result.filter((l) => l.design_analyzed_at !== null);
    if (!includeArchived) result = result.filter((l) => { const s = pipelineMap.get(l.id); return !s || (s !== "won" && s !== "lost"); });
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((l) => l.name.toLowerCase().includes(q) || l.city?.toLowerCase().includes(q) || l.business_type?.toLowerCase().includes(q));
    }
    result = result.filter((l) => { const s = effectiveScore(l) ?? 0; return s >= scoreRange[0] && s <= scoreRange[1]; });

    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === "name") {
        cmp = a.name.localeCompare(b.name);
      } else if (sortBy === "score") {
        cmp = (effectiveScore(a) ?? -1) - (effectiveScore(b) ?? -1);
      } else if (sortBy === "opportunity") {
        cmp = effectiveOpportunityScore(a) - effectiveOpportunityScore(b);
        if (cmp === 0) cmp = (a.flagged_for_outreach ? 1 : 0) - (b.flagged_for_outreach ? 1 : 0);
      } else {
        cmp = new Date(a.discovered_at).getTime() - new Date(b.discovered_at).getTime();
      }
      return sortOrder === "asc" ? cmp : -cmp;
    });
    return result;
  }, [leads, activeOpportunityTab, activePipelineTab, searchQuery, scoreRange, sortBy, sortOrder, pipelineMap, filterAudited, filterAnalysed, includeArchived]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => { setSearchQuery(e.target.value); setPage(1); }, []);

  // ── KPI counts ────────────────────────────────────────────────────────────────
  const auditedCount      = leads.filter((l) => l.audited_at !== null).length;
  const readyToPitchCount = leads.filter((l) => l.flagged_for_outreach).length;
  const inPipelineCount   = pipelineMap.size;

  // ── Actions renderer (shared between table and mobile cards) ──────────────────
  function renderActions(lead: LeadRow) {
    const isAnalysing     = analysingIds.has(lead.id);
    const isFullyAnalysed = lead.audited_at !== null && lead.design_analyzed_at !== null;
    const progress        = analyseProgress.get(lead.id);
    const hasError        = !!progress?.error;
    const canAnalyse      = !!lead.website && (lead.website_status === "has_website" || lead.website_status === "platform_only");

    const viewBtn = (
      <Link
        href={`/dashboard/leads/${lead.id}`}
        className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] px-2.5 py-1 text-xs font-medium text-[var(--text-tertiary)] transition-colors hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
      >
        <Eye className="h-3 w-3" /> View
      </Link>
    );

    // Non-website lead types get fixed context-aware actions
    if (lead.website_status === "no_website") {
      return (
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/dashboard/leads/${lead.id}`}
            className="inline-flex items-center gap-1 rounded-lg bg-[var(--accent)] px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-[var(--accent-hover)]"
          >
            Generate Outreach
          </Link>
          {viewBtn}
        </div>
      );
    }

    if (lead.website_status === "social_only" || lead.website_status === "platform_only") {
      return (
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/dashboard/leads/${lead.id}`}
            className="inline-flex items-center gap-1 rounded-lg border border-[var(--accent)]/30 bg-[var(--accent-tint)] px-2.5 py-1 text-xs font-medium text-[var(--accent)] transition-colors hover:bg-[var(--accent)] hover:text-white"
          >
            Review Opportunity
          </Link>
          {viewBtn}
        </div>
      );
    }

    // has_website (or unknown) — inline analyse flow
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          {isAnalysing ? (
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
          ) : canAnalyse && !isFullyAnalysed ? (
            <button
              onClick={() => handleAnalyse(lead.id, lead.website!)}
              className="cursor-pointer rounded-lg border border-[var(--accent)]/30 bg-[var(--accent-tint)] px-2.5 py-1 text-xs font-medium text-[var(--accent)] transition-colors hover:bg-[var(--accent)] hover:text-white"
            >
              Analyse
            </button>
          ) : canAnalyse && isFullyAnalysed ? (
            <button
              onClick={() => handleAnalyse(lead.id, lead.website!)}
              className="cursor-pointer rounded-lg border border-[var(--border)] px-2.5 py-1 text-xs font-medium text-[var(--text-tertiary)] transition-colors hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
            >
              Re-analyse
            </button>
          ) : null}
          {viewBtn}
        </div>

        {/* Progress indicator */}
        {isAnalysing && progress && (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-2">
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
          <p className="text-[11px] text-red-400">{progress!.error}</p>
        )}
      </div>
    );
  }

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

        {/* KPI strip */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { value: leads.length,      label: "Total Opportunities", valueClass: "text-[var(--text-primary)]" },
            { value: auditedCount,      label: "Audited",             valueClass: "text-[var(--score-mid)]" },
            { value: readyToPitchCount, label: "Ready To Pitch",      valueClass: "text-[var(--score-good)]" },
            { value: inPipelineCount,   label: "In Pipeline",         valueClass: "text-[var(--accent)]" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4">
              <p className={`text-2xl font-bold ${s.valueClass}`}>{s.value}</p>
              <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Two-group filter bar */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {/* Group 1 — Opportunity quality */}
          <div className="flex flex-wrap items-center gap-1.5">
            {OPPORTUNITY_FILTER_OPTIONS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => { setActiveOpportunityTab(tab.value); setPage(1); }}
                className={`inline-flex cursor-pointer items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${
                  activeOpportunityTab === tab.value
                    ? "bg-[var(--accent)] text-white"
                    : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="hidden h-5 w-px bg-[var(--border)] sm:block" />

          {/* Group 2 — Pipeline stage */}
          <div className="flex flex-wrap items-center gap-1.5">
            {PIPELINE_FILTER_OPTIONS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => { setActivePipelineTab(tab.value); setPage(1); }}
                className={`cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${
                  activePipelineTab === tab.value
                    ? "bg-[var(--accent)] text-white"
                    : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Filters toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`ml-auto cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${
              showFilters
                ? "bg-[var(--accent)] text-white"
                : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]"
            }`}
          >
            <Filter className="mr-1.5 inline h-3.5 w-3.5" />Filters
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
              placeholder="Search businesses, cities, industries…"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] py-2.5 pl-10 pr-4 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] transition-colors duration-150 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
            <span className="hidden sm:inline">Sorted by</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-2.5 py-2 text-sm text-[var(--text-secondary)] outline-none focus:border-[var(--accent)]"
            >
              <option value="opportunity">Opportunity</option>
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

        {/* Advanced filter panel */}
        {showFilters && (
          <div className="mb-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-tertiary)]">Order</label>
                <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-secondary)] outline-none focus:border-[var(--accent)]">
                  <option value="desc">Highest First</option>
                  <option value="asc">Lowest First</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-tertiary)]">Sort by</label>
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
              <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-[var(--border)] pt-4 sm:col-span-4">
                {[
                  { checked: filterAudited,   onChange: setFilterAudited,   label: "Show only audited" },
                  { checked: filterAnalysed,  onChange: setFilterAnalysed,  label: "Show only analysed" },
                  { checked: includeArchived, onChange: setIncludeArchived, label: "Include archived" },
                ].map(({ checked, onChange, label }) => (
                  <label key={label} className="flex cursor-pointer items-center gap-2 text-xs text-[var(--text-secondary)]">
                    <input type="checkbox" checked={checked}
                      onChange={(e) => { onChange(e.target.checked); setPage(1); }}
                      className="accent-[var(--accent)] rounded" />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Results ──────────────────────────────────────────────────────────── */}
        {paginated.length === 0 ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]">
            <OpportunitiesEmptyState
              activeTab={activePipelineTab !== "all_pipeline" ? activePipelineTab : activeOpportunityTab}
              searchQuery={searchQuery}
            />
          </div>
        ) : (
          <>
            {/* ── Desktop table (hidden on mobile) ─────────────────────────────── */}
            <div className="hidden overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] md:block">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--bg-elevated)]">
                      <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Opportunity</th>
                      <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Business</th>
                      <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Website</th>
                      <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Last Analysed</th>
                      <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Status</th>
                      <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {paginated.map((lead) => {
                      const pipelineStatus = pipelineMap.get(lead.id);
                      const oppCtx         = getOpportunityContext(lead);
                      const showScoreRing  = lead.website_status === "has_website" || lead.website_status === "unknown";
                      const ringScore      = showScoreRing ? effectiveOpportunityScore(lead) : null;

                      return (
                        <tr key={lead.id} className="transition-colors duration-150 hover:bg-[var(--bg-elevated)]">

                          {/* Opportunity score ring / Web-presence badge */}
                          <td className="px-5 py-4">
                            {showScoreRing
                              ? <ScoreRing score={ringScore} size={52} variant={lead.audited_at ? "opportunity" : "estimate"} />
                              : <WebPresenceBadge status={lead.website_status} />
                            }
                          </td>

                          {/* Business name + type + city + opportunity context */}
                          <td className="px-5 py-4">
                            {/* dir="auto" enables correct RTL rendering for Arabic/Persian/Hebrew */}
                            <p dir="auto" className="font-medium text-[var(--text-primary)]">{lead.name}</p>
                            <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">{lead.business_type} · {lead.city}</p>
                            {lead.phone && (
                              <a href={`tel:${lead.phone}`} className="mt-0.5 inline-flex items-center gap-1 text-xs text-[var(--text-tertiary)] transition-colors hover:text-[var(--accent)]">
                                <Phone className="h-3 w-3" />{lead.phone}
                              </a>
                            )}
                            <p className={`mt-1 text-xs font-medium ${oppCtx.color}`}>{oppCtx.text}</p>
                          </td>

                          {/* Website status */}
                          <td className="px-5 py-4">
                            <WebsiteBadge status={lead.website_status} />
                          </td>

                          {/* Last analysed date */}
                          <td className="px-5 py-4 text-sm text-[var(--text-secondary)]">
                            {formatDate(lead.audited_at ?? lead.design_analyzed_at)}
                          </td>

                          {/* Pipeline status badge */}
                          <td className="px-5 py-4">
                            <PipelineStatusBadge status={pipelineStatus} />
                          </td>

                          {/* Context-aware actions */}
                          <td className="px-5 py-4">
                            {renderActions(lead)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Mobile card list (hidden on md+) ────────────────────────────── */}
            <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] md:hidden">
              <div className="divide-y divide-[var(--border)]">
                {paginated.map((lead) => {
                  const pipelineStatus = pipelineMap.get(lead.id);
                  const oppCtx         = getOpportunityContext(lead);
                  const showScoreRing  = lead.website_status === "has_website" || lead.website_status === "unknown";
                  const ringScore      = showScoreRing ? effectiveOpportunityScore(lead) : null;

                  return (
                    <div key={lead.id} className="p-4">
                      <div className="flex items-start gap-3">
                        {/* Opportunity score ring / Web-presence badge */}
                        <div className="flex-shrink-0 pt-0.5">
                          {showScoreRing
                            ? <ScoreRing score={ringScore} size={52} variant={lead.audited_at ? "opportunity" : "estimate"} />
                            : <WebPresenceBadge status={lead.website_status} />
                          }
                        </div>

                        <div className="min-w-0 flex-1">
                          {/* Business info */}
                          <p dir="auto" className="font-medium text-[var(--text-primary)]">{lead.name}</p>
                          <p className="text-xs text-[var(--text-tertiary)]">{lead.business_type} · {lead.city}</p>
                          {lead.phone && (
                            <a href={`tel:${lead.phone}`} className="inline-flex items-center gap-1 text-xs text-[var(--text-tertiary)] transition-colors hover:text-[var(--accent)]">
                              <Phone className="h-3 w-3" />{lead.phone}
                            </a>
                          )}
                          <p className={`mt-0.5 text-xs font-medium ${oppCtx.color}`}>{oppCtx.text}</p>

                          {/* Badges */}
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            <WebsiteBadge status={lead.website_status} />
                            <PipelineStatusBadge status={pipelineStatus} />
                          </div>

                          {/* Actions */}
                          <div className="mt-3">
                            {renderActions(lead)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
