"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCountUp } from "@/lib/shared-hooks";
import { motion } from "@/lib/motion";
import {
  Search, Target, Mail, BarChart3, Activity,
  ArrowRight, MessageSquare, Compass, TrendingUp,
} from "lucide-react";
import { blendQualityForOpportunity, opportunityLabel, opportunityBadgeVariant, computeOpportunityScore, estimatedOpportunity } from "@/lib/scoring";
import { ScoreRing } from "@/components/ui/ScoreRing";
import type { WebsiteStatus } from "@/lib/db-types";
import type { BusinessRow } from "@/lib/db-types";
import { PIPELINE_TEXT_COLORS, PIPELINE_BAR_COLORS } from "@/lib/ui-constants";

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

// ── Animated count — uses shared useCountUp hook ──────────────────────────────

function AnimatedCount({ value, duration = 600 }: { value: number; duration?: number }) {
  const { display } = useCountUp(value, duration);
  return <>{display}</>;
}

// ── Opportunity type badges ────────────────────────────────────────────────────

const OPPORTUNITY_TYPE_BADGES: Record<string, { label: string; style: string }> = {
  has_website:   { label: "Has Website", style: "bg-[var(--badge-indigo-bg)] text-[var(--badge-indigo-text)] border border-[var(--badge-indigo-border)]" },
  no_website:    { label: "No Website",   style: "bg-[var(--badge-red-bg)] text-[var(--badge-red-text)] border border-[var(--badge-red-border)]" },
  social_only:   { label: "Social Only",  style: "bg-[var(--badge-amber-bg)] text-[var(--badge-amber-text)] border border-[var(--badge-amber-border)]" },
  platform_only: { label: "Platform Only", style: "bg-[var(--badge-indigo-bg)] text-[var(--badge-indigo-text)] border border-[var(--badge-indigo-border)]" },
  unknown:       { label: "Unknown",      style: "bg-[var(--bg-elevated)] text-[var(--text-tertiary)] border border-[var(--border)]" },
};

// ── Pipeline config — sales stages only ───────────────────────────────────────

const DASHBOARD_PIPELINE_STAGES = [
  { key: "new_lead",        label: "Prospect",        textColor: PIPELINE_TEXT_COLORS["new_lead"],        barColor: PIPELINE_BAR_COLORS["new_lead"] },
  { key: "contacted",       label: "Contacted",       textColor: PIPELINE_TEXT_COLORS["contacted"],       barColor: PIPELINE_BAR_COLORS["contacted"] },
  { key: "in_conversation", label: "In Conversation", textColor: PIPELINE_TEXT_COLORS["in_conversation"], barColor: PIPELINE_BAR_COLORS["in_conversation"] },
  { key: "won",             label: "Won",             textColor: PIPELINE_TEXT_COLORS["won"],             barColor: PIPELINE_BAR_COLORS["won"] },
  { key: "lost",            label: "Lost",            textColor: PIPELINE_TEXT_COLORS["lost"],            barColor: PIPELINE_BAR_COLORS["lost"] },
];

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
  const hasPipelineActivity = totalPipeline > 0;
  const hasFlaggedLeads = flaggedLeads > 0;
  const hasUnanalysedLeads = unanalysedLeads > 0;
  const hasAnalysedLeads = totalLeads - unanalysedLeads > 0;

  const greeting = totalLeads === 0
    ? (firstName ? `Welcome, ${firstName}.` : "Welcome.")
    : (firstName ? `Welcome back, ${firstName}.` : "Welcome back.");

  // ── Determine next best action ──────────────────────────────────────────
  type Action = {
    icon: typeof Search;
    title: string;
    description: string;
    cta: string;
    href: string;
    priority: number; // lower = higher priority
  };

  const nextActions: Action[] = [];

  if (hasFlaggedLeads && !hasPipelineActivity) {
    nextActions.push({
      icon: Mail,
      title: `${flaggedLeads} ${flaggedLeads === 1 ? "lead is" : "leads are"} ready to pitch`,
      description: "You have opportunities flagged for outreach but nothing in your pipeline yet. Generate a pitch and start a conversation.",
      cta: "Generate Outreach →",
      href: "/dashboard/leads",
      priority: 1,
    });
  }

  if (hasFlaggedLeads && hasPipelineActivity) {
    nextActions.push({
      icon: Mail,
      title: `${flaggedLeads} ${flaggedLeads === 1 ? "lead is" : "leads are"} ready to pitch`,
      description: "Generate personalised outreach for flagged leads and move them into your pipeline.",
      cta: "View Ready Opportunities →",
      href: "/dashboard/leads",
      priority: 2,
    });
  }

  if (hasUnanalysedLeads && !hasAnalysedLeads) {
    nextActions.push({
      icon: Activity,
      title: `${unanalysedLeads} ${unanalysedLeads === 1 ? "lead needs" : "leads need"} analysis`,
      description: "Run opportunity analysis to discover performance scores, design issues, and outreach angles.",
      cta: "Analyse Opportunities →",
      href: "/dashboard/discover",
      priority: 3,
    });
  }

  if (!hasFlaggedLeads && hasAnalysedLeads && hasUnanalysedLeads) {
    nextActions.push({
      icon: Activity,
      title: `${unanalysedLeads} unanalysed ${unanalysedLeads === 1 ? "lead" : "leads"}`,
      description: "Analyse these leads to find more outreach opportunities.",
      cta: "Analyse Remaining →",
      href: "/dashboard/discover",
      priority: 4,
    });
  }

  if (!hasFlaggedLeads && !hasUnanalysedLeads && totalLeads > 0) {
    nextActions.push({
      icon: Compass,
      title: "No opportunities flagged yet",
      description: "All leads are analysed. Discover more businesses to keep your pipeline full.",
      cta: "Discover More →",
      href: "/dashboard/discover",
      priority: 5,
    });
  }

  if (totalLeads === 0) {
    nextActions.push({
      icon: Search,
      title: "Find your first opportunity",
      description: "Search any city and business type to discover local businesses that need websites.",
      cta: "Start Discovering →",
      href: "/dashboard/discover",
      priority: 1,
    });
  }

  const primaryAction = nextActions.length > 0 ? nextActions.reduce((a, b) => a.priority < b.priority ? a : b) : null;
  const secondaryActions = nextActions.filter((a) => a !== primaryAction);

  // ── Empty state ────────────────────────────────────────────────────────────
  if (totalLeads === 0) {
    return (
      <div className="min-h-screen">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="mb-8">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Dashboard</p>
            <h1 className="mt-1 text-3xl font-normal tracking-tight text-[var(--text-primary)]">{greeting}</h1>
          </div>

          <div className="mx-auto max-w-lg rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent-tint)]">
              <Search className="h-6 w-6 text-[var(--accent)]" />
            </div>
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

        {/* Hero */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Dashboard</p>
            <h1 className="mt-1 text-3xl font-normal tracking-tight text-[var(--text-primary)]">{greeting}</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/discover"
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-1)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-colors duration-150 hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)]"
            >
              <Search className="h-4 w-4" /> Discover
            </Link>
          </div>
        </div>

        <div className="space-y-6">

          {/* ── Next Best Action ──────────────────────────────────────── */}
          {primaryAction && (
            <div className="rounded-xl border border-[var(--accent)]/25 bg-[var(--accent-tint)] p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--accent)]">Next Best Action</p>
                  <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">{primaryAction.title}</p>
                  <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{primaryAction.description}</p>
                </div>
                <Link
                  href={primaryAction.href}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-[var(--accent-hover)]"
                >
                  {primaryAction.cta}
                </Link>
              </div>
            </div>
          )}

          {/* ── KPI Cards — action-first hierarchy ────────────────────── */}
          <motion.div
            className="grid grid-cols-2 gap-3 sm:grid-cols-4"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 1 },
              visible: { transition: { staggerChildren: 0.06 } },
            }}
          >
            {/* 1. Ready to Pitch — highest signal of progress */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 12 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] } },
              }}
              className="rounded-xl border border-[var(--accent)]/30 bg-[var(--bg-surface)] p-4"
            >
              <div className="mb-2 inline-flex rounded-lg p-2 bg-[var(--accent-tint)]">
                <Mail className="h-4 w-4 text-[var(--accent)]" />
              </div>
              <p className="text-3xl font-normal tracking-tight text-[var(--text-primary)] leading-none tabular-nums">
                <AnimatedCount value={flaggedLeads} />
              </p>
              <p className="mt-1.5 text-[11px] text-[var(--text-tertiary)]">Ready to Pitch</p>
            </motion.div>

            {/* 2. In Pipeline — deals in motion */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 12 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] } },
              }}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4"
            >
              <div className="mb-2 inline-flex rounded-lg p-2 bg-[var(--bg-elevated)]">
                <BarChart3 className="h-4 w-4 text-[var(--text-secondary)]" />
              </div>
              <p className="text-3xl font-normal tracking-tight text-[var(--text-primary)] leading-none tabular-nums">
                <AnimatedCount value={totalPipeline} />
              </p>
              <p className="mt-1.5 text-[11px] text-[var(--text-tertiary)]">In Pipeline</p>
            </motion.div>

            {/* 3. Active Conversations — warmest deals */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 12 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] } },
              }}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4"
            >
              <div className="mb-2 inline-flex rounded-lg p-2 bg-[var(--bg-elevated)]">
                <MessageSquare className="h-4 w-4 text-[var(--text-secondary)]" />
              </div>
              <p className="text-3xl font-normal tracking-tight text-[var(--text-primary)] leading-none tabular-nums">
                <AnimatedCount value={activeConversations} />
              </p>
              <p className="mt-1.5 text-[11px] leading-tight text-[var(--text-tertiary)]">Active Conversations</p>
            </motion.div>

            {/* 4. Leads — de-emphasized collection metric with context */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 12 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] } },
              }}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4"
            >
              <div className="mb-2 inline-flex rounded-lg p-2 bg-[var(--bg-elevated)]">
                <Target className="h-4 w-4 text-[var(--text-tertiary)]" />
              </div>
              <p className="text-3xl font-normal tracking-tight text-[var(--text-primary)] leading-none tabular-nums">
                <AnimatedCount value={totalLeads} />
                {unanalysedLeads > 0 && (
                  <span className="ml-2 text-sm font-normal text-[var(--text-tertiary)]">
                    ({unanalysedLeads} unanalysed)
                  </span>
                )}
              </p>
              <p className="mt-1.5 text-[11px] text-[var(--text-tertiary)]">Leads</p>
            </motion.div>
          </motion.div>

          {/* ── Secondary actions (if available) ──────────────────────── */}
          {secondaryActions.length > 0 && (
            <div className="grid gap-2 sm:grid-cols-2">
              {secondaryActions.map((action) => (
                <Link
                  key={action.title}
                  href={action.href}
                  className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 transition-colors duration-150 hover:border-[var(--accent)]/30 hover:bg-[var(--accent-tint)]"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-elevated)]">
                    {action.icon === Search ? <Search className="h-4 w-4 text-[var(--accent)]" /> :
                     action.icon === Mail ? <Mail className="h-4 w-4 text-[var(--accent)]" /> :
                     action.icon === Activity ? <Activity className="h-4 w-4 text-[var(--accent)]" /> :
                     <Compass className="h-4 w-4 text-[var(--accent)]" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--text-primary)]">{action.title}</p>
                    <p className="text-xs text-[var(--text-tertiary)]">{action.description}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-[var(--text-tertiary)]" />
                </Link>
              ))}
            </div>
          )}

          {/* ── Recent Opportunities ──────────────────────────────────── */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface-1)] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-medium text-[var(--text-primary)]">Recent Opportunities</h2>
              <Link href="/dashboard/leads" className="text-xs font-medium text-[var(--accent)] hover:underline">
                View all →
              </Link>
            </div>

            {leads.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-[var(--text-tertiary)]">No opportunities yet.</p>
                <Link href="/dashboard/discover" className="mt-2 inline-block text-sm font-medium text-[var(--accent)] hover:underline">
                  Discover businesses to get started
                </Link>
              </div>
            ) : (
              <motion.div
                className="space-y-1.5"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: { transition: { staggerChildren: 0.04 } },
                }}
              >
                {leads.map((lead) => {
                  const score = lead.performance_score ?? lead.design_score;
                  const isAnalysed = score !== null;
                  const ringScore = isAnalysed ? score : estimatedOpportunity({
                    website_status: lead.website_status,
                    website: lead.website,
                    user_ratings_total: lead.review_count,
                    rating: lead.rating,
                  });

                  return (
                    <motion.div
                      key={lead.id}
                      variants={{
                        hidden: { opacity: 0, y: 8 },
                        visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] } },
                      }}
                      onClick={() => router.push(`/dashboard/leads/${lead.id}`)}
                      className="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-transparent bg-[var(--bg-elevated)] p-3 text-left transition-colors duration-150 hover:border-[var(--border)] hover:bg-[var(--bg-surface)]"
                    >
                      <ScoreRing score={ringScore} size={36} variant={isAnalysed ? "opportunity" : "estimate"} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p dir="auto" className="truncate text-sm font-medium text-[var(--text-primary)]">
                            {lead.name}
                          </p>
                          {(() => {
                            const badge = OPPORTUNITY_TYPE_BADGES[lead.website_status];
                            if (!badge) return null;
                            return (
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase ${badge.style}`}>
                                {badge.label}
                              </span>
                            );
                          })()}
                        </div>
                        <p className="text-xs text-[var(--text-tertiary)]">
                          {lead.business_type} · {lead.city} · {timeAgo(lead.discovered_at, now)}
                        </p>
                      </div>

                      <>
                        {!isAnalysed && (
                          <Link
                            href={`/dashboard/leads/${lead.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="shrink-0 rounded-md border border-[var(--border)] bg-[var(--bg-surface-2)] px-2.5 py-1 text-[10px] font-medium text-[var(--accent)] transition-colors duration-150 hover:border-[var(--accent)]/40 hover:bg-[var(--accent-tint)]"
                          >
                            Analyse
                          </Link>
                        )}
                        {(() => {
                          const oppScore = lead.opportunity_score
                            ?? (isAnalysed
                              ? computeOpportunityScore(blendQualityForOpportunity(null, lead.performance_score, lead.design_score), lead.review_count ?? 0, lead.rating ?? 0, lead.business_type ?? undefined)
                              : estimatedOpportunity({
                                  website_status: lead.website_status,
                                  website: lead.website,
                                  user_ratings_total: lead.review_count,
                                  rating: lead.rating,
                                }));
                          const label = opportunityLabel(oppScore);
                          const variant = opportunityBadgeVariant(oppScore);
                          const map: Record<string, string> = {
                            green:  "text-[var(--badge-green-text)] bg-[var(--badge-green-bg)]",
                            amber:  "text-[var(--badge-amber-text)] bg-[var(--badge-amber-bg)]",
                            indigo: "text-[var(--badge-indigo-text)] bg-[var(--badge-indigo-bg)]",
                            red:    "text-[var(--badge-red-text)] bg-[var(--badge-red-bg)]",
                          };
                          return (
                            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${map[variant] ?? ""}`}>
                              {label}
                            </span>
                          );
                        })()}
                      </>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </div>

          {/* ── Pipeline Overview ─────────────────────────────────────── */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-medium text-[var(--text-primary)]">Pipeline Overview</h2>
              <Link href="/dashboard/pipeline" className="text-xs font-medium text-[var(--accent)] hover:underline">
                Manage →
              </Link>
            </div>

            {totalPipeline === 0 ? (
              <div className="py-6 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--bg-elevated)]">
                  <TrendingUp className="h-5 w-5 text-[var(--text-tertiary)]" />
                </div>
                <p className="text-sm font-medium text-[var(--text-primary)]">No active pipeline yet</p>
                <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                  {hasFlaggedLeads
                    ? "You have leads ready to pitch. Generate outreach to start building your pipeline."
                    : totalLeads > 0
                      ? "Analyse your leads to find outreach opportunities and build your pipeline."
                      : "Discover businesses to start building your pipeline."}
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {hasFlaggedLeads && (
                    <Link
                      href="/dashboard/leads"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-medium text-white transition-colors duration-150 hover:bg-[var(--accent-hover)]"
                    >
                      <Mail className="h-3.5 w-3.5" /> Generate Outreach
                    </Link>
                  )}
                  {!hasFlaggedLeads && totalLeads > 0 && (
                    <Link
                      href="/dashboard/discover"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-medium text-white transition-colors duration-150 hover:bg-[var(--accent-hover)]"
                    >
                      <Activity className="h-3.5 w-3.5" /> Analyse Leads
                    </Link>
                  )}
                  <Link
                    href="/dashboard/discover"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-4 py-2 text-xs font-medium text-[var(--text-secondary)] transition-colors duration-150 hover:bg-[var(--bg-surface-2)]"
                  >
                    <Search className="h-3.5 w-3.5" /> Discover More
                  </Link>
                </div>
              </div>
            ) : totalPipeline < 5 ? (
              /* Compact view for sparse pipelines — includes next-step suggestions */
              <div className="space-y-4">
                {/* Mobile: stacked list */}
                <div className="space-y-1.5 sm:hidden">
                  {DASHBOARD_PIPELINE_STAGES.map((stage) => {
                    const count = pipelineCounts[stage.key] ?? 0;
                    return (
                      <div key={stage.key} className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--bg-surface-2)] px-4 py-2.5">
                        <p className="text-sm text-[var(--text-secondary)]">{stage.label}</p>
                        <p className={`text-lg font-semibold tabular-nums ${stage.textColor}`}>{count}</p>
                      </div>
                    );
                  })}
                </div>
                {/* Desktop: 5-column grid */}
                <div className="hidden sm:grid sm:grid-cols-5 gap-2">
                  {DASHBOARD_PIPELINE_STAGES.map((stage) => {
                    const count = pipelineCounts[stage.key] ?? 0;
                    return (
                      <div
                        key={stage.key}
                        className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface-2)] p-3 text-center"
                      >
                        <p className={`text-xl font-semibold ${stage.textColor}`}>{count}</p>
                        <p className="mt-1 text-[10px] text-[var(--text-tertiary)] leading-tight">{stage.label}</p>
                      </div>
                    );
                  })}
                </div>
                {hasFlaggedLeads && (
                  <div className="rounded-lg border border-[var(--accent)]/20 bg-[var(--accent-tint)] p-3 text-center">
                    <p className="text-xs text-[var(--text-secondary)]">
                      <span className="font-medium text-[var(--accent)]">{flaggedLeads} {flaggedLeads === 1 ? "lead is" : "leads are"}</span> ready for outreach — generate pitches to grow your pipeline.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Full bar visualization for established pipelines */
              <div className="space-y-3">
                {DASHBOARD_PIPELINE_STAGES.map((stage) => {
                  const count = pipelineCounts[stage.key] ?? 0;
                  const pct = totalPipeline > 0 ? (count / totalPipeline) * 100 : 0;
                  return (
                    <div key={stage.key}>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-sm text-[var(--text-secondary)]">{stage.label}</span>
                        <span className={`text-sm font-semibold ${stage.textColor}`}>{count}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bg-elevated)]">
                        <motion.div
                          className={`h-full rounded-full ${stage.barColor}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                        />
                      </div>
                    </div>
                  );
                })}
                <p className="pt-2 text-xs text-[var(--text-tertiary)]">
                  Win rate:{" "}
                  {(
                    ((pipelineCounts["won"] ?? 0) /
                      Math.max(1, (pipelineCounts["won"] ?? 0) + (pipelineCounts["lost"] ?? 0))) *
                    100
                  ).toFixed(0)}
                  %
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
