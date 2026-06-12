"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Copy, ExternalLink, Loader2, RefreshCw, Search, Trash2, Check, ArrowRight, EllipsisVertical, X } from "lucide-react";
import { PITCH_STATUS_LABELS } from "@/lib/ui-constants";
import { WebsiteStatusPill } from "@/components/ui/WebsiteStatusPill";
import { Toast } from "@/components/ui/Toast";
import { FadeUp, StaggerContainer } from "@/lib/motion";
import { ErrorState } from "@/components/ui/ErrorState";
import { BottomSheet } from "@/components/ui/mobile/BottomSheet";

// ── Types ─────────────────────────────────────────────────────────────────────

type Pitch = {
  id: string;
  subject: string;
  body: string;
  tone: string | null;
  lead_type: string | null;
  channel: string | null;
  pitch_status: string;
  created_at: string;
  businesses: {
    name: string;
    website_status?: string;
    website?: string;
    performance_score?: number | null;
    design_score?: number | null;
  } | {
    name: string;
    website_status?: string;
    website?: string;
    performance_score?: number | null;
    design_score?: number | null;
  }[];
};

type FilterKey = "all" | "has_website" | "no_website" | "social_only" | "platform_only";

// ── Constants ─────────────────────────────────────────────────────────────────

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all",          label: "All" },
  { key: "has_website",  label: "Weak site" },
  { key: "no_website",   label: "No website" },
  { key: "social_only",  label: "Social only" },
  { key: "platform_only", label: "Platform only" },
];

const CHANNEL_FILTERS = ["Email", "WhatsApp", "Contact Form"] as const;


// ── Helpers ───────────────────────────────────────────────────────────────────

function getBusiness(pitch: Pitch): { name: string; website_status?: string; website?: string; performance_score?: number | null; design_score?: number | null } | null {
  const biz = Array.isArray(pitch.businesses) ? pitch.businesses[0] : pitch.businesses;
  return biz ?? null;
}

function getScore(biz: { performance_score?: number | null; design_score?: number | null } | null): number | null {
  if (!biz) return null;
  if (biz.performance_score != null) return biz.performance_score;
  if (biz.design_score != null) return biz.design_score;
  return null;
}

/** Truncate body to ~2 lines, ending at a sentence boundary */
function bodyPreview(text: string): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  // Find a sentence boundary within the first ~180 chars (~2 lines)
  const maxLen = 180;
  if (cleaned.length <= maxLen) return cleaned;
  const truncated = cleaned.slice(0, maxLen);
  // Try to break at a sentence-ending punctuation followed by space/end
  const sentenceEnd = truncated.search(/[.!?](?:\s|$)/);
  if (sentenceEnd > 0 && sentenceEnd < maxLen - 10) {
    return truncated.slice(0, sentenceEnd + 1);
  }
  // Fall back to last word boundary
  const lastSpace = truncated.lastIndexOf(" ");
  if (lastSpace > 0) return truncated.slice(0, lastSpace) + ".";
  return truncated + ".";
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PitchesPage() {
  const supabase = createClient();
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [pipelineStatuses, setPipelineStatuses] = useState<Record<string, string>>({});
  const [addingToPipeline, setAddingToPipeline] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [openPitchId, setOpenPitchId] = useState<string | null>(null);

  // Close overflow menu on click outside
  useEffect(() => {
    if (!openMenuId) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openMenuId]);

  const fetchPitches = useCallback(async (showLoader = false) => {
    if (showLoader) setRefreshing(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); setRefreshing(false); return; }
    const { data, error: fetchError } = await supabase
      .from("pitches")
      .select("id, subject, body, tone, lead_type, channel, pitch_status, created_at, business_id, businesses:business_id(id, name, website_status, website, performance_score, design_score)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    const pitchData = (data ?? []) as (Pitch & { business_id: string })[];
    setPitches(pitchData);

    if (pitchData.length > 0) {
      const bizIds = pitchData.map((p) => p.business_id).filter(Boolean);
      if (bizIds.length > 0) {
        const { data: pipelineData } = await supabase
          .from("pipeline")
          .select("business_id, status")
          .in("business_id", bizIds);
        if (pipelineData) {
          const map: Record<string, string> = {};
          pipelineData.forEach((row) => { map[row.business_id] = row.status; });
          setPipelineStatuses(map);
        }
      }
    }

    setLoading(false);
    setRefreshing(false);
  }, [supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPitches(true);
    const onFocus = () => fetchPitches();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchPitches]);

  const handleCopy = async (pitch: Pitch) => {
    const _biz = getBusiness(pitch);
    const text = pitch.channel === "whatsapp" ? pitch.body : `Subject: ${pitch.subject}\n\n${pitch.body}`;
    await navigator.clipboard.writeText(text);
    setCopiedId(pitch.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setDeleteConfirmId(null);
    const { error } = await supabase.from("pitches").delete().eq("id", id);
    if (error) {
      setToast("Failed to delete pitch");
      setDeletingId(null);
      return;
    }
    setPitches((prev) => prev.filter((p) => p.id !== id));
    setDeletingId(null);
    setToast("Pitch deleted");
  };

  const handleAddToPipeline = async (businessId: string) => {
    setAddingToPipeline(businessId);
    try {
      const res = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId }),
      });
      if (res.ok) {
        setPipelineStatuses((prev) => ({ ...prev, [businessId]: "new_lead" }));
        setToast("Added to pipeline");
      } else {
        const data = await res.json().catch(() => null);
        setToast(data?.error ?? "Failed to add to pipeline");
      }
    } catch {
      setToast("Network error");
    } finally {
      setAddingToPipeline(null);
    }
  };

  const handleRemoveFromPipeline = async (businessId: string) => {
    setAddingToPipeline(businessId);
    try {
      const res = await fetch("/api/pipeline", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId }),
      });
      if (res.ok) {
        setPipelineStatuses((prev) => {
          const next = { ...prev };
          delete next[businessId];
          return next;
        });
        setToast("Removed from pipeline");
      } else {
        setToast("Failed to remove from pipeline");
      }
    } catch {
      setToast("Network error");
    } finally {
      setAddingToPipeline(null);
    }
  };

  const handleOpenInWhatsApp = useCallback((pitch: Pitch) => {
    const text = encodeURIComponent(pitch.body ?? "");
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  }, []);

  const handleOpenInEmail = useCallback((pitch: Pitch) => {
    const subject = encodeURIComponent(pitch.subject ?? "");
    const body = encodeURIComponent(pitch.body ?? "");
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }, []);

  // Compute stats
  const stats = useMemo(() => {
    const total = pitches.length;
    const emailCount = pitches.filter((p) => p.channel === "email").length;
    const whatsappCount = pitches.filter((p) => p.channel === "whatsapp").length;
    const pitchBizIds = new Set(
      pitches.map((p) => (p as Pitch & { business_id?: string }).business_id).filter((id): id is string => !!id)
    );
    const inPipelineCount = [...pitchBizIds].filter((id) => pipelineStatuses[id]).length;
    return { total, emailCount, whatsappCount, inPipelineCount };
  }, [pitches, pipelineStatuses]);

  // Count per filter type
  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const f of FILTERS) {
      if (f.key === "all") counts[f.key] = pitches.length;
      else counts[f.key] = pitches.filter((p) => p.lead_type === f.key).length;
    }
    return counts;
  }, [pitches]);

  const _channelCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const ch of CHANNEL_FILTERS) {
      const key = ch.toLowerCase().replace(" ", "_");
      counts[key] = pitches.filter((p) => p.channel === key).length;
    }
    return counts;
  }, [pitches]);

  // Filtered + searched pitches
  const filteredPitches = useMemo(() => {
    let result = pitches;
    if (activeFilter !== "all") {
      result = result.filter((p) => p.lead_type === activeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) => {
        const biz = getBusiness(p);
        const bizName = biz?.name?.toLowerCase() ?? "";
        return bizName.includes(q) || p.subject.toLowerCase().includes(q) || p.body.toLowerCase().includes(q);
      });
    }
    return result;
  }, [pitches, activeFilter, searchQuery]);

  // ── Render pitch card ─────────────────────────────────────────────────
  const renderCard = (pitch: Pitch) => {
    const biz = getBusiness(pitch);
    const pitchRow = pitch as Pitch & { business_id?: string };
    const bizId = pitchRow.business_id;
    const pipelineStatus = bizId ? pipelineStatuses[bizId] : undefined;
    const score = getScore(biz);

    const channelLabel = pitch.channel
      ? pitch.channel.charAt(0).toUpperCase() + pitch.channel.slice(1).replace("_", " ")
      : null;
    const toneLabel = pitch.tone
      ? pitch.tone.charAt(0).toUpperCase() + pitch.tone.slice(1)
      : null;
    const dateStr = new Date(pitch.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });

    const isOpenMenu = openMenuId === pitch.id;

    return (
      <FadeUp key={pitch.id}>
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-4">

          {/* ── Tappable body — opens full pitch sheet on mobile ──────── */}
          <div
            className="cursor-pointer"
            onClick={() => setOpenPitchId(pitch.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpenPitchId(pitch.id); } }}
          >
          {/* ── Top row: business name + type tag + pipeline state ────── */}
          <div className="mb-2 flex items-center gap-2">
            <span className="truncate text-sm font-medium text-[var(--color-text-primary)]" style={{ fontSize: 14, fontWeight: 500 }} dir="auto">
              {biz?.name ?? "Unknown"}
            </span>
            {pitch.lead_type && (
              <WebsiteStatusPill status={pitch.lead_type} size="sm" />
            )}
            <div className="ml-auto shrink-0">
              {bizId && pipelineStatus ? (
                <span className="text-[11px] text-[var(--color-text-tertiary)]">✓ In pipeline</span>
              ) : bizId ? (
                <button
                  onClick={() => handleAddToPipeline(bizId)}
                  disabled={addingToPipeline === bizId}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--color-border-strong)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {addingToPipeline === bizId ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    "+ Pipeline"
                  )}
                </button>
              ) : null}
            </div>
          </div>

          {/* ── Middle: subject + meta + body preview ────────────────── */}
          <p className="text-[13px] font-medium text-[var(--color-text-primary)]" dir="auto">{pitch.subject}</p>

          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-[var(--color-text-tertiary)]">
              {[channelLabel, toneLabel, score != null ? `Score ${score}` : null, dateStr]
                .filter(Boolean)
                .join(" · ")}
            </span>
            {pitch.pitch_status && pitch.pitch_status !== "draft" && (
              <span className={`inline-flex items-center rounded-[var(--radius-sm)] border px-2 py-0.5 text-[10px] font-medium ${
                pitch.pitch_status === "replied"
                  ? "border-[var(--color-success)]/30 bg-[var(--color-success)]/10 text-[var(--color-success)]"
                  : "border-blue-500/30 bg-blue-500/10 text-blue-400"
              }`}>
                {PITCH_STATUS_LABELS[pitch.pitch_status as keyof typeof PITCH_STATUS_LABELS] ?? pitch.pitch_status}
              </span>
            )}
          </div>

          <p className="mt-1.5 text-xs text-[var(--color-text-tertiary)] leading-relaxed line-clamp-2">
            {bodyPreview(pitch.body)}
          </p>
          </div>{/* end tappable wrapper */}

          {/* ── Bottom row: actions ──────────────────────────────────── */}
          <div className="mt-3 flex items-center gap-2 border-t border-[var(--color-border-subtle)] pt-2.5" onClick={(e) => e.stopPropagation()} style={{ borderTopWidth: "0.5px" }}>
            {/* Copy — primary action */}
            <button
              onClick={() => handleCopy(pitch)}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--color-accent)]/10 px-3 py-1.5 text-[11px] font-medium text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent)] hover:text-white"
            >
              {copiedId === pitch.id ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copiedId === pitch.id ? "Copied" : "Copy"}
            </button>

            {/* Open in email/WhatsApp — secondary, channel-aware */}
            {pitch.channel === "whatsapp" ? (
              <button
                onClick={() => handleOpenInWhatsApp(pitch)}
                aria-label="Open pitch in WhatsApp"
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] px-3 py-1.5 text-[11px] font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-elevated)]"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open in WhatsApp
              </button>
            ) : (
              <button
                onClick={() => handleOpenInEmail(pitch)}
                aria-label="Open pitch in email client"
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] px-3 py-1.5 text-[11px] font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-elevated)]"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open in email
              </button>
            )}

            <div className="ml-auto flex items-center gap-1">
              {/* View ↗ */}
              {bizId && (
                <Link
                  href={`/dashboard/leads/${bizId}`}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] px-2.5 py-1.5 text-[11px] font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-elevated)]"
                >
                  View <ExternalLink className="h-3 w-3" />
                </Link>
              )}

              {/* ⋯ overflow menu */}
              <div className="relative" ref={isOpenMenu ? menuRef : undefined}>
                <button
                  onClick={() => setOpenMenuId(isOpenMenu ? null : pitch.id)}
                  className="inline-flex cursor-pointer items-center rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] p-1.5 text-[var(--color-text-tertiary)] transition-colors hover:bg-[var(--color-bg-elevated)]"
                >
                  <EllipsisVertical className="h-4 w-4" />
                </button>

                {isOpenMenu && (
                  <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] py-1 shadow-xl">
                    <button className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-xs text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-elevated)]">
                      <RefreshCw className="h-3.5 w-3.5" /> Regenerate
                    </button>
                    <button className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-xs text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-elevated)]">
                      <ExternalLink className="h-3.5 w-3.5" /> Edit
                    </button>
                    {bizId && (
                      pipelineStatus ? (
                        <button
                          onClick={() => { handleRemoveFromPipeline(bizId); setOpenMenuId(null); }}
                          disabled={addingToPipeline === bizId}
                          className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-xs text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-elevated)] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <ArrowRight className="h-3.5 w-3.5" /> Remove from pipeline
                        </button>
                      ) : (
                        <button
                          onClick={() => { handleAddToPipeline(bizId); setOpenMenuId(null); }}
                          disabled={addingToPipeline === bizId}
                          className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-xs text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-elevated)] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <ArrowRight className="h-3.5 w-3.5" /> Send to pipeline
                        </button>
                      )
                    )}
                    <div className="my-1 border-t border-[var(--color-border-subtle)]" />
                    {deleteConfirmId === pitch.id ? (
                      <div className="flex gap-1 px-3 py-1">
                        <button
                          onClick={() => handleDelete(pitch.id)}
                          disabled={deletingId === pitch.id}
                          className="cursor-pointer rounded-[var(--radius-sm)] border border-red-500/30 bg-red-500/15 px-2 py-1 text-[10px] font-medium text-[var(--color-danger)] transition-colors hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {deletingId === pitch.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Confirm"}
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="cursor-pointer rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] px-2 py-1 text-[10px] font-medium text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-text-secondary)]"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(pitch.id)}
                        className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-xs text-[var(--color-danger)] transition-colors hover:bg-red-500/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </FadeUp>
    );
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-page)] p-6">
        <div className="mx-auto max-w-5xl animate-pulse space-y-4">
          <div className="h-6 w-24 rounded-[var(--radius-sm)] bg-[var(--color-bg-elevated)]" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 rounded-[var(--radius-md)] bg-[var(--color-bg-elevated)]" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-page)]">
        <ErrorState description={error} onRetry={() => fetchPitches(true)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-page)]">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h1 className="text-base font-medium text-[var(--color-text-primary)]">Pitches</h1>
            {stats.total > 0 && (
              <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
                {stats.total} total · {stats.emailCount} email · {stats.whatsappCount} WhatsApp · {stats.inPipelineCount} in pipeline
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] p-2 text-[var(--color-text-tertiary)] transition-colors hover:bg-[var(--color-bg-elevated)]"
              title="Search"
            >
              <Search className="h-4 w-4" />
            </button>
            <button
              onClick={() => fetchPitches(true)}
              disabled={refreshing}
              className="cursor-pointer rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] p-2 text-[var(--color-text-tertiary)] transition-colors hover:bg-[var(--color-bg-elevated)] disabled:cursor-not-allowed disabled:opacity-40"
              title="Refresh"
            >
              <Loader2 className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* ── Always-visible scrollable filter chips ──────────────────── */}
        <div className="mb-4 flex items-center gap-1.5 overflow-x-auto text-[11px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {FILTERS.map((f) => {
            const count = filterCounts[f.key] ?? 0;
            const isZero = count === 0 && f.key !== "all";
            return (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={`shrink-0 cursor-pointer rounded-[var(--radius-sm)] border px-3 py-2 min-h-[44px] flex items-center text-xs font-medium transition-colors duration-150 ${
                  activeFilter === f.key
                    ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
                    : `border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]/40 hover:text-[var(--color-accent)] ${isZero ? "opacity-50" : ""}`
                }`}
              >
                {f.label}
                <span className="ml-1 text-[10px] opacity-70">({count})</span>
              </button>
            );
          })}
        </div>

        {/* ── Collapsible search (advanced) ───────────────────────────── */}
        {showFilters && (
          <div className="mb-4 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search businesses, subjects, or pitch content..."
                className="w-full rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] py-2 pl-10 pr-3 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-tertiary)] transition-colors focus:border-[var(--color-accent)]"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {(searchQuery || activeFilter !== "all") && (
              <button
                onClick={() => { setSearchQuery(""); setActiveFilter("all"); }}
                className="mt-2 text-xs font-medium text-[var(--color-accent)] hover:underline cursor-pointer"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}

        {/* ── Pitch list ─────────────────────────────────────────────── */}
        {pitches.length === 0 ? (
          <div className="flex min-h-[240px] flex-col items-center justify-center py-16 text-center">
            <p className="text-sm font-medium text-[var(--color-text-primary)]">No pitches yet.</p>
            <p className="mx-auto mt-1 max-w-sm text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
              Generate one from any opportunity.
            </p>
            <Link
              href="/dashboard/leads"
              className="mt-4 inline-flex cursor-pointer items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] px-3 py-2 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-accent)]/40 hover:text-[var(--color-accent)]"
            >
              View opportunities →
            </Link>
          </div>
        ) : filteredPitches.length === 0 ? (
          <div className="flex min-h-[240px] flex-col items-center justify-center py-16 text-center">
            <p className="text-sm font-medium text-[var(--color-text-primary)]">No pitches match your filters.</p>
            <button
              onClick={() => { setSearchQuery(""); setActiveFilter("all"); }}
              className="mt-3 cursor-pointer text-xs font-medium text-[var(--color-accent)] hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            {filteredPitches.length !== pitches.length && (
              <p className="mb-3 text-xs text-[var(--color-text-tertiary)]">
                Showing {filteredPitches.length} of {pitches.length} pitches
              </p>
            )}
            <StaggerContainer>
              <div className="space-y-3">
                {filteredPitches.map((pitch) => renderCard(pitch))}
              </div>
            </StaggerContainer>

            {/* ── End-of-list CTA ───────────────────────────────────── */}
            <div className="mt-4 rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-subtle)] p-6 text-center transition-colors hover:border-[var(--color-accent)]/30">
              <p className="text-[13px] text-[var(--color-text-tertiary)]">
                That&apos;s all your pitches.
              </p>
              <Link
                href="/dashboard/leads"
                className="mt-1.5 inline-flex items-center gap-1 text-[13px] font-medium text-[var(--color-accent)] hover:underline"
              >
                Generate more from Opportunities <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </>
        )}
      </div>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      {/* Full pitch bottom sheet — mobile tap-to-read */}
      {(() => {
        const p = pitches.find((x) => x.id === openPitchId);
        const biz = p ? getBusiness(p) : null;
        return (
          <BottomSheet
            isOpen={openPitchId !== null}
            onClose={() => setOpenPitchId(null)}
            title={biz?.name ?? "Pitch"}
          >
            {p && (
              <div className="space-y-4 px-1 pb-4">
                {p.subject && (
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">{p.subject}</p>
                )}
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-text-secondary)]">
                  {p.body}
                </p>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => { handleCopy(p); setOpenPitchId(null); }}
                    className="flex-1 rounded-[var(--radius-sm)] bg-[var(--color-accent)] py-3 text-sm font-medium text-white transition-colors active:opacity-90"
                  >
                    {copiedId === p.id ? "Copied!" : "Copy pitch"}
                  </button>
                  <button
                    onClick={() => { if (p.channel === "whatsapp") handleOpenInWhatsApp(p); else handleOpenInEmail(p); }}
                    className="flex-1 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] py-3 text-sm font-medium text-[var(--color-text-secondary)] transition-colors active:bg-[var(--color-bg-surface)]"
                  >
                    {p.channel === "whatsapp" ? "Open in WhatsApp" : "Open in email"}
                  </button>
                </div>
              </div>
            )}
          </BottomSheet>
        );
      })()}
    </div>
  );
}
