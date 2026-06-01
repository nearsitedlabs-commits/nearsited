"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, CheckCircle2, Circle, Copy, ExternalLink, FileDown, Loader2, Mail, MapPin, Monitor, RefreshCw, Share2, Smartphone, TrendingUp } from "lucide-react";
import { scoreLabel, computeOverall, uxDesignScore, trustScore, projection } from "@/lib/scoring";
import type { WebsiteStatus } from "@/lib/types";
import { MetricKey, METRIC_META, metricColor } from "@/lib/metric-meta";
import { PIPELINE_LABELS, PIPELINE_STATUSES, IMPACT_PILL_STYLES } from "@/lib/ui-constants";
import { Toast } from "@/components/ui/Toast";

// ── Types ─────────────────────────────────────────────────────────────────────

type TabId = "overview" | "audit" | "issues" | "history";

const TABS: { id: TabId; label: string }[] = [
  { id: "overview",    label: "Overview" },
  { id: "audit",       label: "Audit" },
  { id: "issues",      label: "Issues" },
  { id: "history",     label: "History" },
];

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

type Props = {
  business: Record<string, unknown>;
  audits: Record<string, unknown>[];
  designAnalyses: Record<string, unknown>[];
  pipelineStatus: string | null;
};




function ScoreRingWithLabel({ score, size = 56, label }: { score: number; size?: number; label?: string }) {
  const stroke = size >= 70 ? 5 : size <= 42 ? 3 : 4;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;
  const color = score <= 55 ? "var(--score-high)" : score <= 74 ? "var(--score-mid)" : "var(--score-good)";
  const lbl = label ?? scoreLabel(score);
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)"
            strokeWidth={stroke} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset} />
        </svg>
        <span className={`absolute font-bold ${size >= 70 ? "text-xl" : "text-sm"} text-[var(--text-primary)]`}>
          {score}
        </span>
      </div>
      <span className="text-center text-xs font-medium text-[var(--text-secondary)]">{lbl}</span>
    </div>
  );
}

function SubScore({ label, score }: { label: string; score: number | null }) {
  const color = score === null
    ? "text-[var(--text-tertiary)]"
    : score >= 70 ? "text-[var(--score-good)]"
    : score >= 40 ? "text-[var(--score-mid)]"
    : "text-[var(--score-high)]";
  return (
    <div className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2">
      <span className="text-sm text-[var(--text-secondary)]">{label}</span>
      <span className={`text-sm font-bold ${color}`}>{score ?? "—"}</span>
    </div>
  );
}

function ImpactPill({ impact }: { impact: string }) {
  const style = IMPACT_PILL_STYLES[impact] ?? IMPACT_PILL_STYLES.Low;
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${style}`}>
      {impact}
    </span>
  );
}

function ProgressIndicator() {
  return (
    <div className="absolute left-0 right-0 -bottom-1 h-1 overflow-hidden rounded-b-md">
      <div className="h-1 w-full bg-[var(--accent)]/60 animate-pulse" />
    </div>
  );
}

function getRiskIndicators(issues: { title: string; detail: string }[]) {
  const text = issues.map((issue) => `${issue.title} ${issue.detail}`).join(" ").toLowerCase();
  const indicators = new Set<string>();

  if (/(mobile|speed|load|performance|tbt|lcp|fcp|cls)/.test(text)) {
    indicators.add("Slow mobile experience");
  }
  if (/(cta|button|action|hierarch|navigation|conversion)/.test(text)) {
    indicators.add("Weak CTA hierarchy");
  }
  if (/(modern|outdat|visual|branding|design|style|trust)/.test(text)) {
    indicators.add("Outdated visual design");
  }
  if (/(seo|search|visibility|ranking|index)/.test(text)) {
    indicators.add("Low search visibility");
  }
  if (/(trust|secure|reputation|reviews|credibility)/.test(text)) {
    indicators.add("Low brand trust");
  }

  const defaults = [
    "Slow mobile experience",
    "Weak CTA hierarchy",
    "Outdated visual design",
  ];

  for (const def of defaults) {
    if (indicators.size >= 3) break;
    indicators.add(def);
  }

  return Array.from(indicators).slice(0, 3);
}

function formatProposalSummary(businessName: string, businessType: string, city: string, execSummary: string, before: number, potential: number, risks: string[]) {
  return `Proposal Summary for ${businessName}

${execSummary}

Current score: ${before}. Potential score: ${potential} (+${Math.max(0, potential - before)}).

Key business risks:
- ${risks.join("\n- ")}

Recommended scope:
- 30 days: improve speed, mobile usability, and CTA clarity.
- 60 days: refresh visual design and content hierarchy.
- 90 days: refine conversion flow and measure results.

This approach is designed to increase trust, update perception, and turn more website visitors into customers.`;
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function LeadDetailClient({ business, audits, designAnalyses, pipelineStatus }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [screenshotStrategy, setScreenshotStrategy] = useState<"mobile" | "desktop">("mobile");
  const [generatingPitch, setGeneratingPitch] = useState(false);
  const [pitchResult, setPitchResult] = useState<{ subject: string; body: string } | null>(null);
  const [pitchError, setPitchError] = useState<string | null>(null);
  const [pitchTone, setPitchTone] = useState<"professional" | "friendly" | "luxury">("professional");
  const [pitchLength, setPitchLength] = useState<"short" | "medium" | "detailed">("medium");
  const [reanalyzing, setReanalyzing] = useState(false);
  const [runningAudit, setRunningAudit] = useState(false);
  const [runningDesign, setRunningDesign] = useState(false);
  const [runningFullAnalysis, setRunningFullAnalysis] = useState(false);
  const [completedKeys, setCompletedKeys] = useState<string[]>([]);
  const [activeKeys, setActiveKeys] = useState<string[]>([]);
  const [currentPipelineStatus, setCurrentPipelineStatus] = useState<string | null>(pipelineStatus);
  const [toast, setToast] = useState<string | null>(null);
  const [quotaError, setQuotaError] = useState<string | null>(null);
  const [quotaRetryTimer, setQuotaRetryTimer] = useState(0);
  const quotaTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
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

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const biz = business as {
    id: string; name: string; business_type: string; address: string; city: string;
    place_id: string | null; website: string | null; website_status: WebsiteStatus;
    rating: number | null; review_count: number | null; performance_score: number | null;
    design_score: number | null; audited_at: string | null; design_analyzed_at: string | null;
  };

  const mobileAudit   = audits?.find((a) => a.strategy === "mobile")  as Record<string, unknown> | undefined;
  const desktopAudit  = audits?.find((a) => a.strategy === "desktop") as Record<string, unknown> | undefined;
  const mobileDesign  = designAnalyses?.find((a) => a.strategy === "mobile")  as Record<string, unknown> | undefined;
  const desktopDesign = designAnalyses?.find((a) => a.strategy === "desktop") as Record<string, unknown> | undefined;

  // Fix 2: scores reactive to mobile/desktop toggle
  const activeAudit  = screenshotStrategy === "mobile" ? mobileAudit  : desktopAudit;
  const activeDesign = screenshotStrategy === "mobile" ? mobileDesign : desktopDesign;

  const perfScore        = (activeAudit?.performance_score  as number | null) ?? 0;
  const seoScore         = (activeAudit?.seo_score          as number | null) ?? 0;
  const mobileScore      = (mobileAudit?.performance_score  as number | null) ?? 0;
  const designScore      = biz.design_score ?? 0;
  const criteria         = activeDesign?.criteria_scores as Record<string, number> | undefined;
  const uxDesignScoreVal = criteria ? uxDesignScore(criteria as { modernity: number; readability: number; cta: number; hierarchy: number; trust: number }) : 0;
  const trustScoreVal    = criteria ? trustScore(criteria as { trust: number }) : 0;

  const overall  = computeOverall({ performance: perfScore, seo: seoScore, mobile: mobileScore, uxDesign: uxDesignScoreVal, trust: trustScoreVal });

  const allIssues = [
    ...((mobileDesign?.issues  as { title: string; detail: string; point_deduction?: number; impact: "High" | "Medium" | "Low" }[]) ?? []),
    ...((desktopDesign?.issues as { title: string; detail: string; point_deduction?: number; impact: "High" | "Medium" | "Low" }[]) ?? []),
  ].slice(0, 5);

  const projScore = allIssues.length > 0 ? projection(overall, allIssues) : overall;
  const opportunityDelta = Math.max(0, projScore - overall);
  const execSummary = `This ${biz.business_type?.toLowerCase() ?? "business"} in ${biz.city} has a strong opportunity to increase perceived trust and mobile usability significantly with a redesign.`;
  const riskIndicators = getRiskIndicators(allIssues);
  const proposalSummary = formatProposalSummary(
    biz.name,
    biz.business_type ?? "business",
    biz.city,
    execSummary,
    overall,
    projScore,
    riskIndicators
  );

  const handleCopyProposalSummary = () => {
    navigator.clipboard.writeText(proposalSummary).then(() => {
      showToast("Proposal summary copied to clipboard");
    });
  };

  // Fix 1: Pipeline status dropdown handler
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
        // Revert optimistic update on failure
        setCurrentPipelineStatus(prevStatus);
        showToast("Failed to update pipeline status");
      }
    } catch (err) {
      console.error("[LEAD] Pipeline update network error:", err);
      // Revert optimistic update on network error
      setCurrentPipelineStatus(prevStatus);
      showToast("Network error — could not update pipeline");
    }
  }, [biz.id, currentPipelineStatus, showToast]);

  // Fix 4: Generate pitch with error handling + console logging
  const handleGeneratePitch = useCallback(async () => {
    setGeneratingPitch(true);
    setPitchError(null);
    try {
      console.log("[LEAD] Generating pitch:", { businessId: biz.id, tone: pitchTone, length: pitchLength, website_status: biz.website_status });
      const res = await fetch("/api/pitch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: biz.id, tone: pitchTone, length: pitchLength, lead_type: biz.website_status }),
      });
      if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        setQuotaError("AI quota exceeded — please wait a moment and try again");
        startQuotaTimer(data.retryAfter ?? 60);
        return;
      }
      const data = await res.json();
      console.log("[LEAD] Pitch response data:", data);
      console.log("[LEAD] Pitch nested object:", data.pitch);
      console.log("[LEAD] Pitch subject type:", typeof data.pitch?.subject, "body type:", typeof data.pitch?.body);
      if (data.success && data.pitch && typeof data.pitch.subject === "string" && typeof data.pitch.body === "string") {
        console.log("[LEAD] Setting pitchResult with:", { subject: data.pitch.subject, body: data.pitch.body });
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
  }, [biz.id, biz.website_status, pitchTone, pitchLength, startQuotaTimer]);

  // Fix 4: Copy pitch to clipboard
  const handleCopyPitch = useCallback(() => {
    if (!pitchResult) {
      showToast("Generate a pitch first");
      return;
    }
    navigator.clipboard.writeText(pitchResult.body).then(() => {
      showToast("Pitch copied to clipboard");
    });
  }, [pitchResult, showToast]);

  // Share link — create a public share link via /api/share, then copy the URL
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

  // Fix 6 + 7: Run audit — auto-adds to pipeline on first audit
  const handleRunAudit = useCallback(async () => {
    if (!biz.website) return;
    setRunningAudit(true);
    const isFirstAudit = !biz.audited_at;
    try {
      await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: biz.id, website: biz.website }),
      });
      if (isFirstAudit && !currentPipelineStatus) {
        try {
          const pipelineRes = await fetch("/api/pipeline", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ businessId: biz.id, status: "analysed" }),
          });
          if (pipelineRes.ok) {
            setCurrentPipelineStatus("analysed");
            showToast("Added to pipeline automatically");
          } else {
            console.warn("[LEAD] Auto-pipeline add failed:", await pipelineRes.text().catch(() => "unknown"));
          }
        } catch (pipelineErr) {
          console.warn("[LEAD] Auto-pipeline add network error:", pipelineErr);
        }
      }
      router.refresh();
    } catch (err) {
      console.error("[LEAD] Audit failed:", err);
      showToast("Audit failed — please try again.");
    } finally {
      setRunningAudit(false);
    }
  }, [biz.id, biz.website, biz.audited_at, currentPipelineStatus, router, showToast]);

  // Fix 6: Run design analysis
  const handleRunDesign = useCallback(async () => {
    if (!biz.website) return;
    setRunningDesign(true);
    try {
      const res = await fetch("/api/analyze-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: biz.id, website: biz.website }),
      });
      // Read the NDJSON stream to check for quota errors
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

  // Fix 8: Re-analyse with completion toast + 429 handling
  const handleReanalyse = useCallback(async () => {
    if (!biz.website) return;
    setReanalyzing(true);
    try {
      // Read analyze-design NDJSON stream for quota errors
      const designRes = await fetch("/api/analyze-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: biz.id, website: biz.website, force: true }),
      });
      let isQuotaError = false;
      if (designRes.ok && designRes.body) {
        const reader = designRes.body.getReader();
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
            try {
              const chunk = JSON.parse(line);
              if (chunk.type === "error" && chunk.error === "AI_QUOTA_EXCEEDED") {
                isQuotaError = true;
              }
            } catch { /* skip */ }
          }
        }
      }
      if (isQuotaError) {
        setQuotaError("AI quota exceeded — please wait a moment and try again");
        startQuotaTimer(60);
        return;
      }
      // Run audit in parallel (no Gemini involved)
      await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: biz.id, website: biz.website, force: true }),
      });
      showToast("Re-analysis complete");
      router.refresh();
    } catch (err) {
      console.error("[LEAD] Re-analyse failed:", err);
      showToast("Re-analysis failed — please try again.");
    } finally {
      setReanalyzing(false);
    }
  }, [biz.id, biz.website, router, showToast, startQuotaTimer]);

  // ── Combined Full Analysis: Audit → Design → Pitch (chained streaming) ──
  const handleFullAnalysis = useCallback(async () => {
    if (!biz.website) return;
    setRunningFullAnalysis(true);
    setPitchError(null);
    setCompletedKeys([]);
    setActiveKeys([]);

    try {
      // ── Phase 1: stream from /api/audit ───────────────────────────────
      const auditRes = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: biz.id, website: biz.website, force: true }),
      });

      if (auditRes.ok && auditRes.body) {
        const reader = auditRes.body.getReader();
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

      // ── Phase 2: stream from /api/analyze-design ──────────────────────
      const designRes = await fetch("/api/analyze-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: biz.id, website: biz.website, force: true }),
      });

      if (designRes.ok && designRes.body) {
        const reader = designRes.body.getReader();
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
              const parsed = JSON.parse(line);
              if (parsed.type === "progress" && parsed.step) {
                const key = parsed.step === "complete" ? "design_complete" : parsed.step;
                setActiveKeys((prev) => (prev.includes(key) ? prev : [...prev, key]));
              } else if (parsed.type === "result") {
                setCompletedKeys(ANALYSE_STEPS.map((s) => s.key));
                setActiveKeys([]);
              } else if (parsed.type === "error" && parsed.error === "AI_QUOTA_EXCEEDED") {
                isQuotaError = true;
              }
            } catch { /* skip */ }
          }
        }

        if (isQuotaError) {
          setQuotaError("AI quota exceeded — please wait a moment and try again");
          startQuotaTimer(60);
          setRunningFullAnalysis(false);
          return;
        }
      }

      showToast("Analysis complete — scores updated");

      // Auto-generate pitch with fresh data (non-blocking — scores refresh regardless)
      try {
        const pitchRes = await fetch("/api/pitch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ businessId: biz.id, tone: pitchTone, length: pitchLength, lead_type: biz.website_status }),
        });
        if (pitchRes.ok) {
          const pitchData = await pitchRes.json();
          if (pitchData.success && pitchData.pitch && typeof pitchData.pitch.subject === "string" && typeof pitchData.pitch.body === "string") {
            setPitchResult({ subject: pitchData.pitch.subject, body: pitchData.pitch.body });
            showToast("Fresh pitch generated with new data");
          } else {
            console.warn("[LEAD] Pitch API returned unexpected format:", pitchData);
          }
        }
      } catch (pitchErr) {
        console.warn("[LEAD] Pitch auto-generation failed (scores still updated):", pitchErr);
      }

      // Refresh page to show updated scores from DB
      router.refresh();
    } catch (err) {
      console.error("[LEAD] Full analysis failed:", err);
      showToast("Analysis failed — please try again.");
    } finally {
      setRunningFullAnalysis(false);
    }
  }, [biz.id, biz.website, biz.website_status, pitchTone, pitchLength, router, showToast, startQuotaTimer]);

  // ── Tab renderers ──────────────────────────────────────────────────────────

  function renderOverview() {
    const hasAudit  = !!biz.audited_at;
    const hasDesign = !!biz.design_analyzed_at;
    const hasWebsite = !!biz.website;
    const isUnanalysed = !hasAudit && !hasDesign;

    // ── Empty state for unanalysed leads ──────────────────────────────────
    if (isUnanalysed) {
      return (
        <div className="space-y-6">
          {/* Empty state card */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-10 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-tint)]">
              <svg className="h-7 w-7 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <h2 className="text-xl font-medium text-[var(--text-primary)]">This lead hasn't been analysed yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-[var(--text-tertiary)]">
              Run an opportunity analysis to see scores, issues, and a generated pitch.
            </p>
            {hasWebsite && (
              <div className="mt-6">
                <button
                  onClick={handleRunAudit}
                  disabled={runningAudit}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--brand-shadow-sm)] transition-all duration-150 hover:bg-[var(--accent-hover)] hover:shadow-[var(--brand-shadow-md)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {runningAudit ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {runningAudit ? "Analysing…" : "Analyse Opportunity →"}
                </button>
              </div>
            )}
          </div>

          {/* Score Breakdown — always visible */}
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

          {/* Top Issues — shows Run a design analysis message */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-6">
            <h3 className="mb-4 text-base font-semibold text-[var(--text-primary)]">Top Issues Impacting Score</h3>
            <p className="text-sm text-[var(--text-tertiary)]">Run a design analysis to see issues.</p>
          </div>

          {/* AI Opportunity Summary */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-6">
            <h3 className="mb-3 text-base font-semibold text-[var(--text-primary)]">AI Opportunity Summary</h3>
            <p className="text-sm text-[var(--text-tertiary)]">Analyse this lead to generate an opportunity summary.</p>
          </div>

          {/* AI Generated Pitch — config box */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-6">
            <h3 className="mb-3 text-base font-semibold text-[var(--text-primary)]">AI Generated Pitch</h3>
            <div className="mb-3 flex flex-wrap gap-2">
              <select disabled
                className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-2.5 py-1.5 text-xs text-[var(--text-tertiary)] outline-none">
                <option>Professional</option>
              </select>
              <select disabled
                className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-2.5 py-1.5 text-xs text-[var(--text-tertiary)] outline-none">
                <option>Short</option>
              </select>
              <button disabled
                className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg bg-[var(--bg-surface-2)] px-3 py-1.5 text-xs font-medium text-[var(--text-tertiary)] opacity-50">
                Generate Pitch
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left */}
        <div className="space-y-6">

          {/* Executive summary */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-6">
            <h3 className="mb-3 text-base font-semibold text-[var(--text-primary)]">Executive Summary</h3>
            <p className="text-sm leading-6 text-[var(--text-secondary)]">{execSummary}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
                <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Opportunity</p>
                <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{opportunityDelta > 0 ? `+${opportunityDelta}` : "—"}</p>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">Point improvement potential</p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
                <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Meeting-ready takeaway</p>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">Use this summary in a client call to align on trust, mobile usability, and design urgency.</p>
              </div>
            </div>
          </div>

          {/* Overall score card */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-6">
            <div className="mb-4 flex items-center gap-2">
              <button
                onClick={() => setScreenshotStrategy("mobile")}
                className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${screenshotStrategy === "mobile" ? "bg-[var(--accent)] text-white" : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]"}`}
              >
                Mobile
              </button>
              <button
                onClick={() => setScreenshotStrategy("desktop")}
                className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${screenshotStrategy === "desktop" ? "bg-[var(--accent)] text-white" : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]"}`}
              >
                Desktop
              </button>
            </div>
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <ScoreRingWithLabel score={overall} size={80} />
              <div className="text-center sm:text-left">
                <p className="text-sm text-[var(--text-secondary)]">
                  Last analysed: {biz.audited_at ? new Date(biz.audited_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "Never"}
                </p>
                {/* Fix 6: Show appropriate action buttons */}
                <div className="mt-2 flex flex-wrap gap-2">
                  {hasAudit && (
                    <div className="relative inline-block">
                      <button
                        onClick={handleReanalyse}
                        disabled={reanalyzing}
                        className="inline-flex cursor-pointer items-center gap-1 text-xs text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {reanalyzing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                        {reanalyzing ? "Re-analysing…" : "Re-analyse"}
                      </button>
                      {reanalyzing && <div className="absolute left-0 right-0 -bottom-1 h-1 overflow-hidden rounded-b-md"><div className="h-1 w-full bg-[var(--accent)]/60 animate-pulse"/></div>}
                    </div>
                  )}
                  {!hasAudit && hasWebsite && (
                    <div className="relative inline-block">
                      <button
                        onClick={handleRunAudit}
                        disabled={runningAudit}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] transition-colors duration-150 hover:border-[var(--accent)]/40 hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {runningAudit ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                        {runningAudit ? "Running Audit…" : "Run Audit"}
                      </button>
                      {runningAudit && <div className="absolute left-0 right-0 -bottom-1 h-1 overflow-hidden rounded-b-md"><div className="h-1 w-full bg-[var(--accent)]/60 animate-pulse"/></div>}
                    </div>
                  )}
                  {hasAudit && !hasDesign && hasWebsite && (
                    <div className="relative inline-block">
                      <button
                        onClick={handleRunDesign}
                        disabled={runningDesign}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] transition-colors duration-150 hover:border-[var(--accent)]/40 hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {runningDesign ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                        {runningDesign ? "Analysing…" : "Run Design Analysis"}
                      </button>
                      {runningDesign && <div className="absolute left-0 right-0 -bottom-1 h-1 overflow-hidden rounded-b-md"><div className="h-1 w-full bg-[var(--accent)]/60 animate-pulse"/></div>}
                    </div>
                  )}
                  {!hasAudit && hasDesign && hasWebsite && (
                    <div className="relative inline-block">
                      <button
                        onClick={handleRunAudit}
                        disabled={runningAudit}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] transition-colors duration-150 hover:border-[var(--accent)]/40 hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {runningAudit ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                        {runningAudit ? "Running Audit…" : "Run Audit"}
                      </button>
                      {runningAudit && <div className="absolute left-0 right-0 -bottom-1 h-1 overflow-hidden rounded-b-md"><div className="h-1 w-full bg-[var(--accent)]/60 animate-pulse"/></div>}
                    </div>
                  )}
                </div>
                {allIssues.length > 0 && (
                  <p className="mt-2 text-sm font-medium text-[var(--score-good)]">
                    Fixing top issues could improve to <strong>{projScore}+</strong>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Top issues */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-6">
            <h3 className="mb-4 text-base font-semibold text-[var(--text-primary)]">
              Top Issues Impacting Score
            </h3>
            {allIssues.length === 0 ? (
              <p className="text-sm text-[var(--text-tertiary)]">Run a design analysis to see issues.</p>
            ) : (
              <div className="space-y-3">
                {allIssues.slice(0, 3).map((issue, i) => (
                  <div key={i} className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
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
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right */}
        <div className="space-y-6">

          {/* Score breakdown — Fix 2: updates with toggle */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-6">
            <h3 className="mb-4 text-base font-semibold text-[var(--text-primary)]">Score Breakdown</h3>
            <div className="grid grid-cols-2 gap-2">
              <SubScore label="Performance"  score={perfScore || null} />
              <SubScore label="SEO"          score={seoScore || null} />
              <SubScore label="Mobile"       score={mobileScore || null} />
              <SubScore label="UX / Design"  score={uxDesignScoreVal || designScore || null} />
              <SubScore label="Trust"        score={trustScoreVal || null} />
              <SubScore label="Overall"      score={overall || null} />
            </div>
          </div>

          {/* Proposal ready section — moved up */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-6">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-[var(--text-primary)]">Proposal Ready</h3>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">One-click copyable proposal summary for client calls.</p>
              </div>
              <button
                onClick={handleCopyProposalSummary}
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-medium text-white transition-colors duration-150 hover:bg-[var(--accent-hover)]"
              >
                <Copy className="h-4 w-4" /> Copy summary
              </button>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 text-sm text-[var(--text-secondary)] whitespace-pre-line">
              {proposalSummary}
            </div>
          </div>

          {/* Before vs Potential */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-6">
            <h3 className="mb-4 text-base font-semibold text-[var(--text-primary)]">Before vs Potential</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 text-center">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Current</p>
                <p className="mt-3 text-3xl font-semibold text-[var(--text-primary)]">{overall}</p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 text-center">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Potential</p>
                <p className="mt-3 text-3xl font-semibold text-[var(--text-primary)]">{projScore}</p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 text-center">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Opportunity</p>
                <p className="mt-3 text-3xl font-semibold text-[var(--score-good)]">+{opportunityDelta}</p>
              </div>
            </div>
          </div>

          {/* Revenue Impact Estimate removed per request */}

          {/* Impact timeline */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-6">
            <h3 className="mb-4 text-base font-semibold text-[var(--text-primary)]">Impact Timeline</h3>
            <div className="space-y-3">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">30 days</p>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">Improve mobile speed, CTA clarity, and first impressions to capture more leads quickly.</p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">60 days</p>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">Refresh visual design, content hierarchy, and trust signals to increase conversions.</p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">90 days</p>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">Measure results, optimize conversion flow, and prepare a proposal to close the deal.</p>
              </div>
            </div>
          </div>

          {/* Business risk indicators */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-6">
            <h3 className="mb-4 text-base font-semibold text-[var(--text-primary)]">Business Risk Indicators</h3>
            <ul className="space-y-2">
              {riskIndicators.map((risk) => (
                <li key={risk} className="text-sm text-[var(--text-secondary)]">
                  <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
                  {risk}
                </li>
              ))}
            </ul>
          </div>


          {/* AI Opportunity summary */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-6">
            <h3 className="mb-3 text-base font-semibold text-[var(--text-primary)]">AI Opportunity Summary</h3>
            {allIssues.length === 0 ? (
              <p className="text-sm text-[var(--text-tertiary)]">Analyse this lead to generate an opportunity summary.</p>
            ) : (
              <ul className="space-y-2">
                {allIssues.slice(0, 4).map((issue, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                    {issue.detail}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* AI Generated Pitch — Fix 4 */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-6">
            <h3 className="mb-3 text-base font-semibold text-[var(--text-primary)]">AI Generated Pitch</h3>
            <div className="mb-3 flex flex-wrap gap-2">
              <select value={pitchTone} onChange={(e) => setPitchTone(e.target.value as typeof pitchTone)}
                className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-2.5 py-1.5 text-xs text-[var(--text-secondary)] outline-none focus:border-[var(--accent)]">
                <option value="professional">Professional</option>
                <option value="friendly">Friendly</option>
                <option value="luxury">Luxury</option>
              </select>
              <select value={pitchLength} onChange={(e) => setPitchLength(e.target.value as typeof pitchLength)}
                className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-2.5 py-1.5 text-xs text-[var(--text-secondary)] outline-none focus:border-[var(--accent)]">
                <option value="short">Short</option>
                <option value="medium">Medium</option>
                <option value="detailed">Detailed</option>
              </select>
              <div className="relative inline-block">
                {hasAudit && hasDesign ? (
                  <button
                    onClick={handleGeneratePitch}
                    disabled={generatingPitch}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white transition-colors duration-150 hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {generatingPitch && <Loader2 className="h-3 w-3 animate-spin" />}
                    {generatingPitch ? "Generating…" : "Generate Pitch"}
                  </button>
                ) : (
                  <div
                    className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg bg-[var(--bg-surface-2)] px-3 py-1.5 text-xs font-medium text-[var(--text-tertiary)] opacity-60"
                    title="Analyse this lead first to generate a pitch"
                  >
                    <Mail className="h-3 w-3" />
                    Generate Pitch (analyse first)
                  </div>
                )}
                {generatingPitch && <div className="absolute left-0 right-0 -bottom-1 h-1 overflow-hidden rounded-b-md"><div className="h-1 w-full bg-[var(--accent)]/60 animate-pulse"/></div>}
              </div>
            </div>
            {pitchError && (
              <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                {pitchError}
              </div>
            )}
            {(() => {
              if (!pitchResult) {
                return <p className="text-xs text-[var(--text-tertiary)]">Configure tone and length, then click Generate.</p>;
              }
              if (typeof pitchResult !== "object" || typeof pitchResult.subject !== "string" || typeof pitchResult.body !== "string") {
                console.error("[LEAD] Invalid pitchResult state:", pitchResult);
                return <p className="text-xs text-[var(--score-high)]">Pitch data error — please regenerate.</p>;
              }
              return (
                <div className="space-y-2 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-3">
                  <p className="text-sm font-medium text-[var(--text-primary)]">{pitchResult.subject}</p>
                  <p className="whitespace-pre-wrap text-xs text-[var(--text-secondary)]">{pitchResult.body}</p>
                  <button
                    onClick={handleCopyPitch}
                    className="mt-1 inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] transition-colors duration-150 hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
                  >
                    <Copy className="h-3 w-3" /> Copy Pitch
                  </button>
                </div>
              );
            })()}
          </div>

          {/* Export — Fix 5 */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-6">
            <h3 className="mb-3 text-base font-semibold text-[var(--text-primary)]">Export</h3>
            <div className="flex flex-wrap gap-2">
              <a
                href={`/api/export/pdf?businessId=${biz.id}`}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] transition-colors duration-150 hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
              >
                <FileDown className="h-3.5 w-3.5" /> PDF Report
              </a>
              <button
                onClick={handleShare}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] transition-colors duration-150 hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
              >
                <Share2 className="h-3.5 w-3.5" /> Share Link
              </button>
            </div>
          </div>

        </div>
      </div>
    );
  }

  function renderAudit() {
    const auditsToShow = [mobileAudit, desktopAudit].filter(Boolean) as Record<string, unknown>[];
    if (auditsToShow.length === 0) {
      return (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-12 text-center">
          <p className="text-sm text-[var(--text-tertiary)]">No audit data. Run an audit first.</p>
        </div>
      );
    }
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {auditsToShow.map((audit) => {
          const isMobile = audit.strategy === "mobile";
          const StratIcon = isMobile ? Smartphone : Monitor;
          return (
            <div key={audit.id as string} className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-6">
              <div className="mb-4 flex items-center gap-2">
                <StratIcon className="h-4 w-4 text-[var(--text-tertiary)]" />
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {isMobile ? "Mobile" : "Desktop"}
                </p>
              </div>
              <div className="space-y-2">
                <SubScore label="Performance" score={audit.performance_score as number | null} />
                <SubScore label="SEO"         score={audit.seo_score as number | null} />
                {/* Fix 3: expanded metric names with descriptions and colour indicators */}
                <div className="mt-3 space-y-2">
                  {(["fcp", "lcp", "tbt", "cls"] as MetricKey[]).map((metric) => {
                    const rawVal = (audit[metric] as string | null | undefined);
                    const colorClass = metricColor(metric, rawVal);
                    const meta = METRIC_META[metric];
                    return (
                      <div key={metric} className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-[var(--text-primary)]">{meta.label}</p>
                            <p className="mt-0.5 text-[10px] text-[var(--text-tertiary)]">{meta.subtitle}</p>
                          </div>
                          <span className={`shrink-0 text-sm font-bold ${colorClass}`}>
                            {rawVal ?? "—"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  function renderIssues() {
    if (allIssues.length === 0) {
      return (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-12 text-center">
          <p className="text-sm text-[var(--text-tertiary)]">No issues found. Run a design analysis to identify issues.</p>
        </div>
      );
    }
    return (
      <div className="space-y-3">
        {allIssues.map((issue, i) => (
          <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-[var(--text-primary)]">{issue.title}</p>
                  <ImpactPill impact={issue.impact ?? "Medium"} />
                </div>
                <p className="mt-1 text-xs text-[var(--text-tertiary)]">{issue.detail}</p>
              </div>
              {issue.point_deduction && (
                <span className="shrink-0 text-sm font-bold text-[var(--score-high)]">−{issue.point_deduction}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  function renderHistory() {
    const events: { date: string; label: string; score?: number }[] = [];
    // Use the same computed scores as the Overview tab for consistency
    const auditRows = (audits ?? []) as Record<string, unknown>[];
    if (auditRows.length > 0) {
      const latestAudit = auditRows.reduce((latest, a) =>
        new Date(a.created_at as string).getTime() > new Date(latest.created_at as string).getTime() ? a : latest
      );
      events.push({ date: latestAudit.created_at as string, label: "Performance Audit", score: perfScore || undefined });
    }
    const designRows = (designAnalyses ?? []) as Record<string, unknown>[];
    if (designRows.length > 0) {
      const latestDesign = designRows.reduce((latest, a) =>
        new Date(a.analyzed_at as string).getTime() > new Date(latest.analyzed_at as string).getTime() ? a : latest
      );
      events.push({ date: latestDesign.analyzed_at as string, label: "Design Analysis", score: uxDesignScoreVal || undefined });
    }
    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (events.length === 0) {
      return (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-12 text-center">
          <p className="text-sm text-[var(--text-tertiary)]">No history yet.</p>
        </div>
      );
    }
    return (
      <div className="space-y-3">
        {events.map((ev, i) => {
          const scoreColor = ev.score === undefined ? "" : ev.score >= 70 ? "text-[var(--score-good)]" : ev.score >= 40 ? "text-[var(--score-mid)]" : "text-[var(--score-high)]";
          return (
            <div key={i} className="flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4">
              <div className="h-2 w-2 shrink-0 rounded-full bg-[var(--accent)]" />
              <div className="flex-1">
                <p className="text-sm font-medium text-[var(--text-primary)]">{ev.label}</p>
                <p className="text-xs text-[var(--text-tertiary)]">
                  {new Date(ev.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              {ev.score !== undefined && (
                <span className={`text-sm font-bold ${scoreColor}`}>{ev.score}</span>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <div className="mx-auto max-w-7xl px-6 py-8">

        {/* Header */}
        <div className="mb-6">
          <Link
            href="/dashboard/leads"
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] transition-colors duration-150 hover:text-[var(--text-primary)]"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Leads
          </Link>
          <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[var(--text-primary)]">{biz.name}</h1>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {biz.business_type} · {biz.city} · {biz.address}
              </p>
              <div className="mt-2 flex items-center gap-2">
                {biz.place_id && (
                  <a
                    href={`https://www.google.com/maps/place/?q=place_id:${biz.place_id}`}
                    target="_blank" rel="noreferrer"
                    className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] transition-colors duration-150 hover:border-[var(--score-good)]/40 hover:text-[var(--score-good)]"
                  >
                    <MapPin className="h-3.5 w-3.5" /> Map
                  </a>
                )}
                {biz.website && (
                  <a
                    href={biz.website} target="_blank" rel="noreferrer"
                    className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] transition-colors duration-150 hover:border-[var(--status-info-text)]/40 hover:text-[var(--status-info-text)]"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Website
                  </a>
                )}
              </div>
            </div>
            {/* Pipeline status dropdown + Analyse + Copy Pitch */}
            <div className="flex flex-col items-end gap-3">
              <div className="flex items-center gap-2">
                {biz.website && (
                  <button
                    onClick={handleFullAnalysis}
                    disabled={runningFullAnalysis}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--accent)]/40 bg-[var(--accent-tint)] px-4 py-2 text-sm font-medium text-[var(--accent)] transition-colors duration-150 hover:bg-[var(--accent)] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {runningFullAnalysis ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    {runningFullAnalysis ? "Analysing…" : (biz.audited_at ? "Re-analyse" : "Analyse Opportunity")}
                  </button>
                )}
                <select
                  value={currentPipelineStatus ?? "new_lead"}
                  onChange={(e) => handlePipelineChange(e.target.value)}
                  className="cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-1.5 text-sm text-[var(--text-secondary)] outline-none transition-colors duration-150 focus:border-[var(--accent)] hover:border-[var(--border-strong)]"
                >
                  {PIPELINE_STATUSES.map((s) => (
                    <option key={s} value={s}>{PIPELINE_LABELS[s]}</option>
                  ))}
                </select>
                <button
                  onClick={handleCopyPitch}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-[var(--accent-hover)]"
                >
                  <Copy className="h-4 w-4" /> Copy Pitch
                </button>
              </div>

              {/* Inline progress checklist */}
              {(runningFullAnalysis || completedKeys.length > 0) && (
                <div className="w-full max-w-md">
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface-2)] p-3">
                    <div className="space-y-0.5">
                      {ANALYSE_STEPS.map((stepDef) => {
                        const isDone   = completedKeys.includes(stepDef.key);
                        const isActive = !isDone && activeKeys.includes(stepDef.key);
                        return (
                          <div key={stepDef.key} className="flex items-center gap-3 py-1">
                            {isDone ? (
                              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[var(--score-good)]" />
                            ) : isActive ? (
                              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-[var(--accent)]" />
                            ) : (
                              <Circle className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" />
                            )}
                            <span className={`text-xs ${
                              isDone   ? "text-[var(--text-tertiary)] line-through" :
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
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex flex-wrap gap-0 border-b border-[var(--border)]">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`cursor-pointer px-4 py-3 text-sm font-medium transition-colors duration-150 ${
                activeTab === tab.id
                  ? "border-b-2 border-[var(--accent)] text-[var(--accent)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "overview"    && renderOverview()}
        {activeTab === "audit"       && renderAudit()}
        {activeTab === "issues"      && renderIssues()}
        {activeTab === "history"     && renderHistory()}

      </div>


      {/* Quota error banner */}
      {quotaError && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-3.5 shadow-[var(--brand-shadow-lg)]">
          <AlertTriangle className="h-5 w-5 shrink-0 text-[var(--score-mid)]" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-400">{quotaError}</p>
            {quotaRetryTimer > 0 && (
              <p className="mt-0.5 text-xs text-amber-500">
                Retry available in {quotaRetryTimer}s
              </p>
            )}
          </div>
          <button
            onClick={clearQuotaTimer}
            className="cursor-pointer rounded-lg border border-amber-500/30 bg-amber-500/15 px-3 py-1.5 text-xs font-medium text-amber-400 transition-colors hover:bg-amber-500/25"
          >
            {quotaRetryTimer > 0 ? `Wait ${quotaRetryTimer}s` : "Dismiss"}
          </button>
        </div>
      )}

      {/* Toast notification */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
