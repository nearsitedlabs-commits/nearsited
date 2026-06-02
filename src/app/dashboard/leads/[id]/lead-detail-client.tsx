"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, ChevronDown, Copy, ExternalLink, FileDown, Loader2, Mail, MapPin, Monitor, Phone, RefreshCw, Send, Share2, Smartphone, TrendingUp } from "lucide-react";
import { scoreLabel, computeOverall, uxDesignScore, trustScore, projection } from "@/lib/scoring";
import type { WebsiteStatus } from "@/lib/types";
import { MetricKey, METRIC_META, metricColor } from "@/lib/metric-meta";
import { PIPELINE_LABELS, PIPELINE_SALES_STATUSES, IMPACT_PILL_STYLES } from "@/lib/ui-constants";
import PipelineSelect from "@/components/ui/PipelineSelect";
import { Toast } from "@/components/ui/Toast";

// ── Types ─────────────────────────────────────────────────────────────────────

type OutreachChannel = "email" | "whatsapp";

const OUTREACH_CHANNELS: { id: OutreachChannel; label: string; icon: typeof Mail }[] = [
  { id: "email",    label: "Email",     icon: Mail },
  { id: "whatsapp", label: "WhatsApp",  icon: Phone },
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

// ── Sub-components ──────────────────────────────────────────────────────────

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



/** Extract the top 3 highest-impact findings for "Why Contact This Lead" */
function getTopFindings(issues: { title: string; detail: string; impact: string }[]): string[] {
  const impactOrder: Record<string, number> = { High: 0, Medium: 1, Low: 2 };
  const sorted = [...issues].sort((a, b) => (impactOrder[a.impact] ?? 2) - (impactOrder[b.impact] ?? 2));
  return sorted.slice(0, 3).map((i) => i.title);
}

/** Build a concise client call summary from available data */
function buildClientCallSummary(
  businessName: string,
  businessType: string,
  city: string,
  overallScore: number,
  projScore: number,
  opportunityDelta: number,
  topIssues: { title: string; detail: string; impact: string }[],
  mobilePerf: number | null,
  desktopPerf: number | null,
  rating: number | null,
  reviewCount: number | null,
) {
  const delta = Math.max(0, projScore - overallScore);
  const ratingStr = rating != null && reviewCount != null
    ? `\n• Rating: ${rating.toFixed(1)}★ (${reviewCount} reviews)`
    : "";

  const perfStr = mobilePerf != null && desktopPerf != null
    ? `\n• Performance: Mobile ${mobilePerf}/100 · Desktop ${desktopPerf}/100`
    : mobilePerf != null
      ? `\n• Performance: ${mobilePerf}/100`
      : "";

  const risks = topIssues.slice(0, 3).map((i) => i.title).join(", ");
  const scope = topIssues.length > 0
    ? `Fix "${topIssues[0].title}" as priority, then address ${topIssues.slice(1, 3).map((i) => `"${i.title}"`).join(" and ")}.`
    : "Run an analysis to identify improvement areas.";

  return [
    `━━ Current Situation ━━`,
    `${businessName} — ${businessType} in ${city}${ratingStr}${perfStr}`,
    `Overall score: ${overallScore}/100`,
    ``,
    `━━ Opportunity ━━`,
    `Potential score: ${projScore}/100 (+${delta} pts)`,
    ``,
    `━━ Risks ━━`,
    risks || "No critical issues identified.",
    ``,
    `━━ Suggested Scope ━━`,
    scope,
  ].join("\n");
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function LeadDetailClient({ business, audits, designAnalyses, pipelineStatus }: Props) {
  const [screenshotStrategy, setScreenshotStrategy] = useState<"mobile" | "desktop">("mobile");
  const [generatingPitch, setGeneratingPitch] = useState(false);
  const [pitchResult, setPitchResult] = useState<{ subject: string; body: string } | null>(null);
  const [pitchError, setPitchError] = useState<string | null>(null);
  const [pitchTone, setPitchTone] = useState<"professional" | "friendly" | "luxury">("professional");
  const [pitchLength, setPitchLength] = useState<"short" | "medium" | "detailed">("medium");
  const [runningAudit, setRunningAudit] = useState(false);
  const [runningDesign, setRunningDesign] = useState(false);
  const [runningFullAnalysis, setRunningFullAnalysis] = useState(false);
  const [completedKeys, setCompletedKeys] = useState<string[]>([]);
  const [activeKeys, setActiveKeys] = useState<string[]>([]);
  const [currentPipelineStatus, setCurrentPipelineStatus] = useState<string | null>(pipelineStatus);
  const [designError, setDesignError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [quotaError, setQuotaError] = useState<string | null>(null);
  const [quotaRetryTimer, setQuotaRetryTimer] = useState(0);
  const [outreachChannel, setOutreachChannel] = useState<OutreachChannel>("email");
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

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
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
      .catch(() => {
        setContactInfo((prev) => ({ ...prev, loading: false }));
      });
  }, [business]);

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

  const activeAudit  = screenshotStrategy === "mobile" ? (mobileAudit  ?? desktopAudit)  : (desktopAudit  ?? mobileAudit);
  const activeDesign = screenshotStrategy === "mobile" ? (mobileDesign ?? desktopDesign) : (desktopDesign ?? mobileDesign);

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

  // Extract individual scores for both strategies
  const mobilePerfScore  = (mobileAudit?.performance_score  as number | null) ?? null;
  const desktopPerfScore = (desktopAudit?.performance_score as number | null) ?? null;
  // Top findings for "Why Contact This Lead"
  const topFindings = getTopFindings(allIssues as { title: string; detail: string; impact: string }[]);

  // Build summary bullets from issues for Opportunity Summary
  const opportunityBullets = allIssues.slice(0, 4).map((issue) => {
    // Convert technical detail to business-oriented language
    const t = issue.detail.toLowerCase();
    if (/(lcp|fcp|tbt|cls|speed|load|performance|slow)/.test(t)) return "Mobile visitors likely experience friction.";
    if (/(cta|button|hierarch|navigation|conversion)/.test(t)) return "Conversion paths are unclear for visitors.";
    if (/(trust|secure|reputation|reviews|credibility|modern|outdat|design|visual|brand)/.test(t)) return "Trust signals are weak — visitors may hesitate to engage.";
    if (/(seo|search|visibility|ranking|index)/.test(t)) return "Search visibility is limited, reducing organic traffic.";
    if (/(content|readab|typograph|font)/.test(t)) return "Content readability needs improvement for engagement.";
    return issue.detail;
  });

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
        body: JSON.stringify({ businessId: biz.id, tone: pitchTone, length: pitchLength, channel: outreachChannel, lead_type: biz.website_status }),
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
  }, [biz.id, biz.website_status, pitchTone, pitchLength, outreachChannel, startQuotaTimer]);

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

  const handleRunAudit = useCallback(async () => {
    if (!biz.website) return;
    setRunningAudit(true);
    try {
      await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: biz.id, website: biz.website }),
      });
      router.refresh();
    } catch (err) {
      console.error("[LEAD] Audit failed:", err);
      showToast("Audit failed — please try again.");
    } finally {
      setRunningAudit(false);
    }
  }, [biz.id, biz.website, router, showToast]);

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

        {/* Quota error banner */}
        {quotaError && (
          <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-3.5 shadow-[var(--brand-shadow-lg)]">
            <AlertTriangle className="h-5 w-5 shrink-0 text-[var(--score-mid)]" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-400">{quotaError}</p>
              {quotaRetryTimer > 0 && <p className="mt-0.5 text-xs text-amber-500">Retry available in {quotaRetryTimer}s</p>}
            </div>
            <button onClick={clearQuotaTimer}
              className="cursor-pointer rounded-lg border border-amber-500/30 bg-amber-500/15 px-3 py-1.5 text-xs font-medium text-amber-400 transition-colors hover:bg-amber-500/25">
              {quotaRetryTimer > 0 ? `Wait ${quotaRetryTimer}s` : "Dismiss"}
            </button>
          </div>
        )}

        {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      </div>
    );
  }

  // ── Render: Analysed Lead ─────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">

        {/* ── SECTION 1: HERO ──────────────────────────────────────────────── */}
        <div className="mb-6">
          <Link
            href="/dashboard/leads"
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] transition-colors duration-150 hover:text-[var(--text-primary)]"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Leads
          </Link>

          <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Opportunity Details</p>
              <h1 className="mt-1 text-[clamp(1.5rem,4vw,2.75rem)] font-bold text-[var(--text-primary)] leading-tight max-w-[85vw] sm:max-w-[65vw] lg:max-w-[50vw] break-words [text-wrap:balance]">
                {biz.name}
              </h1>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {biz.business_type} · {biz.city} · {biz.address}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
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
              {/* Google Reviews */}
              {(biz.rating != null || biz.review_count != null) && (
                <div className="mt-3 flex items-center gap-3">
                  {biz.rating != null && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-[var(--score-good)]">{biz.rating.toFixed(1)}</span>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg key={star} className={`h-3.5 w-3.5 ${star <= Math.round(biz.rating!) ? "text-[var(--score-good)]" : "text-[var(--text-muted)]"}`} fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                  )}
                  {biz.review_count != null && (
                    <span className="text-xs text-[var(--text-tertiary)]">{biz.review_count.toLocaleString()} reviews</span>
                  )}
                </div>
              )}
            </div>

            {/* Header actions: Pipeline + Analyse + Copy Pitch */}
            <div className="flex flex-col items-end gap-3 w-full sm:w-auto">
              <div className="flex flex-wrap items-center gap-2">
                {hasWebsite && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleFullAnalysis}
                      disabled={runningFullAnalysis}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--accent)]/40 bg-[var(--accent-tint)] px-3 py-1.5 text-xs font-medium text-[var(--accent)] transition-colors duration-150 hover:bg-[var(--accent)] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {runningFullAnalysis ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3.5 w-3.5" />
                      )}
                      {runningFullAnalysis ? "Analysing…" : (biz.audited_at ? "Re-analyse" : "Analyse")}
                    </button>
                    {runningFullAnalysis && (
                      <button
                        type="button"
                        onClick={handleCancelAnalysis}
                        className="cursor-pointer text-xs font-medium text-[var(--text-tertiary)] underline-offset-2 hover:text-[var(--text-secondary)] underline transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                )}
                {currentPipelineStatus ? (
                  <PipelineSelect
                    value={currentPipelineStatus}
                    onChange={handlePipelineChange}
                    options={PIPELINE_SALES_STATUSES.map((s) => ({ value: s, label: PIPELINE_LABELS[s] }))}
                  />
                ) : (
                  <button
                    onClick={() => handlePipelineChange("new_lead")}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--accent)]/40 bg-[var(--accent-tint)] px-3 py-1.5 text-xs font-medium text-[var(--accent)] transition-colors duration-150 hover:bg-[var(--accent)] hover:text-white"
                  >
                    <TrendingUp className="h-3.5 w-3.5" /> Add to Pipeline
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── OPPORTUNITY SCORE STRIP ─────────────────────────────────────── */}
        <div className="mb-8">
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
        </div>

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
          <div className="space-y-6 order-2 lg:order-1">

            {/* ── SECTION 2: WHY CONTACT THIS LEAD ────────────────────────── */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 sm:p-6">
              <h3 className="mb-4 text-base font-semibold text-[var(--text-primary)]">Why Contact This Lead</h3>
              {topFindings.length === 0 ? (
                <p className="text-sm text-[var(--text-tertiary)]">Run a design analysis to identify findings.</p>
              ) : (
                <ul className="space-y-3">
                  {topFindings.map((finding, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent-tint)] text-[10px] font-bold text-[var(--accent)]">
                        {i + 1}
                      </span>
                      <span className="text-sm text-[var(--text-secondary)] leading-relaxed">{finding}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* ── SECTION 3: AI OPPORTUNITY SUMMARY ────────────────────────── */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 sm:p-6">
              <h3 className="mb-3 text-base font-semibold text-[var(--text-primary)]">AI Opportunity Summary</h3>
              {opportunityBullets.length === 0 ? (
                <p className="text-sm text-[var(--text-tertiary)]">Analyse this lead to generate an opportunity summary.</p>
              ) : (
                <ul className="space-y-2">
                  {opportunityBullets.map((bullet, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* ── SECTION 5: TOP ISSUES IMPACTING SCORE ────────────────────── */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 sm:p-6">
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
                    </div>
                  ))}
                  {allIssues.length > 3 && (
                    <p className="text-xs text-[var(--text-tertiary)] text-center pt-1">
                      +{allIssues.length - 3} more issues
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* ── SECTION 6: AUDIT DETAILS (collapsible) ────────────────────── */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 sm:p-6">
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
                <SubScore label="Performance"  score={perfScore || null} />
                <SubScore label="SEO"          score={seoScore || null} />
                <SubScore label="Mobile"       score={mobileScore || null} />
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
            </div>

            {/* ── SECTION 8: HISTORY ────────────────────────────────────────── */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 sm:p-6">
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
            </div>

          </div>

          {/* ════ RIGHT COLUMN ═══════════════════════════════════════════════ */}
          <div className="space-y-6 order-1 lg:order-2">

            {/* ── SECTION 4: READY-TO-SEND OUTREACH ────────────────────────── */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 sm:p-6">
              <h3 className="mb-3 text-base font-semibold text-[var(--text-primary)]">Ready-to-Send Outreach</h3>

              {/* Channel tabs with contact status dots */}
              <div className="mb-3 flex gap-1 rounded-lg bg-[var(--bg-elevated)] p-1">
                {OUTREACH_CHANNELS.map((channel) => {
                  const ChannelIcon = channel.icon;
                  const contactLabel = channel.id === "email" ? contactInfo.email : contactInfo.phone;
                  const hasContact = !!contactLabel;
                  return (
                    <button
                      key={channel.id}
                      onClick={() => setOutreachChannel(channel.id)}
                      className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors duration-150 ${
                        outreachChannel === channel.id
                          ? "bg-[var(--bg-surface)] text-[var(--accent)] shadow-[var(--shadow-xs)]"
                          : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${contactInfo.loading ? "bg-[var(--text-tertiary)] animate-pulse" : hasContact ? "bg-[var(--score-good)]" : "bg-[var(--text-tertiary)]"}`} />
                      <ChannelIcon className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">{channel.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Contact info per channel */}
              {!contactInfo.loading && (() => {
                let contactLabel: string | null = null;
                let contactAction: { label: string; url?: string } | null = null;
                if (outreachChannel === "email") {
                  if (contactInfo.email) {
                    contactLabel = contactInfo.email;
                    contactAction = { label: "Send via email", url: `mailto:${contactInfo.email}` };
                  }
                } else if (outreachChannel === "whatsapp") {
                  if (contactInfo.phone) {
                    contactLabel = contactInfo.phone;
                    contactAction = { label: "Open WhatsApp", url: `https://wa.me/${contactInfo.phone.replace(/[^0-9]/g, "")}` };
                  }
                }
                if (contactLabel) {
                  return (
                    <div className="mb-3 flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2">
                      <span className="text-xs text-[var(--text-secondary)] truncate max-w-[60%]">{contactLabel}</span>
                      {contactAction?.url && (
                        <a href={contactAction.url} target="_blank" rel="noreferrer"
                          className="inline-flex cursor-pointer items-center gap-1 rounded-md bg-[var(--accent)] px-2.5 py-1 text-[10px] font-medium text-white transition-colors duration-150 hover:bg-[var(--accent-hover)] shrink-0">
                          <ExternalLink className="h-3 w-3" /> {contactAction.label}
                        </a>
                      )}
                    </div>
                  );
                }
                // Not found
                if (outreachChannel === "email") {
                  return (
                    <div className="mb-3 space-y-2">
                      <p className="text-xs text-[var(--text-tertiary)]">Couldn&rsquo;t find an email address on the website.</p>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          value={manualEmail}
                          onChange={(e) => setManualEmail(e.target.value)}
                          placeholder="Paste email address manually..."
                          className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)]"
                        />
                      </div>
                    </div>
                  );
                }
                return (
                  <div className="mb-3 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2">
                    <p className="text-xs text-[var(--text-tertiary)]">Couldn&rsquo;t find a phone number on the website.</p>
                  </div>
                );
              })()}

              {/* Pitch controls */}
              <div className="mb-3 flex flex-wrap gap-2">
                <PipelineSelect
                  value={pitchTone}
                  onChange={(v) => setPitchTone(v as typeof pitchTone)}
                  options={[
                    { value: "professional", label: "Professional" },
                    { value: "friendly", label: "Friendly" },
                    { value: "luxury", label: "Luxury" },
                  ]}
                />
                <PipelineSelect
                  value={pitchLength}
                  onChange={(v) => setPitchLength(v as typeof pitchLength)}
                  options={[
                    { value: "short", label: "Short" },
                    { value: "medium", label: "Medium" },
                    { value: "detailed", label: "Detailed" },
                  ]}
                />
                <div className="relative inline-block">
                  {hasAudit && hasDesign ? (
                    <button
                      onClick={handleGeneratePitch}
                      disabled={generatingPitch}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white transition-colors duration-150 hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {generatingPitch && <Loader2 className="h-3 w-3 animate-spin" />}
                      <Send className="h-3 w-3" />
                      {generatingPitch ? "Generating…" : "Generate"}
                    </button>
                  ) : (
                    <div
                      className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg bg-[var(--bg-surface-2)] px-3 py-1.5 text-xs font-medium text-[var(--text-tertiary)] opacity-60"
                      title="Analyse this lead first to generate a pitch"
                    >
                      <Mail className="h-3 w-3" />
                      Generate (analyse first)
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

              {pitchResult ? (
                <div className="space-y-2 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-3">
                  <p className="text-sm font-medium text-[var(--text-primary)]">{pitchResult.subject}</p>
                  <p className="whitespace-pre-wrap text-xs text-[var(--text-secondary)] leading-relaxed">{pitchResult.body}</p>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={handleCopyPitch}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors duration-150 hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
                    >
                      <Copy className="h-3 w-3" /> Copy
                    </button>
                    <button
                      onClick={handleGeneratePitch}
                      disabled={generatingPitch}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors duration-150 hover:border-[var(--accent)]/40 hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {generatingPitch ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                      Regenerate
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[var(--text-tertiary)]">Configure tone and length, then click Generate.</p>
              )}
            </div>

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
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 sm:p-6">
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

      </div>

      {/* Quota error banner */}
      {quotaError && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-3.5 shadow-[var(--brand-shadow-lg)]">
          <AlertTriangle className="h-5 w-5 shrink-0 text-[var(--score-mid)]" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-400">{quotaError}</p>
            {quotaRetryTimer > 0 && <p className="mt-0.5 text-xs text-amber-500">Retry available in {quotaRetryTimer}s</p>}
          </div>
          <button onClick={clearQuotaTimer}
            className="cursor-pointer rounded-lg border border-amber-500/30 bg-amber-500/15 px-3 py-1.5 text-xs font-medium text-amber-400 transition-colors hover:bg-amber-500/25">
            {quotaRetryTimer > 0 ? `Wait ${quotaRetryTimer}s` : "Dismiss"}
          </button>
        </div>
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
