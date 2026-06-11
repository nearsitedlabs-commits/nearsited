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
    <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-max sm:max-w-sm flex items-center gap-3 rounded-[var(--radius-md)] border border-amber-500/30 bg-[#1a1200]/95 backdrop-blur-sm px-4 py-3 shadow-xl">
      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-amber-400 leading-snug">AI quota exceeded — please wait a moment</p>
        {quotaRetryTimer > 0 && <p className="mt-0.5 text-[11px] text-amber-500/80">Retry in {quotaRetryTimer}s</p>}
      </div>
      <button onClick={clearQuotaTimer}
        className="shrink-0 cursor-pointer rounded-[var(--radius-sm)] border border-amber-500/30 bg-amber-500/15 px-2.5 py-1 text-[11px] font-medium text-amber-400 transition-colors hover:bg-amber-500/25">
        {quotaRetryTimer > 0 ? `${quotaRetryTimer}s` : "OK"}
      </button>
    </div>
  );
}
