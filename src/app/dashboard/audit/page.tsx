"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, CheckCircle2, Circle, Globe, Loader2, Mail, Monitor, Plus, RefreshCw, Search, Smartphone } from "lucide-react";
import { MetricKey, METRIC_META, metricColor } from "@/lib/metric-meta";

// ── Types ─────────────────────────────────────────────────────────────────────

type StrategyResult = {
  performance_score: number | null;
  seo_score?: number | null;
  fcp: string | null;
  lcp: string | null;
  tbt: string | null;
  cls: string | null;
  status: "ok" | "timeout" | "error";
};

type DesignResult = {
  status: "ok" | "error";
  design_score?: number;
  issues?: { title: string; detail: string; point_deduction?: number; impact?: string }[];
  error?: string;
};


// ── Progress steps (Fix 1) ─────────────────────────────────────────────────────

const AUDIT_STEP_KEYS = ["fetching", "mobile", "desktop", "audit_complete"] as const;

const ALL_STEPS: { key: string; label: string }[] = [
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

// ── Helpers ────────────────────────────────────────────────────────────────────

function getPerformanceSummary(mobile: number | null, desktop: number | null): string {
  if (mobile === null && desktop === null) return "";
  const count = (mobile !== null ? 1 : 0) + (desktop !== null ? 1 : 0);
  const avg = ((mobile ?? 0) + (desktop ?? 0)) / count;
  if (avg >= 85) return "This site loads quickly on both mobile and desktop. Performance is a strength.";
  if (avg >= 70) return "This site performs reasonably well but has room for improvement, especially on mobile.";
  if (avg >= 50) return "This site is noticeably slow. Visitors on mobile are likely leaving before it loads.";
  return "This site is critically slow. Most visitors will abandon it before seeing any content.";
}

function getDesignSummary(
  mobileIssues: DesignResult["issues"],
  desktopIssues: DesignResult["issues"],
): string {
  const all = [...(mobileIssues ?? []), ...(desktopIssues ?? [])];
  if (all.length === 0) return "";
  const top = all.slice(0, 3).map((i) => i.title.toLowerCase());
  if (top.length === 1) return `The main issue found: ${top[0]}.`;
  const last = top.pop();
  return `The main issues found: ${top.join(", ")}, and ${last}.`;
}

/** Map a design analysis error string to a user-friendly title + description. */
function getDesignErrorDisplay(error: string | undefined): { title: string; description: string } {
  if (!error) return { title: "Analysis failed", description: "Click retry to try again." };
  const lower = error.toLowerCase();
  if (lower.includes("screenshot")) {
    return { title: "Site couldn't be loaded", description: "The site could not be loaded for analysis." };
  }
  if (error === "AI_SERVICE_BUSY") {
    return { title: "Our AI is busy", description: "Click retry to try again." };
  }
  return { title: "Analysis failed", description: "Click retry to try again." };
}

function timeAgo(ts: number): string {
  const mins = Math.floor((Date.now() - ts) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  return `${Math.floor(hours / 24)} days ago`;
}

const STORAGE_KEY = "ai_audit_last_result";

// ── Sub-components ─────────────────────────────────────────────────────────────

function SubScore({ label, score }: { label: string; score: number | null | undefined }) {
  const color = !score ? "text-[var(--text-tertiary)]" : score >= 70 ? "text-[var(--score-good)]" : score >= 40 ? "text-[var(--score-mid)]" : "text-[var(--score-high)]";
  return (
    <div className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2">
      <span className="text-sm text-[var(--text-secondary)]">{label}</span>
      <span className={`text-sm font-bold ${color}`}>{score ?? "—"}</span>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AuditPage() {
  const [url, setUrl] = useState("");
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState<"idle" | "auditing" | "design" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const [auditResult, setAuditResult] = useState<{ mobile: StrategyResult; desktop: StrategyResult } | null>(null);
  const [designResult, setDesignResult] = useState<{ mobile: DesignResult; desktop: DesignResult } | null>(null);
  const [quotaError, setQuotaError] = useState<string | null>(null);
  const [quotaRetryTimer, setQuotaRetryTimer] = useState(0);
  const [completedKeys, setCompletedKeys] = useState<string[]>([]);
  const [activeKeys, setActiveKeys] = useState<string[]>([]);
  const [savedTimestamp, setSavedTimestamp] = useState<number | null>(null);
  const [showPitchResult, setShowPitchResult] = useState(false);
  const [pitchResult, setPitchResult] = useState<string | null>(null);
  const [pitchLoading, setPitchLoading] = useState(false);
  const [pipelineLoading, setPipelineLoading] = useState(false);
  const [pipelineAdded, setPipelineAdded] = useState(false);
  const [pipelineError, setPipelineError] = useState<string | null>(null);
  const [designRetrying, setDesignRetrying] = useState<{ mobile: boolean; desktop: boolean }>({ mobile: false, desktop: false });
  const quotaTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fix 2: restore from sessionStorage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as {
        url?: string;
        auditResult?: { mobile: StrategyResult; desktop: StrategyResult };
        designResult?: { mobile: DesignResult; desktop: DesignResult };
        timestamp?: number;
      };
      // sessionStorage restoration is a synchronous read — this is the idiomatic
      // pattern for hydrating component state from an external cache on mount.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (parsed.url) setUrl(parsed.url);
      if (parsed.auditResult) {
        setAuditResult(parsed.auditResult);
        setStep("done");
        setCompletedKeys(ALL_STEPS.map((s) => s.key));
      }
      if (parsed.designResult) setDesignResult(parsed.designResult);
      if (parsed.timestamp) setSavedTimestamp(parsed.timestamp);
    } catch {
      // ignore parse errors
    }
  }, []);

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

  const handleRun = async () => {
    if (!url.trim()) return;

    // Fix 2: clear saved result when starting new audit
    sessionStorage.removeItem(STORAGE_KEY);
    setSavedTimestamp(null);

    setRunning(true);
    setError(null);
    setPipelineError(null);
    setPipelineAdded(false);
    setAuditResult(null);
    setDesignResult(null);
    setCompletedKeys([]);
    setActiveKeys([]);
    setStep("auditing");

    let localAuditResult: { mobile: StrategyResult; desktop: StrategyResult } | null = null;
    let localDesignResult: { mobile: DesignResult; desktop: DesignResult } | null = null;

    // ── Phase 1: stream from /api/audit ───────────────────────────────
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ website: url.trim() }),
      });
      if (!res.ok) throw new Error("Audit failed");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

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
              // Map "complete" in audit phase to "audit_complete"
              const key = parsed.step === "complete" ? "audit_complete" : parsed.step;
              setActiveKeys((prev) => (prev.includes(key) ? prev : [...prev, key]));
            } else if (parsed.type === "result") {
              localAuditResult = { mobile: parsed.mobile, desktop: parsed.desktop };
              setAuditResult(localAuditResult);
              setCompletedKeys([...AUDIT_STEP_KEYS]);
              setActiveKeys([]);
            }
          } catch {
            // skip malformed lines
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Audit failed");
      setRunning(false);
      return;
    }

    // ── Phase 2: stream from /api/analyze-design ──────────────────────
    setStep("design");
    try {
      const res = await fetch("/api/analyze-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ website: url.trim() }),
      });
      if (!res.ok) throw new Error("Design analysis failed");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

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
              // Map "complete" in design phase to "design_complete"
              const key = parsed.step === "complete" ? "design_complete" : parsed.step;
              setActiveKeys((prev) => (prev.includes(key) ? prev : [...prev, key]));
            } else if (parsed.type === "result") {
              localDesignResult = { mobile: parsed.mobile, desktop: parsed.desktop };
              setDesignResult(localDesignResult);
              setCompletedKeys(ALL_STEPS.map((s) => s.key));
              setActiveKeys([]);
            } else if (parsed.type === "error" && parsed.error === "AI_QUOTA_EXCEEDED") {
              isQuotaError = true;
            }
          } catch {
            // skip malformed lines
          }
        }
      }

      if (isQuotaError) {
        setQuotaError("AI quota exceeded — please wait a moment and try again");
        startQuotaTimer(60);
        setRunning(false);
        return;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Design analysis failed");
    }

    // Fix 2: persist to sessionStorage
    if (localAuditResult) {
      try {
        const ts = Date.now();
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
          url: url.trim(),
          auditResult: localAuditResult,
          designResult: localDesignResult,
          timestamp: ts,
        }));
        setSavedTimestamp(ts);
      } catch {
        // ignore storage errors
      }
    }

    setStep("done");
    setRunning(false);
  };

  const showProgress = running || completedKeys.length > 0;

  // ── Pitch handler ──────────────────────────────────────────────────────────
  const handleGeneratePitch = useCallback(async () => {
    if (!url.trim() || !auditResult) return;
    setPitchLoading(true);
    setPitchResult(null);
    setShowPitchResult(true);

    try {
      const res = await fetch("/api/pitch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          website: url.trim(),
          audit: auditResult,
          design: designResult,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Distinguish between "no data" (400) and "AI failed" (502/other)
        if (res.status === 400) {
          throw new Error("Cannot generate pitch — no audit or design data available. Run the audit first.");
        }
        throw new Error(data.error ?? "AI service is busy. Please try again.");
      }

      setPitchResult(data.pitch ?? "No pitch could be generated.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate pitch. Please try again.";
      setPitchResult(message);
    } finally {
      setPitchLoading(false);
    }
  }, [url, auditResult, designResult]);

  const handleAddToPipeline = useCallback(async () => {
    if (!url.trim() || !auditResult) return;
    setPipelineError(null);
    setPipelineLoading(true);

    try {
      const res = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          website: url.trim(),
          audit: auditResult,
          design: designResult,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error ?? data.message ?? "Failed to add to pipeline");
      }

      setPipelineAdded(true);
    } catch (err) {
      setPipelineError(err instanceof Error ? err.message : "Failed to add to pipeline");
    } finally {
      setPipelineLoading(false);
    }
  }, [url, auditResult, designResult]);

  // ── Retry design analysis for a single strategy ──────────────────────────
  const handleRetryDesign = useCallback(async (strategy: "mobile" | "desktop") => {
    if (!url.trim()) return;
    setDesignRetrying((prev) => ({ ...prev, [strategy]: true }));

    try {
      const res = await fetch("/api/analyze-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ website: url.trim() }),
      });

      if (!res.ok) throw new Error("Design analysis failed");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";
      let newDesignResult: { mobile: DesignResult; desktop: DesignResult } | null = null;

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
            if (parsed.type === "result") {
              newDesignResult = { mobile: parsed.mobile, desktop: parsed.desktop };
            }
          } catch {
            // skip malformed lines
          }
        }
      }

      if (newDesignResult) {
        setDesignResult((prev) => {
          if (!prev) return newDesignResult;
          // Merge: update only the retried strategy, keep the other one as-is
          return {
            mobile: strategy === "mobile" ? newDesignResult!.mobile : prev.mobile,
            desktop: strategy === "desktop" ? newDesignResult!.desktop : prev.desktop,
          };
        });
      }
    } catch {
      // Error result is already in the stream — no additional action needed
    } finally {
      setDesignRetrying((prev) => ({ ...prev, [strategy]: false }));
    }
  }, [url]);

  // ── Empty state (idle) ──────────────────────────────────────────────────────
  if (step === "idle" && !error && !auditResult && !showProgress) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)]">
        <div className="mx-auto max-w-4xl px-6 py-8">
          <Link href="/dashboard" className="mb-6 inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] transition-colors duration-150 hover:text-[var(--text-primary)]">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface-1)] p-6">
            <h1 className="text-2xl font-medium text-[var(--text-primary)]">Opportunity Review</h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Enter any website URL to evaluate its performance, design quality, and opportunity potential.
            </p>

            <div className="mt-6 flex gap-3">
              <div className="relative flex-1">
                <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !running && url.trim() && handleRun()}
                  placeholder="https://example.com"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface-2)] py-2.5 pl-10 pr-4 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] transition-colors duration-150 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
                />
              </div>
              <button
                onClick={handleRun}
                disabled={running || !url.trim()}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Search className="h-4 w-4" />
                Review Opportunity
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Error state (with retry) ────────────────────────────────────────────────
  if (error && !running && !auditResult) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)]">
        <div className="mx-auto max-w-4xl px-6 py-8">
          <Link href="/dashboard" className="mb-6 inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] transition-colors duration-150 hover:text-[var(--text-primary)]">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>

          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-[var(--score-high)]" />
            <h2 className="mt-3 text-lg font-medium text-[var(--text-primary)]">Review Failed</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{error}</p>
            <button
              onClick={() => { setError(null); setStep("idle"); setRunning(false); }}
              className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[var(--accent)] px-5 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-[var(--accent-hover)]"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <Link href="/dashboard" className="mb-6 inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] transition-colors duration-150 hover:text-[var(--text-primary)]">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>

        {/* URL input card — always visible */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface-1)] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] font-medium text-[var(--text-tertiary)]">Opportunity Review</p>
              <h1 className="mt-1 text-2xl font-medium text-[var(--text-primary)]">
                {step === "done" ? "Review Complete" : "Reviewing Opportunity"}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {step === "done" && (
                <>
                  <button
                    onClick={() => {
                      sessionStorage.removeItem(STORAGE_KEY);
                      setStep("idle");
                      setUrl("");
                      setAuditResult(null);
                      setDesignResult(null);
                      setError(null);
                      setCompletedKeys([]);
                      setActiveKeys([]);
                      setSavedTimestamp(null);
                      setShowPitchResult(false);
                      setPitchResult(null);
                      setPipelineAdded(false);
                      setPipelineError(null);
                    }}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors duration-150 hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
                  >
                    <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none"><path d="M1.5 1.5l9 9M10.5 1.5l-9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                    New Search
                  </button>
                  <div className="rounded-lg border border-[var(--score-good)]/30 bg-[var(--score-good-tint)] px-3 py-1.5 text-xs font-medium text-[var(--badge-green-text)]">
                    <CheckCircle2 className="mr-1 inline h-3 w-3" />
                    Complete
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <div className="relative flex-1">
              <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !running && url.trim() && handleRun()}
                placeholder="https://example.com"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface-2)] py-2.5 pl-10 pr-4 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] transition-colors duration-150 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
              />
            </div>
            <button
              onClick={handleRun}
              disabled={running || !url.trim()}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {running ? (step === "auditing" ? "Reviewing…" : "Analysing…") : "Review Again"}
            </button>
          </div>

          {/* Progress checklist */}
          {showProgress && (
            <div className="mt-4">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface-2)] p-4">
                <div className="space-y-0.5">
                  {ALL_STEPS.map((stepDef) => {
                    const isDone   = completedKeys.includes(stepDef.key);
                    const isActive = !isDone && activeKeys.includes(stepDef.key);
                    return (
                      <div
                        key={stepDef.key}
                        className="flex items-center gap-3 py-1.5"
                      >
                        {isDone ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--score-good)]" />
                        ) : isActive ? (
                          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[var(--accent)]" />
                        ) : (
                          <Circle className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                        )}
                        <span className={`text-sm ${
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

          {error && (
            <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {quotaError && (
            <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--score-mid)]" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-400">{quotaError}</p>
                  {quotaRetryTimer > 0 && (
                    <p className="mt-0.5 text-xs text-amber-500">Retry available in {quotaRetryTimer}s</p>
                  )}
                </div>
                <button
                  onClick={clearQuotaTimer}
                  className="cursor-pointer shrink-0 rounded-lg border border-amber-500/30 bg-amber-500/15 px-3 py-1.5 text-xs font-medium text-amber-400 transition-colors hover:bg-amber-500/25"
                >
                  {quotaRetryTimer > 0 ? `Wait ${quotaRetryTimer}s` : "Dismiss"}
                </button>
              </div>
            </div>
          )}
        </div>

        {savedTimestamp !== null && auditResult && !running && (
          <p className="mt-3 text-xs text-[var(--text-tertiary)]">
            Showing results from {timeAgo(savedTimestamp)}
          </p>
        )}

        {/* Timeout error panel — both strategies timed out */}
        {auditResult && auditResult.mobile.status === "timeout" && auditResult.desktop.status === "timeout" && (
          <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-8 text-center">
            <AlertTriangle className="mx-auto h-10 w-10 text-[var(--score-mid)]" />
            <h2 className="mt-4 text-lg font-medium text-[var(--text-primary)]">Couldn&rsquo;t reach the site</h2>
            <p className="mt-2 max-w-md mx-auto text-sm text-[var(--text-secondary)]">
              The site took too long to respond. This usually means it&rsquo;s down, very slow, or blocking automated checks. Try again or test a different URL.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                onClick={handleRun}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-[var(--accent-hover)]"
              >
                <Loader2 className="h-4 w-4" />
                Try again
              </button>
              <button
                onClick={() => {
                  sessionStorage.removeItem(STORAGE_KEY);
                  setStep("idle");
                  setUrl("");
                  setAuditResult(null);
                  setDesignResult(null);
                  setError(null);
                  setCompletedKeys([]);
                  setActiveKeys([]);
                  setSavedTimestamp(null);
                  setShowPitchResult(false);
                  setPitchResult(null);
                  setPipelineAdded(false);
                  setPipelineError(null);
                }}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--border)] px-5 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-colors duration-150 hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
              >
                <Search className="h-4 w-4" />
                Try a different URL
              </button>
            </div>
          </div>
        )}

        {/* Results — skip if both timed out (handled above) */}
        {auditResult && !(auditResult.mobile.status === "timeout" && auditResult.desktop.status === "timeout") && (
          <div className="mt-6 space-y-6">
            {/* Performance Scores */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface-1)] p-6">
              <h2 className="mb-4 text-lg font-medium text-[var(--text-primary)]">Performance Scores</h2>
              <div className="grid gap-6 md:grid-cols-2">
                {(["mobile", "desktop"] as const).map((s) => {
                  const d = auditResult[s];
                  const StratIcon = s === "mobile" ? Smartphone : Monitor;
                  return (
                    <div key={s} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <StratIcon className="h-4 w-4 text-[var(--text-tertiary)]" />
                        <p className="text-sm font-medium text-[var(--text-primary)]">
                          {s === "mobile" ? "Mobile" : "Desktop"}
                        </p>
                      </div>
                      {d.status === "ok" ? (
                        <>
                          <SubScore label="Performance" score={d.performance_score} />
                          {d.seo_score !== undefined && <SubScore label="SEO" score={d.seo_score} />}
                          <div className="space-y-2">
                            {(["fcp", "lcp", "tbt", "cls"] as MetricKey[]).map((key) => {
                              const rawVal = d[key];
                              return (
                                <div key={key} className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface-2)] px-3 py-2.5">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs font-medium text-[var(--text-primary)]">{METRIC_META[key].label}</p>
                                      <p className="mt-0.5 text-[10px] text-[var(--text-tertiary)]">{METRIC_META[key].subtitle}</p>
                                    </div>
                                    <span className={`shrink-0 text-sm font-bold ${metricColor(key, rawVal)}`}>
                                      {rawVal ?? "—"}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-[var(--score-high)]">{d.status === "timeout" ? "Timed out" : "Failed"}</p>
                      )}
                    </div>
                  );
                })}
              </div>

              {(() => {
                const summary = getPerformanceSummary(
                  auditResult.mobile.performance_score,
                  auditResult.desktop.performance_score,
                );
                return summary ? (
                  <div className="mt-4 rounded-lg border border-[var(--accent)]/30 bg-[var(--accent-tint)] p-3 text-sm text-[var(--accent)]">
                    {summary}
                  </div>
                ) : null;
              })()}
            </div>

            {/* Design Analysis */}
            {designResult && (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface-1)] p-6">
                <h2 className="mb-4 text-lg font-medium text-[var(--text-primary)]">Design Analysis</h2>
                <div className="grid gap-6 md:grid-cols-2">
                  {(["mobile", "desktop"] as const).map((s) => {
                    const d = designResult[s];
                    const StratIcon = s === "mobile" ? Smartphone : Monitor;
                    const errDisplay = d.status !== "ok" ? getDesignErrorDisplay(d.error) : null;
                    return (
                      <div key={s}>
                        <div className="mb-3 flex items-center gap-2">
                          <StratIcon className="h-4 w-4 text-[var(--text-tertiary)]" />
                          <p className="text-sm font-medium text-[var(--text-primary)]">
                            {s === "mobile" ? "Mobile" : "Desktop"}
                          </p>
                        </div>
                        {d.status === "ok" ? (
                          <>
                            <div className="mb-3 flex items-baseline gap-1.5">
                              <span className="text-2xl font-bold text-[var(--text-primary)]">{d.design_score}</span>
                              <span className="text-sm text-[var(--text-tertiary)]">/ 100</span>
                            </div>
                            {d.issues && d.issues.length > 0 && (
                              <div className="space-y-2">
                                <p className="text-xs font-medium text-[var(--text-tertiary)]">Issues found</p>
                                {d.issues.slice(0, 3).map((issue, i) => (
                                  <div key={i} className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface-2)] p-2">
                                    <p className="text-xs font-medium text-[var(--text-primary)]">{issue.title}</p>
                                    <p className="mt-0.5 text-[11px] text-[var(--text-tertiary)]">{issue.detail}</p>
                                    {issue.point_deduction && (
                                      <span className="mt-1 inline-block text-[10px] font-semibold text-[var(--score-high)]">
                                        −{issue.point_deduction} pts
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="rounded-lg border border-dashed border-red-500/30 bg-red-500/10 p-4">
                            <div className="text-center">
                              <p className="text-sm font-medium text-[var(--score-high)]">{errDisplay?.title ?? "Analysis failed"}</p>
                              <p className="mt-1 text-xs text-red-400">{errDisplay?.description ?? "Click retry to try again."}</p>
                            </div>
                            <div className="mt-3 flex justify-center">
                              <button
                                onClick={() => handleRetryDesign(s)}
                                disabled={designRetrying[s]}
                                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-500/15 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {designRetrying[s] ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <RefreshCw className="h-3 w-3" />
                                )}
                                {designRetrying[s] ? "Retrying…" : "Retry design analysis"}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {(() => {
                  const summary = getDesignSummary(designResult.mobile.issues, designResult.desktop.issues);
                  return summary ? (
                    <div className="mt-4 rounded-lg border border-[var(--accent)]/30 bg-[var(--accent-tint)] p-3 text-sm text-[var(--accent)]">
                      <span className="font-medium">What the AI found: </span>{summary}
                    </div>
                  ) : null;
                })()}
              </div>
            )}
          </div>
        )}

        {/* Success state — actions: Generate Pitch + Add to Pipeline */}
        {step === "done" && !error && auditResult && (
          <div className="mt-6 space-y-4">
            {/* Design data missing notice — only when performance exists but design failed */}
            {(!designResult || (designResult.mobile.status !== "ok" && designResult.desktop.status !== "ok")) && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
                Pitch will be based on performance data only.{" "}
                <button
                  onClick={() => {
                    if (designResult?.mobile.status !== "ok") handleRetryDesign("mobile");
                    if (designResult?.desktop.status !== "ok") handleRetryDesign("desktop");
                  }}
                  className="cursor-pointer underline hover:text-amber-300"
                >
                  Retry design analysis
                </button>{" "}
                above for a richer pitch.
              </div>
            )}

            {/* Generate Pitch */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface-1)] p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-base font-medium text-[var(--text-primary)]">Generate Pitch</h3>
                  <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
                    Create a personalised outreach message based on this review.
                  </p>
                </div>
                {auditResult.mobile.status === "timeout" && auditResult.desktop.status === "timeout" ? (
                  <div
                    className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg bg-[var(--bg-surface-2)] px-5 py-2.5 text-sm font-medium text-[var(--text-tertiary)]"
                    title="Generate Pitch (unavailable — audit failed)"
                  >
                    <Mail className="h-4 w-4" />
                    Generate Pitch (unavailable — audit failed)
                  </div>
                ) : (
                  <button
                    onClick={handleGeneratePitch}
                    disabled={pitchLoading}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {pitchLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Mail className="h-4 w-4" />
                    )}
                    {pitchLoading ? "Generating…" : "Generate Pitch"}
                  </button>
                )}
              </div>

              {/* Pitch result */}
              {showPitchResult && pitchResult && (
                <div className="mt-4">
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface-2)] p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs font-medium text-[var(--text-tertiary)]">Pitch Preview</span>
                      <button
                        onClick={() => { navigator.clipboard.writeText(pitchResult); }}
                        className="cursor-pointer text-xs font-medium text-[var(--accent)] hover:underline"
                      >
                        Copy to clipboard
                      </button>
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-secondary)]">
                      {pitchResult}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Add to Pipeline */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface-1)] p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-base font-medium text-[var(--text-primary)]">Add to Pipeline</h3>
                  <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
                    Save this opportunity to your pipeline and track progress.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddToPipeline}
                  disabled={pipelineLoading || pipelineAdded}
                  className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {pipelineAdded ? <CheckCircle2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  {pipelineLoading ? "Adding…" : pipelineAdded ? "Added" : "Add to Pipeline"}
                </button>
              </div>
              {pipelineError && (
                <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {pipelineError}
                </div>
              )}
              {pipelineAdded && (
                <div className="mt-4 rounded-lg border border-[var(--score-good)]/30 bg-[var(--score-good-tint)] px-4 py-3 text-sm text-[var(--badge-green-text)]">
                  Opportunity saved to your pipeline.
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
