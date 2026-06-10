"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Toast } from "@/components/ui/Toast";
import { Tooltip } from "@/components/ui/Tooltip";

const TIER_LABELS: Record<string, string> = { free: "Free", starter: "Starter", agency: "Agency" };

type SubData = { tier: string; audits_used: number; audits_limit: number };

export default function CreditsWidget() {
  const [sub, setSub] = useState<SubData | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const hasShownToast = useRef(false);

  // Fetch subscription data client-side — avoids blocking the dashboard layout
  const refresh = useCallback(() => {
    fetch("/api/check-subscription")
      .then((res) => res.json())
      .then((data) => {
        if (data.tier) {
          setSub({ tier: data.tier, audits_used: data.audits_used ?? 0, audits_limit: data.audits_limit ?? 20 });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener("credits:updated", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("credits:updated", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [refresh]);

  const tier = sub?.tier ?? "free";
  const used = sub?.audits_used ?? 0;
  const limit = sub?.audits_limit ?? 20;
  const remaining = limit - used;
  const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  const barColor = pct >= 95 ? "bg-red-500" : pct >= 80 ? "bg-amber-500" : "bg-[var(--accent)]";

  // Show low-balance toast once per session when credits are critically low
  useEffect(() => {
    if (!sub) return;
    if (pct >= 80 && !hasShownToast.current) {
      hasShownToast.current = true;
      const msg = remaining <= 1
        ? `You've used all ${limit} free credits. Upgrade to continue.`
        : `${remaining} free credit${remaining !== 1 ? "s" : ""} remaining. Upgrade when you need more.`;
      const id = setTimeout(() => setToast(msg), 0);
      return () => clearTimeout(id);
    }
  }, [pct, limit, remaining, sub]);

  return (
    <>
      {toast && (
        <Toast message={toast} onClose={() => setToast(null)} duration={5000} />
      )}
      <div className="rounded-xl border border-[var(--accent)]/20 bg-[var(--accent-tint)] px-3 py-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-[var(--accent)]">{TIER_LABELS[tier] ?? tier} Plan</span>
          {tier === "free" && (
            <Link href="/pricing" className="text-[10px] text-[var(--accent)] hover:underline">Upgrade</Link>
          )}
        </div>
        {sub ? (
          <>
            <div className="mt-1 flex items-center gap-1">
              <p className="text-[10px] text-[var(--text-tertiary)]">
                {used} / {limit} free credits used
              </p>
              <Tooltip content="Free credits are lifetime and don't reset — upgrade for a monthly allowance.">
                <span className="inline-flex h-3.5 w-3.5 cursor-help items-center justify-center rounded-full border border-[var(--border)] text-[9px] text-[var(--text-tertiary)] transition-colors hover:border-[var(--accent)]/40 hover:text-[var(--accent)]">
                  ?
                </span>
              </Tooltip>
            </div>
            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-[var(--bg-elevated)]">
              <div className={`h-1 rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
            </div>
          </>
        ) : (
          <p className="mt-1 text-[10px] text-[var(--text-tertiary)]">Loading...</p>
        )}
      </div>
    </>
  );
}
