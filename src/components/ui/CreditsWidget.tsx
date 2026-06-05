"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Toast } from "@/components/ui/Toast";

const TIER_LABELS: Record<string, string> = { free: "Free", starter: "Starter", agency: "Agency" };

export default function CreditsWidget({
  tier,
  auditsUsed,
  auditsLimit,
}: {
  tier: string;
  auditsUsed: number;
  auditsLimit: number;
}) {
  const [toast, setToast] = useState<string | null>(null);
  const hasShownToast = useRef(false);

  const used = auditsUsed;
  const limit = auditsLimit;
  const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  const barColor = pct >= 95 ? "bg-red-500" : pct >= 80 ? "bg-amber-500" : "bg-[var(--accent)]";

  // Show low-balance toast once per session when credits are critically low
  useEffect(() => {
    if (pct >= 80 && !hasShownToast.current) {
      hasShownToast.current = true;
      const remaining = limit - used;
      // Defer setState to next microtask to avoid cascading render warning
      const msg = remaining <= 1
        ? `You've used all ${limit} audits this month. Upgrade to continue auditing.`
        : `${remaining} audit${remaining !== 1 ? "s" : ""} remaining this month. Upgrade when you need more.`;
      const id = setTimeout(() => setToast(msg), 0);
      return () => clearTimeout(id);
    }
  }, [pct, limit, used]);

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
        <p className="mt-1 text-[10px] text-[var(--text-tertiary)]">
          {used} / {limit} audits this month
        </p>
        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-[var(--bg-elevated)]">
          <div className={`h-1 rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    </>
  );
}
