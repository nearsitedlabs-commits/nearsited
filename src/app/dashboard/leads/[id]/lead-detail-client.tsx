"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  motion,
  useReducedMotion,
} from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, ChevronDown, Copy, ExternalLink, Loader2, MapPin, Monitor, Smartphone, TrendingUp } from "lucide-react";
import { scoreLabel, computeOverall, uxDesignScore, trustScore, projection, computeOpportunityScore } from "@/lib/scoring";
import type { WebsiteStatus } from "@/lib/types";
import { MetricKey, METRIC_META, metricColor } from "@/lib/metric-meta";
import { PIPELINE_LABELS, PIPELINE_SALES_STATUSES } from "@/lib/ui-constants";
import PipelineSelect from "@/components/ui/PipelineSelect";
import { Toast } from "@/components/ui/Toast";
import { useToast } from "@/lib/shared-hooks";

// Extracted sub-components
import { ScoreRingWithLabel } from "./components/ScoreRingWithLabel";
import { SubScore } from "./components/SubScore";
import { ImpactPill } from "./components/ImpactPill";
import { buildClientCallSummary } from "./components/OpportunityBullets";
import { LeadHeroSection } from "./components/LeadHeroSection";
import { LeadOutreachSection } from "./components/LeadOutreachSection";
import { LeadExportSection } from "./components/LeadExportSection";
import { QuotaErrorBanner } from "./components/QuotaErrorBanner";
import { OpportunityScoreExplanation } from "./components/opportunity-score-explanation";

// ── Analysis progress steps ──────────────────────────────────────────────

const AUDIT_STEP_KEYS = ["fetching", "mobile", "desktop", "audit_complete"] as const;

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

type SavedPitch = { id: string; subject: string; body: string; tone: string };

type Props = {
  business: Record<string, unknown>;
  audits: Record<string, unknown>[];
  designAnalyses: Record<string, unknown>[];
  pipelineStatus: string | null;
  savedPitch: SavedPitch | null;
};

// ── Animation constants ───────────────────────────────────────────────────────

const EASE_OUT = [0.25, 0.1, 0.25, 1] as const;

const sectionContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const sectionCard = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE_OUT } },
};

const issueContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const issueItem = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: EASE_OUT } },
};

// ── Main Component ────────────────────────────────────────────────────────────

export default function LeadDetailClient({ business, audits, designAnalyses, pipelineStatus, savedPitch }: Props) {
  const { toast, showToast, setToast } = useToast();
  const [screenshotStrategy, setScreenshotStrategy] = useState<"mobile" | "desktop">("mobile");
  const [generatingPitch, setGeneratingPitch] = useState(false);
  const [pitchResult, setPitchResult] = useState<{ subject: string; body: string } | null>(
    savedPitch ? { subject: savedPitch.subject, body: savedPitch.body } : null,
  );
  const [pitchError, setPitchError] = useState<string | null>(null);
  const [pitchTone, setPitchTone] = useState<string>("professional");
  const [pitchLength, setPitchLength] = useState<string>("medium");
  const [pitchFocus, setPitchFocus] = useState("all");
  const [pitchOpening, setPitchOpening] = useState("direct");
  const [pitchUrgency, setPitchUrgency] = useState("medium");
  const [runningDesign, setRunningDesign] = useState(false);
  const [runningFullAnalysis, setRunningFullAnalysis] = useState(false);
  const [completedKeys, setCompletedKeys] = useState<string[]>([]);
  const [showAllIssues, setShowAllIssues] = useState(false);
  const [activeKeys, setActiveKeys] = useState<string[]>([]);
  const [currentPipelineStatus, setCurrentPipelineStatus] = useState<string | null>(pipelineStatus);
  const [designError, setDesignError] = useState<string | null>(null);
  const [quotaError, setQuotaError] = useState<string | null>(null);
  const [quotaRetryTimer, setQuotaRetryTimer] = useState(0);
  const shouldReduce = useReducedMotion();
  const [outreachChannel, setOutreachChannel] = useState<"email" | "whatsapp">("email");
  const [showTechDetails, setShowTechDetails] = useState(false);
  const [contactInfo, setContactInfo] = useState<{
    email: string | null;
    phone: string | null;
    loading: boolean;
  }>({ email: null, phone: null, loading: true });
  const [manualEmail, setManualEmail] = useState("");
  const quotaTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const router = useRouter();

  // ── Quota retry countdown ──
  const startQuotaTimer = useCallback((seconds: number) => {
    setQuotaRetryTimer(seconds);
    if (quotaTimerRef.current) clearInterval(quotaTimerRef.current);
    quotaTimerRef.current = setInterval(() => {
      setQuotaRetryTimer((prev) => {
        if (prev <= 1) {
          if (quotaTimerRef.current) clearInterval(quotaTimerRef.current);
          quotaTimerRef.current = null;
          setQuotaError(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const clearQuotaTimer = useCallback(() => {
    if (quotaTimerRef.current) {
      clearInterval(quotaTimerRef.current);
      quotaTimerRef.current = null;
    }
    setQuotaError(null);
    setQuotaRetryTimer(0);
  }, []);

  // Fetch contact info on mount
  useEffect(() => {
    const bizId = (business as Record<string, unknown>).id as string;
    if (!bizId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setContactInfo((prev) => ({ ...prev, loading: false }));
      return;
    }
    fetch(`/api/contact-info?businessId=${bizId}`)
      .then((res) => res.json())
      .then((data) => {
        setContactInfo({
          email: data.email ?? null,
          phone: data.phone ?? null,
          loading: false,
        });
      })
      .catch((err) => {
        console.error("[LEAD-DETAIL] contact-info fetch failed:", err);
        setContactInfo((prev) => ({ ...prev, loading: false }));
      });
  }, [business]);

  // Background rating refresh — fire-and-forget, never blocks render
  useEffect(() => {
    const bizId = (business as Record<string, unknown>).id as string | undefined;
    if (!bizId) return;
    fetch("/api/refresh-ratings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId: bizId }),
    }).catch((err) => {
      console.error("[LEAD-DETAIL] refresh-ratings failed:", err);
    });
  }, [business]);

  const biz = business as {
    id: string; name: string; business_type: string; address: string; city: string;
    place_id: string | null; website: string | null; website_status: WebsiteStatus;
    rating: number | null; review_count: number | null; performance_score: number | null;
    design_score: number | null; opportunity_score: number | null;
    audited_at: string | null; design_analyzed_at: string | null;
  };

  const mobileAudit   = audits?.find((a) => a.strategy === "mobile")  as Record<string, unknown> | undefined;
  const desktopAudit  = audits?.find((a) => a.strategy === "desktop") as Record<string, unknown> | undefined;
  const mobileDesign  = designAnalyses?.find((a) => a.strategy === "mobile")  as Record<string, unknown> | undefined;
  const desktopDesign = designAnalyses?.find((a) => a.strategy === "desktop") as Record<string, unknown> | undefined;

  const activeDesign = screenshotStrategy === "mobile" ? (mobileDesign ?? desktopDesign) : (desktopDesign ?? mobileDesign);

  const designScore      = biz.design_score ?? 0;
  const criteria         = activeDesign?.criteria_scores as Record<string, number> | undefined;
  const uxDesignScoreVal = criteria ? uxDesignScore(criteria as { modernity: number; readability: number; cta: number; hierarchy: number; trust: number }) : 0;
  const trustScoreVal    = criteria ? trustScore(criteria as { trust: number }) : 0;

  // Extract individual scores for both strategies
  const mobilePerfScore  = (mobileAudit?.performance_score  as number | null) ?? null;
  const desktopPerfScore = (desktopAudit?.performance_score as number | null) ?? null;

  const overall  = computeOverall({
    performance: desktopPerfScore ?? 0,
    seo:         (desktopAudit?.seo_score as number | null) ?? 0,
    mobile:      mobilePerfScore ?? 0,
    uxDesign:    uxDesignScoreVal,
    trust:       trustScoreVal,
  });

  const allIssues = [
    ...((mobileDesign?.issues  as { title: string; detail: string; point_deduction?: number; impact: "High" | "Medium" | "Low" }[]) ?? []),
    ...((desktopDesign?.issues as { title: string; detail: string; point_deduction?: number; impact: "High" | "Medium" | "Low" }[]) ?? []),
  ].slice(0, 5);

  const projScore = allIssues.length > 0 ? projection(overall, allIssues) : overall;
  const opportunityDelta = Math.max(0, projScore - overall);
  const effectiveOpportunityScore = biz.opportunity_score ??
    computeOpportunityScore(overall || biz.performance_score || biz.design_score || 50, biz.review_count ?? 0, biz.rating ?? 0);

  // Build concise client call summary
  const clientCallSummary = buildClientCallSummary(
    biz.name,
    biz.business_type ?? "business",
    biz.city,
    overall,
    projScore,
    opportunityDelta,
    allIssues as { title: string; detail: string; impact: string }[],
    mobilePerfScore,
    desktopPerfScore,
    biz.rating,
    biz.review_count,
  );

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleCopyToClipboard = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      showToast(`${label} copied to clipboard`);
    });
  }, [showToast]);

  const handlePipelineChange = useCallback(async (newStatus: string) => {
    const prevStatus = currentPipelineStatus;
    setCurrentPipelineStatus(newStatus);
    try {
      const res = await fetch("/api/pipeline", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: biz.id, status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error("[LEAD] Pipeline update failed:", data.error ?? res.status);
        setCurrentPipelineStatus(prevStatus);
        showToast("Failed to update pipeline status");
      }
    } catch (err) {
      console.error("[LEAD] Pipeline update network error:", err);
      setCurrentPipelineStatus(prevStatus);
      showToast("Network error — could not update pipeline");
    }
  }, [biz.id, currentPipelineStatus, showToast]);

  const handleGeneratePitch = useCallback(async () => {
    setGeneratingPitch(true);
    setPitchError(null);
    try {
      console.log("[LEAD] Generating pitch:", { businessId: biz.id, tone: pitchTone, length: pitchLength, channel: outreachChannel, website_status: biz.website_status });
      const res = await fetch("/api/pitch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: biz.id, tone: pitchTone, length: pitchLength, channel: outreachChannel, lead_type: biz.website_status, focus: pitchFocus, opening: pitchOpening, urgency: pitchUrgency }),
      });
      if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        setQuotaError("AI quota exceeded — please wait a moment and try again");
        startQuotaTimer(data.retryAfter ?? 60);
        return;
      }
      const data = await res.json();
      if (data.success && data.pitch && typeof data.pitch.subject === "string" && typeof data.pitch.body === "string") {
        setPitchResult({ subject: data.pitch.subject, body: data.pitch.body });
      } else if (data.success && data.pitch) {
        console.warn("[LEAD] Pitch API returned unexpected format:", data.pitch);
        setPitchError("Pitch data format error — please try again.");
      } else {
        setPitchError(data.error ?? data.message ?? "Pitch generation failed. Please try again.");
      }
    } catch (err) {
      console.error("[LEAD] Pitch generation failed:", err);
      setPitchError("Network error — please check your connection and try again.");
    } finally {
      setGeneratingPitch(false);
    }
  }, [biz.id, biz.website_status, pitchTone, pitchLength, outreachChannel, pitchFocus, pitchOpening, pitchUrgency, startQuotaTimer]);

  const handleCopyPitch = useCallback(() => {
    if (!pitchResult) {
      showToast("Generate a pitch first");
      return;
    }
    navigator.clipboard.writeText(pitchResult.body).then(() => {
      showToast("Pitch copied to clipboard");
    });
  }, [pitchResult, showToast]);

  const handleShare = useCallback(async () => {
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: biz.id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error("[LEAD] Share API failed:", data.error ?? res.status);
        showToast("Failed to create share link");
        return;
      }
      const data = await res.json();
      await navigator.clipboard.writeText(data.url);
      showToast("Share link copied to clipboard");
    } catch (err) {
      console.error("[LEAD] Share failed:", err);
      showToast("Network error — could not create share link");
    }
  }, [biz.id, showToast]);

  const handleRunDesign = useCallback(async () => {
    if (!biz.website) return;
    setRunningDesign(true);
    try {
      const res = await fetch("/api/analyze-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: biz.id, website: biz.website }),
      });
      if (res.ok && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let isQuotaError = false;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const chunk = JSON.parse(line);
              if (chunk.type === "error" && chunk.error === "AI_QUOTA_EXCEEDED") {
                isQuotaError = true;
              }
            } catch { /* skip */ }
          }
        }
        if (isQuotaError) {
          setQuotaError("AI quota exceeded — please wait a moment and try again");
          startQuotaTimer(60);
          return;
        }
      }
      router.refresh();
    } catch (err) {
      console.error("[LEAD] Design analysis failed:", err);
      showToast("Design analysis failed — please try again.");
    } finally {
      setRunningDesign(false);
    }
  }, [biz.id, biz.website, router, showToast, startQuotaTimer]);

  const handleFullAnalysis = useCallback(async () => {
    if (!biz.website) return;
    console.log("[LEAD] handleFullAnalysis START", { id: biz.id, website: biz.website });
    setRunningFullAnalysis(true);
    setPitchError(null);
    setCompletedKeys([]);
    setActiveKeys([]);

    try {
      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      const { signal } = abortController;

      // Phase 1: Audit stream
      console.log("[LEAD] Phase 1: fetching /api/audit...");
      const auditRes = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: biz.id, website: biz.website }),
        signal,
      });

      if (auditRes.ok && auditRes.body) {
        const reader = auditRes.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          if (signal.aborted) return;
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
                const key = parsed.step === "complete" ? "audit_complete" : parsed.step;
                setActiveKeys((prev) => (prev.includes(key) ? prev : [...prev, key]));
              } else if (parsed.type === "result") {
                setCompletedKeys([...AUDIT_STEP_KEYS]);
                setActiveKeys([]);
              }
            } catch { /* skip */ }
          }
        }
      }

      // Phase 2: Design stream
      console.log("[LEAD] Phase 2: fetching /api/analyze-design...");
      const designRes = await fetch("/api/analyze-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: biz.id, website: biz.website }),
        signal,
      });

      if (designRes.ok && designRes.body) {
        const reader = designRes.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          if (signal.aborted) return;
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
                const key = parsed.step === "complete" ? "design_complete" : parsed.step;
                setActiveKeys((prev) => (prev.includes(key) ? prev : [...prev, key]));
              } else if (parsed.type === "result") {
                setCompletedKeys(ANALYSE_STEPS.map((s) => s.key));
                setActiveKeys([]);
                setDesignError(null);
              } else if (parsed.type === "error") {
                const msg = (parsed.message as string) ?? "Design analysis failed";
                setDesignError(msg);
                setRunningFullAnalysis(false);
                setCompletedKeys([]);
                setActiveKeys([]);
                showToast(msg);
                return;
              }
            } catch { /* skip */ }
          }
        }
      }

      showToast("Analysis complete — scores updated");

      // Auto-generate pitch fire-and-forget
      fetch("/api/pitch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: biz.id, tone: pitchTone, length: pitchLength, lead_type: biz.website_status }),
      }).then(async (pitchRes) => {
        if (pitchRes.ok) {
          const pitchData = await pitchRes.json();
          if (pitchData.success && pitchData.pitch && typeof pitchData.pitch.subject === "string" && typeof pitchData.pitch.body === "string") {
            setPitchResult({ subject: pitchData.pitch.subject, body: pitchData.pitch.body });
            showToast("Fresh pitch generated with new data");
          }
        }
      }).catch((pitchErr) => {
        console.warn("[LEAD] Pitch auto-generation failed:", pitchErr);
      });

      router.refresh();
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        console.log("[LEAD] handleFullAnalysis aborted by user");
        return;
      }
      console.error("[LEAD] Full analysis failed:", err);
      showToast("Analysis failed — please try again.");
    } finally {
      setRunningFullAnalysis(false);
      abortControllerRef.current = null;
    }
  }, [biz.id, biz.website, biz.website_status, pitchTone, pitchLength, router, showToast]);

  const handleCancelAnalysis = useCallback(() => {
    const controller = abortControllerRef.current;
    if (controller) {
      controller.abort();
      abortControllerRef.current = null;
    }
    setRunningFullAnalysis(false);
    setCompletedKeys([]);
    setActiveKeys([]);
    setDesignError(null);
    showToast("Analysis cancelled");
  }, [showToast]);

  // ── Derived state ──────────────────────────────────────────────────────────

  const hasAudit  = !!biz.audited_at;
  const hasDesign = !!biz.design_analyzed_at;
  const hasWebsite = !!biz.website;
  const isUnanalysed = !hasAudit && !hasDesign;

  // ── Render: Empty State ─────────────────────────────────────────────────────

  if (isUnanalysed) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)]">
        <div className="mx-auto max-w-7xl px-6 py-8">
          {/* Header */}
          <Link
            href="/dashboard/leads"
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] transition-colors duration-150 hover:text-[var(--text-primary)]"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Leads
          </Link>

          <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Opportunity Details</p>
              <h1 className="mt-1 text-[clamp(1.5rem,4vw,2.5rem)] font-bold text-[var(--text-primary)] leading-tight break-words max-w-[75vw] sm:max-w-none">
                {biz.name}
              </h1>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {currentPipelineStatus ? (
                <PipelineSelect
                  value={currentPipelineStatus}
                  onChange={handlePipelineChange}
                  options={PIPELINE_SALES_STATUSES.map((s) => ({ value: s, label: PIPELINE_LABELS[s] }))}
                />
              ) : (
                <button
                  onClick={() => handlePipelineChange("new_lead")}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--accent)]/40 bg-[var(--accent-tint)] px-3 py-1.5 text-sm font-medium text-[var(--accent)] transition-colors duration-150 hover:bg-[var(--accent)] hover:text-white"
                >
                  <TrendingUp className="h-4 w-4" /> Add to Pipeline
                </button>
              )}
            </div>
          </div>

          {/* Location & Actions */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-sm text-[var(--text-secondary)]">
              {biz.business_type} · {biz.city} · {biz.address}
            </span>
            <div className="flex items-center gap-2">
              {biz.place_id && (
                <a href={`https://www.google.com/maps/place/?q=place_id:${biz.place_id}`}
                  target="_blank" rel="noreferrer"
                  className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] transition-colors duration-150 hover:border-[var(--score-good)]/40 hover:text-[var(--score-good)]">
                  <MapPin className="h-3.5 w-3.5" /> Map
                </a>
              )}
              {biz.website && (
                <a href={biz.website} target="_blank" rel="noreferrer"
                  className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] transition-colors duration-150 hover:border-[var(--status-info-text)]/40 hover:text-[var(--status-info-text)]">
                  <ExternalLink className="h-3.5 w-3.5" /> Website
                </a>
              )}
            </div>
          </div>

          {/* Empty state card */}
          <div className="mt-8 space-y-6">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-10 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-tint)]">
                <svg className="h-7 w-7 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </div>
              <h2 className="text-xl font-medium text-[var(--text-primary)]">This lead hasn&rsquo;t been analysed yet</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-[var(--text-tertiary)]">
                Run an opportunity analysis to see scores, issues, and a generated pitch.
              </p>
              {hasWebsite && (
                <div className="mt-6">
                  <button
                    onClick={handleFullAnalysis}
                    disabled={runningFullAnalysis}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--brand-shadow-sm)] transition-all duration-150 hover:bg-[var(--accent-hover)] hover:shadow-[var(--brand-shadow-md)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {runningFullAnalysis ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {runningFullAnalysis ? "Analysing…" : "Analyse Opportunity →"}
                  </button>
                </div>
              )}
            </div>

            {/* Skeleton Score Breakdown */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-6">
              <h3 className="mb-4 text-base font-semibold text-[var(--text-primary)]">Score Breakdown</h3>
              <div className="grid grid-cols-2 gap-2">
                <SubScore label="Performance"  score={null} />
                <SubScore label="SEO"          score={null} />
                <SubScore label="Mobile"       score={null} />
                <SubScore label="UX / Design"  score={null} />
                <SubScore label="Trust"        score={null} />
                <SubScore label="Overall"      score={null} />
              </div>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-6">
              <h3 className="mb-4 text-base font-semibold text-[var(--text-primary)]">Top Issues Impacting Score</h3>
              <p className="text-sm text-[var(--text-tertiary)]">Run a design analysis to see issues.</p>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-6">
              <h3 className="mb-3 text-base font-semibold text-[var(--text-primary)]">AI Opportunity Summary</h3>
              <p className="text-sm text-[var(--text-tertiary)]">Analyse this lead to generate an opportunity summary.</p>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-6">
              <h3 className="mb-3 text-base font-semibold text-[var(--text-primary)]">Ready-to-Send Outreach</h3>
              <p className="text-sm text-[var(--text-tertiary)]">Analyse this lead to generate outreach copy.</p>
            </div>
          </div>
        </div>

        <QuotaErrorBanner
          quotaError={quotaError}
          quotaRetryTimer={quotaRetryTimer}
          clearQuotaTimer={clearQuotaTimer}
        />

        {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      </div>
    );
  }

  // ── Render: Analysed Lead ─────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">

        {/* ── SECTION 1: HERO ──────────────────────────────────────────────── */}
        <LeadHeroSection
          biz={biz}
          currentPipelineStatus={currentPipelineStatus}
          hasWebsite={hasWebsite}
          runningFullAnalysis={runningFullAnalysis}
          handlePipelineChange={handlePipelineChange}
          handleFullAnalysis={handleFullAnalysis}
          handleCancelAnalysis={handleCancelAnalysis}
        />

        {/* ── OPPORTUNITY SCORE STRIP ─────────────────────────────────────── */}
        <motion.div
          className="mb-8"
          initial={shouldReduce ? {} : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: EASE_OUT }}
        >
          {hasDesign ? (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 lg:gap-16 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-4 sm:px-8 py-6">
              {/* Current Score */}
              <div className="flex flex-col items-center gap-1">
                <p className="text-[10px] uppercase tracking-[0.2em] font-medium text-[var(--text-tertiary)]">Current Score</p>
                <ScoreRingWithLabel score={overall} size={72} />
              </div>

              {/* Arrow */}
              <div className="hidden sm:flex items-center">
                <TrendingUp className="h-6 w-6 text-[var(--accent)]" />
              </div>
              <div className="flex sm:hidden text-[var(--text-tertiary)] text-xs">↓</div>

              {/* Potential Score */}
              <div className="flex flex-col items-center gap-1">
                <p className="text-[10px] uppercase tracking-[0.2em] font-medium text-[var(--text-tertiary)]">Potential Score</p>
                <ScoreRingWithLabel score={projScore} size={72} />
              </div>

              {/* Arrow */}
              <div className="hidden sm:flex items-center">
                <TrendingUp className="h-6 w-6 text-[var(--accent)]" />
              </div>
              <div className="flex sm:hidden text-[var(--text-tertiary)] text-xs">↓</div>

              {/* Opportunity */}
              <div className="flex flex-col items-center gap-1">
                <p className="text-[10px] uppercase tracking-[0.2em] font-medium text-[var(--text-tertiary)]">Opportunity</p>
                <span className="text-[clamp(2rem,5vw,3.5rem)] font-bold text-[var(--score-good)] leading-none">
                  +{opportunityDelta}
                </span>
                <span className="text-xs text-[var(--text-tertiary)]">point{opportunityDelta !== 1 ? 's' : ''} to gain</span>
              </div>
            </div>
          ) : hasAudit ? (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-8 py-6">
              <div className="flex flex-col items-center gap-1">
                <p className="text-[10px] uppercase tracking-[0.2em] font-medium text-[var(--text-tertiary)]">Current Score</p>
                <ScoreRingWithLabel score={overall} size={72} />
              </div>
              <div className="text-center">
                <p className="text-xs text-[var(--text-tertiary)]">Run a design analysis to see your improvement potential.</p>
                {hasWebsite && (
                  <button
                    onClick={handleRunDesign}
                    disabled={runningDesign}
                    className="mt-2 inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--accent)]/40 bg-[var(--accent-tint)] px-3 py-1.5 text-xs font-medium text-[var(--accent)] transition-colors duration-150 hover:bg-[var(--accent)] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {runningDesign ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                    {runningDesign ? "Analysing…" : "Analyse Design"}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-8 py-6 text-center">
              <p className="text-sm text-[var(--text-tertiary)]">Run an audit to see scores.</p>
            </div>
          )}
        </motion.div>

        {/* Full analysis progress banner */}
        {runningFullAnalysis && (
          <div className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-[var(--accent)]" />
              <span className="text-sm font-medium text-[var(--text-primary)]">Analysing...</span>
            </div>
            <div className="mt-2 h-[4px] w-full rounded-full bg-[var(--border)] overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--accent)] transition-all duration-500 ease-out"
                style={{ width: `${(completedKeys.length / ANALYSE_STEPS.length) * 100}%` }}
              />
            </div>
            {activeKeys.length > 0 && (
              <p className="mt-1.5 text-xs text-[var(--text-tertiary)]">
                {ANALYSE_STEPS.find((s) => s.key === activeKeys[activeKeys.length - 1])?.label ?? ""}
              </p>
            )}
          </div>
        )}

        {/* Design error banner */}
        {designError && !runningFullAnalysis && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
            <p className="text-sm font-medium text-[var(--badge-red-text)]">Design analysis failed</p>
            <p className="mt-1 text-xs text-[var(--text-tertiary)]">{designError}</p>
            {biz.website && (
              <button
                type="button"
                onClick={handleFullAnalysis}
                className="mt-2 cursor-pointer text-xs font-medium text-[var(--accent)] underline-offset-2 hover:text-[var(--accent-hover)] underline transition-colors"
              >
                Try again
              </button>
            )}
          </div>
        )}

        {/* ── DESKTOP TWO-COLUMN LAYOUT ───────────────────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-2">

          {/* ════ LEFT COLUMN ════════════════════════════════════════════════ */}
          <motion.div
            className="space-y-6 order-2 lg:order-1"
            variants={sectionContainer}
            initial={shouldReduce ? "visible" : "hidden"}
            animate="visible"
          >

            {/* ── SECTION 2: OPPORTUNITY SCORE EXPLANATION ─────────────────── */}
            <motion.div variants={sectionCard}>
              <OpportunityScoreExplanation
                websiteStatus={biz.website_status}
                overallScore={overall}
                opportunityScore={effectiveOpportunityScore}
                reviewCount={biz.review_count}
                rating={biz.rating}
                hasAudit={hasAudit}
                hasDesign={hasDesign}
                contactAvailable={!contactInfo.loading && (contactInfo.email !== null || contactInfo.phone !== null)}
                businessType={biz.business_type}
                issues={allIssues}
              />
            </motion.div>

            {/* ── SECTION 5: TOP ISSUES IMPACTING SCORE ────────────────────── */}
            <motion.div variants={sectionCard} className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 sm:p-6">
              <h3 className="mb-4 text-base font-semibold text-[var(--text-primary)]">
                Top Issues Impacting Score
              </h3>
              {allIssues.length === 0 ? (
                <p className="text-sm text-[var(--text-tertiary)]">Run a design analysis to see issues.</p>
              ) : (
                <motion.div
                  className="space-y-3"
                  variants={issueContainer}
                  initial={shouldReduce ? "visible" : "hidden"}
                  animate="visible"
                >
                  {(showAllIssues ? allIssues : allIssues.slice(0, 3)).map((issue, i) => (
                    <motion.div key={i} variants={issueItem} className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--text-primary)]">{issue.title}</p>
                          <p className="mt-1 text-xs text-[var(--text-tertiary)]">{issue.detail}</p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <ImpactPill impact={issue.impact ?? "Medium"} />
                          {issue.point_deduction && (
                            <span className="text-xs font-bold text-[var(--score-high)]">−{issue.point_deduction}pts</span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {allIssues.length > 3 && (
                    <button
                      onClick={() => setShowAllIssues((v) => !v)}
                      className="w-full cursor-pointer pt-1 text-xs text-[var(--text-tertiary)] transition-colors hover:text-[var(--accent)]"
                    >
                      {showAllIssues ? "Show less" : `+${allIssues.length - 3} more issue${allIssues.length - 3 !== 1 ? "s" : ""}`}
                    </button>
                  )}
                </motion.div>
              )}
            </motion.div>

            {/* ── SECTION 6: AUDIT DETAILS (collapsible) ────────────────────── */}
            <motion.div variants={sectionCard} className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-[var(--text-primary)]">
                  {screenshotStrategy === "mobile" ? "Mobile" : "Desktop"} Audit
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setScreenshotStrategy("mobile")}
                    className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-medium transition-colors duration-150 ${screenshotStrategy === "mobile" ? "bg-[var(--accent)] text-white" : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]"}`}
                  >
                    <Smartphone className="h-3 w-3 inline mr-1" />Mobile
                  </button>
                  <button
                    onClick={() => setScreenshotStrategy("desktop")}
                    className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-medium transition-colors duration-150 ${screenshotStrategy === "desktop" ? "bg-[var(--accent)] text-white" : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]"}`}
                  >
                    <Monitor className="h-3 w-3 inline mr-1" />Desktop
                  </button>
                </div>
              </div>

              {/* Score breakdown */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <SubScore label="Desktop Perf" score={desktopPerfScore} />
                <SubScore label="SEO"          score={(desktopAudit?.seo_score as number | null) ?? null} />
                <SubScore label="Mobile Perf"  score={mobilePerfScore} />
                <SubScore label="UX / Design"  score={uxDesignScoreVal || designScore || null} />
                <SubScore label="Trust"        score={trustScoreVal || null} />
                <SubScore label="Overall"      score={overall || null} />
              </div>

              {/* Collapsible technical details */}
              <button
                onClick={() => setShowTechDetails(!showTechDetails)}
                className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-[var(--text-tertiary)] transition-colors duration-150 hover:text-[var(--text-secondary)]"
              >
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-150 ${showTechDetails ? "rotate-180" : ""}`} />
                {showTechDetails ? "Hide" : "View"} Technical Details
              </button>

              {showTechDetails && (() => {
                const auditsToShow = [mobileAudit, desktopAudit].filter(Boolean) as Record<string, unknown>[];
                if (auditsToShow.length === 0) return null;
                return (
                  <div className="mt-3 space-y-3">
                    {auditsToShow.map((audit) => {
                      const isMobile = audit.strategy === "mobile";
                      return (
                        <div key={audit.id as string} className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-3">
                          <p className="text-xs font-medium text-[var(--text-primary)] mb-2">
                            {isMobile ? "Mobile" : "Desktop"} Web Vitals
                          </p>
                          <div className="space-y-2">
                            {(["fcp", "lcp", "tbt", "cls"] as MetricKey[]).map((metric) => {
                              const rawVal = (audit[metric] as string | null | undefined);
                              const colorClass = metricColor(metric, rawVal);
                              const meta = METRIC_META[metric];
                              return (
                                <div key={metric} className="flex items-center justify-between">
                                  <div>
                                    <p className="text-xs text-[var(--text-primary)]">{meta.label}</p>
                                    <p className="text-[10px] text-[var(--text-tertiary)]">{meta.subtitle}</p>
                                  </div>
                                  <span className={`text-xs font-bold ${colorClass}`}>{rawVal ?? "—"}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </motion.div>

            {/* ── SECTION 8: HISTORY ────────────────────────────────────────── */}
            <motion.div variants={sectionCard} className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 sm:p-6">
              <h3 className="mb-4 text-base font-semibold text-[var(--text-primary)]">History</h3>
              {(() => {
                const events: { date: string; label: string; score?: number }[] = [];
                const auditRows = (audits ?? []) as Record<string, unknown>[];
                if (auditRows.length > 0) {
                  const latestAudit = auditRows.reduce((latest, a) =>
                    new Date(a.created_at as string).getTime() > new Date(latest.created_at as string).getTime() ? a : latest
                  );
                  events.push({ date: latestAudit.created_at as string, label: "Performance Audit", score: (latestAudit.performance_score as number | null) ?? undefined });
                }
                const designRows = (designAnalyses ?? []) as Record<string, unknown>[];
                if (designRows.length > 0) {
                  const latestDesign = designRows.reduce((latest, a) =>
                    new Date(a.analyzed_at as string).getTime() > new Date(latest.analyzed_at as string).getTime() ? a : latest
                  );
                  events.push({ date: latestDesign.analyzed_at as string, label: "Design Analysis", score: (latestDesign.design_score as number | null) ?? undefined });
                }
                events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                if (events.length === 0) {
                  return <p className="text-sm text-[var(--text-tertiary)]">No history yet.</p>;
                }
                return (
                  <div className="space-y-2">
                    {events.map((ev, i) => {
                      const scoreColor = ev.score === undefined ? "" : ev.score >= 70 ? "text-[var(--score-good)]" : ev.score >= 40 ? "text-[var(--score-mid)]" : "text-[var(--score-high)]";
                      return (
                        <div key={i} className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-3">
                          <div className="h-2 w-2 shrink-0 rounded-full bg-[var(--accent)]" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-[var(--text-primary)]">{ev.label}</p>
                            <p className="text-[10px] text-[var(--text-tertiary)]">
                              {new Date(ev.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                          {ev.score !== undefined && (
                            <span className={`text-xs font-bold ${scoreColor}`}>{ev.score}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </motion.div>

          </motion.div>

          {/* ════ RIGHT COLUMN ═══════════════════════════════════════════════ */}
          <motion.div
            className="space-y-6 order-1 lg:order-2"
            variants={sectionContainer}
            initial={shouldReduce ? "visible" : "hidden"}
            animate="visible"
          >

            {/* ── SECTION 4: READY-TO-SEND OUTREACH ────────────────────────── */}
            <LeadOutreachSection
              outreachChannel={outreachChannel}
              setOutreachChannel={setOutreachChannel}
              contactInfo={contactInfo}
              manualEmail={manualEmail}
              setManualEmail={setManualEmail}
              pitchTone={pitchTone}
              setPitchTone={setPitchTone}
              pitchLength={pitchLength}
              setPitchLength={setPitchLength}
              pitchFocus={pitchFocus}
              setPitchFocus={setPitchFocus}
              pitchOpening={pitchOpening}
              setPitchOpening={setPitchOpening}
              pitchUrgency={pitchUrgency}
              setPitchUrgency={setPitchUrgency}
              hasAudit={hasAudit}
              hasDesign={hasDesign}
              generatingPitch={generatingPitch}
              handleGeneratePitch={handleGeneratePitch}
              pitchError={pitchError}
              pitchResult={pitchResult}
              handleCopyPitch={handleCopyPitch}
            />

            {/* ── SECTION 7: CLIENT CALL SUMMARY ─────────────────────────────── */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 sm:p-6">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-[var(--text-primary)]">Client Call Summary</h3>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">Read this 60 seconds before a sales call.</p>
                </div>
                <button
                  onClick={() => handleCopyToClipboard(clientCallSummary, "Client call summary")}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-medium text-white transition-colors duration-150 hover:bg-[var(--accent-hover)] shrink-0"
                >
                  <Copy className="h-3.5 w-3.5" /> Copy
                </button>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 text-xs text-[var(--text-secondary)] whitespace-pre-line leading-relaxed">
                {clientCallSummary}
              </div>
            </div>

            {/* ── EXPORT ──────────────────────────────────────────────────────── */}
            <LeadExportSection
              businessId={biz.id}
              handleShare={handleShare}
            />

          </motion.div>
        </div>

      </div>

      <QuotaErrorBanner
        quotaError={quotaError}
        quotaRetryTimer={quotaRetryTimer}
        clearQuotaTimer={clearQuotaTimer}
      />

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
