"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { readNdjsonStream } from "@/lib/ndjson";
import { useToast } from "@/lib/shared-hooks";
import { businessTypes } from "@/lib/data/businessTypes";
import type { CityOption } from "@/lib/data/cities";
import { ArrowLeft, ListFilter, Compass } from "lucide-react";
import type { WebsiteStatus } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Toast } from "@/components/ui/Toast";
import { estimatedOpportunity, computeOpportunityScore } from "@/lib/scoring";
import { PoweredByGoogle } from "@/components/ui/PoweredByGoogle";
import { motion } from "framer-motion";

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

// ─── Persisted Audits ────────────────────────────────────────────────────────

async function fetchPersistedAudits(ids: string[], sb: SupabaseClient): Promise<Map<string, AuditResult>> {
  const map = new Map<string, AuditResult>();
  const { data, error } = await sb.from("audits").select("business_id, strategy, performance_score, seo_score, fcp, lcp, tbt, cls").in("business_id", ids).order("created_at", { ascending: false });
  if (error || !data) return map;
  const mobile = new Map<string, StrategyResult>(), desktop = new Map<string, StrategyResult>();
  for (const r of data as Record<string, unknown>[]) {
    const s: StrategyResult = { performance_score: (r.performance_score as number) ?? null, seo_score: (r.seo_score as number) ?? null, fcp: (r.fcp as string) ?? null, lcp: (r.lcp as string) ?? null, tbt: (r.tbt as string) ?? null, cls: (r.cls as string) ?? null, status: "ok" };
    if (r.strategy === "mobile") mobile.set(r.business_id as string, s); else if (r.strategy === "desktop") desktop.set(r.business_id as string, s);
  }
  const empty = (): StrategyResult => ({ performance_score: null, seo_score: null, fcp: null, lcp: null, tbt: null, cls: null, status: "error" });
  for (const id of new Set([...mobile.keys(), ...desktop.keys()])) map.set(id, { mobile: mobile.get(id) ?? empty(), desktop: desktop.get(id) ?? empty() });
  return map;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function DiscoverPage() {
  const [city, setCity] = useState(""), [bizType, setBizType] = useState(""), [radius, setRadius] = useState(10000);
  const [loadingAuth, setLoadingAuth] = useState(true), [error, setError] = useState<string | null>(null), [userId, setUserId] = useState<string | null>(null);
  const [results, setResults] = useState<BusinessResult[]>([]), [fetching, setFetching] = useState(false), [submitting, setSubmitting] = useState(false);
  const [analyseProg, setAnalyseProg] = useState<Map<string, { step: string; label: string; phase: "audit" | "design" | "done" | "error"; error?: string }>>(new Map());
  const [pipeLoading, setPipeLoading] = useState<string | null>(null);
  const [audited, setAudited] = useState<Set<string>>(new Set()), [analysed, setAnalysed] = useState<Set<string>>(new Set()), [pipeline, setPipeline] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState("all"), [sort, setSort] = useState("opportunity-desc"), [visible, setVisible] = useState(50);
  const [showSave, setShowSave] = useState(false);
  const { toast: toastMsg, showToast, setToast } = useToast();
  const [cities, setCities] = useState<CityOption[]>([]), [cityQ, setCityQ] = useState("");
  const [sortOpen, setSortOpen] = useState(false);
  const [saved, setSaved] = useState<{ id: string; name: string; city: string; business_type: string; radius?: number }[]>([]);
  const [savedOpen, setSavedOpen] = useState(false), [resKey, setResKey] = useState(0);
  const mounted = useRef(true), sortRef = useRef<HTMLDivElement>(null), formRef = useRef<HTMLFormElement>(null);
  const abortRef = useRef<Map<string, AbortController>>(new Map());
  const supabase = createClient();

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
      try { const r = await fetch("/api/cities/search"); if (r.ok) setCities((await r.json()).cities ?? []); } catch {}
      setLoadingAuth(false);
    })();
  }, []);

  useEffect(() => { if (!cityQ) return; const t = setTimeout(async () => { try { const r = await fetch(`/api/cities/search?q=${encodeURIComponent(cityQ)}`); if (r.ok && mounted.current) setCities((await r.json()).cities ?? []); } catch {} }, 150); return () => clearTimeout(t); }, [cityQ]);
  useEffect(() => { function h(e: MouseEvent) { if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false); } document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);

  const flagged = useMemo(() => results.filter((b) => b.flagged_for_outreach).length, [results]);

  const processed = useMemo(() => {
    const f = results.filter((b) => filter === "all" || b.website_status === filter);
    const score = (b: BusinessResult) => {
      const v = b.audit?.mobile?.performance_score;
      return v != null ? computeOpportunityScore(v, b.review_count ?? 0, b.rating ?? 0) : estimatedOpportunity({ website_status: b.website_status, website: b.website ?? null, rating: b.rating ?? null, user_ratings_total: b.review_count ?? null });
    };
    return [...f].sort((a, b) => {
      if (sort === "rating-desc") return (b.rating ?? 0) - (a.rating ?? 0);
      if (sort === "outreach-first") {
        if (a.flagged_for_outreach && !b.flagged_for_outreach) return -1;
        if (!a.flagged_for_outreach && b.flagged_for_outreach) return 1;
      }
      return score(b) - score(a);
    });
  }, [results, filter, sort]);

  const randomize = useCallback(() => { if (!cities.length) return; setCity(cities[Math.floor(Math.random() * cities.length)].value); setBizType(businessTypes[Math.floor(Math.random() * businessTypes.length)].value); }, [cities]);

  const analyseOpp = useCallback(async (id: string, website: string) => {
    setAnalyseProg((p) => { const n = new Map(p); n.set(id, { step: "starting", label: "Starting opportunity analysis...", phase: "audit" }); return n; });
    try {
      const ac = new AbortController(); abortRef.current.set(id, ac); const { signal } = ac;
      let auditData: AuditResult | null = null, designData: Record<string, unknown> | null = null, auditErr: string | null = null, designErr: string | null = null;
      const readStream = async (res: Response, onP: (s: string, l: string) => void, onR: (d: Record<string, unknown>) => void) => {
        const errs: string[] = []; await readNdjsonStream(res, { onProgress: (s, l) => { if (!signal.aborted) onP(s, l); }, onResult: (d) => { if (!signal.aborted) onR(d); }, onError: (m) => errs.push(m) }); if (errs.length) throw new Error(errs[0]);
      };
      const apr = fetch("/api/audit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businessId: id, website, force: true }), signal });
      const dpr = fetch("/api/analyze-design", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businessId: id, website, force: true }), signal });
      const ap = (async () => { try { const r = await apr; if (!r.ok) throw new Error((await r.json().catch(() => null))?.error ?? "Audit failed"); await readStream(r, (s, l) => { setAnalyseProg((p) => { const n = new Map(p); n.set(id, { step: s, label: l, phase: "audit" }); return n; }); }, (d) => { auditData = { mobile: d.mobile as AuditResult["mobile"], desktop: d.desktop as AuditResult["desktop"] }; }); if (auditData) { setResults((r) => r.map((b) => b.id === id ? { ...b, audit: auditData! } : b)); setAudited((a) => { const n = new Set(a); n.add(id); save(SS.AUDITED, [...n]); return n; }); } } catch (e) { auditErr = e instanceof Error ? e.message : "Audit failed"; } })();
      const dp = (async () => { try { const r = await dpr; if (!r.ok) throw new Error((await r.json().catch(() => null))?.error ?? "Design failed"); await readStream(r, (s, l) => { setAnalyseProg((p) => { const n = new Map(p); n.set(id, { step: s, label: l, phase: "design" }); return n; }); }, (d) => { designData = d; }); if (designData) { const dd = designData; const m = (dd as Record<string, unknown>).mobile as Record<string, unknown> | undefined; const dt = (dd as Record<string, unknown>).desktop as Record<string, unknown> | undefined; const sc = (m?.design_score as number) ?? (dt?.design_score as number); if (sc) setResults((r) => r.map((b) => b.id === id ? { ...b, design_score: sc } : b)); setAnalysed((a) => { const n = new Set(a); n.add(id); save(SS.ANALYSED, [...n]); return n; }); } } catch (e) { designErr = e instanceof Error ? e.message : "Design failed"; } })();
      await Promise.all([ap, dp]); if (!mounted.current) return;
      if (auditErr) throw new Error(auditErr);
      if (designErr) { console.warn("[DISCOVER] Design analysis failed (non-fatal):", designErr); showToast("Performance audit complete, but design analysis unavailable. Try again later."); }
      setAnalyseProg((p) => { const n = new Map(p); n.set(id, { step: "done", label: "Analysis complete", phase: "done" }); return n; });
    } catch (e) { if (e instanceof DOMException && e.name === "AbortError") { abortRef.current.delete(id); return; } const m = e instanceof Error ? e.message : "Analysis failed"; setAnalyseProg((p) => { const n = new Map(p); n.set(id, { step: "error", label: m, phase: "error", error: m }); return n; }); }
    finally { abortRef.current.delete(id); }
  }, [showToast]);

  const addPipe = useCallback(async (id: string) => { if (!userId) return; setPipeLoading(id); try { const r = await fetch("/api/pipeline", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businessId: id }) }); const d = await r.json(); if (!r.ok) throw new Error(d?.error ?? "Failed"); if (d.success || d.message === "Already in pipeline") { setPipeline((p) => { const n = new Set(p); n.add(id); save(SS.PIPELINE, [...n]); return n; }); } else throw new Error(d?.message ?? "Failed"); } catch (e) { console.error("Pipeline add error:", e); } finally { setPipeLoading(null); } }, [userId]);
  const removePipe = useCallback(async (id: string) => { if (!userId) return; setPipeLoading(id); try { const r = await fetch("/api/pipeline", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businessId: id }) }); const d = await r.json(); if (!r.ok) throw new Error(d?.error ?? "Failed"); if (d.success) { setPipeline((p) => { const n = new Set(p); n.delete(id); save(SS.PIPELINE, [...n]); return n; }); } else throw new Error(d?.message ?? "Failed"); } catch (e) { console.error("Pipeline remove error:", e); } finally { setPipeLoading(null); } }, [userId]);
  const cancelAnalysis = useCallback((id: string) => { const c = abortRef.current.get(id); if (c) { c.abort(); abortRef.current.delete(id); } setAnalyseProg((p) => { const n = new Map(p); n.delete(id); return n; }); showToast("Analysis cancelled"); }, [showToast]);

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
      const res = await fetch("/api/discover", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ city: cq, businessType: tq, userId, radiusMeters: radius }) });
      if (!res.ok) { const p = await res.json().catch(() => null); throw new Error(p?.error || p?.details || `Failed (${res.status})`); }
      const reader = res.body!.getReader(); const dec = new TextDecoder(); let buf = "";
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        buf += dec.decode(value, { stream: true }); const lines = buf.split("\n"); buf = lines.pop() ?? "";
        for (const line of lines) { if (!line.trim()) continue; let ch: Record<string, unknown>; try { ch = JSON.parse(line); } catch { continue; }
          const t = ch.type as string;
          if (t === "progress") continue;
          if (t === "results") { const b = (ch.data as BusinessResult[]) ?? []; setResults(b); save(SS.RESULTS, b, () => showToast("Too many results to save locally.")); setVisible(30); setFetching(false); setSubmitting(false); setResKey((k) => k + 1); gotInit = true; continue; }
          if (t === "enrichment") { const upd = (ch.updated as { id: string; website: string | null; phone: string | null; website_status: string }[]) ?? []; if (upd.length) { const m = new Map(upd.map((u) => [u.id, u])); setResults((pr) => pr.map((b) => { const e = m.get(b.id); return e ? { ...b, website: e.website ?? b.website, phone: e.phone ?? b.phone, website_status: e.website_status as WebsiteStatus } : b; })); } continue; }
          if (t === "done") { const b = (ch.businesses as BusinessResult[]) ?? []; setResults(b); save(SS.RESULTS, b, () => showToast("Too many results to save locally.")); if (b.length) fetchPersistedAudits(b.map((x) => x.id), supabase).then((m) => { setResults((pr) => pr.map((r) => { const p = m.get(r.id); return p ? { ...r, audit: p } : r; })); }).catch(() => {}); continue; }
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

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8" style={{ background: "var(--bg-base)" }}>
      <div className="mx-auto w-full max-w-7xl space-y-5">
        <div>
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-tertiary)] transition-colors duration-150 hover:text-[var(--text-primary)] mb-4"><ArrowLeft className="h-3.5 w-3.5" />Back</Link>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] font-medium text-[var(--text-tertiary)]">Opportunity Discovery</p>
              <h1 className="mt-1 text-3xl font-normal tracking-tight text-[var(--text-primary)]">Find businesses worth <em className="italic text-[var(--accent)]">reaching out to.</em></h1>
            </div>
            <Link href="/dashboard/pipeline" className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] shadow-[var(--brand-shadow-sm)] transition-all duration-150 hover:shadow-[var(--brand-shadow-md)] hover:text-[var(--text-primary)]"><ListFilter className="h-4 w-4" />View Pipeline →</Link>
          </div>
        </div>

        <DiscoverForm selectedCity={city} selectedBusinessType={bizType} radiusMeters={radius} submitting={submitting} loadingAuth={loadingAuth} error={error} cities={cities} savedSearches={saved} savedSearchesOpen={savedOpen}
          onCityChange={setCity} onBusinessTypeChange={setBizType} onRadiusChange={setRadius} onCitySearchChange={setCityQ} onSubmit={handleSubmit} onRandomize={randomize} onSaveSearchClick={() => { if (city && bizType) setShowSave(true); }}
          onLoadSearch={loadSearch} onSavedSearchesToggle={() => setSavedOpen((v) => !v)} />

        {fetching && <LoadingSkeleton />}

        {!fetching && results.length > 0 && (
          <>
            <ResultsFilterBar totalCount={results.length} flaggedCount={flagged} sortOption={sort} sortDropdownOpen={sortOpen} websiteFilter={filter} sortRef={sortRef}
              onSortChange={(v) => { setSort(v); setSortOpen(false); }} onSortToggle={() => setSortOpen((v) => !v)} onFilterChange={setFilter} />
            <div className="flex items-center justify-between px-1">
              <p className="text-xs text-[var(--text-tertiary)]">~ Estimated opportunity. Analyse any business for the verified opportunity score.</p>
              <PoweredByGoogle />
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-[var(--brand-shadow-sm)] overflow-hidden">
              <motion.div key={resKey} initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.04 } } }}>
                {processed.slice(0, visible).map((b, idx) => (
                  <div key={b.id} className={idx < Math.min(visible, processed.length) - 1 ? "border-b border-[var(--border)]" : ""}>
                    <ResultCard business={b} analyseProgress={analyseProg} auditedIds={audited} analysedIds={analysed} pipelineIds={pipeline} pipelineLoadingId={pipeLoading}
                      selectedBusinessType={bizType} onAnalyseOpportunity={analyseOpp} onCancelAnalysis={cancelAnalysis} onAddToPipeline={addPipe} onRemoveFromPipeline={removePipe} />
                  </div>
                ))}
              </motion.div>
            </div>
            {visible < processed.length && (
              <div className="flex justify-center">
                <button type="button" onClick={() => setVisible((p) => p + 50)} className="cursor-pointer inline-flex items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-6 py-2.5 text-sm font-medium text-[var(--text-secondary)] shadow-[var(--brand-shadow-sm)] transition-all duration-150 hover:shadow-[var(--brand-shadow-md)] hover:text-[var(--text-primary)]">
                  Load more businesses ({processed.length - visible} remaining)
                </button>
              </div>
            )}
          </>
        )}

        {!fetching && results.length === 0 && !error && <EmptyState type="no-search" />}
        {!fetching && results.length === 0 && error && <EmptyState type="no-results" />}
      </div>

      {showSave && <SaveSearchDialog onSave={saveSearch} onCancel={() => setShowSave(false)} />}
      {toastMsg && <Toast message={toastMsg} onClose={() => setToast(null)} />}
    </div>
  );
}
