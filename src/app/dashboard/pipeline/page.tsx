"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { motion, LayoutGroup } from "@/lib/motion";
import { PIPELINE_SALES_STATUSES, PIPELINE_LABELS } from "@/lib/ui-constants";
import { detectLeadWorkflow } from "@/lib/lead-types";
import { blendQualityForOpportunity, computeOpportunityScore } from "@/lib/scoring";
import type { PipelineBusiness, PipelineStatus, WebsiteStatus } from "@/lib/db-types";
// import { PipelineCard } from "./components/PipelineCard";
import { MobileCard } from "./components/MobileCard";
import { StageColumn } from "./components/StageColumn";
import { ErrorState } from "@/components/ui/ErrorState";

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

  // Default: Contacted + In Conversation expanded; Prospect, Won, Lost collapsed.
  // Persist to localStorage so the user's preference survives navigation.
  const STORAGE_KEY = "nearsited_pipeline_collapsed";
  const [collapsedStages, setCollapsedStages] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? new Set(JSON.parse(saved) as string[]) : new Set(["new_lead", "won", "lost"]);
    } catch {
      return new Set(["new_lead", "won", "lost"]);
    }
  });
  const toggleStage = useCallback((stage: string) => {
    setCollapsedStages((prev) => {
      const next = new Set(prev);
      if (next.has(stage)) next.delete(stage);
      else next.add(stage);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
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
      <div className="min-h-screen bg-[var(--color-bg-page)] px-6 py-8">
        <div className="mx-auto max-w-6xl animate-pulse space-y-4">
          <div className="h-8 w-48 rounded-[var(--radius-sm)] bg-[var(--color-bg-elevated)]" />
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-96 w-[220px] shrink-0 rounded-[var(--radius-md)] bg-[var(--color-bg-elevated)]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-page)]">
        <ErrorState description={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-page)]">
      <div className="mx-auto max-w-[1600px] px-6 py-8">
        {/* Header — stands alone, no card wrapper (Rule E) */}
        <div className="mb-6">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
            <h1 className="text-xl font-medium tracking-tight text-[var(--color-text-primary)]">
              Your pipeline
            </h1>
            <span className="text-sm text-[var(--color-text-tertiary)]">
              {items.length} active
            </span>
          </div>
        </div>

        {/* Empty state */}
        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
            className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] px-6 sm:px-12 py-12 sm:py-20 text-center"
          >
            <p className="text-sm font-medium text-[var(--color-text-primary)]">
              Pipeline is empty.
            </p>
            <p className="mx-auto mt-1 max-w-md text-sm text-[var(--color-text-secondary)]">
              Add leads from Opportunities to start tracking your deals.
            </p>
            <Link
              href="/dashboard/leads"
              className="mt-5 inline-flex cursor-pointer items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition-colors duration-150 hover:border-[var(--color-accent)]/40 hover:text-[var(--color-accent)]"
            >
              View opportunities →
            </Link>
          </motion.div>
        ) : (
          <>
            {/* Mobile accordion — one collapsible section per stage */}
            <div className="space-y-1 lg:hidden">
              {PIPELINE_SALES_STATUSES.map((stage) => {
                const stageItems = grouped[stage] ?? [];
                const isOpen = !collapsedStages.has(stage);
                return (
                  <div key={stage} className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)]">
                    {/* Stage header — tappable to toggle */}
                    <button
                      type="button"
                      onClick={() => toggleStage(stage)}
                      className="flex w-full min-h-[48px] items-center justify-between px-4 py-3 text-left transition-colors [@media(hover:hover)]:hover:bg-[var(--color-bg-elevated)] active:bg-[var(--color-bg-elevated)]"
                    >
                      <span className="text-sm font-medium text-[var(--color-text-primary)]">
                        {PIPELINE_LABELS[stage as keyof typeof PIPELINE_LABELS] ?? stage}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium tabular-nums ${stageItems.length > 0 ? "text-[var(--color-text-secondary)]" : "text-[var(--color-text-tertiary)]"}`}>
                          {stageItems.length}
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 text-[var(--color-text-tertiary)] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                        />
                      </div>
                    </button>

                    {/* Stage cards — collapse/expand */}
                    {isOpen && (
                      <div className="border-t border-[var(--color-border-subtle)]">
                        {stageItems.length === 0 ? (
                          <p className="px-4 py-5 text-sm text-[var(--color-text-tertiary)]">
                            No cards in this stage.
                          </p>
                        ) : (
                          <div className="space-y-2 px-3 pb-3 pt-2">
                            {stageItems.map((item) => (
                              <MobileCard
                                key={item.pipeline_id}
                                item={item}
                                score={scores[item.pipeline_id] ?? null}
                                onStatusChange={handleStatusChange}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
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
