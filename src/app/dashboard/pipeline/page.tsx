"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { ArrowLeft, ExternalLink, Phone, Target, Search } from "lucide-react";
import type { WebsiteStatus } from "@/lib/db-types";
import { PIPELINE_SALES_STATUSES, PIPELINE_LABELS } from "@/lib/ui-constants";
import { detectLeadWorkflow } from "@/lib/lead-types";
import { blendQualityForOpportunity, computeOpportunityScore } from "@/lib/scoring";

// ── Types ─────────────────────────────────────────────────────────────────────

type PipelineBusiness = {
  pipeline_id: string;
  pipeline_status: string;
  created_at: string;
  id: string;
  name: string;
  address: string;
  website: string | null;
  phone: string | null;
  website_status: WebsiteStatus;
  rating: number | null;
  review_count: number | null;
  city: string;
  business_type: string;
  performance_score: number | null;
  design_score: number | null;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const STAGES = PIPELINE_SALES_STATUSES;

const STAGE_LABELS: Record<string, string> = PIPELINE_LABELS;

const STAGE_COLORS: Record<string, string> = {
  new_lead:        "border-t-[var(--pipeline-new)]",
  contacted:       "border-t-[var(--pipeline-contacted)]",
  in_conversation: "border-t-[var(--pipeline-conversation)]",
  won:             "border-t-[var(--pipeline-won)]",
  lost:            "border-t-[var(--pipeline-lost)]",
};

const STAGE_TEXT_COLORS: Record<string, string> = {
  new_lead:        "text-[var(--pipeline-new)]",
  contacted:       "text-[var(--pipeline-contacted)]",
  in_conversation: "text-[var(--pipeline-conversation)]",
  won:             "text-[var(--pipeline-won)]",
  lost:            "text-[var(--pipeline-lost)]",
};

const OPPORTUNITY_BADGES: Record<string, { label: string; style: string }> = {
  has_website:   { label: "Has Website",  style: "bg-[var(--badge-indigo-bg)] text-[var(--badge-indigo-text)] border border-[var(--badge-indigo-border)]" },
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
    if (item.performance_score != null || item.design_score != null) {
      const opp = computeOpportunityScore(
        blendQualityForOpportunity(null, item.performance_score, item.design_score),
        item.review_count ?? 0, item.rating ?? 0
      );
      const label = opp >= 70 ? "High opportunity" : opp >= 45 ? "Good opportunity" : "Moderate opportunity";
      return `${label} · opportunity score ${opp}/100`;
    }
    return "Website opportunity";
  }
  if (wf === "social_only") return "Social presence — no website yet";
  return "No digital presence — greenfield opportunity";
}

// ── Query ─────────────────────────────────────────────────────────────────────

const PIPELINE_QUERY = `
  id, status, created_at,
  businesses:business_id (
    id, name, address, website, phone, website_status,
    rating, review_count, city, business_type, performance_score, design_score
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
    phone:            (biz?.phone as string | null) ?? null,
    website_status:   (biz?.website_status as WebsiteStatus) ?? "unknown",
    rating:           (biz?.rating as number | null) ?? null,
    review_count:     (biz?.review_count as number | null) ?? null,
    city:             (biz?.city as string) ?? "",
    business_type:    (biz?.business_type as string) ?? "",
    performance_score:(biz?.performance_score as number | null) ?? null,
    design_score:     (biz?.design_score as number | null) ?? null,
  };
}

// ── Animated Counter ──────────────────────────────────────────────────────────

function AnimatedCount({ value }: { value: number }) {
  return (
    <motion.span
      className="text-2xl font-semibold tabular-nums"
      key={value}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {value}
    </motion.span>
  );
}

// ── Mobile Card ───────────────────────────────────────────────────────────────

function MobileCard({ item, onStatusChange }: { item: PipelineBusiness; onStatusChange: (pipelineId: string, status: string) => void }) {
  const badge = OPPORTUNITY_BADGES[item.website_status] ?? OPPORTUNITY_BADGES.unknown;
  return (
    <div className={`rounded-xl border border-[var(--border)] border-l-[3px] bg-[var(--bg-surface)] p-4 ${STAGE_COLORS[item.pipeline_status]?.replace("border-t-", "border-l-") ?? ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-[var(--text-primary)]">{item.name}</p>
          <p className="mt-0.5 truncate text-xs text-[var(--text-tertiary)]">{item.business_type} · {item.city}</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase ${badge.style}`}>{badge.label}</span>
            <span className="text-[10px] text-[var(--text-tertiary)]">{new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <select
            value={item.pipeline_status}
            onChange={(e) => onStatusChange(item.pipeline_id, e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1.5 text-[11px] text-[var(--text-secondary)] focus:outline-none"
          >
            {STAGES.map((s) => (
              <option key={s} value={s}>{STAGE_LABELS[s]}</option>
            ))}
          </select>
          <Link
            href={`/dashboard/leads/${item.id}`}
            className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-[11px] font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
          >
            <ExternalLink className="h-3 w-3" /> View
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Stage Column ──────────────────────────────────────────────────────────────

function StageColumn({
  stage,
  items,
  draggingId,
  onDragStart,
  onDragEnd,
  onCardClick,
}: {
  stage: string;
  items: PipelineBusiness[];
  draggingId: string | null;
  onDragStart: (id: string) => void;
  onDragEnd: (id: string, stage: string) => void;
  onCardClick: (id: string) => void;
}) {
  const columnRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={columnRef}
      className="flex w-[280px] shrink-0 flex-col rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]"
    >
      {/* Column header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium uppercase tracking-wider ${STAGE_TEXT_COLORS[stage]}`}>
            {STAGE_LABELS[stage]}
          </span>
        </div>
        <AnimatedCount value={items.length} />
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-2 p-3 min-h-[120px]">
        <AnimatePresence>
          {items.map((item) => (
            <motion.div
              key={item.pipeline_id}
              layout
              layoutId={item.pipeline_id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{
                opacity: 1,
                scale: 1,
                transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] },
              }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
              whileHover={{ y: -1 }}
              drag
              dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
              dragElastic={0.1}
              dragMomentum={false}
              onDragStart={() => onDragStart(item.pipeline_id)}
              onDragEnd={(_, info) => {
                const dx = info.offset.x;
                if (Math.abs(dx) > 80) {
                  const currentIdx = STAGES.indexOf(item.pipeline_status);
                  const dir = dx > 0 ? 1 : -1;
                  const nextIdx = Math.max(0, Math.min(STAGES.length - 1, currentIdx + dir));
                  const nextStage = STAGES[nextIdx];
                  if (nextStage !== item.pipeline_status) {
                    onDragEnd(item.pipeline_id, nextStage);
                    return;
                  }
                }
              }}
              onClick={() => onCardClick(item.id)}
              className={`cursor-grab active:cursor-grabbing rounded-lg border border-[var(--border)] border-t-[3px] bg-[var(--bg-elevated)] p-3 transition-shadow ${
                draggingId === item.pipeline_id
                  ? "shadow-[var(--brand-shadow-lg)] z-10"
                  : "shadow-[var(--brand-shadow-xs)] hover:shadow-[var(--brand-shadow-sm)]"
              } ${STAGE_COLORS[item.pipeline_status]}`}
              style={{ touchAction: "none" }}
            >
              {/* Name */}
              <p className="truncate text-sm font-medium text-[var(--text-primary)]" dir="auto">
                {item.name}
              </p>

              {/* Type + City */}
              <p className="mt-0.5 truncate text-xs text-[var(--text-tertiary)]">
                {item.business_type} · {item.city}
              </p>

              {/* Phone */}
              {item.phone && (
                <a
                  href={`tel:${item.phone}`}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-1 inline-flex items-center gap-1 text-xs text-[var(--text-tertiary)] transition-colors hover:text-[var(--accent)]"
                >
                  <Phone className="h-3 w-3" />
                  {item.phone}
                </a>
              )}

              {/* Badge row */}
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase ${
                    OPPORTUNITY_BADGES[item.website_status]?.style ?? OPPORTUNITY_BADGES.unknown.style
                  }`}
                >
                  {OPPORTUNITY_BADGES[item.website_status]?.label ?? "Unknown"}
                </span>
                <span className="text-[9px] text-[var(--text-tertiary)]">
                  {new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </div>

              {/* Context */}
              <p className="mt-1.5 text-[10px] leading-relaxed text-[var(--text-tertiary)] line-clamp-2">
                {getOpportunityContext(item)}
              </p>

              {/* Action */}
              <div className="mt-2 flex items-center gap-1.5 border-t border-[var(--border)] pt-2">
                <Link
                  href={`/dashboard/leads/${item.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--bg-surface)] px-2 py-1 text-[10px] font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
                >
                  <ExternalLink className="h-3 w-3" />
                  {NEXT_ACTIONS[item.pipeline_status] ?? "Review"}
                </Link>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
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
    // Optimistic update
    setItems((prev) => prev.map((item) =>
      item.pipeline_id === pipelineId ? { ...item, pipeline_status: newStatus } : item
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
      // Refetch on error
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("pipeline").select(PIPELINE_QUERY)
          .eq("user_id", user.id).order("created_at", { ascending: false });
        if (data) setItems(data.map((row) => mapPipelineRow(row as Record<string, unknown>)));
      }
    }
  }, [supabase]);

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

  // Group items by stage
  const grouped = useMemo(() => {
    const map: Record<string, PipelineBusiness[]> = {};
    for (const stage of STAGES) map[stage] = [];
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
              <div key={i} className="h-96 w-[280px] shrink-0 rounded-xl bg-[var(--bg-elevated)]" />
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
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] transition-colors duration-150 hover:text-[var(--text-primary)]"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>

          <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface-1)] p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Pipeline</p>
                <h1 className="mt-1 text-2xl font-normal tracking-tight text-[var(--text-primary)]">Your pipeline</h1>
                <p className="mt-1 text-sm text-[var(--text-secondary)] hidden lg:block">
                  Drag cards between stages to update progress
                </p>
                <p className="mt-1 text-sm text-[var(--text-secondary)] lg:hidden">
                  Use the dropdown on each card to update status
                </p>
              </div>
              <span className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface-2)] px-4 py-2 text-sm text-[var(--text-secondary)]">
                {items.length} active {items.length === 1 ? "opportunity" : "opportunities"}
              </span>
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
            {/* Mobile list — one card per row, grouped by stage */}
            <div className="lg:hidden space-y-6">
              {STAGES.filter((s) => (grouped[s] ?? []).length > 0).map((stage) => (
                <div key={stage}>
                  <p className={`mb-2 px-1 text-xs font-semibold uppercase tracking-wider ${STAGE_TEXT_COLORS[stage]}`}>
                    {STAGE_LABELS[stage]} · {(grouped[stage] ?? []).length}
                  </p>
                  <div className="space-y-2">
                    {(grouped[stage] ?? []).map((item) => (
                      <MobileCard key={item.pipeline_id} item={item} onStatusChange={handleStatusChange} />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Kanban board */}
            <div className="hidden lg:block">
              <LayoutGroup>
                <div className="flex gap-4 overflow-x-auto pb-4">
                  {STAGES.map((stage) => (
                    <StageColumn
                      key={stage}
                      stage={stage}
                      items={grouped[stage] ?? []}
                      draggingId={draggingId}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      onCardClick={handleCardClick}
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
