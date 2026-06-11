"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { readNdjsonStream } from "@/lib/ndjson";
import { useToast } from "@/lib/shared-hooks";
import { businessTypes } from "@/lib/data/businessTypes";
import type { CityOption } from "@/lib/data/cities";
import { ListFilter, Loader2 } from "lucide-react";
import type { WebsiteStatus } from "@/lib/db-types";
import type { AuditRow } from "@/lib/db-types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Toast } from "@/components/ui/Toast";
import {
  estimatedOpportunity,
  computeOpportunityScore,
  blendQualityForOpportunity,
} from "@/lib/scoring";
import { PoweredByGoogle } from "@/components/ui/PoweredByGoogle";
import { motion, AnimatePresence } from "@/lib/motion";

import { DiscoverForm } from "./components/DiscoverForm";
import { ResultCard } from "./components/ResultCard";
import { SaveSearchDialog } from "./components/SaveSearchDialog";
import { LoadingSkeleton } from "./components/LoadingSkeleton";
import { EmptyState } from "./components/EmptyState";
import { ResultsFilterBar } from "./components/ResultsFilterBar";
import type { BusinessResult, AuditResult, StrategyResult } from "./components/types";

// ─── Session Storage ─────────────────────────────────────────────────────────

const SS = {
  RESULTS: "nearsited_discover_results",
  PARAMS: "nearsited_discover_search_params",
  AUDITED: "nearsited_discover_audited",
  ANALYSED: "nearsited_discover_analysed",
  PIPELINE: "nearsited_discover_pipeline",
};

function save(key: string, data: unknown, onQuota?: () => void) {
  try { sessionStorage.setItem(key, JSON.stringify(data)); }
  catch (err) {
    if (err instanceof DOMException && (err.name === "QuotaExceededError" || err.name === "NS_ERROR_DOM_QUOTA_REACHED")) onQuota?.();
  }
}
function load<T>(key: string): T | null {
  try { const d = sessionStorage.getItem(key); return d ? JSON.parse(d) : null; }
  catch { return null; }
}

// ─── Persisted Scores ────────────────────────────────────────────────────────

async function fetchPersistedData(
  ids: string[],
  sb: SupabaseClient
): Promise<{ audits: Map<string, AuditResult>; designScores: Map<string, number> }> {
  const [auditResp, designResp] = await Promise.all([
    sb.from("audits").select("business_id, strategy, performance_score, seo_score, fcp, lcp, tbt, cls").in("business_id", ids).order("created_at", { ascending: false }),
    sb.from("businesses").select("id, design_score").in("id", ids),
  ]);

  const audits = new Map<string, AuditResult>();
  if (!auditResp.error && auditResp.data) {
    const mobile = new Map<string, StrategyResult>(), desktop = new Map<string, StrategyResult>();
    for (const r of auditResp.data as AuditRow[]) {
      const s: StrategyResult = { performance_score: (r.performance_score as number) ?? null, seo_score: (r.seo_score as number) ?? null, fcp: (r.fcp as string) ?? null, lcp: (r.lcp as string) ?? null, tbt: (r.tbt as string) ?? null, cls: (r.cls as string) ?? null, status: "ok" };
      if (r.strategy === "mobile") mobile.set(r.business_id as string, s); else if (r.strategy === "desktop") desktop.set(r.business_id as string, s);
    }
    const empty = (): StrategyResult => ({ performance_score: null, seo_score: null, fcp: null, lcp: null, tbt: null, cls: null, status: "error" });
    for (const id of new Set([...mobile.keys(), ...desktop.keys()])) audits.set(id, { mobile: mobile.get(id) ?? empty(), desktop: desktop.get(id) ?? empty() });
  }

  const designScores = new Map<string, number>();
  if (!designResp.error && designResp.data) {
    for (const r of designResp.data as { id: string; design_score: number | null }[]) {
      if (r.design_score != null) designScores.set(r.id, r.design_score);
    }
  }

  return { audits, designScores };
}

// ─── Tier helpers ────────────────────────────────────────────────────────────

type TierKey = "high" | "medium" | "low";

const TIER_CONFIG: Record<TierKey, { label: string; color: string; bg: string; border: string; minScore: number }> = {
  high:   { label: "HIGH", color: "text-[var(--color-success)]", bg: "bg-[var(--color-success)]/10", border: "border-[var(--color-success)]/30", minScore: 70 },
  medium: { label: "MEDIUM", color: "text-[var(--color-info)]",  bg: "bg-[var(--color-info)]/10",  border: "border-[var(--color-info)]/30",  minScore: 45 },
  low:    { label: "LOW",  color: "text-[var(--score-high)]", bg: "bg-[var(--score-high-tint)]", border: "border-[var(--score-high)]/30", minScore: 0 },
};

const TIER_ORDER: TierKey[] = ["high", "medium", "low"];

function getTier(score: number): TierKey {
  if (score >= 70) return "high";
  if (score >= 45) return "medium";
  return "low";
}

function getEffectiveScore(business: BusinessResult): number {
  const mobilePf = business.audit?.mobile?.performance_score ?? null;
  const desktopPf = business.audit?.desktop?.performance_score ?? null;
  const designPf = business.design_score ?? null;
  const hasData = mobilePf != null || desktopPf != null || designPf != null;

  if (hasData) {
    return computeOpportunityScore(
      blendQualityForOpportunity(mobilePf, desktopPf, designPf),
      business.review_count ?? 0,
      business.rating ?? 0,
      business.business_type ?? undefined
    );
  }

  return estimatedOpportunity({
    website_status: business.website_status,
    website: business.website ?? null,
    rating: business.rating ?? null,
    user_ratings_total: business.review_count ?? null,
  });
}

function canAuditBusiness(business: BusinessResult): boolean {
  return business.website_status === "has_website" || business.website_status === "platform_only";
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function DiscoverPage() {
  const [city, setCity] = useState(""), [bizType, setBizType] = useState(""), [radius, setRadius] = useState(10000);
  const [loadingAuth, setLoadingAuth] = useState(true), [error, setError] = useState<string | null>(null), [userId, setUserId] = useState<string | null>(null);
  const [results, setResults] = useState<BusinessResult[]>([]), [fetching, setFetching] = useState(false), [submitting, setSubmitting] = useState(false);
  const [analyseProg, setAnalyseProg] = useState<Map<string, { step: string; label: string; phase: "audit" | "design" | "done" | "error"; error?: string }>>(new Map());
  const [pipeLoading, setPipeLoading] = useState<string | null>(null);
  const [audited, setAudited] = useState<Set<string>>(new Set()), [analysed, setAnalysed] = useState<Set<string>>(new Set()), [pipeline, setPipeline] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState("all"), [sort, setSort] = useState("score-desc"), [_visible, setVisible] = useState(50);
  const [showSave, setShowSave] = useState(false);
  const { toast: toastMsg, showToast, setToast } = useToast();
  const [cities, setCities] = useState<CityOption[]>([]), [cityQ, setCityQ] = useState("");
  const citiesFullRef = useRef<CityOption[]>([]);
  const [sortOpen, setSortOpen] = useState(false);
  const [saved, setSaved] = useState<{ id: string; name: string; city: string; business_type: string; radius?: number }[]>([]);
  const [savedOpen, setSavedOpen] = useState(false), [resKey, setResKey] = useState(0);
  const mounted = useRef(true), sortRef = useRef<HTMLDivElement>(null), formRef = useRef<HTMLFormElement>(null);
  const abortRef = useRef<Map<string, AbortController>>(new Map());
  const supabase = createClient();

  // Per-tier expanded state (show all rows when true)
  const [tierExpanded, setTierExpanded] = useState<Record<TierKey, boolean>>({ high: false, medium: false, low: false });

  useEffect(() => { return () => { mounted.current = false; }; }, []);

  // Init
  useEffect(() => {
    (async () => {
      setLoadingAuth(true);
      const cached = load<BusinessResult[]>(SS.RESULTS); if (cached?.length) { setResults(cached); setVisible(50); }
      const p = load<{ city: string; businessType: string; radius: number }>(SS.PARAMS);
      if (p) { setCity(p.city ?? ""); setBizType(p.businessType ?? ""); setRadius(p.radius ?? 10000); }
      const a = load<string[]>(SS.AUDITED); if (a) setAudited(new Set(a));
      const ad = load<string[]>(SS.ANALYSED); if (ad) setAnalysed(new Set(ad));
      const pl = load<string[]>(SS.PIPELINE); if (pl) setPipeline(new Set(pl));
      const sb = createClient(); const { data, error: ae } = await sb.auth.getUser();
      if (ae) setError("Unable to verify user. Please sign in again."); else if (data?.user) setUserId(data.user.id);
      try { const r = await fetch("/api/saved-searches"); if (r.ok) setSaved((await r.json()).searches ?? []); } catch {}
      try { const r = await fetch("/api/cities/search"); if (r.ok) { const data = (await r.json()).cities ?? []; setCities(data); citiesFullRef.current = data; } } catch {}
      setLoadingAuth(false);
    })();
  }, []);

  useEffect(() => {
    if (!cityQ) return;
    const lower = cityQ.toLowerCase();
    const localMatch = citiesFullRef.current.filter((c) =>
      c.label.toLowerCase().includes(lower)
    );
    if (localMatch.length > 0 && localMatch.length < 200) {
      setCities(localMatch);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/cities/search?q=${encodeURIComponent(cityQ)}`);
        if (r.ok && mounted.current) setCities((await r.json()).cities ?? []);
      } catch {}
    }, 250);
    return () => clearTimeout(t);
  }, [cityQ]);
  useEffect(() => { if (!cityQ && citiesFullRef.current.length > 0) { setCities(citiesFullRef.current); } }, [cityQ]);
  useEffect(() => { function h(e: MouseEvent) { if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false); } document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);

  // Hydrate audit + design scores from DB once userId resolves
  useEffect(() => {
    if (!userId || !results.length) return;
    fetchPersistedData(results.map((r) => r.id), supabase).then(({ audits, designScores }) => {
      if (!audits.size && !designScores.size) return;
      setResults((prev) => prev.map((r) => {
        const a = audits.get(r.id);
        const ds = designScores.get(r.id);
        if (!a && ds == null) return r;
        return { ...r, ...(a ? { audit: a } : {}), ...(ds != null ? { design_score: ds } : {}) };
      }));
      if (audits.size) setAudited((prev) => { const n = new Set(prev); for (const id of audits.keys()) n.add(id); return n; });
      if (designScores.size) setAnalysed((prev) => { const n = new Set(prev); for (const id of designScores.keys()) n.add(id); return n; });
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const resultsRef = useRef<typeof results>([]);
  useEffect(() => { resultsRef.current = results; }, [results]);

  // React immediately when analysis completes elsewhere
  useEffect(() => {
    const handler = (e: Event) => {
      const { businessId } = (e as CustomEvent<{ businessId: string }>).detail;
      if (!resultsRef.current.some((r) => r.id === businessId)) return;
      setAudited((prev) => new Set([...prev, businessId]));
      setAnalysed((prev) => new Set([...prev, businessId]));
      fetchPersistedData([businessId], supabase).then(({ audits, designScores }) => {
        setResults((prev) => prev.map((r) => {
          if (r.id !== businessId) return r;
          const a = audits.get(r.id); const ds = designScores.get(r.id);
          return { ...r, ...(a ? { audit: a } : {}), ...(ds != null ? { design_score: ds } : {}) };
        }));
      }).catch(() => {});
    };
    window.addEventListener("nearsited:analysis:completed", handler);
    return () => window.removeEventListener("nearsited:analysis:completed", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flagged = useMemo(() => results.filter((b) => b.flagged_for_outreach).length, [results]);

  // Compute effective score for each business and memoize
  const scoredResults = useMemo(() => {
    return results.map((b) => ({ business: b, score: getEffectiveScore(b) }));
  }, [results]);

  // Filter + sort
  const processed = useMemo(() => {
    const f = scoredResults.filter((sr) => filter === "all" || sr.business.website_status === filter);
    return [...f].sort((a, b) => {
      switch (sort) {
        case "reviews-desc":
          return (b.business.review_count ?? 0) - (a.business.review_count ?? 0);
        case "rating-desc":
          return (b.business.rating ?? 0) - (a.business.rating ?? 0);
        case "name-asc":
          return a.business.name.localeCompare(b.business.name);
        case "recency-desc":
          return 0; // preserves insertion order
        case "score-desc":
        default:
          return b.score - a.score;
      }
    });
  }, [scoredResults, filter, sort]);

  // Group into tiers
  const tiered = useMemo(() => {
    const groups: Record<TierKey, { business: BusinessResult; score: number }[]> = { high: [], medium: [], low: [] };
    for (const sr of processed) {
      const tier = getTier(sr.score);
      groups[tier].push(sr);
    }
    return groups;
  }, [processed]);

  const randomize = useCallback(() => { const pool = citiesFullRef.current; if (!pool.length) return; setCity(pool[Math.floor(Math.random() * pool.length)].value); setBizType(businessTypes[Math.floor(Math.random() * businessTypes.length)].value); }, []);

  const analyseOpp = useCallback(async (id: string, website: string) => {
    setAnalyseProg((p) => { const n = new Map(p); n.set(id, { step: "starting", label: "Starting audit…", phase: "audit" }); return n; });
    try {
      const ac = new AbortController(); abortRef.current.set(id, ac); const { signal } = ac;
      let auditData: AuditResult | null = null, designData: Record<string, unknown> | null = null, auditErr: string | null = null, designErr: string | null = null;
      const readStream = async (res: Response, onP: (s: string, l: string) => void, onR: (d: Record<string, unknown>) => void) => {
        const errs: string[] = []; await readNdjsonStream(res, { onProgress: (s, l) => { if (!signal.aborted) onP(s, l); }, onResult: (d) => { if (!signal.aborted) onR(d); }, onError: (m) => errs.push(m) }); if (errs.length) throw new Error(errs[0]);
      };
      const apr = fetch("/api/audit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businessId: id, website, force: true }), signal });
      const dpr = fetch("/api/analyze-design", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businessId: id, website, force: true }), signal });
      const ap = (async () => { try { const r = await apr; if (!r.ok) throw new Error((await r.json().catch(() => null))?.error ?? "Audit failed"); await readStream(r, (s, l) => { setAnalyseProg((p) => { const n = new Map(p); n.set(id, { step: s, label: l, phase: "audit" }); return n; }); }, (d) => { auditData = { mobile: d.mobile as AuditResult["mobile"], desktop: d.desktop as AuditResult["desktop"] }; }); if (auditData) { setResults((prev) => { const next = prev.map((b) => b.id === id ? { ...b, audit: auditData! } : b); save(SS.RESULTS, next, () => {}); return next; }); setAudited((a) => { const n = new Set(a); n.add(id); save(SS.AUDITED, [...n]); return n; }); } } catch (e) { auditErr = e instanceof Error ? e.message : "Audit failed"; } })();
      const dp = (async () => { try { const r = await dpr; if (!r.ok) throw new Error((await r.json().catch(() => null))?.error ?? "Design failed"); await readStream(r, (s, l) => { setAnalyseProg((p) => { const n = new Map(p); n.set(id, { step: s, label: l, phase: "design" }); return n; }); }, (d) => { designData = d; }); if (designData) { const dd = designData; const m = (dd as Record<string, unknown>).mobile as Record<string, unknown> | undefined; const dt = (dd as Record<string, unknown>).desktop as Record<string, unknown> | undefined; const sc = (m?.design_score as number) ?? (dt?.design_score as number); if (sc) setResults((r) => r.map((b) => b.id === id ? { ...b, design_score: sc } : b)); setAnalysed((a) => { const n = new Set(a); n.add(id); save(SS.ANALYSED, [...n]); return n; }); } } catch (e) { designErr = e instanceof Error ? e.message : "Design failed"; } })();
      await Promise.all([ap, dp]); if (!mounted.current) return;
      if (auditErr) throw new Error(auditErr);
      if (designErr) { console.warn("[DISCOVER] Design analysis failed (non-fatal):", designErr); showToast("Performance audit complete, but design analysis unavailable. Try again later."); setAnalysed((prev) => new Set(prev).add(id)); }
      setAnalyseProg((p) => { const n = new Map(p); n.set(id, { step: "done", label: "Analysis complete ✓", phase: "done" }); return n; });
      window.dispatchEvent(new CustomEvent("credits:updated"));
    } catch (e) { if (e instanceof DOMException && e.name === "AbortError") { abortRef.current.delete(id); return; } const m = e instanceof Error ? e.message : "Analysis failed"; setAnalyseProg((p) => { const n = new Map(p); n.set(id, { step: "error", label: m, phase: "error", error: m }); return n; }); }
    finally { abortRef.current.delete(id); }
  }, [showToast]);

  const addPipe = useCallback(async (id: string) => { if (!userId) return; setPipeLoading(id); try { const r = await fetch("/api/pipeline", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businessId: id }) }); const d = await r.json(); if (!r.ok) throw new Error(d?.error ?? "Failed"); if (d.success || d.message === "Already in pipeline") { setPipeline((p) => { const n = new Set(p); n.add(id); save(SS.PIPELINE, [...n]); return n; }); } else throw new Error(d?.message ?? "Failed"); } catch (e) { console.error("Pipeline add error:", e); } finally { setPipeLoading(null); } }, [userId]);
  const removePipe = useCallback(async (id: string) => { if (!userId) return; setPipeLoading(id); try { const r = await fetch("/api/pipeline", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businessId: id }) }); const d = await r.json(); if (!r.ok) throw new Error(d?.error ?? "Failed"); if (d.success) { setPipeline((p) => { const n = new Set(p); n.delete(id); save(SS.PIPELINE, [...n]); return n; }); } else throw new Error(d?.message ?? "Failed"); } catch (e) { console.error("Pipeline remove error:", e); } finally { setPipeLoading(null); } }, [userId]);
  const cancelAnalysis = useCallback((id: string) => { const c = abortRef.current.get(id); if (c) { c.abort(); abortRef.current.delete(id); } setAnalyseProg((p) => { const n = new Map(p); n.delete(id); return n; }); showToast("Analysis cancelled"); }, [showToast]);

  // ── Bulk actions ──
  const bulkAddToPipeline = useCallback(async (tier: TierKey) => {
    const ids = tiered[tier].map((sr) => sr.business.id).filter((id) => !pipeline.has(id));
    if (!ids.length) return;
    setPipeLoading("bulk-" + tier);
    let success = 0;
    for (const id of ids) {
      try {
        const r = await fetch("/api/pipeline", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businessId: id }) });
        const d = await r.json();
        if (d.success || d.message === "Already in pipeline") { setPipeline((p) => { const n = new Set(p); n.add(id); save(SS.PIPELINE, [...n]); return n; }); success++; }
      } catch { }
    }
    setPipeLoading(null);
    if (success > 0) showToast(`Added ${success} lead${success > 1 ? "s" : ""} to pipeline`);
  }, [tiered, pipeline, showToast]);

  const bulkAuditAll = useCallback(async (tier: TierKey) => {
    const auditables = tiered[tier].filter((sr) => canAuditBusiness(sr.business));
    let audited = 0;
    for (const { business } of auditables) {
      if (business.website) {
        await analyseOpp(business.id, business.website);
        audited++;
      }
    }
    if (audited > 0) showToast(`Started audit for ${audited} business${audited > 1 ? "es" : ""}`);
  }, [tiered, analyseOpp, showToast]);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault(); setError(null);
    if (!userId) { setError("User must be signed in."); return; }
    if (!city || !bizType) { setError("Please select both a city and a business type."); return; }
    save(SS.PARAMS, { city, businessType: bizType, radius });
    const cq = cities.find((c) => c.value === city)?.label ?? city;
    const tq = businessTypes.find((t) => t.value === bizType)?.value ?? bizType;
    setFetching(true); setSubmitting(true);
    let gotInit = false;
    try {
      const res = await fetch("/api/discover", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ city: cq, businessType: tq, radiusMeters: radius }) });
      if (!res.ok) {
        const p = await res.json().catch(() => null);
        if (res.status === 429 && p?.error === "Search limit reached") {
          throw new Error(`Monthly search limit reached (${p.searches_used}/${p.searches_limit} searches used). Upgrade your plan for more city searches.`);
        }
        throw new Error(p?.error || p?.details || `Failed (${res.status})`);
      }
      const reader = res.body!.getReader(); const dec = new TextDecoder(); let buf = "";
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        buf += dec.decode(value, { stream: true }); const lines = buf.split("\n"); buf = lines.pop() ?? "";
        for (const line of lines) { if (!line.trim()) continue; let ch: Record<string, unknown>; try { ch = JSON.parse(line); } catch { continue; }
          const t = ch.type as string;
          if (t === "progress") continue;
          if (t === "results") { const b = (ch.data as BusinessResult[]) ?? []; setResults(b); save(SS.RESULTS, b, () => showToast("Too many results to save locally.")); setVisible(30); setFetching(false); setSubmitting(false); setResKey((k) => k + 1); gotInit = true; continue; }
          if (t === "enrichment") { const upd = (ch.updated as { id: string; website: string | null; phone: string | null; website_status: string; flagged_for_outreach?: boolean }[]) ?? []; if (upd.length) { const m = new Map(upd.map((u) => [u.id, u])); setResults((pr) => pr.map((b) => { const e = m.get(b.id); return e ? { ...b, website: e.website ?? b.website, phone: e.phone ?? b.phone, website_status: e.website_status as WebsiteStatus, flagged_for_outreach: e.flagged_for_outreach ?? b.flagged_for_outreach } : b; })); } continue; }
          if (t === "done") { const b = (ch.businesses as BusinessResult[]) ?? []; setResults(b); save(SS.RESULTS, b, () => showToast("Too many results to save locally.")); if (b.length) fetchPersistedData(b.map((x) => x.id), supabase).then(({ audits, designScores }) => { setResults((pr) => pr.map((r) => { const a = audits.get(r.id); const ds = designScores.get(r.id); if (!a && ds == null) return r; return { ...r, ...(a ? { audit: a } : {}), ...(ds != null ? { design_score: ds } : {}) }; })); }).catch(() => {}); continue; }
          if (t === "error") throw new Error((ch.message as string) ?? "Error");
        }
      }
      if (!gotInit) { setResults([]); setError("No businesses found in this area"); }
    } catch (fe) { setError(fe instanceof Error ? fe.message : "Unexpected error"); setResults([]); }
    finally { setFetching(false); setSubmitting(false); }
  };

  const saveSearch = useCallback(async (name: string) => {
    if (!name || !city || !bizType) return;
    try { const r = await fetch("/api/saved-searches", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, city, businessType: bizType, radius }) }); if (!r.ok) throw new Error((await r.json().catch(() => null))?.error ?? "Failed"); setShowSave(false); showToast("Search saved successfully"); const rr = await fetch("/api/saved-searches"); if (rr.ok) setSaved((await rr.json()).searches ?? []); } catch (e) { setError(e instanceof Error ? e.message : "Failed to save search"); }
  }, [city, bizType, radius, showToast]);

  const loadSearch = useCallback((s: { city: string; business_type: string; radius?: number }) => { setCity(s.city); setBizType(s.business_type); if (s.radius) setRadius(s.radius); setSavedOpen(false); setTimeout(() => formRef.current?.requestSubmit(), 50); }, []);

  // ── Tier description helper ──
  const getTierDescription = useCallback((tier: TierKey): string => {
    const items = tiered[tier];
    if (!items.length) return "";
    const allNoWebsite = items.every((sr) => !canAuditBusiness(sr.business));
    const allHasWebsite = items.every((sr) => canAuditBusiness(sr.business));
    const minScore = TIER_CONFIG[tier].minScore;
    const maxScore = tier === "high" ? 100 : tier === "medium" ? 69 : 44;

    if (allNoWebsite) return `All no-website · Score ${minScore}+`;
    if (allHasWebsite) return `Has site · estimated ${minScore}-${maxScore}`;
    return `Mixed · Score ${minScore}-${maxScore}`;
  }, [tiered]);

  // ── Resolve labels from current search params ──
  const businessTypeLabel = businessTypes.find((t) => t.value === bizType)?.label ?? bizType;
  const locationLabel = cities.find((c) => c.value === city)?.label ?? city;

  return (
    <div className="min-h-screen bg-[var(--color-bg-page)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-5">
        <div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-normal tracking-tight text-[var(--color-text-primary)]">Find businesses worth reaching out to<em className="italic text-[var(--color-accent)]"></em></h1>
            </div>
            <Link href="/dashboard/pipeline" className="self-start inline-flex cursor-pointer items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] px-4 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] shadow-[var(--brand-shadow-sm)] transition-all duration-150 hover:shadow-[var(--brand-shadow-md)] hover:text-[var(--color-text-primary)] sm:self-auto"><ListFilter className="h-4 w-4" />View Pipeline →</Link>
          </div>
        </div>

        <DiscoverForm selectedCity={city} selectedBusinessType={bizType} radiusMeters={radius} submitting={submitting} loadingAuth={loadingAuth} error={error} cities={cities} savedSearches={saved} savedSearchesOpen={savedOpen}
          onCityChange={setCity} onBusinessTypeChange={setBizType} onRadiusChange={setRadius} onCitySearchChange={setCityQ} onSubmit={handleSubmit} onRandomize={randomize} onSaveSearchClick={() => { if (city && bizType) setShowSave(true); }}
          onLoadSearch={loadSearch} onSavedSearchesToggle={() => setSavedOpen((v) => !v)} />

        {fetching && <LoadingSkeleton />}

        {!fetching && results.length > 0 && (
          <>
            {/* Header strip + filter chips */}
            <ResultsFilterBar
              businessTypeLabel={businessTypeLabel}
              locationLabel={locationLabel}
              totalCount={results.length}
              flaggedCount={flagged}
              sortOption={sort}
              sortDropdownOpen={sortOpen}
              websiteFilter={filter}
              sortRef={sortRef}
              onSortChange={(v) => { setSort(v); setSortOpen(false); }}
              onSortToggle={() => setSortOpen((v) => !v)}
              onFilterChange={setFilter}
            />

            <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] shadow-[var(--brand-shadow-sm)] overflow-hidden">
              {/* Tiered list */}
              {TIER_ORDER.map((tier) => {
                const items = tiered[tier];
                if (!items.length) return null;
                const cfg = TIER_CONFIG[tier];
                const isExpanded = tierExpanded[tier];
                const displayItems = isExpanded ? items : items.slice(0, 5);
                const hidden = items.length - displayItems.length;
                const allCanAudit = items.some((sr) => canAuditBusiness(sr.business));
                const bulkLoading = pipeLoading === "bulk-" + tier;

                return (
                  <div key={tier}>
                    {/* Tier header */}
                    <div
                      className={`flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-4 md:px-5 py-2 sm:py-1.5 border-b border-[var(--color-border-subtle)] ${cfg.bg}`}
                      style={{ minHeight: "36px" }}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${cfg.color} ${cfg.bg} border ${cfg.border}`}
                        >
                          {cfg.label} · {items.length} lead{items.length > 1 ? "s" : ""}
                        </span>
                        <span className="text-[11px] text-[var(--color-text-tertiary)] hidden sm:inline">
                          {getTierDescription(tier)}
                        </span>
                      </div>

                      {/* Bulk action */}
                      <div className="flex items-center gap-2">
                        {allCanAudit ? (
                          <button
                            type="button"
                            onClick={() => bulkAuditAll(tier)}
                            disabled={bulkLoading}
                            className="inline-flex items-center gap-1 whitespace-nowrap text-[11px] font-medium h-7 px-2.5 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]/40 hover:text-[var(--color-accent)] transition-all duration-150 disabled:opacity-50 cursor-pointer"
                          >
                            {bulkLoading ? (
                              <Loader2 className="h-2.5 w-2.5 animate-spin" />
                            ) : null}
                            Audit all ({items.length} credits)
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => bulkAddToPipeline(tier)}
                            disabled={bulkLoading}
                            className="inline-flex items-center gap-1 whitespace-nowrap text-[11px] font-medium h-7 px-2.5 rounded-[var(--radius-sm)] border border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 transition-all duration-150 disabled:opacity-50 cursor-pointer"
                          >
                            {bulkLoading ? (
                              <Loader2 className="h-2.5 w-2.5 animate-spin" />
                            ) : null}
                            + All to pipeline
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Rows */}
                    <motion.div key={`${tier}-${resKey}`} initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.03 } } }}>
                      {displayItems.map((sr) => (
                        <ResultCard
                          key={sr.business.id}
                          business={sr.business}
                          analyseProgress={analyseProg}
                          auditedIds={audited}
                          analysedIds={analysed}
                          pipelineIds={pipeline}
                          pipelineLoadingId={pipeLoading}
                          selectedBusinessType={bizType}
                          onAnalyseOpportunity={analyseOpp}
                          onCancelAnalysis={cancelAnalysis}
                          onAddToPipeline={addPipe}
                          onRemoveFromPipeline={removePipe}
                        />
                      ))}
                    </motion.div>

                    {/* Collapse toggle */}
                    {hidden > 0 && (
                      <button
                        type="button"
                        onClick={() => setTierExpanded((prev) => ({ ...prev, [tier]: !isExpanded }))}
                        className="w-full flex items-center justify-center gap-1 px-4 py-1.5 text-[11px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-elevated)] transition-colors duration-150 border-b border-[var(--color-border-subtle)] cursor-pointer"
                      >
                        {isExpanded ? (
                          <>Show fewer</>
                        ) : (
                          <>+ {hidden} more in this tier</>
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between px-1">
              <p className="text-xs text-[var(--color-text-tertiary)]">No-website scores are estimated from reviews and ratings. Website leads show audit-based scores when available.</p>
              <PoweredByGoogle />
            </div>
          </>
        )}

        {!fetching && results.length === 0 && !error && <EmptyState type="no-search" />}
        {!fetching && results.length === 0 && error && <EmptyState type="no-results" />}
      </div>

      <AnimatePresence>
        {showSave && <SaveSearchDialog onSave={saveSearch} onCancel={() => setShowSave(false)} />}
      </AnimatePresence>
      {toastMsg && <Toast message={toastMsg} onClose={() => setToast(null)} />}
    </div>
  );
}
