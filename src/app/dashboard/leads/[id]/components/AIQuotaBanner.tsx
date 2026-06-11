"use client";

import { AlertTriangle, Sparkles, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";

type AIQuotaBannerProps = {
  /** Error message from the API call */
  quotaError: string | null;
  /** Whether this is a Gemini quota error (429) vs user credit error */
  isGeminiQuota: boolean;
  /** Countdown seconds remaining before auto-retry */
  quotaRetryTimer: number;
  /** Called to clear/dismiss the error */
  clearQuotaTimer: () => void;
  /** Called to retry the failed operation */
  onRetry: () => void;
  /** Called to switch to Gemini Flash-Lite fallback */
  onUseFallback: () => void;
  /** How many times we've already retried (auto-retry once, then show fallback) */
  retryCount: number;
};

export function AIQuotaBanner({
  quotaError,
  isGeminiQuota,
  quotaRetryTimer,
  clearQuotaTimer,
  onRetry,
  onUseFallback,
  retryCount,
}: AIQuotaBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  // Auto-retry once with 5s backoff when it's a Gemini 429
  useEffect(() => {
    if (!isGeminiQuota || retryCount > 0 || !quotaError) return;
    // Auto-retry after 5s
    const timer = setTimeout(() => {
      onRetry();
    }, 5000);
    return () => clearTimeout(timer);
  }, [isGeminiQuota, retryCount, quotaError, onRetry]);

  if (!quotaError || dismissed) return null;

  // User credit quota (different from Gemini API quota)
  if (!isGeminiQuota) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-max sm:max-w-md flex items-start gap-3 rounded-[var(--radius-md)] border border-red-500/30 bg-[#1a0a0a]/95 backdrop-blur-sm px-4 py-3 shadow-xl">
        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-red-400 leading-snug">
            {quotaError}
          </p>
          <p className="mt-0.5 text-[11px] text-red-400/70">
            You still have credits available — this is a service capacity issue.
          </p>
        </div>
        <button
          onClick={() => { clearQuotaTimer(); setDismissed(true); }}
          className="shrink-0 cursor-pointer rounded-[var(--radius-sm)] border border-red-500/30 bg-red-500/15 px-2.5 py-1 text-[11px] font-medium text-red-400 transition-colors hover:bg-red-500/25"
        >
          Dismiss
        </button>
      </div>
    );
  }

  // Gemini API quota / 429 error
  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-max sm:max-w-md flex items-start gap-3 rounded-[var(--radius-md)] border border-amber-500/30 bg-[#1a1200]/95 backdrop-blur-sm px-4 py-3 shadow-xl">
      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-amber-400 leading-snug">
          AI service is at capacity
          {quotaRetryTimer > 0 ? `. Auto-retrying in ${quotaRetryTimer}s…` : ""}
        </p>
        <p className="mt-0.5 text-[11px] text-amber-500/70">
          {retryCount === 0
            ? "Retrying automatically in a few seconds…"
            : retryCount >= 2
              ? "You can switch to the lighter model below."
              : "This is a temporary capacity issue — not your credit limit."}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            onClick={onRetry}
            className="inline-flex cursor-pointer items-center gap-1 rounded-[var(--radius-sm)] border border-amber-500/30 bg-amber-500/15 px-2.5 py-1 text-[11px] font-medium text-amber-400 transition-colors hover:bg-amber-500/25"
          >
            <RotateCcw className="h-3 w-3" /> Retry Now
          </button>
          {retryCount >= 1 && (
            <button
              onClick={() => { onUseFallback(); clearQuotaTimer(); setDismissed(true); }}
              className="inline-flex cursor-pointer items-center gap-1 rounded-[var(--radius-sm)] border border-purple-500/30 bg-purple-500/15 px-2.5 py-1 text-[11px] font-medium text-purple-400 transition-colors hover:bg-purple-500/25"
            >
              <Sparkles className="h-3 w-3" /> Use lighter model
            </button>
          )}
          <button
            onClick={() => { clearQuotaTimer(); setDismissed(true); }}
            className="shrink-0 cursor-pointer rounded-[var(--radius-sm)] border border-amber-500/20 bg-transparent px-2.5 py-1 text-[11px] font-medium text-amber-500/60 transition-colors hover:text-amber-400"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
