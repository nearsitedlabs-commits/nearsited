"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Toast } from "@/components/ui/Toast";
import { Tooltip } from "@/components/ui/Tooltip";
import { getTierLabel } from "@/lib/tier-features";

const TIER_LABELS: Record<string, string> = {
  free_trial: "Free Trial",
  solo: "Solo",
  agency: "Agency",
  scale: "Scale",
};

type SubData = { tier: string; audits_used: number; audits_limit: number };

export default function AuditsWidget() {
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
    window.addEventListener("audits:updated", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("audits:updated", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [refresh]);

  const tier = sub?.tier ?? "free_trial";
  const used = sub?.audits_used ?? 0;
  const limit = sub?.audits_limit ?? 20;
  const remaining = limit - used;
  const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  const barColor = pct >= 95 ? "bg-[var(--color-danger)]" : pct >= 80 ? "bg-[var(--color-warning)]" : "bg-[var(--color-accent)]";
  const isFreeTrial = tier === "free_trial";

  // Show low-balance toast once per session when audits are critically low
  useEffect(() => {
    if (!sub) return;
    if (pct >= 80 && !hasShownToast.current) {
      hasShownToast.current = true;
      const msg = isFreeTrial
        ? remaining <= 1
          ? `You've used all ${limit} free audits. Upgrade to continue auditing.`
          : `${remaining} free audit${remaining !== 1 ? "s" : ""} remaining. Upgrade when you need more.`
        : remaining <= 1
          ? `You've used all ${limit} audits this month. Upgrade or buy a booster pack.`
          : `${remaining} audit${remaining !== 1 ? "s" : ""} remaining this month.`;
      const id = setTimeout(() => setToast(msg), 0);
      return () => clearTimeout(id);
    }
  }, [pct, limit, remaining, sub, tier, isFreeTrial]);

  return (
    <>
      {toast && (
        <Toast message={toast} onClose={() => setToast(null)} duration={5000} />
      )}
      <div className="rounded-[var(--radius-md)] bg-[var(--color-accent)]/10 px-3 py-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-[var(--color-accent)]">
            {TIER_LABELS[tier] ?? getTierLabel(tier)} Plan
          </span>
          {isFreeTrial && (
            <Link href="/pricing" className="text-[10px] text-[var(--color-accent)] hover:underline">Upgrade</Link>
          )}
        </div>
        {sub ? (
          <>
            <div className="mt-1 flex items-center gap-1">
              <p className="text-[10px] text-[var(--color-text-tertiary)]">
                {used} / {limit} {isFreeTrial ? "free " : ""}audits used
                {!isFreeTrial && " this month"}
              </p>
              <Tooltip content={isFreeTrial ? "Free Trial audits are lifetime and don't reset — upgrade for a monthly allowance." : "Paid plan audits reset at the start of each billing month."}>
                <span className="inline-flex h-3.5 w-3.5 cursor-help items-center justify-center rounded-full bg-[var(--color-bg-elevated)] text-[9px] text-[var(--color-text-tertiary)] transition-colors [@media(hover:hover)]:hover:bg-[var(--color-accent)]/10 [@media(hover:hover)]:hover:text-[var(--color-accent)]">
                  ?
                </span>
              </Tooltip>
            </div>
            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-[var(--color-bg-elevated)]">
              <div className={`h-1 rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
            </div>
          </>
        ) : (
          <p className="mt-1 text-[10px] text-[var(--color-text-tertiary)]">Loading...</p>
        )}
      </div>
    </>
  );
}
