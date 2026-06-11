"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowRight, Loader2, Search } from "lucide-react";
import { readNdjsonStream } from "@/lib/ndjson";
import { FadeUp } from "@/lib/motion";
import { useReducedMotion } from "@/lib/motion";
import {
  AuditForm,
  AuditProgressPanel,
  AuditResultsPanel,
  ReviewCompleteActions,
  ExampleReportModal,
} from "./components";
import type {
  StrategyResult,
  DesignResult,
  AuditStep,
  ExampleTab,
  DesignRetrying,
} from "./components";
import { AUDIT_STEP_KEYS } from "./components/AuditProgressPanel";

// ── Constants ───────────────────────────────────────────────────────────────────
const SAVE_INTERVAL_MS = 3000;
const AUDIT_COMPLETED_KEY = "nearsited_has_completed_audit";
const STORAGE_KEY = "ai_audit_last_result";

// ── Helper ─────────────────────────────────────────────────────────────────────
function timeAgo(ts: number): string {
  const mins = Math.floor((Date.now() - ts) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  return `${Math.floor(hours / 24)} days ago`;
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AuditPage() {
  const router = useRouter(); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [url, setUrl] = useState("");
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState<AuditStep>("idle");
  const [error, setError] = useState<string | null>(null);
  const [auditResult, setAuditResult] = useState<{
    mobile: StrategyResult;
    desktop: StrategyResult;
  } | null>(null);
  const [designResult, setDesignResult] = useState<{
    mobile: DesignResult;
    desktop: DesignResult;
  } | null>(null);
  const [quotaError, setQuotaError] = useState<string | null>(null);
  const [quotaRetryTimer, setQuotaRetryTimer] = useState(0);
  const [completedKeys, setCompletedKeys] = useState<string[]>([]);
  const [activeKeys, setActiveKeys] = useState<string[]>([]);
  const [savedTimestamp, setSavedTimestamp] = useState<number | null>(null);
  const [mapsLookupUrl, setMapsLookupUrl] = useState("");
  const [mapsLookupLoading, setMapsLookupLoading] = useState(false);
  const [mapsLookupHint, setMapsLookupHint] = useState<string | null>(null);
  const [mapsRating, setMapsRating] = useState<number | null>(null);
  const [mapsReviewCount, setMapsReviewCount] = useState<number | null>(null);
  const [_mapsPlaceId, setMapsPlaceId] = useState<string | null>(null);
  const [mapsBusinessName, setMapsBusinessName] = useState<string | null>(null);
  const [designRetrying, setDesignRetrying] = useState<DesignRetrying>({
    mobile: false,
    desktop: false,
  });
  const [hasCompletedAudit, setHasCompletedAudit] = useState(false);
  const [showExampleModal, setShowExampleModal] = useState(false);
  const [exampleTab, setExampleTab] = useState<ExampleTab>("weak_website");
  const quotaTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);
  const saveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const urlRef = useRef("");
  const pendingAutoRunRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const cancelledRef = useRef(false);
  const shouldReduce = useReducedMotion();

  // Read hasCompletedAudit from localStorage on mount
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHasCompletedAudit(localStorage.getItem(AUDIT_COMPLETED_KEY) === "true");
    } catch {
      /* ignore */
    }
  }, []);

  // Mark completed when step reaches "done"
  useEffect(() => {
    if (step === "done") {
      try {
        localStorage.setItem(AUDIT_COMPLETED_KEY, "true");
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setHasCompletedAudit(true);
      } catch {
        /* ignore */
      }
    }
  }, [step]);

  // ── Helpers to save/load intermediate state ──────────────────────────────────
  const saveCurrentState = useCallback(
    (
      audit: typeof auditResult,
      design: typeof designResult,
      u: string,
      ts?: number,
    ) => {
      try {
        sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            url: u,
            auditResult: audit,
            designResult: design,
            timestamp: ts ?? Date.now(),
          }),
        );
      } catch {
        /* ignore storage errors */
      }
    },
    [],
  );

  // ── Keep refs in sync ────────────────────────────────────────────────────────
  const runningRef = useRef(false);
  useEffect(() => {
    runningRef.current = running;
  }, [running]);
  useEffect(() => {
    urlRef.current = url;
  }, [url]);

  // ── Cleanup on unmount ──────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (saveIntervalRef.current) clearInterval(saveIntervalRef.current);
      if (runningRef.current && urlRef.current) {
        try {
          const stored = sessionStorage.getItem(STORAGE_KEY);
          const base = stored ? (JSON.parse(stored) as Record<string, unknown>) : {};
          sessionStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
              ...base,
              url: urlRef.current,
              interrupted: true,
              interruptedAt: Date.now(),
            }),
          );
        } catch {
          /* ignore */
        }
      }
    };
  }, []);

  // Restore from sessionStorage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as {
        url?: string;
        auditResult?: { mobile: StrategyResult; desktop: StrategyResult };
        designResult?: { mobile: DesignResult; desktop: DesignResult };
        timestamp?: number;
        interrupted?: boolean;
        interruptedAt?: number;
      };

      // If interrupted recently (< 15 min), auto-restart
      const interruptedRecently =
        parsed.interrupted &&
        parsed.interruptedAt &&
        Date.now() - parsed.interruptedAt < 15 * 60 * 1000;
      if (interruptedRecently && parsed.url) {
        sessionStorage.removeItem(STORAGE_KEY);
        pendingAutoRunRef.current = parsed.url;
        urlRef.current = parsed.url;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUrl(parsed.url);
        return;
      }

      if (parsed.url) setUrl(parsed.url);
      if (parsed.auditResult) {
        setAuditResult(parsed.auditResult);
        setStep("done");
        setCompletedKeys(AUDIT_STEP_KEYS.map((k) => k));
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

  const handleCancel = () => {
    cancelledRef.current = true;
    abortControllerRef.current?.abort();
    if (saveIntervalRef.current) {
      clearInterval(saveIntervalRef.current);
      saveIntervalRef.current = null;
    }
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ ...parsed, interrupted: false }),
        );
      }
    } catch {
      /* ignore */
    }
    setRunning(false);
    setStep("idle");
    setCompletedKeys([]);
    setActiveKeys([]);
    setError(null);
  };

  const handleRun = async (urlOverride?: string) => {
    let trimmedUrl = (urlOverride ?? url).trim();
    if (!trimmedUrl) return;
    if (!/^https?:\/\//i.test(trimmedUrl)) trimmedUrl = "https://" + trimmedUrl;
    if (urlOverride) setUrl(trimmedUrl);
    else setUrl(trimmedUrl);

    cancelledRef.current = false;
    abortControllerRef.current = new AbortController();

    sessionStorage.removeItem(STORAGE_KEY);
    setSavedTimestamp(null);

    setRunning(true);
    setError(null);
    setAuditResult(null);
    setDesignResult(null);
    setCompletedKeys([]);
    setActiveKeys([]);
    setStep("auditing");

    let localAuditResult: {
      mobile: StrategyResult;
      desktop: StrategyResult;
    } | null = null;
    let localDesignResult: {
      mobile: DesignResult;
      desktop: DesignResult;
    } | null = null;
    let auditError: string | null = null;
    let isQuotaError = false;

    const signal = abortControllerRef.current!.signal;

    const auditResponsePromise = fetch("/api/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ website: trimmedUrl }),
      signal,
    });
    const designResponsePromise = fetch("/api/analyze-design", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ website: trimmedUrl }),
      signal,
    });

    const progressiveSave = () => {
      if (localAuditResult || localDesignResult) {
        saveCurrentState(localAuditResult, localDesignResult, trimmedUrl);
      }
    };
    saveIntervalRef.current = setInterval(progressiveSave, SAVE_INTERVAL_MS);

    const auditProcess = (async () => {
      try {
        const res = await auditResponsePromise;
        if (!res.ok) throw new Error("Audit failed");

        await readNdjsonStream(res, {
          onProgress: (stepKey) => {
            const key = stepKey === "complete" ? "audit_complete" : stepKey;
            setActiveKeys((prev) =>
              prev.includes(key) ? prev : [...prev, key],
            );
          },
          onResult: (data) => {
            localAuditResult = {
              mobile: data.mobile as StrategyResult,
              desktop: data.desktop as StrategyResult,
            };
            setAuditResult(localAuditResult);
            setCompletedKeys([...AUDIT_STEP_KEYS]);
            setActiveKeys([]);
            progressiveSave();
          },
        });
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        auditError = err instanceof Error ? err.message : "Audit failed";
      }
    })();

    const designProcess = (async () => {
      try {
        const res = await designResponsePromise;

        if (!res.ok) {
          let errMsg = "Design analysis failed";
          try {
            const errBody = (await res.json()) as {
              error?: string;
              message?: string;
            };
            errMsg = errBody.error ?? errBody.message ?? errMsg;
          } catch {
            /* ignore parse failure */
          }
          localDesignResult = {
            mobile: { status: "error", error: errMsg },
            desktop: { status: "error", error: errMsg },
          };
          setDesignResult(localDesignResult);
          return;
        }

        await readNdjsonStream(res, {
          onProgress: (stepKey) => {
            const key =
              stepKey === "complete" ? "design_complete" : stepKey;
            setActiveKeys((prev) =>
              prev.includes(key) ? prev : [...prev, key],
            );
          },
          onResult: (data) => {
            localDesignResult = {
              mobile: data.mobile as DesignResult,
              desktop: data.desktop as DesignResult,
            };
            setDesignResult(localDesignResult);
            setCompletedKeys(
              [...AUDIT_STEP_KEYS, "mobile-screenshot", "desktop-screenshot", "analysing_mobile", "analysing_desktop", "design_complete"],
            );
            setActiveKeys([]);
            progressiveSave();
          },
          onError: (errMsg) => {
            if (
              errMsg === "AI_QUOTA_EXCEEDED" ||
              errMsg === "AI_SERVICE_BUSY"
            ) {
              isQuotaError = true;
            }
            localDesignResult = {
              mobile: { status: "error", error: errMsg },
              desktop: { status: "error", error: errMsg },
            };
            setDesignResult(localDesignResult);
          },
        });
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        const errMsg = err instanceof Error ? err.message : "Design analysis failed";
        localDesignResult = {
          mobile: { status: "error", error: errMsg },
          desktop: { status: "error", error: errMsg },
        };
        setDesignResult(localDesignResult);
      }
    })();

    await Promise.all([auditProcess, designProcess]);

    if (saveIntervalRef.current) {
      clearInterval(saveIntervalRef.current);
      saveIntervalRef.current = null;
    }

    if (cancelledRef.current) return;

    if (!mountedRef.current) {
      progressiveSave();
      return;
    }

    if (auditError) {
      setError(auditError);
      setRunning(false);
      return;
    }

    if (isQuotaError) {
      setQuotaError("AI quota exceeded — please wait a moment and try again");
      startQuotaTimer(60);
      setRunning(false);
      return;
    }

    if (localAuditResult) {
      const ts = Date.now();
      saveCurrentState(localAuditResult, localDesignResult, trimmedUrl, ts);
      setSavedTimestamp(ts);
    }

    setStep("done");
    setRunning(false);
  };

  // Auto-restart if interrupted
  useEffect(() => {
    if (pendingAutoRunRef.current) {
      const u = pendingAutoRunRef.current;
      pendingAutoRunRef.current = null;
      void handleRun(u);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showProgress = (running || completedKeys.length > 0) && step !== "done";

  const handleMapsLookup = useCallback(async () => {
    const rawUrl = mapsLookupUrl.trim();
    if (!rawUrl) return;
    setMapsLookupLoading(true);
    setMapsLookupHint(null);
    try {
      const res = await fetch(
        `/api/places-lookup?mapsUrl=${encodeURIComponent(rawUrl)}`,
      );
      const data = (await res.json()) as {
        found: boolean;
        name?: string;
        city?: string;
        suggested_business_type?: string;
        rating?: number;
        review_count?: number;
        place_id?: string;
        website?: string;
      };
      if (!data.found) {
        setMapsLookupHint("No business found. Fill in details manually below.");
      } else {
        const urlWasEmpty = !url.trim();
        if (data.website && urlWasEmpty) setUrl(data.website);
        if (data.name) setMapsBusinessName(data.name);
        if (data.city) setMapsLookupHint(`Found "${data.name}" — city: ${data.city}`);
        if (data.suggested_business_type)
          setMapsLookupHint(mapsLookupHint ?? null);
        if (data.rating != null) setMapsRating(data.rating);
        if (data.review_count != null) setMapsReviewCount(data.review_count);
        if (data.place_id) setMapsPlaceId(data.place_id);
        const parts: string[] = [];
        if (data.rating != null) parts.push(`${data.rating.toFixed(1)}★`);
        if (data.review_count != null && data.review_count > 0)
          parts.push(`${data.review_count} reviews`);
        const ratingText = parts.length ? ` · ${parts.join(" · ")}` : "";
        const hint =
          data.website && urlWasEmpty
            ? `Found "${data.name}" — website auto-filled${ratingText}`
            : `Found "${data.name}"${ratingText}`;
        setMapsLookupHint(hint);
      }
    } catch {
      setMapsLookupHint("Lookup failed. Fill in details manually.");
    } finally {
      setMapsLookupLoading(false);
    }
  }, [mapsLookupUrl, url, mapsLookupHint]);

  const handleRetryDesign = useCallback(
    async (strategy: "mobile" | "desktop") => {
      if (!url.trim()) return;
      setDesignRetrying((prev) => ({ ...prev, [strategy]: true }));

      try {
        const res = await fetch("/api/analyze-design", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ website: url.trim() }),
        });

        if (!res.ok) throw new Error("Design analysis failed");

        let newDesignResult: {
          mobile: DesignResult;
          desktop: DesignResult;
        } | null = null;

        await readNdjsonStream<{
          mobile: DesignResult;
          desktop: DesignResult;
        }>(res, {
          onResult: (data) => {
            newDesignResult = {
              mobile: data.mobile,
              desktop: data.desktop,
            };
          },
        });

        if (newDesignResult) {
          setDesignResult((prev) => {
            if (!prev) return newDesignResult;
            return {
              mobile:
                strategy === "mobile" ? newDesignResult!.mobile : prev.mobile,
              desktop:
                strategy === "desktop"
                  ? newDesignResult!.desktop
                  : prev.desktop,
            };
          });
        }
      } catch {
        // Error result is already in the stream
      } finally {
        setDesignRetrying((prev) => ({ ...prev, [strategy]: false }));
      }
    },
    [url],
  );

  const handleReset = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setStep("idle");
    setUrl("");
    setAuditResult(null);
    setDesignResult(null);
    setError(null);
    setCompletedKeys([]);
    setActiveKeys([]);
    setSavedTimestamp(null);
    setMapsLookupUrl("");
    setMapsLookupHint(null);
    setMapsRating(null);
    setMapsReviewCount(null);
    setMapsPlaceId(null);
    setMapsBusinessName(null);
  };

  // ── Idle state ──────────────────────────────────────────────────────────────
  if (step === "idle" && !error && !auditResult && !running) {
    const mainContent = (
      <>
        {/* Hero */}
        <div className="mb-6">
          <h1 className="text-2xl font-medium text-[var(--color-text-primary)]">
            Quick audit
          </h1>
          <p className="mt-1.5 text-sm text-[var(--color-text-secondary)]">
            Analyse a business website and uncover opportunities in seconds.
          </p>
        </div>

        {/* URL input card */}
        <AuditForm
          url={url}
          onUrlChange={setUrl}
          running={running}
          onRun={() => handleRun()}
          mapsLookupUrl={mapsLookupUrl}
          onMapsLookupUrlChange={setMapsLookupUrl}
          mapsLookupLoading={mapsLookupLoading}
          mapsLookupHint={mapsLookupHint}
          onMapsLookup={handleMapsLookup}
          step={step}
          onCancel={handleCancel}
          onReset={handleReset}
          savedTimestamp={savedTimestamp}
          mapsBusinessName={mapsBusinessName}
        />

        {/* Example Opportunity Card — hidden once user has run an audit */}
        {!hasCompletedAudit && (
          <div className="mt-6 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] font-medium text-[var(--color-text-tertiary)]">
                  Example
                </p>
                <h2 className="mt-1 text-base font-medium text-[var(--color-text-primary)]">
                  Example Opportunity
                </h2>
                <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">
                  See how Nearsited evaluates a business.
                </p>
              </div>
              <span className="shrink-0 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-2.5 py-1 font-mono text-xs text-[var(--color-text-tertiary)]">
                {
                  {
                    weak_website: "lawfirmdubai.com",
                    no_website: "Marina Legal Consultants",
                    social_only: "Blue Wave Restaurant",
                    platform_only: "Serene Spa & Wellness",
                  }[exampleTab]
                }
              </span>
            </div>

            {/* Type tabs */}
            <div className="mb-5 flex flex-wrap gap-1.5">
              {([
                { key: "weak_website" as const, label: "Weak Website" },
                { key: "no_website" as const, label: "No Website" },
                { key: "social_only" as const, label: "Social Only" },
                { key: "platform_only" as const, label: "Platform Only" },
              ] satisfies { key: ExampleTab; label: string }[]).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setExampleTab(tab.key)}
                  className={`cursor-pointer rounded-[var(--radius-sm)] border px-3 py-1 text-xs font-medium transition-colors duration-150 ${
                    exampleTab === tab.key
                      ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
                      : "border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]/40 hover:text-[var(--color-accent)]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Score display */}
            {exampleTab === "weak_website" ? (
              <div className="mb-5 flex flex-col gap-4 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] p-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-[var(--score-high)]">
                      42
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">
                      Current
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 flex-shrink-0 text-[var(--text-muted)]" />
                  <div className="text-center">
                    <p className="text-2xl font-bold text-[var(--color-success)]">
                      81
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">
                      Potential
                    </p>
                  </div>
                </div>
                <div className="rounded-[var(--radius-sm)] border border-[var(--color-success)]/30 bg-[var(--color-success)]/10 px-4 py-2 text-center sm:ml-auto">
                  <p className="text-xl font-bold text-[var(--color-success)]">
                    +39
                  </p>
                  <p className="text-[10px] text-[var(--color-text-tertiary)]">
                    Opportunity
                  </p>
                </div>
              </div>
            ) : (
              <div className="mb-5 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] p-4">
                <p className="text-base font-semibold text-[var(--color-text-primary)]">
                  High Opportunity
                </p>
                <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
                  {exampleTab === "no_website"
                    ? "This business has no digital presence — missed visibility and lead generation."
                    : exampleTab === "platform_only"
                      ? "Listed on a booking platform — no owned site, fully dependent on a third party."
                      : "Active on social platforms but no owned website for search and credibility."}
                </p>
              </div>
            )}

            {/* Top Findings */}
            <div className="mb-5 space-y-2">
              {(
                {
                  weak_website: [
                    "Mobile experience creates friction",
                    "Weak trust signals",
                    "Missing conversion pathways",
                  ],
                  no_website: [
                    "No website detected",
                    "Limited online visibility",
                    "Missed lead generation opportunities",
                  ],
                  social_only: [
                    "Active social presence",
                    "No dedicated website",
                    "Limited search visibility",
                  ],
                  platform_only: [
                    "Listed on Fresha / Booksy only",
                    "No owned web presence",
                    "Dependent on third-party platform",
                  ],
                } as Record<ExampleTab, string[]>
              )[exampleTab].map((finding, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className="h-1 w-1 shrink-0 rounded-[var(--radius-sm)] bg-[var(--text-muted)]" />
                  <span className="text-sm text-[var(--color-text-secondary)]">
                    {finding}
                  </span>
                </div>
              ))}
            </div>

            {/* View Example Report CTA */}
            <button
              onClick={() => setShowExampleModal(true)}
              className="inline-flex cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition-colors duration-150 hover:border-[var(--color-accent)]/40 hover:text-[var(--color-accent)]"
            >
              View Example Report
            </button>
          </div>
        )}
      </>
    );

    return (
      <div className="min-h-screen bg-[var(--color-bg-page)]">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
          {shouldReduce ? mainContent : <FadeUp>{mainContent}</FadeUp>}
          {showExampleModal && (
            <ExampleReportModal
              type={exampleTab}
              onClose={() => setShowExampleModal(false)}
            />
          )}
        </div>
      </div>
    );
  }

  // ── Error state (with retry) ────────────────────────────────────────────────
  if (error && !running && !auditResult) {
    const errorContent = (
      <>
        <div className="rounded-[var(--radius-md)] border border-red-500/30 bg-red-500/10 p-6 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-[var(--score-high)]" />
          <h2 className="mt-3 text-lg font-medium text-[var(--color-text-primary)]">
            Review Failed
          </h2>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setStep("idle");
              setRunning(false);
            }}
            className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-accent)] px-5 py-2 text-sm font-medium text-white transition-colors duration-150 hover:opacity-90"
          >
            Try Again
          </button>
        </div>
      </>
    );

    return (
      <div className="min-h-screen bg-[var(--color-bg-page)]">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
          {shouldReduce ? errorContent : <FadeUp>{errorContent}</FadeUp>}
        </div>
      </div>
    );
  }

  // ── Active / Done state ─────────────────────────────────────────────────────
  const bothTimedOut =
    auditResult &&
    auditResult.mobile.status === "timeout" &&
    auditResult.desktop.status === "timeout";

  const activeDoneContent = (
    <>
      {/* URL input card (idle/running) OR status pill (done) — AuditForm handles this internally */}
      <AuditForm
        url={url}
        onUrlChange={setUrl}
        running={running}
        onRun={() => handleRun()}
        mapsLookupUrl={mapsLookupUrl}
        onMapsLookupUrlChange={setMapsLookupUrl}
        mapsLookupLoading={mapsLookupLoading}
        mapsLookupHint={mapsLookupHint}
        onMapsLookup={handleMapsLookup}
        step={step}
        onCancel={handleCancel}
        onReset={handleReset}
        savedTimestamp={savedTimestamp}
        mapsBusinessName={mapsBusinessName}
      />

      {/* Progress checklist — only shown during active run, not in done state */}
      {(running || completedKeys.length > 0) && step !== "done" && (
        <AuditProgressPanel
          completedKeys={completedKeys}
          activeKeys={activeKeys}
          showProgress={showProgress}
          running={running}
          onCancel={handleCancel}
        />
      )}

      {/* Error banner */}
      {error && (
        <div className="mt-4 rounded-[var(--radius-sm)] border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Quota error */}
      {quotaError && (
        <div className="mt-4 rounded-[var(--radius-md)] border border-amber-500/30 bg-amber-500/10 px-5 py-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-info)]" />
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
              className="cursor-pointer shrink-0 rounded-[var(--radius-sm)] border border-amber-500/30 bg-amber-500/15 px-3 py-1.5 text-xs font-medium text-amber-400 transition-colors hover:bg-amber-500/25"
            >
              {quotaRetryTimer > 0 ? `Wait ${quotaRetryTimer}s` : "Dismiss"}
            </button>
          </div>
        </div>
      )}

      {/* Timestamp */}
      {savedTimestamp !== null && auditResult && !running && (
        <p className="mt-3 text-xs text-[var(--color-text-tertiary)]">
          Showing results from {timeAgo(savedTimestamp)}
        </p>
      )}

      {/* Both timed out */}
      {bothTimedOut && (
        <div className="mt-6 rounded-[var(--radius-md)] border border-amber-500/30 bg-amber-500/10 p-8 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-[var(--color-info)]" />
          <h2 className="mt-4 text-lg font-medium text-[var(--color-text-primary)]">
            Couldn&rsquo;t reach the site
          </h2>
          <p className="mt-2 max-w-md mx-auto text-sm text-[var(--color-text-secondary)]">
            The site took too long to respond. This usually means it&rsquo;s
            down, very slow, or blocking automated checks. Try again or test a
            different URL.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => handleRun()}
              className="inline-flex cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-accent)] px-5 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:opacity-90"
            >
              <Loader2 className="h-4 w-4" />
              Try again
            </button>
            <button
              onClick={handleReset}
              className="inline-flex cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] px-5 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors duration-150 hover:border-[var(--color-accent)]/40 hover:text-[var(--color-accent)]"
            >
              <Search className="h-4 w-4" />
              Try a different URL
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {auditResult && !bothTimedOut && (
        <AuditResultsPanel
          auditResult={auditResult}
          designResult={designResult}
          mapsRating={mapsRating}
          mapsReviewCount={mapsReviewCount}
          onRetryDesign={handleRetryDesign}
          designRetrying={designRetrying}
        />
      )}

      {/* Done state actions — consolidated into ReviewCompleteActions */}
      {step === "done" && !error && auditResult && !bothTimedOut && (
        <div className="mt-6">
          <ReviewCompleteActions
            url={url}
            auditResult={auditResult}
            designResult={designResult}
          />
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-[var(--color-bg-page)]">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        {shouldReduce ? activeDoneContent : <FadeUp>{activeDoneContent}</FadeUp>}
      </div>
    </div>
  );
}