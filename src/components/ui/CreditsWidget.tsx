"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type SubData = { tier: string; audits_used: number; audits_limit: number };

const TIER_LABELS: Record<string, string> = { free: "Free", starter: "Starter", agency: "Agency" };

export default function CreditsWidget() {
  const [sub, setSub] = useState<SubData | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("subscriptions")
        .select("tier, audits_used, audits_limit")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) setSub(data as SubData);
    }
    load();
  }, [supabase]);

  const used = sub?.audits_used ?? 0;
  const limit = sub?.audits_limit ?? 10;
  const tier = sub?.tier ?? "free";
  const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  const barColor = pct >= 95 ? "bg-red-500" : pct >= 80 ? "bg-amber-500" : "bg-[var(--accent)]";

  return (
    <div className="rounded-xl border border-[var(--accent)]/20 bg-[var(--accent-tint)] px-3 py-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--accent)]">{TIER_LABELS[tier] ?? tier} Plan</span>
        {tier === "free" && (
          <Link href="/pricing" className="text-[10px] text-[var(--accent)] hover:underline">Upgrade</Link>
        )}
      </div>
      <p className="mt-1 text-[10px] text-[var(--text-tertiary)]">
        {sub ? `${used} / ${limit} audits this month` : "Loading…"}
      </p>
      <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-[var(--bg-elevated)]">
        <div className={`h-1 rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
