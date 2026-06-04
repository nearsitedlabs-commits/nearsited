"use client";

import { AlertTriangle } from "lucide-react";

type QuotaErrorBannerProps = {
  quotaError: string | null;
  quotaRetryTimer: number;
  clearQuotaTimer: () => void;
};

export function QuotaErrorBanner({ quotaError, quotaRetryTimer, clearQuotaTimer }: QuotaErrorBannerProps) {
  if (!quotaError) return null;

  return (
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
  );
}
