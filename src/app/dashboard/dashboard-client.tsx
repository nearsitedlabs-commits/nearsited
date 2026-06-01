"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, ListFilter, Target, Mail, BarChart3, Activity } from "lucide-react";
import { opportunityLabel, opportunityBadgeVariant, computeOpportunityScore } from "@/lib/scoring";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { MetricCard } from "@/components/ui/MetricCard";
import type { WebsiteStatus } from "@/lib/types";
import { PIPELINE_TEXT_COLORS, PIPELINE_BAR_COLORS, PIPELINE_LABELS } from "@/lib/ui-constants";

// ── Types ─────────────────────────────────────────────────────────────────────

type RecentLead = {
  id: string;
  name: string;
  business_type: string;
  city: string;
  website_status: WebsiteStatus;
  performance_score: number | null;
  design_score: number | null;
  discovered_at: string;
  flagged_for_outreach: boolean;
};

type Props = {
  userEmail: string;
  totalLeads: number;
  flaggedLeads: number;
  totalPitches: number;
  pipelineCounts: Record<string, number>;
  recentLeads: Record<string, unknown>[];
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

// ── Dashboard ─────────────────────────────────────────────────────────────────

const STAT_CARDS = (totalLeads: number, flaggedLeads: number, totalPitches: number, totalPipeline: number) => [
  { value: totalLeads,    label: "Opportunities Spotted", icon: Target,   iconBg: "bg-[var(--accent-tint)]",   iconColor: "text-[var(--accent)]" },
  { value: flaggedLeads,  label: "Ready to Pitch",        icon: Activity, iconBg: "bg-[var(--accent-tint)]",   iconColor: "text-[var(--accent)]" },
  { value: totalPitches,  label: "Pitches Generated",     icon: Mail,     iconBg: "bg-[var(--accent-tint)]",   iconColor: "text-[var(--accent)]" },
  { value: totalPipeline, label: "In Pipeline",           icon: BarChart3,iconBg: "bg-[var(--accent-tint)]",   iconColor: "text-[var(--accent)]" },
];

const PIPELINE_STAGES = [
  { key: "new_lead",        label: PIPELINE_LABELS["new_lead"],        textColor: PIPELINE_TEXT_COLORS["new_lead"],        barColor: PIPELINE_BAR_COLORS["new_lead"] },
  { key: "analysed",        label: PIPELINE_LABELS["analysed"],        textColor: PIPELINE_TEXT_COLORS["analysed"],        barColor: PIPELINE_BAR_COLORS["analysed"] },
  { key: "pitch_generated", label: PIPELINE_LABELS["pitch_generated"], textColor: PIPELINE_TEXT_COLORS["pitch_generated"], barColor: PIPELINE_BAR_COLORS["pitch_generated"] },
  { key: "contacted",       label: PIPELINE_LABELS["contacted"],       textColor: PIPELINE_TEXT_COLORS["contacted"],       barColor: PIPELINE_BAR_COLORS["contacted"] },
  { key: "in_conversation", label: PIPELINE_LABELS["in_conversation"], textColor: PIPELINE_TEXT_COLORS["in_conversation"], barColor: PIPELINE_BAR_COLORS["in_conversation"] },
  { key: "won",             label: PIPELINE_LABELS["won"],             textColor: PIPELINE_TEXT_COLORS["won"],             barColor: PIPELINE_BAR_COLORS["won"] },
  { key: "lost",            label: PIPELINE_LABELS["lost"],            textColor: PIPELINE_TEXT_COLORS["lost"],            barColor: PIPELINE_BAR_COLORS["lost"] },
];

export default function DashboardClient({ userEmail, totalLeads, flaggedLeads, totalPitches, pipelineCounts, recentLeads }: Props) {
  const [now, setNow] = useState<number | null>(null);
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

  // ── Empty state for first-time users ─────────────────────────────────
  if (totalLeads === 0) {
    return (
      <div className="min-h-screen">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="mb-8">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Dashboard</p>
            <h1 className="mt-1 text-3xl font-normal tracking-tight text-[var(--text-primary)]">Good to see you, {userEmail}</h1>
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

        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Dashboard</p>
            <h1 className="mt-1 text-3xl font-normal tracking-tight text-[var(--text-primary)]">Good to see you.</h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{userEmail}</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/dashboard/leads"
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-1)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-colors duration-150 hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)]"
            >
              <ListFilter className="h-4 w-4" /> All Opportunities
            </Link>
            <Link
              href="/dashboard/discover"
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-[var(--accent-hover)]"
            >
              <Search className="h-4 w-4" /> Discover
            </Link>
          </div>
        </div>
        <div className="space-y-6">

            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {STAT_CARDS(totalLeads, flaggedLeads, totalPitches, totalPipeline).map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.label}
                    className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4"
                  >
                    <div className={`mb-2 inline-flex rounded-lg p-2 ${card.iconBg}`}>
                      <Icon className={`h-4 w-4 ${card.iconColor}`} />
                    </div>
                    <p className="text-3xl font-normal tracking-tight text-[var(--text-primary)] leading-none">
                      {card.value}
                    </p>
                    <p className="mt-1.5 text-[11px] text-[var(--text-tertiary)]">
                      {card.label}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Recent Opportunities */}
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
                <div className="space-y-1.5">
                  {leads.map((lead) => {
                    const score = lead.performance_score ?? lead.design_score;
                    return (
                      <Link
                        key={lead.id}
                        href={`/dashboard/leads/${lead.id}`}
                        className="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-transparent bg-[var(--bg-elevated)] p-3 text-left transition-colors duration-150 hover:border-[var(--border)] hover:bg-[var(--bg-surface)]"
                      >
                        <ScoreRing score={score} size={36} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-[var(--text-primary)]">{lead.name}</p>
                          <p className="text-xs text-[var(--text-tertiary)]">
                            {lead.business_type} · {lead.city} · {timeAgo(lead.discovered_at, now)}
                          </p>
                        </div>
                        {score === null ? (
                          <span className="rounded-full bg-[var(--bg-surface-2)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-tertiary)]">
                            Not Analysed
                          </span>
                        ) : (() => {
                          const oppScore = (lead as { opportunity_score?: number | null }).opportunity_score
                            ?? computeOpportunityScore(score, (lead as { review_count?: number }).review_count ?? 0, (lead as { rating?: number }).rating ?? 0);
                          const label = opportunityLabel(oppScore);
                          const variant = opportunityBadgeVariant(oppScore);
                          const map: Record<string, string> = {
                            green:  "text-[var(--badge-green-text)] bg-[var(--badge-green-bg)]",
                            amber:  "text-[var(--badge-amber-text)] bg-[var(--badge-amber-bg)]",
                            indigo: "text-[var(--badge-indigo-text)] bg-[var(--badge-indigo-bg)]",
                            red:    "text-[var(--badge-red-text)] bg-[var(--badge-red-bg)]",
                          };
                          return (
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${map[variant] ?? ""}`}>
                              {label}
                            </span>
                          );
                        })()}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pipeline Overview */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-6">
              <h2 className="mb-4 text-base font-semibold text-[var(--text-primary)]">Pipeline Overview</h2>
              {totalPipeline === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-sm text-[var(--text-tertiary)]">No businesses in pipeline yet.</p>
                  <Link href="/dashboard/discover" className="mt-2 inline-block text-sm font-medium text-[var(--accent)] hover:underline">
                    Discover and add leads
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {PIPELINE_STAGES.map((stage) => {
                    const count = pipelineCounts[stage.key] ?? 0;
                    const pct = totalPipeline > 0 ? (count / totalPipeline) * 100 : 0;
                    return (
                      <div key={stage.key}>
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-sm text-[var(--text-secondary)]">{stage.label}</span>
                          <span className={`text-sm font-semibold ${stage.textColor}`}>{count}</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bg-elevated)]">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${stage.barColor}`}
                            style={{ width: `${pct}%` }}
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

