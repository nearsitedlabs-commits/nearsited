"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search } from "lucide-react";
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
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
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
] as const;

// Bar segment bg colors — semantic per spec:
// Prospect=secondary, Contacted=neutral, In conv=info, Won=success, Lost=danger
const PIPELINE_BAR_COLORS: Record<string, string> = {
  new_lead:        "bg-[var(--color-text-tertiary)]",
  contacted:       "bg-[var(--color-border-strong)]",
  in_conversation: "bg-[var(--color-info)]",
  won:             "bg-[var(--color-success)]",
  lost:            "bg-[var(--color-danger)]",
};

// Count-line text colors — semantic, applied only when count > 0
const PIPELINE_TEXT_COLORS: Record<string, string> = {
  new_lead:        "text-[var(--color-text-secondary)]",
  contacted:       "text-[var(--color-text-secondary)]",
  in_conversation: "text-[var(--color-info)]",
  won:             "text-[var(--color-success)]",
  lost:            "text-[var(--color-danger)]",
};

// ── Shared header sub-component ───────────────────────────────────────────────

function PageHeader({ firstName }: { firstName: string }) {
  return (
    <div className="mb-6 flex items-center justify-between" style={{ minHeight: 40 }}>
      <div>
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
          {formatDate()}
        </p>
        <p className="mt-0.5 text-[14px] font-medium text-[var(--color-text-primary)]">
          {firstName ? `${firstName}'s workspace` : "Your workspace"}
        </p>
      </div>
      {/* Icon-only on mobile; labelled on sm+ */}
      <Link
        href="/dashboard/discover"
        aria-label="Discover leads"
        className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)] sm:min-w-0"
      >
        <Search className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="hidden sm:inline">Discover</span>
      </Link>
    </div>
  );
}

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
    return () => { clearTimeout(timeout); clearInterval(interval); };
  }, []);

  const leads = recentLeads as RecentLead[];
  const totalPipeline = Object.values(pipelineCounts).reduce((a, b) => a + b, 0);

  const highOpportunityCount = useMemo(() =>
    leads.filter((l) => {
      const score = l.opportunity_score
        ?? (l.performance_score != null || l.design_score != null
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

  const userCity = useMemo(() => {
    const counts = new Map<string, number>();
    for (const l of leads) if (l.city) counts.set(l.city, (counts.get(l.city) ?? 0) + 1);
    let best = ""; let most = 0;
    for (const [c, n] of counts) if (n > most) { most = n; best = c; }
    return best;
  }, [leads]);

  // ── Empty state (no leads at all) ─────────────────────────────────────────
  if (totalLeads === 0) {
    return (
      <div className="min-h-screen">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
          <PageHeader firstName={firstName} />
          <div className="mx-auto max-w-lg rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-8 sm:p-12 text-center">
            <h2 className="text-lg font-medium text-[var(--color-text-primary)]">Find your first opportunity</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--color-text-secondary)]">
              Search any city and business type to discover local businesses with weak websites. Nearsited will score, audit, and write the pitch.
            </p>
            <Link
              href="/dashboard/discover"
              className="mt-8 inline-flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-accent)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90"
            >
              <Search className="h-4 w-4" /> Find leads →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">

        <PageHeader firstName={firstName} />

        {/* ── Next Action Card — the ONLY card on the page ──────────────── */}
        <div className="mb-8 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] border-l-[4px] border-l-[var(--color-accent)] bg-[var(--color-bg-surface)] p-5">
          {flaggedLeads > 0 ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
                  Today
                </p>
                <p className="mt-1 text-[18px] font-medium leading-snug text-[var(--color-text-primary)]">
                  {flaggedLeads} {flaggedLeads === 1 ? "lead" : "leads"} ready to pitch
                </p>
                <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                  {[
                    highOpportunityCount > 0 ? `${highOpportunityCount} high-opportunity` : null,
                    userCity ? `${leads.filter((l) => l.city === userCity).length} in ${userCity}` : null,
                    "pitches not yet generated",
                  ].filter(Boolean).join(" · ")}
                </p>
              </div>
              {/* Full-width on mobile (primary CTA inside a card), auto-width on sm+ */}
              <Link
                href="/dashboard/leads"
                className="flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--color-accent)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90 sm:w-auto sm:shrink-0"
              >
                Pitch them →
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
                  Today
                </p>
                <p className="mt-1 text-[18px] font-medium leading-snug text-[var(--color-text-primary)]">
                  All caught up.
                </p>
                <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                  Run a new search to find more leads.
                </p>
              </div>
              {/* Full-width on mobile, auto on sm+ */}
              <Link
                href="/dashboard/discover"
                className="flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border-strong)] px-4 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] sm:w-auto sm:shrink-0"
              >
                + Find leads
              </Link>
            </div>
          )}
        </div>

        {/* ── Opportunities (flush, no card) ────────────────────────────── */}
        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-2">
            <h2 className="text-sm font-medium text-[var(--color-text-primary)]">Opportunities</h2>
            <Link
              href="/dashboard/leads"
              className="min-h-[44px] flex items-center px-1 text-xs font-medium text-[var(--color-accent)] hover:underline"
            >
              View all →
            </Link>
          </div>

          <p className="mb-3 text-xs text-[var(--color-text-tertiary)]">
            {totalLeads} total
            {unanalysedLeads > 0 && ` · ${unanalysedLeads} unanalysed`}
            {highOpportunityCount > 0 && ` · ${highOpportunityCount} high-opportunity`}
            {totalPipeline > 0 && ` · ${totalPipeline} in pipeline`}
            {activeConversations > 0 && ` · ${activeConversations} in conversation`}
          </p>

          {leads.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm text-[var(--color-text-tertiary)]">No recent opportunities.</p>
            </div>
          ) : (
            <div>
              {leads.map((lead, idx) => {
                const hasAudit = lead.performance_score !== null || lead.design_score !== null;
                const oppScore = lead.opportunity_score
                  ?? (hasAudit
                    ? computeOpportunityScore(
                        blendQualityForOpportunity(null, lead.performance_score, lead.design_score),
                        lead.review_count ?? 0, lead.rating ?? 0, lead.business_type ?? undefined)
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
                    className={`flex cursor-pointer items-center gap-3 px-1 py-0.5 transition-colors hover:bg-[var(--color-bg-elevated)] min-h-[56px] sm:min-h-[46px]${idx === 4 ? " hidden sm:flex" : ""}`}
                    style={{
                      borderBottom: idx < leads.length - 1 ? "1px solid var(--color-border-subtle)" : undefined,
                    }}
                  >
                    <ScoreRing score={oppScore} size={32} variant="opportunity" noAnimate />

                    <div className="min-w-0 flex-1">
                      <p dir="auto" className="truncate text-[13px] font-medium leading-snug text-[var(--color-text-primary)]">
                        {lead.name}
                      </p>
                      <p className="truncate text-[11px] leading-snug text-[var(--color-text-tertiary)]">
                        <WebsiteBadge status={lead.website_status} /> · {lead.city ?? "Unknown"}
                      </p>
                    </div>

                    <p className="shrink-0 whitespace-nowrap text-[11px] text-[var(--color-text-tertiary)]">
                      {timeAgo(lead.discovered_at, now)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Pipeline (flush, different visual treatment) ───────────────── */}
        <div>
          <div className="mb-3 flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-2">
            <h2 className="text-sm font-medium text-[var(--color-text-primary)]">Pipeline</h2>
            <Link
              href="/dashboard/pipeline"
              className="text-xs font-medium text-[var(--color-accent)] hover:underline"
            >
              Manage →
            </Link>
          </div>

          {/* Horizontal segmented bar */}
          {totalPipeline === 0 ? (
            <div className="mb-2 h-2 w-full rounded-full bg-[var(--color-bg-elevated)]" />
          ) : (
            <div className="mb-2 flex h-2 w-full overflow-hidden rounded-full bg-[var(--color-bg-elevated)]">
              {PIPELINE_STAGES.map((stage) => {
                const count = pipelineCounts[stage.key] ?? 0;
                if (count === 0) {
                  return (
                    <div
                      key={stage.key}
                      className="h-full shrink-0 bg-[var(--color-bg-elevated)]"
                      style={{ width: 8 }}
                    />
                  );
                }
                return (
                  <div
                    key={stage.key}
                    className={`h-full shrink-0 first:rounded-l-full last:rounded-r-full ${PIPELINE_BAR_COLORS[stage.key] ?? ""}`}
                    style={{ flexGrow: count }}
                  />
                );
              })}
            </div>
          )}

          {/* Count line */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
            {PIPELINE_STAGES.map((stage, idx) => {
              const count = pipelineCounts[stage.key] ?? 0;
              const textColor = count > 0
                ? (PIPELINE_TEXT_COLORS[stage.key] ?? "text-[var(--color-text-tertiary)]")
                : "text-[var(--color-text-tertiary)]";
              return (
                <span key={stage.key} className={textColor}>
                  {count} {stage.label}
                  {idx < PIPELINE_STAGES.length - 1 && (
                    <span className="ml-3 text-[var(--color-border-strong)]">·</span>
                  )}
                </span>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
