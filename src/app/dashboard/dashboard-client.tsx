"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, ArrowRight } from "lucide-react";
import { blendQualityForOpportunity, computeOpportunityScore, estimatedOpportunity } from "@/lib/scoring";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { WebsiteBadge } from "@/components/ui/WebsiteBadge";
import type { WebsiteStatus } from "@/lib/db-types";
import type { BusinessRow } from "@/lib/db-types";

// ── Types ─────────────────────────────────────────────────────────────────────

type RecentLead = {
  id: string;
  name: string;
  business_type: string;
  city: string;
  website: string | null;
  website_status: WebsiteStatus;
  performance_score: number | null;
  design_score: number | null;
  opportunity_score: number | null;
  rating: number | null;
  review_count: number | null;
  discovered_at: string;
  flagged_for_outreach: boolean;
};

type Props = {
  firstName: string;
  totalLeads: number;
  flaggedLeads: number;
  unanalysedLeads: number;
  activeConversations: number;
  pipelineCounts: Record<string, number>;
  recentLeads: BusinessRow[];
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string, now: number | null): string {
  if (!now) return "just now";
  const diff = Math.floor((now - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatDate(): string {
  const d = new Date();
  const day = d.toLocaleDateString("en-US", { weekday: "long" });
  const date = d.getDate();
  const month = d.toLocaleDateString("en-US", { month: "long" });
  return `${day}, ${date} ${month}`;
}

// ── Pipeline config ───────────────────────────────────────────────────────────

const PIPELINE_STAGES = [
  { key: "new_lead",        label: "Prospect" },
  { key: "contacted",       label: "Contacted" },
  { key: "in_conversation", label: "In conv." },
  { key: "won",             label: "Won" },
  { key: "lost",            label: "Lost" },
];

const PIPELINE_BAR_COLORS: Record<string, string> = {
  new_lead:        "bg-[var(--pipeline-new)]",
  contacted:       "bg-[var(--pipeline-contacted)]",
  in_conversation: "bg-[var(--pipeline-conversation)]",
  won:             "bg-[var(--pipeline-won)]",
  lost:            "bg-[var(--pipeline-lost)]",
};

const PIPELINE_TEXT_COLORS: Record<string, string> = {
  new_lead:        "text-[var(--pipeline-new)]",
  contacted:       "text-[var(--pipeline-contacted)]",
  in_conversation: "text-[var(--pipeline-conversation)]",
  won:             "text-[var(--pipeline-won)]",
  lost:            "text-[var(--pipeline-lost)]",
};

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function DashboardClient({
  firstName, totalLeads, flaggedLeads,
  unanalysedLeads, activeConversations, pipelineCounts, recentLeads,
}: Props) {
  const [now, setNow] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    const timeout = setTimeout(() => setNow(Date.now()), 0);
    const interval = setInterval(() => setNow(Date.now()), 60_000);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  const leads = recentLeads as RecentLead[];
  const totalPipeline = Object.values(pipelineCounts).reduce((a, b) => a + b, 0);

  // Compute high-opportunity count from recent leads (for the inline stat)
  const highOpportunityFromRecent = useMemo(() =>
    leads.filter((l) => {
      if (l.opportunity_score != null) return l.opportunity_score >= 70;
      const hasAudit = l.performance_score != null || l.design_score != null;
      const score = l.opportunity_score
        ?? (hasAudit
          ? computeOpportunityScore(
              blendQualityForOpportunity(null, l.performance_score, l.design_score),
              l.review_count ?? 0, l.rating ?? 0, l.business_type ?? undefined)
          : estimatedOpportunity({
              website_status: l.website_status,
              website: l.website,
              user_ratings_total: l.review_count,
              rating: l.rating,
            }));
      return score >= 70;
    }).length,
  [leads]);

  // ── Next action card data ──────────────────────────────────────────────
  const highOppCount = highOpportunityFromRecent;
  const userCity = useMemo(() => {
    const cities = leads.map((l) => l.city).filter(Boolean);
    const counts = new Map<string, number>();
    for (const c of cities) counts.set(c, (counts.get(c) ?? 0) + 1);
    let best = "";
    let most = 0;
    for (const [c, n] of counts) {
      if (n > most) { most = n; best = c; }
    }
    return best;
  }, [leads]);

  // ── Empty state ────────────────────────────────────────────────────────────
  if (totalLeads === 0) {
    return (
      <div className="min-h-screen">
        <div className="mx-auto max-w-7xl px-6 py-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between" style={{ minHeight: 40 }}>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--text-tertiary)]">{formatDate()}</p>
              <p className="mt-0.5 text-sm font-medium text-[var(--text-primary)]" style={{ fontSize: 14 }}>
                {firstName ? `${firstName}'s workspace` : "Your workspace"}
              </p>
            </div>
            <Link
              href="/dashboard/discover"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors duration-150 hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)]"
            >
              <Search className="h-3 w-3" /> Discover
            </Link>
          </div>

          <div className="mx-auto max-w-lg rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-12 text-center">
            <h2 className="text-2xl font-medium text-[var(--text-primary)]">Find your first opportunity</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
              Search any city and business type to discover local businesses with weak websites. Nearsited will score, audit, and write the pitch.
            </p>
            <Link
              href="/dashboard/discover"
              className="mt-8 inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-6 py-3 text-sm font-medium text-white transition-colors duration-150 hover:bg-[var(--accent-hover)]"
            >
              <Search className="h-4 w-4" /> Start Discovering →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-6 py-8">

        {/* ── Header: date + workspace label (left), Discover (right) ───── */}
        <div className="mb-6 flex items-center justify-between" style={{ minHeight: 40 }}>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--text-tertiary)]">{formatDate()}</p>
            <p className="mt-0.5 text-sm font-medium text-[var(--text-primary)]" style={{ fontSize: 14, fontWeight: 500 }}>
              {firstName ? `${firstName}'s workspace` : "Your workspace"}
            </p>
          </div>
          <Link
            href="/dashboard/discover"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors duration-150 hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)]"
          >
            <Search className="h-3 w-3" /> Discover
          </Link>
        </div>

        {/* ── Next Action Card (the ONLY card on the page) ──────────────── */}
        {flaggedLeads > 0 && (
          <div className="mb-6 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent-tint)] p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--accent)]">Today</p>
                <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
                  {flaggedLeads} {flaggedLeads === 1 ? "lead is" : "leads are"} ready to pitch
                </p>
                <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                  {highOppCount > 0 && `${highOppCount} high-opportunity`}
                  {highOppCount > 0 && userCity ? ` · ` : ""}
                  {userCity ? `${leads.filter((l) => l.city === userCity).length} in ${userCity}` : ""}
                  {highOppCount > 0 || userCity ? " · " : ""}
                  pitches not yet generated
                </p>
              </div>
              <Link
                href="/dashboard/leads"
                className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-[var(--accent-hover)]"
              >
                Pitch them <ArrowRight className="h-4 w-4 shrink-0" />
              </Link>
            </div>
          </div>
        )}

        {/* ── Opportunities ────────────────────────────────────────────── */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-medium text-[var(--text-primary)]">Opportunities</h2>
            <Link href="/dashboard/leads" className="text-xs font-medium text-[var(--accent)] hover:underline">
              View all →
            </Link>
          </div>

          <p className="mb-3 text-xs text-[var(--text-tertiary)]">
            {totalLeads} total · {unanalysedLeads} unanalysed · {highOppCount} high opportunity · {totalPipeline} in pipeline · {activeConversations} in conversation
          </p>

          {leads.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm text-[var(--text-tertiary)]">No opportunities yet.</p>
              <Link href="/dashboard/discover" className="mt-2 inline-block text-sm font-medium text-[var(--accent)] hover:underline">
                Discover businesses to get started
              </Link>
            </div>
          ) : (
            <div>
              {leads.map((lead, idx) => {
                const hasAudit = lead.performance_score !== null || lead.design_score !== null;
                const oppScore = lead.opportunity_score
                  ?? (hasAudit
                    ? computeOpportunityScore(blendQualityForOpportunity(null, lead.performance_score, lead.design_score), lead.review_count ?? 0, lead.rating ?? 0, lead.business_type ?? undefined)
                    : estimatedOpportunity({
                        website_status: lead.website_status,
                        website: lead.website,
                        user_ratings_total: lead.review_count,
                        rating: lead.rating,
                      }));
                return (
                  <div
                    key={lead.id}
                    onClick={() => router.push(`/dashboard/leads/${lead.id}`)}
                    className="flex cursor-pointer items-center gap-3 px-1 transition-colors duration-150 hover:bg-[var(--bg-surface-2)]"
                    style={{ minHeight: 50, borderBottom: idx < leads.length - 1 ? "0.5px solid var(--border)" : undefined }}
                  >
                    {/* Score circle */}
                    <ScoreRing score={oppScore} size={32} variant="opportunity" noAnimate />

                    {/* Name + subtitle */}
                    <div className="min-w-0 flex-1">
                      <p dir="auto" className="truncate text-[13px] font-medium text-[var(--text-primary)] leading-snug">
                        {lead.name}
                      </p>
                      <p className="truncate text-[11px] text-[var(--text-tertiary)] leading-snug">
                        <WebsiteBadge status={lead.website_status} /> · {lead.city ?? "Unknown city"}
                      </p>
                    </div>

                    {/* Timestamp */}
                    <p className="shrink-0 text-[11px] text-[var(--text-tertiary)] whitespace-nowrap">
                      {timeAgo(lead.discovered_at, now)}
                    </p>
                  </div>
                );
              })}
              <p className="mt-2 text-[11px] text-[var(--text-tertiary)]">Scores are estimates.</p>
            </div>
          )}
        </div>

        {/* ── Pipeline ──────────────────────────────────────────────────── */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-[var(--text-primary)]">Pipeline</h2>
            <Link href="/dashboard/pipeline" className="text-xs font-medium text-[var(--accent)] hover:underline">
              Manage →
            </Link>
          </div>

          {totalPipeline === 0 ? (
            <div className="py-4 text-center">
              <p className="text-xs text-[var(--text-tertiary)]">No active pipeline yet.</p>
            </div>
          ) : (
            <>
              {/* Horizontal segmented bar */}
              <div className="mb-2 flex h-2 w-full overflow-hidden rounded-full bg-[var(--bg-elevated)]">
                {PIPELINE_STAGES.map((stage) => {
                  const count = pipelineCounts[stage.key] ?? 0;
                  const pct = totalPipeline > 0 ? (count / totalPipeline) * 100 : 0;
                  if (count === 0) return null;
                  const barColor = PIPELINE_BAR_COLORS[stage.key] ?? "bg-[var(--border)]";
                  return (
                    <div
                      key={stage.key}
                      className={`h-full ${barColor} first:rounded-l-full last:rounded-r-full`}
                      style={{ width: `${pct}%` }}
                    />
                  );
                })}
              </div>

              {/* Count line */}
              <div className="flex items-center gap-3 text-[11px]">
                {PIPELINE_STAGES.map((stage, idx) => {
                  const count = pipelineCounts[stage.key] ?? 0;
                  const textColor = count > 0
                    ? (PIPELINE_TEXT_COLORS[stage.key] ?? "text-[var(--text-tertiary)]")
                    : "text-[var(--text-tertiary)]";
                  return (
                    <span key={stage.key} className={textColor}>
                      {count} {stage.label}
                      {idx < PIPELINE_STAGES.length - 1 && (
                        <span className="ml-3 text-[var(--border)]">·</span>
                      )}
                    </span>
                  );
                })}
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
