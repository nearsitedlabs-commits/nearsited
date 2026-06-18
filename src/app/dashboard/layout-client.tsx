"use client";

import { useState } from "react";
import { WifiOff, X } from "lucide-react";
import { LayoutGroup } from "@/lib/motion";
import { useOnline } from "@/lib/useOnline";

function OfflineBanner() {
  const online = useOnline();
  const [dismissed, setDismissed] = useState(false);

  if (online || dismissed) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed top-[var(--mobile-header-height)] left-0 right-0 z-[var(--z-nav)] lg:top-0 flex items-center gap-2 bg-[var(--color-warning)]/10 border-b border-[var(--color-warning)]/30 px-4 py-2 text-sm text-[var(--color-warning)]"
    >
      <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="flex-1">You&rsquo;re offline. Changes won&rsquo;t save until your connection returns.</span>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss offline warning"
        className="shrink-0 rounded p-0.5 opacity-70 hover:opacity-100 transition-opacity focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-warning)]"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}

export function DashboardLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <LayoutGroup>
      <OfflineBanner />
      {children}
    </LayoutGroup>
  );
}
