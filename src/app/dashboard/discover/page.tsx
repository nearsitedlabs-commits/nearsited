"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { getOrderedCities } from "@/lib/data/cities";
import type { CityOption } from "@/lib/data/cities";
import { businessTypes } from "@/lib/data/businessTypes";
import {
  ArrowLeft,
  Info,
  ListFilter,
  MapPin,
  Search,
  ChevronDown,
  Shuffle,
  Building2,
  Globe,
  Compass,
} from "lucide-react";
import type { WebsiteStatus } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { WebsiteBadge } from "@/components/ui/WebsiteBadge";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { Toast } from "@/components/ui/Toast";
import { OUTREACH_REASONS } from "@/lib/ui-constants";
import { computeOpportunityScore, opportunityLabel, opportunityBadgeVariant } from "@/lib/scoring";

// ─── Types ───────────────────────────────────────────────────────────────────

type StrategyResult = {
  performance_score: number | null;
  seo_score?: number | null;
  fcp: string | null;
  lcp: string | null;
  tbt: string | null;
  cls: string | null;
  status: "ok" | "timeout" | "error";
};

type AuditResult = {
  mobile: StrategyResult;
  desktop: StrategyResult;
};

type BusinessResult = {
  id: string;
  name: string;
  address: string;
  place_id?: string;
  website?: string;
  rating?: number;
  review_count?: number;
  website_status: WebsiteStatus;
  website_url?: string;
  flagged_for_outreach?: boolean;
  outreach_reason?: string | null;
  audit?: AuditResult | null;
  business_type?: string;
  city?: string;
};

// ─── Session Storage Keys ────────────────────────────────────────────────────

const STORAGE_KEY_RESULTS = "nearsited_discover_results";
const STORAGE_KEY_PARAMS = "nearsited_discover_search_params";
const STORAGE_KEY_AUDITED = "nearsited_discover_audited";
const STORAGE_KEY_ANALYSED = "nearsited_discover_analysed";
const STORAGE_KEY_PIPELINE = "nearsited_discover_pipeline";

function saveToSession(key: string, data: unknown) {
  try {
    sessionStorage.setItem(key, JSON.stringify(data));
  } catch {}
}
function loadFromSession<T>(key: string): T | null {
  try {
    const d = sessionStorage.getItem(key);
    return d ? JSON.parse(d) : null;
  } catch {
    return null;
  }
}


// ─── Sort Options ────────────────────────────────────────────────────────────

type SortOption = {
  value: string;
  label: string;
};

const SORT_OPTIONS: SortOption[] = [
  { value: "opportunity-desc", label: "Opportunity (Highest First)" },
  { value: "opportunity-asc", label: "Opportunity (Lowest First)" },
  { value: "rating-desc", label: "Rating (High to Low)" },
  { value: "rating-asc", label: "Rating (Low to High)" },
  { value: "name-asc", label: "Name (A-Z)" },
  { value: "date-desc", label: "Most Recently Added" },
  { value: "outreach-first", label: "Flagged for Outreach First" },
];

// ─── Filter Tabs ─────────────────────────────────────────────────────────────

type FilterTab = {
  value: string;
  label: string;
};

const FILTER_TABS: FilterTab[] = [
  { value: "all", label: "All" },
  { value: "no_website", label: "Website Opportunity" },
  { value: "social_only", label: "Social Presence" },
  { value: "platform_only", label: "Platform Presence" },
  { value: "has_website", label: "Opportunity Found" },
];

const STATUS_BAR_COLOR: Record<string, string> = {
  has_website: "bg-[var(--badge-green-text)]",
  no_website: "bg-[var(--badge-red-text)]",
  social_only: "bg-[var(--badge-amber-text)]",
  platform_only: "bg-[var(--badge-indigo-text)]",
};

// ─── Muted reason tags when no audit/design actions are available ──────────

const NO_ACTION_LABEL: Record<string, string> = {
  no_website: "No site to audit",
  social_only: "Social profile only",
  platform_only: "Platform page only",
};

// ─── Fetch Persisted Audits ──────────────────────────────────────────────────

async function fetchPersistedAudits(
  businessIds: string[],
  supabase: SupabaseClient
): Promise<Map<string, AuditResult>> {
  const auditMap = new Map<string, AuditResult>();

  const { data: auditRows, error } = await supabase
    .from("audits")
    .select(
      "business_id, strategy, performance_score, seo_score, fcp, lcp, tbt, cls"
    )
    .in("business_id", businessIds)
    .order("created_at", { ascending: false });

  if (error || !auditRows) {
    console.log("[DISCOVER] Failed to fetch persisted audits:", error?.message);
    return auditMap;
  }

  const mobileMap = new Map<string, StrategyResult>();
  const desktopMap = new Map<string, StrategyResult>();

  for (const row of auditRows as Record<string, unknown>[]) {
    const bizId = row.business_id as string;
    const strategy = row.strategy as string;
    const result: StrategyResult = {
      performance_score: (row.performance_score as number | null) ?? null,
      seo_score: (row.seo_score as number | null) ?? null,
      fcp: (row.fcp as string | null) ?? null,
      lcp: (row.lcp as string | null) ?? null,
      tbt: (row.tbt as string | null) ?? null,
      cls: (row.cls as string | null) ?? null,
      status: "ok",
    };

    if (strategy === "mobile") {
      mobileMap.set(bizId, result);
    } else if (strategy === "desktop") {
      desktopMap.set(bizId, result);
    }
  }

  const allBizIds = new Set([...mobileMap.keys(), ...desktopMap.keys()]);
  for (const bizId of allBizIds) {
    auditMap.set(bizId, {
      mobile:
        mobileMap.get(bizId) ?? {
          performance_score: null,
          seo_score: null,
          fcp: null,
          lcp: null,
          tbt: null,
          cls: null,
          status: "error",
        },
      desktop:
        desktopMap.get(bizId) ?? {
          performance_score: null,
          seo_score: null,
          fcp: null,
          lcp: null,
          tbt: null,
          cls: null,
          status: "error",
        },
    });
  }

  return auditMap;
}

// ─── Utility: get label for business type value ─────────────────────────────

function getBusinessTypeLabel(value: string): string {
  const bt = businessTypes.find((t) => t.value === value);
  return bt?.label ?? value;
}

// ─── Utility: extract city from address ─────────────────────────────────────

function extractCity(address: string): string {
  return address?.split(",")[0]?.trim() ?? address;
}

// ─── MAIN PAGE COMPONENT ─────────────────────────────────────────────────────

export default function DiscoverPage() {
  // ── Form state ──
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedBusinessType, setSelectedBusinessType] = useState("");
  const [radiusMeters, setRadiusMeters] = useState(10000);

  // ── Auth state ──
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // ── Results state ──
  const [results, setResults] = useState<BusinessResult[]>([]);
  const [fetchingResults, setFetchingResults] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ── Progress tracking (single unified Map for Analyse Opportunity) ──
  const [analyseProgress, setAnalyseProgress] = useState<
    Map<string, { step: string; label: string; phase: "audit" | "design" | "done" | "error"; error?: string }>
  >(new Map());

  // ── Pipeline state ──
  const [pipelineLoadingId, setPipelineLoadingId] = useState<string | null>(
    null
  );

  // ── Persisted completion sets ──
  const [auditedIds, setAuditedIds] = useState<Set<string>>(new Set());
  const [analysedIds, setAnalysedIds] = useState<Set<string>>(new Set());
  const [pipelineIds, setPipelineIds] = useState<Set<string>>(new Set());

  // ── UI state ──
  const [websiteFilter, setWebsiteFilter] = useState<string>("all");
  const [sortOption, setSortOption] = useState<string>("rating-desc");
  const [visibleCount, setVisibleCount] = useState(50);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [cities, setCities] = useState<CityOption[]>([]);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [savedSearches, setSavedSearches] = useState<{ id: string; name: string; city: string; business_type: string; radius?: number }[]>([]);
  const [savedSearchesOpen, setSavedSearchesOpen] = useState(false);
  const savedSearchesRef = useRef<HTMLDivElement>(null);

  const supabase = createClient();
  const sortRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // ── Restore state from sessionStorage on mount ──
  useEffect(() => {
    async function init() {
      setLoadingAuth(true);

      // Restore cached results
      const cached = loadFromSession<BusinessResult[]>(STORAGE_KEY_RESULTS);
      if (cached && cached.length > 0) {
        setResults(cached);
        setVisibleCount(50);
      }

      // Restore search params
      const params = loadFromSession<{
        city: string;
        businessType: string;
        radius: number;
      }>(STORAGE_KEY_PARAMS);
      if (params) {
        setSelectedCity(params.city ?? "");
        setSelectedBusinessType(params.businessType ?? "");
        setRadiusMeters(params.radius ?? 10000);
      }

      // Restore completion state
      const audited = loadFromSession<string[]>(STORAGE_KEY_AUDITED);
      if (audited) setAuditedIds(new Set(audited));

      const analysed = loadFromSession<string[]>(STORAGE_KEY_ANALYSED);
      if (analysed) setAnalysedIds(new Set(analysed));

      const pipeline = loadFromSession<string[]>(STORAGE_KEY_PIPELINE);
      if (pipeline) setPipelineIds(new Set(pipeline));

      // Auth
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.getUser();
      if (authError) {
        setError("Unable to verify user. Please sign in again.");
      } else if (data?.user) {
        setUserId(data.user.id);
      }

      // Load saved searches
      try {
        const res = await fetch("/api/saved-searches");
        if (res.ok) {
          const data = await res.json();
          setSavedSearches(data.searches ?? []);
        }
      } catch {
        // non-critical
      }

      // Lazy-load cities (29 MB JSON loaded on first access, not at module level)
      try {
        const ordered = await getOrderedCities();
        setCities(ordered);
      } catch {
        // non-critical — city select will show empty state
      }

      setLoadingAuth(false);
    }

    init();
  }, []);

  // ── Close dropdowns on click outside ──
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortDropdownOpen(false);
      }
      if (savedSearchesRef.current && !savedSearchesRef.current.contains(e.target as Node)) {
        setSavedSearchesOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Compute flagged count ──
  const flaggedCount = useMemo(
    () => results.filter((b) => b.flagged_for_outreach === true).length,
    [results]
  );

  // ── Sort + filter results ──
  const processedResults = useMemo(() => {
    const filtered = results.filter((b) => {
      if (websiteFilter !== "all" && b.website_status !== websiteFilter)
        return false;
      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      switch (sortOption) {
        case "opportunity-desc":
        case "opportunity-asc": {
          // Compute effective opportunity score from audit or website status
          const aScore = a.audit?.mobile?.performance_score ?? null;
          const bScore = b.audit?.mobile?.performance_score ?? null;
          // Businesses with no website / social-only are high opportunity
          const aOpp = a.website_status === "no_website" || a.website_status === "social_only" ? 90
                     : a.website_status === "platform_only" ? 75
                     : aScore ?? 0;
          const bOpp = b.website_status === "no_website" || b.website_status === "social_only" ? 90
                     : b.website_status === "platform_only" ? 75
                     : bScore ?? 0;
          const cmp = aOpp - bOpp;
          return sortOption === "opportunity-desc" ? -cmp : cmp;
        }
        case "rating-asc":
          return (a.rating ?? 0) - (b.rating ?? 0);
        case "rating-desc":
          return (b.rating ?? 0) - (a.rating ?? 0);
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "outreach-first":
          if (a.flagged_for_outreach && !b.flagged_for_outreach) return -1;
          if (!a.flagged_for_outreach && b.flagged_for_outreach) return 1;
          return (b.rating ?? 0) - (a.rating ?? 0);
        case "date-desc":
        default:
          return 0;
      }
    });

    return sorted;
  }, [results, websiteFilter, sortOption]);

  // ── Randomize handler — picks random city + business type, then auto-searches ──
  const handleRandomize = useCallback(() => {
    if (cities.length === 0) return;
    const randomCity = cities[Math.floor(Math.random() * cities.length)];
    const randomType = businessTypes[Math.floor(Math.random() * businessTypes.length)];

    setSelectedCity(randomCity.value);
    setSelectedBusinessType(randomType.value);
  }, [cities]);

  // ── Analyse Opportunity handler (chains audit → design analysis) ──
  const handleAnalyseOpportunity = useCallback(
    async (businessId: string, website: string) => {
      setAnalyseProgress((prev) => {
        const next = new Map(prev);
        next.set(businessId, {
          step: "starting",
          label: "Starting opportunity analysis...",
          phase: "audit",
        });
        return next;
      });

      try {
        const decoder = new TextDecoder();

        // ── Phase 1: Audit ──
        const auditResponse = await fetch("/api/audit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ businessId, website, force: true }),
        });

        if (!auditResponse.ok) {
          const errData = await auditResponse.json().catch(() => null);
          throw new Error(errData?.error ?? "Audit request failed");
        }

        const auditReader = auditResponse.body!.getReader();
        let auditBuffer = "";
        let auditResultData: AuditResult | null = null;

        while (true) {
          const { done, value } = await auditReader.read();
          if (done) break;

          auditBuffer += decoder.decode(value, { stream: true });
          const lines = auditBuffer.split("\n");
          auditBuffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.trim()) continue;
            let chunk: Record<string, unknown>;
            try {
              chunk = JSON.parse(line);
            } catch {
              continue;
            }

            const type = chunk.type as string;
            if (type === "progress") {
              setAnalyseProgress((prev) => {
                const next = new Map(prev);
                next.set(businessId, {
                  step: chunk.step as string,
                  label: (chunk.label as string) ?? "",
                  phase: "audit",
                });
                return next;
              });
            } else if (type === "result") {
              auditResultData = {
                mobile: chunk.mobile as AuditResult["mobile"],
                desktop: chunk.desktop as AuditResult["desktop"],
              };
            } else if (type === "error") {
              throw new Error((chunk.message as string) ?? "Audit failed");
            }
          }
        }

        if (auditResultData) {
          setResults((prev) =>
            prev.map((b) =>
              b.id === businessId ? { ...b, audit: auditResultData! } : b
            )
          );
        }

        setAuditedIds((prev) => {
          const next = new Set(prev);
          next.add(businessId);
          saveToSession(STORAGE_KEY_AUDITED, [...next]);
          return next;
        });

        // ── Phase 2: Design Analysis ──
        setAnalyseProgress((prev) => {
          const next = new Map(prev);
          next.set(businessId, {
            step: "starting",
            label: "Starting design analysis...",
            phase: "design",
          });
          return next;
        });

        const designResponse = await fetch("/api/analyze-design", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ businessId, website, force: true }),
        });

        if (!designResponse.ok) {
          const errData = await designResponse.json().catch(() => null);
          throw new Error(errData?.error ?? "Design analysis request failed");
        }

        const designReader = designResponse.body!.getReader();
        let designBuffer = "";
        let designResultData: Record<string, unknown> | null = null;

        while (true) {
          const { done, value } = await designReader.read();
          if (done) break;

          designBuffer += decoder.decode(value, { stream: true });
          const lines = designBuffer.split("\n");
          designBuffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.trim()) continue;
            let chunk: Record<string, unknown>;
            try {
              chunk = JSON.parse(line);
            } catch {
              continue;
            }

            const type = chunk.type as string;
            if (type === "progress") {
              setAnalyseProgress((prev) => {
                const next = new Map(prev);
                next.set(businessId, {
                  step: chunk.step as string,
                  label: (chunk.label as string) ?? "",
                  phase: "design",
                });
                return next;
              });
            } else if (type === "result") {
              designResultData = chunk;
            } else if (type === "error") {
              throw new Error(
                (chunk.message as string) ?? "Design analysis failed"
              );
            }
          }
        }

        if (designResultData) {
          const mobile = designResultData.mobile as Record<string, unknown> | undefined;
          const desktop = designResultData.desktop as Record<string, unknown> | undefined;
          const score =
            (mobile?.design_score as number) ??
            (desktop?.design_score as number);

          if (score) {
            setResults((prev) =>
              prev.map((b) =>
                b.id === businessId ? { ...b, design_score: score } : b
              )
            );
          }

          if (mobile?.status === "error") {
            console.warn("[DISCOVER] Mobile design analysis warning:", mobile.error);
          }
          if (desktop?.status === "error") {
            console.warn("[DISCOVER] Desktop design analysis warning:", desktop.error);
          }
        }

        setAnalysedIds((prev) => {
          const next = new Set(prev);
          next.add(businessId);
          saveToSession(STORAGE_KEY_ANALYSED, [...next]);
          return next;
        });

        setAnalyseProgress((prev) => {
          const next = new Map(prev);
          next.set(businessId, {
            step: "done",
            label: "Analysis complete",
            phase: "done",
          });
          return next;
        });
      } catch (err) {
        const msg =
          err instanceof DOMException && err.name === "AbortError"
            ? "Request timed out (screenshots or AI took too long)"
            : err instanceof Error
            ? err.message
            : "Analysis failed";
        setAnalyseProgress((prev) => {
          const next = new Map(prev);
          next.set(businessId, {
            step: "error",
            label: msg,
            phase: "error",
            error: msg,
          });
          return next;
        });
      }
    },
    []
  );

  // ── Add to Pipeline handler ──
  const handleAddToPipeline = useCallback(
    async (businessId: string) => {
      if (!userId) return;

      setPipelineLoadingId(businessId);

      try {
        const response = await fetch("/api/pipeline", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ businessId }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error ?? "Failed to add to pipeline");
        }

        if (data.success === true || data.message === "Already in pipeline") {
          setPipelineIds((prev) => {
            const next = new Set(prev);
            next.add(businessId);
            saveToSession(STORAGE_KEY_PIPELINE, [...next]);
            return next;
          });
        } else {
          throw new Error(data?.message ?? "Failed to add to pipeline");
        }
      } catch (err) {
        console.error("Pipeline add error:", err);
      } finally {
        setPipelineLoadingId(null);
      }
    },
    [userId]
  );

  const handleRemoveFromPipeline = useCallback(
    async (businessId: string) => {
      if (!userId) return;

      setPipelineLoadingId(businessId);

      try {
        const response = await fetch("/api/pipeline", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ businessId }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error ?? "Failed to remove from pipeline");
        }

        if (data.success === true) {
          setPipelineIds((prev) => {
            const next = new Set(prev);
            next.delete(businessId);
            saveToSession(STORAGE_KEY_PIPELINE, [...next]);
            return next;
          });
        } else {
          throw new Error(data?.message ?? "Failed to remove from pipeline");
        }
      } catch (err) {
        console.error("Pipeline remove error:", err);
      } finally {
        setPipelineLoadingId(null);
      }
    },
    [userId]
  );

  // ── Submit handler ──
  const handleSubmit = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!userId) {
      setError("User must be signed in to search for businesses.");
      return;
    }

    if (!selectedCity || !selectedBusinessType) {
      setError("Please select both a city and a business type.");
      return;
    }

    // Save search params to sessionStorage
    saveToSession(STORAGE_KEY_PARAMS, {
      city: selectedCity,
      businessType: selectedBusinessType,
      radius: radiusMeters,
    });

    const cityOption = cities.find((c) => c.value === selectedCity);
    const cityQuery = cityOption?.label ?? selectedCity;

    const typeOption = businessTypes.find(
      (t) => t.value === selectedBusinessType
    );
    const typeQuery = typeOption?.value ?? selectedBusinessType;

    setFetchingResults(true);
    setSubmitting(true);

    let hasReceivedInitialResults = false;

    try {
      const response = await fetch("/api/discover", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          city: cityQuery,
          businessType: typeQuery,
          userId,
          radiusMeters,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(
          payload?.error ||
            payload?.details ||
            `Request failed (${response.status})`
        );
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;

          let chunk: Record<string, unknown>;
          try {
            chunk = JSON.parse(line);
          } catch {
            console.warn("[DISCOVER] Failed to parse NDJSON line:", line);
            continue;
          }

          const type = chunk.type as string;

          if (type === "progress") {
            console.log("[DISCOVER] Progress:", chunk.phase, chunk.detail);
            continue;
          }

          if (type === "results") {
            const initialBusinesses = (chunk.data as BusinessResult[]) ?? [];

            setResults(initialBusinesses);
            saveToSession(STORAGE_KEY_RESULTS, initialBusinesses);
            setVisibleCount(30);
            setFetchingResults(false);
            setSubmitting(false);
            hasReceivedInitialResults = true;
            continue;
          }

          if (type === "enrichment") {
            const updated =
              (chunk.updated as {
                id: string;
                website: string | null;
                website_status: string;
              }[]) ?? [];
            if (updated.length > 0) {
              setResults((prev) => {
                const updatedMap = new Map(updated.map((u) => [u.id, u]));
                return prev.map((b) => {
                  const enrichment = updatedMap.get(b.id);
                  if (enrichment) {
                    return {
                      ...b,
                      website: enrichment.website ?? b.website,
                      website_status:
                        enrichment.website_status as WebsiteStatus,
                    };
                  }
                  return b;
                });
              });
            }
            continue;
          }

          if (type === "done") {
            const doneBusinesses = (chunk.businesses as BusinessResult[]) ?? [];
            setResults(doneBusinesses);
            saveToSession(STORAGE_KEY_RESULTS, doneBusinesses);

            if (doneBusinesses.length > 0) {
              fetchPersistedAudits(
                doneBusinesses.map((b: BusinessResult) => b.id),
                supabase
              )
                .then((auditMap: Map<string, AuditResult>) => {
                  setResults((prev) =>
                    prev.map((b) => {
                      const persisted = auditMap.get(b.id);
                      if (persisted) return { ...b, audit: persisted };
                      return b;
                    })
                  );
                })
                .catch(() => {});
            }
            continue;
          }

          if (type === "error") {
            throw new Error(
              (chunk.message as string) ?? "An error occurred during discovery"
            );
          }
        }
      }

      if (!hasReceivedInitialResults) {
        setResults([]);
        setError("No businesses found in this area");
      }
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "An unexpected error occurred."
      );
      setResults([]);
    } finally {
      setFetchingResults(false);
      setSubmitting(false);
    }
  };

  // ── Save Search handler ──
  const handleSaveSearch = useCallback(
    async (name: string) => {
      if (!name || !selectedCity || !selectedBusinessType) return;

      try {
        const res = await fetch("/api/saved-searches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            city: selectedCity,
            businessType: selectedBusinessType,
            radius: radiusMeters,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error ?? "Failed to save search");
        }

        const result = await res.json();
        setShowSaveDialog(false);
        setToastMessage("Search saved successfully");

        // Add to local list immediately
        if (result.search) {
          setSavedSearches((prev) => [result.search, ...prev]);
        }

        // Re-fetch the full list
        const refreshRes = await fetch("/api/saved-searches");
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          setSavedSearches(data.searches ?? []);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to save search"
        );
      }
    },
    [selectedCity, selectedBusinessType, radiusMeters]
  );

  // ── Load a saved search ──
  const handleLoadSearch = useCallback(
    (search: { city: string; business_type: string; radius?: number }) => {
      setSelectedCity(search.city);
      setSelectedBusinessType(search.business_type);
      if (search.radius) setRadiusMeters(search.radius);
      setSavedSearchesOpen(false);
      // Auto-submit after a brief delay to let state settle
      setTimeout(() => formRef.current?.requestSubmit(), 50);
    },
    []
  );


  // ── Analyse Step List (unified progress for audit + design) ──
  const ANALYSE_STEPS: { key: string; label: string; phase: "audit" | "design" }[] = [
    { key: "fetching",           label: "Fetching site data",           phase: "audit" },
    { key: "mobile",             label: "Running Mobile PageSpeed",     phase: "audit" },
    { key: "desktop",            label: "Running Desktop PageSpeed",    phase: "audit" },
    { key: "audit_complete",     label: "Performance audit complete",   phase: "audit" },
    { key: "screenshot_mobile",  label: "Taking Mobile screenshot",     phase: "design" },
    { key: "screenshot_desktop", label: "Taking Desktop screenshot",    phase: "design" },
    { key: "analysing_mobile",   label: "Analysing Mobile design",      phase: "design" },
    { key: "analysing_desktop",  label: "Analysing Desktop design",     phase: "design" },
    { key: "design_complete",    label: "Analysis complete",            phase: "design" },
  ];

  // ── Progress bar animation style ──
  const progressBarStyle = (progressStep: string) => {
    const currentIdx = ANALYSE_STEPS.findIndex((s) => s.key === progressStep);
    const totalSteps = ANALYSE_STEPS.length;
    const pct = Math.min(95, Math.round(((currentIdx + 1) / totalSteps) * 100));
    return { width: `${pct}%` };
  };

  // ── RENDER ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8" style={{ background: "var(--bg-base)" }}>
      <div className="mx-auto w-full max-w-7xl space-y-5">

        {/* ── HEADER ── */}
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-tertiary)] transition-colors duration-150 hover:text-[var(--text-primary)] mb-4"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Link>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] font-medium text-[var(--text-tertiary)]">
                Opportunity Discovery
              </p>
              <h1 className="mt-1 text-3xl font-normal tracking-tight text-[var(--text-primary)]">
                Find businesses worth{" "}
                <em className="italic text-[var(--accent)]">reaching out to.</em>
              </h1>
            </div>
            <Link
              href="/dashboard/pipeline"
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] shadow-[var(--brand-shadow-sm)] transition-all duration-150 hover:shadow-[var(--brand-shadow-md)] hover:text-[var(--text-primary)]"
            >
              <ListFilter className="h-4 w-4" />
              View Pipeline →
            </Link>
          </div>
        </div>

        {/* ── SEARCH CARD ── */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-[var(--brand-shadow-sm)]">
          <form ref={formRef} onSubmit={handleSubmit}>
            <div className="flex flex-wrap gap-2.5 items-center min-w-0">
              <div className="relative flex-1 min-w-0">
                <label className="sr-only">City</label>
                <MapPin className="pointer-events-none absolute left-3.5 top-1/2 z-10 size-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
                <SearchableSelect
                  options={cities}
                  value={selectedCity}
                  onChange={setSelectedCity}
                  placeholder="City…"
                  displayKey="label"
                  valueKey="value"
                  inputClassName="!pl-10 !h-11 !rounded-xl !border-[var(--border)] !bg-[var(--bg-elevated)] !text-sm !text-[var(--text-primary)] !shadow-none placeholder:!text-[var(--text-tertiary)] !text-ellipsis !overflow-hidden !whitespace-nowrap"
                />
              </div>
              <div className="relative flex-1 min-w-0">
                <label className="sr-only">Business Type</label>
                <Building2 className="pointer-events-none absolute left-3.5 top-1/2 z-10 size-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
                <SearchableSelect
                  options={businessTypes}
                  value={selectedBusinessType}
                  onChange={setSelectedBusinessType}
                  placeholder="Business type…"
                  displayKey="label"
                  valueKey="value"
                  groupKey="category"
                  inputClassName="!pl-10 !h-11 !rounded-xl !border-[var(--border)] !bg-[var(--bg-elevated)] !text-sm !text-[var(--text-primary)] !shadow-none placeholder:!text-[var(--text-tertiary)] !text-ellipsis !overflow-hidden !whitespace-nowrap"
                />
              </div>
              <div className="flex-shrink-0 min-w-[160px]">
                <label className="mb-1 block text-[10px] uppercase tracking-[0.15em] font-medium text-[var(--text-tertiary)]">
                  Radius: {radiusMeters >= 1000 ? `${(radiusMeters / 1000).toFixed(0)} km` : `${radiusMeters} m`}
                </label>
                <input
                  type="range"
                  min={1000}
                  max={100000}
                  step={1000}
                  value={radiusMeters}
                  onChange={(e) => setRadiusMeters(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-[var(--bg-elevated)] accent-[var(--accent)] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--accent)] [&::-webkit-slider-thumb]:shadow-[var(--brand-shadow-sm)] [&::-webkit-slider-thumb]:cursor-pointer"
                />
              </div>
              <button
                type="submit"
                disabled={!!(submitting || loadingAuth)}
                className="inline-flex h-11 flex-shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 text-sm font-semibold text-white shadow-[var(--brand-shadow-sm)] transition-all duration-150 hover:bg-[var(--accent-hover)] hover:shadow-[var(--brand-shadow-md)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Search className="h-4 w-4" />
                {submitting ? "Finding…" : "Find Businesses"}
              </button>
              <button
                type="button"
                onClick={handleRandomize}
                disabled={!!(submitting || loadingAuth)}
                title="Random city + business type"
                className="inline-flex h-11 w-11 flex-shrink-0 cursor-pointer items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-tertiary)] transition-all duration-150 hover:border-[var(--accent)]/50 hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Shuffle className="h-4 w-4" />
              </button>
            </div>
          </form>

          <div className="mt-3 flex items-center gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => { if (!selectedCity || !selectedBusinessType) return; setShowSaveDialog(true); }}
                disabled={!selectedCity || !selectedBusinessType || submitting}
                className="cursor-pointer text-xs text-[var(--text-tertiary)] transition-colors hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                + Save this search
              </button>
              {savedSearches.length > 0 && (
                <div className="relative" ref={savedSearchesRef}>
                  <button
                    type="button"
                    onClick={() => setSavedSearchesOpen(!savedSearchesOpen)}
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
                            onClick={() => handleLoadSearch(s)}
                            className="w-full text-left px-3 py-2.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
                          >
                            <span className="font-medium text-[var(--text-primary)]">{s.name}</span>
                            <span className="ml-1.5 text-[var(--text-tertiary)]">
                              · {s.city} · {s.business_type}
                              {s.radius ? ` · ${s.radius >= 1000 ? `${(s.radius / 1000).toFixed(0)}km` : `${s.radius}m`}` : ""}
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

        {/* ── LOADING SKELETON ── */}
        {fetchingResults && (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden shadow-[var(--brand-shadow-sm)]">
            <div className="border-b border-[var(--border)] px-6 py-4">
              <div className="h-5 w-44 rounded-lg bg-[var(--bg-elevated)] animate-pulse" />
            </div>
            <div className="divide-y divide-[var(--border)]">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 min-h-[52px]">
                  {/* accent strip */}
                  <div className="w-[3px] self-stretch bg-[var(--bg-elevated)] animate-pulse" style={{ animationDelay: `${i * 0.05}s` }} />
                  {/* badge */}
                  <div className="w-[108px] flex-shrink-0">
                    <div className="h-[26px] w-[90px] rounded-lg animate-pulse" style={{ backgroundColor: `hsl(${i * 45 + 210}, 22%, 91%)`, animationDelay: `${i * 0.05}s` }} />
                  </div>
                  {/* name + meta */}
                  <div className="flex-1 space-y-2 py-3.5">
                    <div className="h-[14px] rounded-md bg-[var(--bg-elevated)] animate-pulse" style={{ width: `${48 + (i * 7) % 28}%`, animationDelay: `${i * 0.05 + 0.04}s` }} />
                    <div className="h-[11px] rounded-md bg-[var(--bg-elevated)] animate-pulse" style={{ width: `${32 + (i * 5) % 20}%`, animationDelay: `${i * 0.05 + 0.08}s` }} />
                  </div>
                  {/* links */}
                  <div className="w-[168px] flex-shrink-0 flex justify-end gap-2.5">
                    <div className="h-[15px] w-[15px] rounded bg-[var(--bg-elevated)] animate-pulse" />
                    <div className="h-[15px] w-[15px] rounded bg-[var(--bg-elevated)] animate-pulse" />
                  </div>
                  {/* actions */}
                  <div className="w-[216px] flex-shrink-0 flex items-center justify-end gap-2">
                    <div className="h-[30px] w-[120px] rounded-lg bg-[var(--bg-elevated)] animate-pulse" />
                    <div className="h-[30px] w-[90px] rounded-lg animate-pulse" style={{ backgroundColor: "hsl(240, 55%, 92%)" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── RESULTS ── */}
        {!fetchingResults && results.length > 0 && (
          <>
            {/* Summary + filter bar */}
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] px-5 py-3.5 shadow-[var(--brand-shadow-sm)]">
              <span className="flex items-baseline gap-1">
                <span className="text-2xl font-normal text-[var(--text-primary)]">{results.length}</span>
                <span className="text-sm text-[var(--text-secondary)]">business{results.length === 1 ? "" : "es"}</span>
              </span>

              {flaggedCount > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-tint)] px-2.5 py-1 text-xs font-semibold text-[var(--accent)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                  {flaggedCount} flagged for outreach
                  <span className="relative group inline-flex items-center">
                    <Info className="size-3 cursor-help opacity-60" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-[var(--bg-surface-3)] text-[var(--text-primary)] text-xs rounded-xl px-3 py-2.5 w-64 shadow-xl z-50 leading-relaxed pointer-events-none">
                      Businesses are flagged as outreach candidates when they have no website, rely only on social media or a third-party platform page, or score below 50 on performance or design after auditing.
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[var(--bg-surface-3)]" />
                    </div>
                  </span>
                </span>
              )}

              <div className="ml-auto flex items-center gap-2 flex-wrap">
                {/* Sort dropdown */}
                <div className="relative" ref={sortRef}>
                  <button
                    type="button"
                    onClick={() => setSortDropdownOpen((v) => !v)}
                    className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] transition-all duration-150 hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
                  >
                    Sort
                    <ChevronDown className={`h-3 w-3 transition-transform duration-150 ${sortDropdownOpen ? "rotate-180" : ""}`} />
                  </button>
                  {sortDropdownOpen && (
                    <div className="absolute right-0 top-full z-40 mt-1.5 w-52 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-[var(--brand-shadow-lg)] overflow-hidden">
                      {SORT_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => { setSortOption(opt.value); setSortDropdownOpen(false); }}
                          className={`cursor-pointer flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm transition-colors hover:bg-[var(--bg-elevated)] ${
                            sortOption === opt.value ? "font-semibold text-[var(--accent)]" : "text-[var(--text-secondary)]"
                          }`}
                        >
                          {sortOption === opt.value && (
                            <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--accent)]" />
                          )}
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Filter pills */}
                <div className="flex gap-1 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-1">
                  {FILTER_TABS.map((tab) => (
                    <button
                      key={tab.value}
                      type="button"
                      onClick={() => setWebsiteFilter(tab.value)}
                      className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 whitespace-nowrap ${
                        websiteFilter === tab.value
                          ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--brand-shadow-xs)] font-semibold"
                          : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Business rows */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-[var(--brand-shadow-sm)] overflow-hidden">
              <div>
                {processedResults.slice(0, visibleCount).map((business, idx) => {
                  const ap = analyseProgress.get(business.id);
                  const isAnalyseDone = auditedIds.has(business.id) && analysedIds.has(business.id);
                  const isInPipeline = pipelineIds.has(business.id);
                  const showAnalyseButton = business.website_status === "has_website" || business.website_status === "platform_only";
                  const isAnalyseLoading = ap && ap.phase !== "done" && ap.phase !== "error";
                  const cityDisplay = business.city ?? extractCity(business.address);
                  const typeDisplay = business.business_type ?? getBusinessTypeLabel(selectedBusinessType);

                  return (
                    <div
                      key={business.id}
                      className={`relative flex items-center gap-4 px-5 py-0 min-h-[52px] transition-colors duration-150 hover:bg-[var(--bg-elevated)] cursor-default ${
                        idx < Math.min(visibleCount, processedResults.length) - 1 ? "border-b border-[var(--border)]" : ""
                      }`}
                    >
                      {/* Left status accent strip — full row height */}
                      <div className={`w-[3px] self-stretch flex-shrink-0 ${STATUS_BAR_COLOR[business.website_status] ?? "bg-[var(--text-tertiary)]"}`} />

                      {/* Score ring — shows audit score when available */}
                      <ScoreRing
                        score={business.audit?.mobile?.performance_score ?? null}
                        size={44}
                      />

                      {/* Opportunity indicator badge */}
                      <div className="w-[130px] flex-shrink-0 flex items-center">
                        {(() => {
                          const score = business.audit?.mobile?.performance_score ?? null;
                          const oppScore = score != null
                            ? computeOpportunityScore(score, business.review_count ?? 0, business.rating ?? 0)
                            : 0;
                          const label = opportunityLabel(oppScore);
                          const variant = opportunityBadgeVariant(oppScore);
                          const colorMap: Record<string, string> = {
                            green:  "border-[var(--badge-green-border)] text-[var(--badge-green-text)] bg-[var(--badge-green-bg)]",
                            amber:  "border-[var(--badge-amber-border)] text-[var(--badge-amber-text)] bg-[var(--badge-amber-bg)]",
                            indigo: "border-[var(--badge-indigo-border)] text-[var(--badge-indigo-text)] bg-[var(--badge-indigo-bg)]",
                            red:    "border-[var(--badge-red-border)] text-[var(--badge-red-text)] bg-[var(--badge-red-bg)]",
                          };
                          const dotMap: Record<string, string> = {
                            green:  "bg-[var(--badge-green-text)]",
                            amber:  "bg-[var(--badge-amber-text)]",
                            indigo: "bg-[var(--badge-indigo-text)]",
                            red:    "bg-[var(--badge-red-text)]",
                          };
                          return (
                            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-medium whitespace-nowrap ${colorMap[variant] ?? ""}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${dotMap[variant] ?? ""}`} />
                              {label}
                            </span>
                          );
                        })()}
                      </div>

                      {/* Status badge — fixed width so name column never shifts */}
                      <div className="w-[90px] flex-shrink-0 flex items-center">
                        <WebsiteBadge status={business.website_status} />
                      </div>

                      {/* Name + meta — takes remaining space */}
                      <div className="flex-1 min-w-0 py-3.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[13px] font-medium tracking-[-0.01em] text-[var(--text-primary)] truncate leading-snug">
                            {business.name}
                          </span>
                          {business.rating != null && (
                            <span className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-secondary)] whitespace-nowrap shrink-0">
                              <span className="text-[var(--badge-amber-text)]">★</span>
                              {business.rating.toFixed(1)}
                              {business.review_count != null && business.review_count > 0 && (
                                <span className="text-[var(--text-tertiary)]">({business.review_count})</span>
                              )}
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 text-[11px] font-normal text-[var(--text-tertiary)] truncate tracking-wide">
                          {typeDisplay}{typeDisplay && cityDisplay ? " · " : ""}{cityDisplay}
                        </div>
                      </div>

                      {/* Outreach badge + icon links — fixed width, right-aligned */}
                      <div className="flex-shrink-0 w-[168px] flex items-center justify-end gap-3">
                        {business.flagged_for_outreach && business.outreach_reason !== business.website_status && (
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--accent)]/20 bg-[var(--accent-tint)] px-2 py-1 text-[11px] font-medium text-[var(--accent)] whitespace-nowrap">
                            <span className="h-1 w-1 rounded-full bg-[var(--accent)]" />
                            {business.outreach_reason ? (OUTREACH_REASONS[business.outreach_reason] ?? "Outreach") : "Outreach"}
                          </span>
                        )}
                        {/* Fixed-width icon container so MapPin stays in same column */}
                        <div className="flex items-center gap-2.5 w-[38px] justify-end">
                          {business.place_id ? (
                            <a
                              href={`https://www.google.com/maps/place/?q=place_id:${business.place_id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="cursor-pointer text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors duration-150 flex-shrink-0"
                              title="View on Google Maps"
                            >
                              <MapPin className="size-[15px]" />
                            </a>
                          ) : null}
                          {business.website ? (
                            <a
                              href={business.website}
                              target="_blank"
                              rel="noreferrer"
                              className="cursor-pointer text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors duration-150 flex-shrink-0"
                              title={business.website}
                            >
                              <Globe className="size-[15px]" />
                            </a>
                          ) : (
                            <div className="size-[15px]" /> /* invisible placeholder keeps MapPin aligned */
                          )}
                        </div>
                      </div>

                      {/* Action buttons — single Analyse Opportunity + Pipeline */}
                      <div className="flex-shrink-0 flex items-center justify-end gap-2" style={{ minWidth: isAnalyseLoading ? "320px" : "216px" }}>
                        {/* Analyse Opportunity */}
                        {(() => {
                          if (isAnalyseLoading) return (
                            <div className="w-[160px]">
                              <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-tertiary)] justify-center mb-1.5">
                                <div className="h-3 w-3 animate-spin rounded-full border-[1.5px] border-[var(--accent)] border-t-transparent" />
                                <span>Analysing…</span>
                              </div>
                              {/* Compact progress panel */}
                              <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-1.5">
                                <div className="space-y-0.5">
                                  {ANALYSE_STEPS.map((stepDef) => {
                                    const apStep = ap!.step;
                                    // Build completed set: keys up to and including the current step in the same phase
                                    const isDone = (() => {
                                      if (ap!.phase === "done") return true;
                                      if (ap!.phase === "audit" && stepDef.phase === "audit") {
                                        const phaseKeys = ANALYSE_STEPS.filter(s => s.phase === "audit").map(s => s.key);
                                        const currentIdx = phaseKeys.indexOf(apStep === "complete" ? "audit_complete" : apStep);
                                        const stepIdx = phaseKeys.indexOf(stepDef.key);
                                        return stepIdx <= currentIdx;
                                      }
                                      if (ap!.phase === "design" && stepDef.phase === "audit") return true;
                                      if (ap!.phase === "design" && stepDef.phase === "design") {
                                        const phaseKeys = ANALYSE_STEPS.filter(s => s.phase === "design").map(s => s.key);
                                        const currentIdx = phaseKeys.indexOf(apStep === "complete" ? "design_complete" : apStep);
                                        const stepIdx = phaseKeys.indexOf(stepDef.key);
                                        return stepIdx <= currentIdx;
                                      }
                                      return false;
                                    })();
                                    const isActive = !isDone && stepDef.key === apStep;

                                    return (
                                      <div key={stepDef.key} className="flex items-center gap-1.5">
                                        {isDone ? (
                                          <svg className="h-2.5 w-2.5 shrink-0 text-[var(--score-good)]" viewBox="0 0 12 12" fill="none"><path d="M2.5 6l2.5 2.5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                        ) : isActive ? (
                                          <div className="h-2.5 w-2.5 shrink-0 animate-spin rounded-full border-[1.5px] border-[var(--accent)] border-t-transparent" />
                                        ) : (
                                          <div className="h-2.5 w-2.5 shrink-0 rounded-full border border-[var(--border)]" />
                                        )}
                                        <span className={`text-[10px] leading-tight ${
                                          isDone ? "text-[var(--text-tertiary)] line-through" :
                                          isActive ? "font-medium text-[var(--text-primary)]" :
                                          "text-[var(--text-tertiary)]"
                                        }`}>
                                          {stepDef.label}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          );
                          if (ap?.phase === "error") return (
                            <button
                              type="button"
                              onClick={() => handleAnalyseOpportunity(business.id, business.website!)}
                              className="cursor-pointer text-[11px] px-2.5 py-1.5 rounded-lg border border-red-500/30 text-[var(--badge-red-text)] hover:bg-red-500/10 transition-colors duration-150 w-[120px] text-center"
                              title={ap.label}
                            >Retry</button>
                          );
                          if (isAnalyseDone) return (
                            <button
                              type="button"
                              onClick={() => handleAnalyseOpportunity(business.id, business.website!)}
                              className="cursor-pointer text-[11px] font-medium px-2.5 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]/40 hover:text-[var(--accent)] transition-all duration-150 w-[120px] text-center"
                            >Re-analyse</button>
                          );
                          if (showAnalyseButton) return (
                            <button
                              type="button"
                              onClick={() => handleAnalyseOpportunity(business.id, business.website!)}
                              className="cursor-pointer text-[11px] font-medium px-2.5 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]/40 hover:text-[var(--accent)] transition-all duration-150 w-[120px] text-center"
                            >Analyse Opportunity</button>
                          );
                          // No site to analyse — show muted reason tag
                          return (
                            <span className="text-[11px] italic text-[var(--text-tertiary)] w-[120px] text-center leading-tight">
                              {NO_ACTION_LABEL[business.website_status] ?? ""}
                            </span>
                          );
                        })()}

                        {/* Pipeline — always pinned right */}
                        {isInPipeline ? (
                          <button
                            type="button"
                            onClick={() => handleRemoveFromPipeline(business.id)}
                            disabled={pipelineLoadingId === business.id}
                            className="cursor-pointer text-[11px] font-medium px-3 py-1.5 rounded-lg border border-red-500 text-red-500 hover:bg-red-500/10 transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 w-[90px] text-center"
                          >
                            {pipelineLoadingId === business.id ? (
                              <span className="flex items-center justify-center gap-1.5">
                                <div className="h-3 w-3 animate-spin rounded-full border-[1.5px] border-red-500 border-t-transparent" />
                                Removing…
                              </span>
                            ) : "Remove"}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAddToPipeline(business.id)}
                            disabled={pipelineLoadingId === business.id}
                            className="cursor-pointer text-[11px] font-medium px-3 py-1.5 rounded-lg border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent-tint)] transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 w-[90px] text-center"
                          >
                            {pipelineLoadingId === business.id ? (
                              <span className="flex items-center justify-center gap-1.5">
                                <div className="h-3 w-3 animate-spin rounded-full border-[1.5px] border-[var(--accent)] border-t-transparent" />
                                Adding…
                              </span>
                            ) : "+ Add"}
                          </button>
                        )}
                      </div>

                      {/* Progress bar */}
                      {isAnalyseLoading && (
                        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--bg-elevated)]">
                          <div
                            className="h-full bg-[var(--accent)] transition-all duration-500 ease-out"
                            style={progressBarStyle(ap!.step)}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Load more */}
            {visibleCount < processedResults.length && (
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + 50)}
                  className="cursor-pointer inline-flex items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-6 py-2.5 text-sm font-medium text-[var(--text-secondary)] shadow-[var(--brand-shadow-sm)] transition-all duration-150 hover:shadow-[var(--brand-shadow-md)] hover:text-[var(--text-primary)]"
                >
                  Load more businesses ({processedResults.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </>
        )}

        {/* ── EMPTY STATE — no search yet ── */}
        {!fetchingResults && results.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] py-20 shadow-[var(--brand-shadow-sm)]">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-tint)]">
              <Compass className="h-6 w-6 text-[var(--accent)]" />
            </div>
            <h3 className="text-xl font-normal text-[var(--text-primary)] mb-1.5">Hidden revenue is waiting.</h3>
            <p className="text-xs text-[var(--text-tertiary)] max-w-xs text-center leading-relaxed">
              Every city has businesses with outdated websites, poor mobile performance, and no online presence. Pick a city and business type above to uncover redesign opportunities ready for outreach.
            </p>
          </div>
        )}

        {/* ── EMPTY STATE — no results ── */}
        {!fetchingResults && results.length === 0 && error && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] py-20 shadow-[var(--brand-shadow-sm)]">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--bg-elevated)]">
              <Compass className="h-6 w-6 text-[var(--text-tertiary)]" />
            </div>
            <h3 className="text-xl font-normal text-[var(--text-primary)] mb-1.5">No opportunities in this area.</h3>
            <p className="text-xs text-[var(--text-tertiary)] max-w-xs text-center leading-relaxed">
              Try a different city, expand your radius, or choose another business type. Undiscovered revenue is out there.
            </p>
          </div>
        )}
      </div>

      {/* ── SAVE SEARCH DIALOG ── */}
      {showSaveDialog && (
        <SaveSearchDialog
          onSave={handleSaveSearch}
          onCancel={() => setShowSaveDialog(false)}
        />
      )}

      {/* ── TOAST ── */}
      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      )}
    </div>
  );
}

// ─── Save Search Dialog Component ────────────────────────────────────────────

function SaveSearchDialog({
  onSave,
  onCancel,
}: {
  onSave: (name: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim());
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-[var(--brand-shadow-lg)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Save Search</h3>
        <p className="mt-1 text-xs text-[var(--text-tertiary)]">
          Give this search a name so you can find it later.
        </p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Dubai restaurants"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none transition-all placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-tint)]"
            autoComplete="off"
          />
          <p className="text-xs text-[var(--text-tertiary)]">
            Saved searches appear in Settings under Saved Searches.
          </p>
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="cursor-pointer rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-elevated)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="cursor-pointer rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Save Search
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
