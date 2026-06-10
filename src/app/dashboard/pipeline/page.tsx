"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { motion, LayoutGroup } from "@/lib/motion";
import { Target, Search } from "lucide-react";
import { PIPELINE_SALES_STATUSES } from "@/lib/ui-constants";
import { detectLeadWorkflow } from "@/lib/lead-types";
import { blendQualityForOpportunity, computeOpportunityScore } from "@/lib/scoring";
import type { PipelineBusiness, PipelineStatus, WebsiteStatus } from "@/lib/db-types";
// import { PipelineCard } from "./components/PipelineCard";
import { MobileCard } from "./components/MobileCard";
import { StageColumn } from "./components/StageColumn";

// ── Query ─────────────────────────────────────────────────────────────────────

const PIPELINE_QUERY = `
  id, status, stage_entered_at, created_at,
  businesses:business_id (
    id, name, address, website, phone, website_status,
    rating, review_count, city, business_type, performance_score, design_score
  )
`;

function mapPipelineRow(row: Record<string, unknown>): PipelineBusiness {
  const biz = (Array.isArray(row.businesses) ? row.businesses[0] : row.businesses) as Record<string, unknown> | null;
  return {
    pipeline_id:      row.id as string,
    pipeline_status:  row.status as PipelineStatus,
    stage_entered_at: (row.stage_entered_at as string | null) ?? null,
    created_at:       row.created_at as string,
    id:               (biz?.id as string) ?? "",
    user_id:          "",
    name:             (biz?.name as string) ?? "Unknown",
    place_id:         null,
    business_type:    (biz?.business_type as string) ?? null,
    address:          (biz?.address as string) ?? null,
    city:             (biz?.city as string) ?? null,
    phone:            (biz?.phone as string | null) ?? null,
    website:          (biz?.website as string | null) ?? null,
    website_status:   (biz?.website_status as WebsiteStatus) ?? "unknown",
    rating:           (biz?.rating as number | null) ?? null,
    review_count:     (biz?.review_count as number | null) ?? null,
    performance_score:(biz?.performance_score as number | null) ?? null,
    design_score:     (biz?.design_score as number | null) ?? null,
    ux_score:         null,
    opportunity_score:null,
    flagged_for_outreach: false,
    outreach_reason:  null,
    discovered_at:    row.created_at as string,
    audited_at:       null,
    design_analyzed_at: null,
    ux_analyzed_at:   null,
  };
}

// ── Score Helper ──────────────────────────────────────────────────────────────

function getOpportunityScore(item: PipelineBusiness): number | null {
  const wf = detectLeadWorkflow({ website_status: item.website_status ?? "unknown", website: item.website });
  if (wf !== "website") return null;
  if (item.performance_score == null && item.design_score == null) return null;
  return computeOpportunityScore(
    blendQualityForOpportunity(null, item.performance_score, item.design_score),
    item.review_count ?? 0,
    item.rating ?? 0,
    item.business_type
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PipelinePage() {
  const [items, setItems] = useState<PipelineBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
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
    setItems((prev) => prev.map((item) =>
      item.pipeline_id === pipelineId ? { ...item, pipeline_status: newStatus as PipelineStatus } : item
    ));
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
    }
  }, [supabase]);

  const handleDelete = useCallback(async (pipelineId: string) => {
    try {
      const res = await fetch(`/api/pipeline?id=${pipelineId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setItems((prev) => prev.filter((item) => item.pipeline_id !== pipelineId));
    } catch (err) {
      console.error("Delete error:", err);
    }
  }, []);

  const handleDragStart = useCallback((id: string) => {
    setDraggingId(id);
  }, []);

  const handleDragEnd = useCallback((id: string, stage: string) => {
    setDraggingId(null);
    handleStatusChange(id, stage);
  }, [handleStatusChange]);

  const handleCardClick = useCallback((id: string) => {
    window.location.href = `/dashboard/leads/${id}`;
  }, []);

  // Pre-compute opportunity scores for all items
  const scores = useMemo(() => {
    const map: Record<string, number | null> = {};
    for (const item of items) {
      map[item.pipeline_id] = getOpportunityScore(item);
    }
    return map;
  }, [items]);

  // Group items by stage
  const grouped = useMemo(() => {
    const map: Record<string, PipelineBusiness[]> = {};
    for (const stage of PIPELINE_SALES_STATUSES) map[stage] = [];
    for (const item of items) {
      if (map[item.pipeline_status]) {
        map[item.pipeline_status].push(item);
      } else {
        map["new_lead"].push(item);
      }
    }
    return map;
  }, [items]);

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] px-6 py-8">
        <div className="mx-auto max-w-6xl animate-pulse space-y-4">
          <div className="h-8 w-48 rounded-lg bg-[var(--bg-elevated)]" />
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-96 w-[220px] shrink-0 rounded-xl bg-[var(--bg-elevated)]" />
            ))}
          </div>
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
      <div className="mx-auto max-w-[1600px] px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface-1)] p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-normal tracking-tight text-[var(--text-primary)]">
                  Your pipeline
                  <span className="ml-2 text-sm font-normal text-[var(--text-tertiary)]">
                    · {items.length} active
                  </span>
                </h1>
              </div>
            </div>
          </div>
        </div>

        {/* Empty state */}
        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
            className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-6 sm:px-12 py-12 sm:py-20 text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-tint)]"
            >
              <Target className="h-6 w-6 text-[var(--accent)]" />
            </motion.div>
            <motion.h3
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              className="text-lg font-semibold text-[var(--text-primary)]"
            >
              No opportunities in pipeline yet
            </motion.h3>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.25 }}
              className="mx-auto mt-2 max-w-md text-sm text-[var(--text-secondary)]"
            >
              Add opportunities you are actively pursuing to begin tracking conversations and deals.
              Drag cards between stages to update progress.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.35 }}
            >
              <Link
                href="/dashboard/discover"
                className="mt-6 inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-[var(--accent-hover)]"
              >
                <Search className="h-4 w-4" /> View Opportunities
              </Link>
            </motion.div>
          </motion.div>
        ) : (
          <>
            {/* Mobile list */}
            <div className="space-y-6 lg:hidden">
              {PIPELINE_SALES_STATUSES.filter((s) => (grouped[s] ?? []).length > 0).map((stage) => (
                <div key={stage}>
                  <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                    {stage} · {(grouped[stage] ?? []).length}
                  </p>
                  <div className="space-y-2">
                    {(grouped[stage] ?? []).map((item) => (
                      <MobileCard
                        key={item.pipeline_id}
                        item={item}
                        score={scores[item.pipeline_id] ?? null}
                        onStatusChange={handleStatusChange}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Kanban board */}
            <div className="hidden lg:block">
              <LayoutGroup>
                <div className="flex gap-3 overflow-x-auto pb-4">
                  {PIPELINE_SALES_STATUSES.map((stage) => (
                    <StageColumn
                      key={stage}
                      stage={stage}
                      cards={grouped[stage] ?? []}
                      draggingId={draggingId}
                      scores={scores}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      onCardClick={handleCardClick}
                      onStatusChange={handleStatusChange}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </LayoutGroup>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
