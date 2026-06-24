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
    <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-max sm:max-w-sm flex items-center gap-3 rounded-[var(--radius-md)] bg-[var(--color-warning)]/12 backdrop-blur-sm px-4 py-3 shadow-xl">
      <AlertTriangle className="h-4 w-4 shrink-0 text-[var(--color-warning)]" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-[var(--color-warning)] leading-snug">AI quota exceeded — please wait a moment</p>
        {quotaRetryTimer > 0 && <p className="mt-0.5 text-[11px] text-[var(--color-warning)]/80">Retry in {quotaRetryTimer}s</p>}
      </div>
      <button onClick={clearQuotaTimer}
        className="shrink-0 cursor-pointer rounded-[var(--radius-sm)] bg-[var(--color-warning)]/15 px-2.5 py-1 text-[11px] font-medium text-[var(--color-warning)] transition-colors hover:bg-[var(--color-warning)]/25">
        {quotaRetryTimer > 0 ? `${quotaRetryTimer}s` : "OK"}
      </button>
    </div>
  );
}
