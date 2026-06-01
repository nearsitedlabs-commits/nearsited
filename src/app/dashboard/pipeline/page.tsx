"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { WebsiteStatus } from "@/lib/types";
import { PIPELINE_BADGE_STYLES, PIPELINE_STATUSES, PIPELINE_LABELS } from "@/lib/ui-constants";

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

const STATUS_OPTIONS = PIPELINE_STATUSES.map((value) => ({
  value,
  label: PIPELINE_LABELS[value],
  color: PIPELINE_BADGE_STYLES[value],
}));

import { WebsiteBadge as SharedWebsiteBadge } from "@/components/ui/WebsiteBadge";

import { ScoreRing as SharedScoreRing } from "@/components/ui/ScoreRing";

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
            </div>
            <span className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface-2)] px-4 py-2 text-sm text-[var(--text-secondary)]">
              {items.length} business{items.length === 1 ? "" : "es"}
            </span>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-12 text-center">
            <p className="text-lg font-semibold text-[var(--text-primary)]">No businesses yet</p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Go to{" "}
              <Link href="/dashboard/discover" className="font-medium text-[var(--accent)] hover:underline">
                Discover
              </Link>{" "}
              to find prospects.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--bg-elevated)]">
                    {["Business", "Location", "Website", "Score", "Action", "Status", "Date Added"].map((h) => (
                      <th key={h} className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {items.map((item) => (
                    <tr
                      key={item.pipeline_id}
                      onClick={() => window.location.href = `/dashboard/leads/${item.id}`}
                      className="cursor-pointer transition-colors duration-150 hover:bg-[var(--bg-elevated)]"
                    >
                      <td className="px-5 py-4">
                        <p className="font-medium text-[var(--text-primary)]">{item.name}</p>
                        <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">{item.business_type}</p>
                      </td>
                      <td className="px-5 py-4 text-sm text-[var(--text-secondary)]">{item.city}</td>
                      <td className="px-5 py-4"><SharedWebsiteBadge status={item.website_status} /></td>
                      <td className="px-5 py-4"><SharedScoreRing score={item.performance_score} /></td>
                      <td className="px-5 py-4">
                        {item.performance_score === null ? (
                          <Link
                            href={`/dashboard/leads/${item.id}`}
                            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-[var(--border)] px-2.5 py-1 text-xs font-medium text-[var(--text-tertiary)] transition-colors hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            → Analyse
                          </Link>
                        ) : null}
                      </td>
                      <td className="px-5 py-4">
                        {updatingId === item.pipeline_id ? (
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
                        ) : (
                          <select
                            value={item.pipeline_status}
                            onChange={(e) => handleStatusChange(item.pipeline_id, e.target.value)}
                            className="cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-1.5 text-sm font-medium text-[var(--text-secondary)] outline-none transition-colors duration-150 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
                          >
                            {STATUS_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="px-5 py-4 text-sm text-[var(--text-tertiary)]">
                        {new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
