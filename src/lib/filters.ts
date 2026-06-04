import { computeOpportunityScore } from "@/lib/scoring";

// ── Types ─────────────────────────────────────────────────────────────────────

export type SortOption =
  | "score_desc" | "score_asc"
  | "date_desc"  | "date_asc"
  | "health_desc"
  | "reviews_desc" | "reviews_asc";

export type FilterState = {
  scoreMin:      number;    // 0-100
  scoreMax:      number;    // 0-100
  healthMin:     number;    // 0-100
  healthMax:     number;    // 0-100
  websiteStatus: string[];  // [] = all
  industry:      string;    // "" = all
  city:          string;    // "" = all
  activity:      string;    // "all" | "active" | "moderate" | "low"
  dateRange:     string;    // "all" | "today" | "7d" | "30d"
  flaggedOnly:   boolean;
  auditedOnly:   boolean;
  sortBy:        SortOption;
};

export const DEFAULT_FILTERS: FilterState = {
  scoreMin:      0,
  scoreMax:      100,
  healthMin:     0,
  healthMax:     100,
  websiteStatus: [],
  industry:      "",
  city:          "",
  activity:      "all",
  dateRange:     "all",
  flaggedOnly:   false,
  auditedOnly:   false,
  sortBy:        "score_desc",
};

export function countActiveFilters(f: FilterState): number {
  let n = 0;
  if (f.scoreMin > 0 || f.scoreMax < 100)   n++;
  if (f.healthMin > 0 || f.healthMax < 100)  n++;
  if (f.websiteStatus.length > 0)            n++;
  if (f.industry)                            n++;
  if (f.city)                                n++;
  if (f.activity !== "all")                  n++;
  if (f.dateRange !== "all")                 n++;
  if (f.flaggedOnly)                         n++;
  if (f.auditedOnly)                         n++;
  return n;
}

// ── URL encode / decode ───────────────────────────────────────────────────────

export function filtersToParams(f: FilterState): URLSearchParams {
  const p = new URLSearchParams();
  if (f.scoreMin > 0 || f.scoreMax < 100)  p.set("score",    `${f.scoreMin}-${f.scoreMax}`);
  if (f.healthMin > 0 || f.healthMax < 100) p.set("health",  `${f.healthMin}-${f.healthMax}`);
  if (f.websiteStatus.length > 0)           p.set("status",  f.websiteStatus.join(","));
  if (f.industry)                           p.set("industry", f.industry);
  if (f.city)                               p.set("city",    f.city);
  if (f.activity !== "all")                 p.set("activity", f.activity);
  if (f.dateRange !== "all")                p.set("date",    f.dateRange);
  if (f.flaggedOnly)                        p.set("flagged", "1");
  if (f.auditedOnly)                        p.set("audited", "1");
  if (f.sortBy !== DEFAULT_FILTERS.sortBy)  p.set("sort",    f.sortBy);
  return p;
}

export function paramsToFilters(params: URLSearchParams): FilterState {
  const f = { ...DEFAULT_FILTERS };
  const score = params.get("score");
  if (score) { const [lo, hi] = score.split("-").map(Number); if (!isNaN(lo)) f.scoreMin = lo; if (!isNaN(hi)) f.scoreMax = hi; }
  const health = params.get("health");
  if (health) { const [lo, hi] = health.split("-").map(Number); if (!isNaN(lo)) f.healthMin = lo; if (!isNaN(hi)) f.healthMax = hi; }
  const status = params.get("status");
  if (status) f.websiteStatus = status.split(",").filter(Boolean);
  f.industry  = params.get("industry") ?? "";
  f.city      = params.get("city")     ?? "";
  f.activity  = params.get("activity") ?? "all";
  f.dateRange = params.get("date")     ?? "all";
  f.flaggedOnly = params.get("flagged") === "1";
  f.auditedOnly = params.get("audited") === "1";
  const sort = params.get("sort");
  if (sort) f.sortBy = sort as SortOption;
  return f;
}

// ── Apply filters to a lead list ──────────────────────────────────────────────

export type FilterableLead = {
  id: string;
  website_status: string | null;
  performance_score: number | null;
  design_score: number | null;
  opportunity_score: number | null;
  review_count: number | null;
  rating: number | null;
  business_type: string | null;
  city: string | null;
  flagged_for_outreach: boolean;
  audited_at: string | null;
  design_analyzed_at: string | null;
  discovered_at: string;
  name: string;
};

function effectiveOpportunity(lead: FilterableLead): number {
  if (lead.opportunity_score != null) return lead.opportunity_score;
  const q = lead.performance_score ?? lead.design_score ?? 50;
  return computeOpportunityScore(q, lead.review_count ?? 0, lead.rating ?? 0);
}

function effectiveHealth(lead: FilterableLead): number | null {
  return lead.performance_score ?? lead.design_score ?? null;
}

export function applyFilters<T extends FilterableLead>(
  leads: T[],
  filters: FilterState,
  searchQuery: string,
  pipelineMap?: Map<string, string>,
  activePipelineTab?: string,
): T[] {
  const now = Date.now();
  let result = [...leads];

  // Pipeline filter (separate concern, pass-through)
  if (activePipelineTab && activePipelineTab !== "all_pipeline") {
    const PIPELINE_STATUS: Record<string, string> = {
      pipeline_prospect: "new_lead",
      pipeline_contacted: "contacted",
      pipeline_in_conversation: "in_conversation",
      pipeline_won: "won",
    };
    const dbStatus = PIPELINE_STATUS[activePipelineTab];
    result = pipelineMap
      ? result.filter(l => dbStatus ? pipelineMap.get(l.id) === dbStatus : pipelineMap.has(l.id))
      : result;
  }

  // Website status
  if (filters.websiteStatus.length > 0) {
    result = result.filter(l => filters.websiteStatus.includes(l.website_status ?? ""));
  }

  // Opportunity score range
  result = result.filter(l => {
    const s = effectiveOpportunity(l);
    return s >= filters.scoreMin && s <= filters.scoreMax;
  });

  // Website health score range
  if (filters.healthMin > 0 || filters.healthMax < 100) {
    result = result.filter(l => {
      const h = effectiveHealth(l);
      if (h === null) return filters.healthMin === 0; // unaudited: show only if min is 0
      return h >= filters.healthMin && h <= filters.healthMax;
    });
  }

  // Industry
  if (filters.industry) {
    const q = filters.industry.toLowerCase();
    result = result.filter(l => (l.business_type ?? "").toLowerCase().includes(q));
  }

  // City
  if (filters.city) {
    const q = filters.city.toLowerCase();
    result = result.filter(l => (l.city ?? "").toLowerCase().includes(q));
  }

  // Activity level (derived from review_count)
  if (filters.activity !== "all") {
    result = result.filter(l => {
      const r = l.review_count ?? 0;
      if (filters.activity === "active")   return r >= 20;
      if (filters.activity === "moderate") return r >= 5 && r < 20;
      if (filters.activity === "low")      return r < 5;
      return true;
    });
  }

  // Date range (based on discovered_at)
  if (filters.dateRange !== "all") {
    const cutoff = {
      today: now - 24 * 60 * 60 * 1000,
      "7d":  now - 7  * 24 * 60 * 60 * 1000,
      "30d": now - 30 * 24 * 60 * 60 * 1000,
    }[filters.dateRange] ?? 0;
    result = result.filter(l => new Date(l.discovered_at).getTime() >= cutoff);
  }

  // Flagged for outreach
  if (filters.flaggedOnly) result = result.filter(l => l.flagged_for_outreach);

  // Audited only
  if (filters.auditedOnly) result = result.filter(l => l.audited_at !== null);

  // Search
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    result = result.filter(l =>
      l.name.toLowerCase().includes(q) ||
      (l.city ?? "").toLowerCase().includes(q) ||
      (l.business_type ?? "").toLowerCase().includes(q)
    );
  }

  // Sort
  result.sort((a, b) => {
    switch (filters.sortBy) {
      case "score_desc":    return effectiveOpportunity(b) - effectiveOpportunity(a);
      case "score_asc":     return effectiveOpportunity(a) - effectiveOpportunity(b);
      case "date_desc":     return new Date(b.discovered_at).getTime() - new Date(a.discovered_at).getTime();
      case "date_asc":      return new Date(a.discovered_at).getTime() - new Date(b.discovered_at).getTime();
      case "health_desc":   return (effectiveHealth(b) ?? -1) - (effectiveHealth(a) ?? -1);
      case "reviews_desc":  return (b.review_count ?? 0) - (a.review_count ?? 0);
      case "reviews_asc":   return (a.review_count ?? 0) - (b.review_count ?? 0);
      default:              return effectiveOpportunity(b) - effectiveOpportunity(a);
    }
  });

  return result;
}

// ── Analytics ─────────────────────────────────────────────────────────────────

type FilterEvent = "filter_opened" | "filter_applied" | "filter_reset" | "filter_removed" | "sort_changed";

export function trackFilter(event: FilterEvent, detail?: Record<string, unknown>) {
  // Swap for your real analytics service (Posthog, Mixpanel, etc.)
  if (process.env.NODE_ENV === "development") {
    console.log(`[FILTER] ${event}`, detail ?? "");
  }
}
