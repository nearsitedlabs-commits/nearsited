"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import type { WebsiteStatus } from "@/lib/types";
import { PIPELINE_BADGE_STYLES, PIPELINE_SALES_STATUSES, PIPELINE_LABELS } from "@/lib/ui-constants";
import { detectLeadWorkflow } from "@/lib/lead-types";
import PipelineSelect from "@/components/ui/PipelineSelect";

// ── Types ─────────────────────────────────────────────────────────────────────

type PipelineBusiness = {
  pipeline_id: string;
  pipeline_status: string;
  created_at: string;
  id: string;
  name: string;
  address: string;
  website: string | null;
  website_status: WebsiteStatus;
  rating: number | null;
  review_count: number | null;
  city: string;
  business_type: string;
  performance_score: number | null;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = PIPELINE_SALES_STATUSES.map((value) => ({
  value,
  label: PIPELINE_LABELS[value],
  color: PIPELINE_BADGE_STYLES[value],
}));

const OPPORTUNITY_BADGES: Record<string, { label: string; style: string }> = {
  has_website:   { label: "Weak Website",  style: "bg-[var(--badge-green-bg)] text-[var(--badge-green-text)] border border-[var(--badge-green-border)]" },
  no_website:    { label: "No Website",    style: "bg-[var(--badge-red-bg)] text-[var(--badge-red-text)] border border-[var(--badge-red-border)]" },
  social_only:   { label: "Social Only",   style: "bg-[var(--badge-amber-bg)] text-[var(--badge-amber-text)] border border-[var(--badge-amber-border)]" },
  platform_only: { label: "Platform Only", style: "bg-[var(--badge-indigo-bg)] text-[var(--badge-indigo-text)] border border-[var(--badge-indigo-border)]" },
  unknown:       { label: "Unknown",       style: "bg-[var(--bg-elevated)] text-[var(--text-tertiary)] border border-[var(--border)]" },
};

const NEXT_ACTIONS: Record<string, string> = {
  new_lead:        "Generate Outreach",
  analysed:        "Review Analysis",
  contacted:       "Await Response",
  in_conversation: "Schedule Follow-Up",
  won:             "Start Project",
  lost:            "Review & Improve",
};

function getOpportunityContext(item: PipelineBusiness): string {
  const wf = detectLeadWorkflow({ website_status: item.website_status, website: item.website });
  if (wf === "website") {
    if (item.performance_score != null && item.performance_score < 70) {
      const potential = Math.min(95, item.performance_score + 25);
      return `Score ${item.performance_score} → ${potential} · +${potential - item.performance_score} pts`;
    }
    if (item.performance_score != null) return `Score: ${item.performance_score}/100`;
    return "Website opportunity";
  }
  if (wf === "social_only") return "Social presence — no website yet";
  return "No digital presence — greenfield opportunity";
}

// ── Query ─────────────────────────────────────────────────────────────────────

const PIPELINE_QUERY = `
  id, status, created_at,
  businesses:business_id (
    id, name, address, website, website_status,
    rating, review_count, city, business_type, performance_score
  )
`;

function mapPipelineRow(row: Record<string, unknown>): PipelineBusiness {
  const biz = (Array.isArray(row.businesses) ? row.businesses[0] : row.businesses) as Record<string, unknown> | null;
  return {
    pipeline_id:      row.id as string,
    pipeline_status:  row.status as string,
    created_at:       row.created_at as string,
    id:               (biz?.id as string) ?? "",
    name:             (biz?.name as string) ?? "Unknown",
    address:          (biz?.address as string) ?? "",
    website:          (biz?.website as string | null) ?? null,
    website_status:   (biz?.website_status as WebsiteStatus) ?? "unknown",
    rating:           (biz?.rating as number | null) ?? null,
    review_count:     (biz?.review_count as number | null) ?? null,
    city:             (biz?.city as string) ?? "",
    business_type:    (biz?.business_type as string) ?? "",
    performance_score:(biz?.performance_score as number | null) ?? null,
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PipelinePage() {
  const [items, setItems] = useState<PipelineBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchPipeline() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError("You must be signed in to view your pipeline."); setLoading(false); return; }
      const { data, error: fetchError } = await supabase
        .from("pipeline").select(PIPELINE_QUERY)
        .eq("user_id", user.id).order("created_at", { ascending: false });
      if (fetchError) { setError(fetchError.message); setLoading(false); return; }
      setItems((data ?? []).map((row) => mapPipelineRow(row as Record<string, unknown>)));
      setLoading(false);
    }
    fetchPipeline();
  }, [supabase]);

  const handleStatusChange = useCallback(async (pipelineId: string, newStatus: string) => {
    setUpdatingId(pipelineId);
    setItems((prev) => prev.map((item) => item.pipeline_id === pipelineId ? { ...item, pipeline_status: newStatus } : item));
    try {
      const res = await fetch("/api/pipeline", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pipelineId, status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to update status");
      }
    } catch (err) {
      console.error("Status update error:", err);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("pipeline").select(PIPELINE_QUERY)
          .eq("user_id", user.id).order("created_at", { ascending: false });
        if (data) setItems(data.map((row) => mapPipelineRow(row as Record<string, unknown>)));
      }
    } finally {
      setUpdatingId(null);
    }
  }, [supabase]);

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] px-6 py-8">
        <div className="mx-auto max-w-6xl animate-pulse space-y-4">
          <div className="h-8 w-48 rounded-lg bg-[var(--bg-elevated)]" />
          <div className="h-64 rounded-xl bg-[var(--bg-elevated)]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] px-6 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-6 py-4 text-sm text-[var(--badge-red-text)]">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] transition-colors duration-150 hover:text-[var(--text-primary)]">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface-1)] p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Pipeline</p>
              <h1 className="mt-1 text-2xl font-normal tracking-tight text-[var(--text-primary)]">Your pipeline</h1>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">Businesses you are actively pursuing</p>
            </div>
            <span className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface-2)] px-4 py-2 text-sm text-[var(--text-secondary)]">
              {items.length} active {items.length === 1 ? "opportunity" : "opportunities"}
            </span>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-12 py-20 text-center">
            <p className="text-lg font-semibold text-[var(--text-primary)]">No opportunities in pipeline yet</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-[var(--text-secondary)]">
              Add opportunities you are actively pursuing to begin tracking conversations and deals.
            </p>
            <Link href="/dashboard/discover"
              className="mt-6 inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-[var(--accent-hover)]">
              View Opportunities
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--bg-elevated)]">
                    {["Business", "Opportunity", "Context", "Next Action", "Stage", "Added"].map((h) => (
                      <th key={h} className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {items.map((item) => {
                    const badge = OPPORTUNITY_BADGES[item.website_status] ?? OPPORTUNITY_BADGES.unknown;
                    const context = getOpportunityContext(item);
                    const nextAction = NEXT_ACTIONS[item.pipeline_status] ?? "Review";

                    return (
                      <tr
                        key={item.pipeline_id}
                        onClick={() => window.location.href = `/dashboard/leads/${item.id}`}
                        className="cursor-pointer transition-colors duration-150 hover:bg-[var(--bg-elevated)]"
                      >
                        {/* Business */}
                        <td className="px-5 py-4">
                          <p className="font-medium text-[var(--text-primary)]" dir="auto">{item.name}</p>
                          <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">{item.business_type} · {item.city}</p>
                        </td>

                        {/* Opportunity Type Badge */}
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${badge.style}`}>
                            {badge.label}
                          </span>
                        </td>

                        {/* Context */}
                        <td className="px-5 py-4">
                          <span className="text-xs text-[var(--text-secondary)]">{context}</span>
                        </td>

                        {/* Next Action */}
                        <td className="px-5 py-4">
                          <Link
                            href={`/dashboard/leads/${item.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] transition-colors duration-150 hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
                          >
                            <ExternalLink className="h-3 w-3" /> {nextAction}
                          </Link>
                        </td>

                        {/* Stage */}
                        <td className="px-5 py-4">
                          {updatingId === item.pipeline_id ? (
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
                          ) : (
                            <PipelineSelect
                              value={item.pipeline_status}
                              onChange={(v) => handleStatusChange(item.pipeline_id, v)}
                              options={STATUS_OPTIONS}
                            />
                          )}
                        </td>

                        {/* Date Added */}
                        <td className="px-5 py-4 text-xs text-[var(--text-tertiary)] whitespace-nowrap">
                          {new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
