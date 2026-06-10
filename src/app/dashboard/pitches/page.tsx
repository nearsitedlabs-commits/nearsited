"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Copy, ExternalLink, Loader2, Search, Trash2, Check, ArrowRight, EllipsisVertical, X } from "lucide-react";
import { Toast } from "@/components/ui/Toast";
import { FadeUp, StaggerContainer, useReducedMotion } from "@/lib/motion";

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

const OPPORTUNITY_TAGS: Record<string, { label: string; style: string }> = {
  has_website:   { label: "Weak site",     style: "bg-[var(--badge-indigo-bg)]/60 text-[var(--badge-indigo-text)]" },
  no_website:    { label: "No website",    style: "bg-[var(--badge-red-bg)]/60 text-[var(--badge-red-text)]" },
  social_only:   { label: "Social only",   style: "bg-[var(--badge-amber-bg)]/60 text-[var(--badge-amber-text)]" },
  platform_only: { label: "Platform only", style: "bg-[var(--badge-indigo-bg)]/60 text-[var(--badge-indigo-text)]" },
};

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
  const shouldReduce = useReducedMotion();

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
    const { data } = await supabase
      .from("pitches")
      .select("id, subject, body, tone, lead_type, channel, pitch_status, created_at, business_id, businesses:business_id(id, name, website_status, website, performance_score, design_score)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
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
    const biz = getBusiness(pitch);
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

  const channelCounts = useMemo(() => {
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
    const tag = pitch.lead_type ? OPPORTUNITY_TAGS[pitch.lead_type] : null;
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
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4">

          {/* ── Top row: business name + type tag + pipeline state ────── */}
          <div className="mb-2 flex items-center gap-2">
            <span className="truncate text-sm font-medium text-[var(--text-primary)]" style={{ fontSize: 14, fontWeight: 500 }} dir="auto">
              {biz?.name ?? "Unknown"}
            </span>
            {tag && (
              <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${tag.style}`}>
                {tag.label}
              </span>
            )}
            <div className="ml-auto shrink-0">
              {bizId && pipelineStatus ? (
                <span className="text-[11px] text-[var(--text-tertiary)]">✓ In pipeline</span>
              ) : bizId ? (
                <button
                  onClick={() => handleAddToPipeline(bizId)}
                  disabled={addingToPipeline === bizId}
                  className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-medium text-[var(--accent)] transition-colors hover:underline disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {addingToPipeline === bizId ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    "�' Pipeline"
                  )}
                </button>
              ) : null}
            </div>
          </div>

          {/* ── Middle: subject + meta + body preview ────────────────── */}
          <p className="text-[13px] font-medium text-[var(--text-primary)]" dir="auto">{pitch.subject}</p>

          <p className="mt-0.5 text-[11px] text-[var(--text-tertiary)]">
            {[channelLabel, toneLabel, score != null ? `Score ${score}` : null, dateStr]
              .filter(Boolean)
              .join(" · ")}
          </p>

          <p className="mt-1.5 text-xs text-[var(--text-tertiary)] leading-relaxed line-clamp-2">
            {bodyPreview(pitch.body)}
          </p>

          {/* ── Bottom row: actions ──────────────────────────────────── */}
          <div className="mt-3 flex items-center gap-2 border-t border-[var(--border)] pt-2.5" style={{ borderTopWidth: "0.5px" }}>
            {/* Copy — primary action */}
            <button
              onClick={() => handleCopy(pitch)}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[var(--accent-tint)] px-3 py-1.5 text-[11px] font-medium text-[var(--accent)] transition-colors hover:bg-[var(--accent)] hover:text-white"
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
                onClick={() => handleCopy(pitch)}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-[11px] font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface-2)]"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open in WhatsApp
              </button>
            ) : (
              <button
                onClick={() => handleCopy(pitch)}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-[11px] font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface-2)]"
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
                  className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-[11px] font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface-2)]"
                >
                  View <ExternalLink className="h-3 w-3" />
                </Link>
              )}

              {/* ⋯ overflow menu */}
              <div className="relative" ref={isOpenMenu ? menuRef : undefined}>
                <button
                  onClick={() => setOpenMenuId(isOpenMenu ? null : pitch.id)}
                  className="inline-flex cursor-pointer items-center rounded-lg border border-[var(--border)] p-1.5 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--bg-surface-2)]"
                >
                  <EllipsisVertical className="h-4 w-4" />
                </button>

                {isOpenMenu && (
                  <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] py-1 shadow-xl">
                    <button className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-xs text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface-2)]">
                      <Loader2 className="h-3.5 w-3.5" /> Regenerate
                    </button>
                    <button className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-xs text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface-2)]">
                      <ExternalLink className="h-3.5 w-3.5" /> Edit
                    </button>
                    {bizId && (
                      pipelineStatus ? (
                        <button
                          onClick={() => { handleRemoveFromPipeline(bizId); setOpenMenuId(null); }}
                          disabled={addingToPipeline === bizId}
                          className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-xs text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface-2)] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <ArrowRight className="h-3.5 w-3.5" /> Remove from pipeline
                        </button>
                      ) : (
                        <button
                          onClick={() => { handleAddToPipeline(bizId); setOpenMenuId(null); }}
                          disabled={addingToPipeline === bizId}
                          className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-xs text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface-2)] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <ArrowRight className="h-3.5 w-3.5" /> Send to pipeline
                        </button>
                      )
                    )}
                    <div className="my-1 border-t border-[var(--border)]" />
                    {deleteConfirmId === pitch.id ? (
                      <div className="flex gap-1 px-3 py-1">
                        <button
                          onClick={() => handleDelete(pitch.id)}
                          disabled={deletingId === pitch.id}
                          className="cursor-pointer rounded-md border border-red-500/30 bg-red-500/15 px-2 py-1 text-[10px] font-medium text-[var(--badge-red-text)] transition-colors hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {deletingId === pitch.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Confirm"}
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="cursor-pointer rounded-md border border-[var(--border)] px-2 py-1 text-[10px] font-medium text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)]"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(pitch.id)}
                        className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-xs text-[var(--badge-red-text)] transition-colors hover:bg-red-500/10"
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
      <div className="min-h-screen bg-[var(--bg-base)] p-6">
        <div className="mx-auto max-w-5xl animate-pulse space-y-4">
          <div className="h-6 w-24 rounded-lg bg-[var(--bg-elevated)]" />
          <div className="h-64 rounded-xl bg-[var(--bg-elevated)]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <div className="mx-auto max-w-5xl px-6 py-8">

        {/* ── Header: "Pitches" + stats + search/filter trigger ──────── */}
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h1 className="text-base font-medium text-[var(--text-primary)]">Pitches</h1>
            {stats.total > 0 && (
              <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                {stats.total} total · {stats.emailCount} email · {stats.whatsappCount} WhatsApp · {stats.inPipelineCount} in pipeline
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface-2)]"
            >
              <Search className="h-3.5 w-3.5" />
              Filter{searchQuery || activeFilter !== "all" ? " active" : ""}
              <span className="text-[10px] text-[var(--text-tertiary)]">{showFilters ? "▲" : "▼"}</span>
            </button>
            <button
              onClick={() => fetchPitches(true)}
              disabled={refreshing}
              className="cursor-pointer rounded-lg border border-[var(--border)] p-2 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--bg-surface-2)] disabled:cursor-not-allowed disabled:opacity-40"
              title="Refresh"
            >
              <Loader2 className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* ── Collapsible search + filters ───────────────────────────── */}
        {showFilters && (
          <div className="mb-5 space-y-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface-1)] p-4">
            {/* Search */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search businesses, subjects, or pitch content..."
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] py-2 pl-10 pr-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] transition-colors focus:border-[var(--accent)]"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Opportunity type chips */}
            <div>
              <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--text-tertiary)]">Opportunity type</p>
              <div className="flex flex-wrap items-center gap-1.5">
                {FILTERS.map((f) => {
                  const count = filterCounts[f.key] ?? 0;
                  const isZero = count === 0 && f.key !== "all";
                  return (
                    <button
                      key={f.key}
                      onClick={() => setActiveFilter(f.key)}
                      className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors duration-150 ${
                        activeFilter === f.key
                          ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                          : `border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:border-[var(--accent)]/40 hover:text-[var(--accent)] ${
                              isZero ? "opacity-50" : ""
                            }`
                      }`}
                    >
                      {f.label}
                      {count > 0 && (
                        <span className="ml-1 text-[10px] opacity-70">({count})</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Channel chips */}
            {pitches.length > 0 && (
              <div>
                <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--text-tertiary)]">Channel</p>
                <div className="flex flex-wrap items-center gap-1.5">
                  {CHANNEL_FILTERS.map((channel) => {
                    const key = channel.toLowerCase().replace(" ", "_");
                    const count = channelCounts[key] ?? 0;
                    return (
                      <span
                        key={channel}
                        className={`inline-flex cursor-default items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--bg-elevated)]/50 px-2.5 py-1 text-xs font-medium text-[var(--text-tertiary)] ${
                          count === 0 ? "opacity-50" : ""
                        }`}
                      >
                        {channel}
                        {count > 0 && <span className="text-[10px] opacity-70">({count})</span>}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Clear all */}
            {(searchQuery || activeFilter !== "all") && (
              <button
                onClick={() => { setSearchQuery(""); setActiveFilter("all"); }}
                className="text-xs font-medium text-[var(--accent)] hover:underline cursor-pointer"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}

        {/* ── Pitch list ─────────────────────────────────────────────── */}
        {pitches.length === 0 ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-6 sm:px-12 py-12 sm:py-20 text-center">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">No pitches generated yet.</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--text-tertiary)]">
              Generate outreach from any opportunity to build your outreach workspace.
            </p>
            <Link href="/dashboard/discover"
              className="mt-6 inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)]">
              View Opportunities
            </Link>
          </div>
        ) : filteredPitches.length === 0 ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-6 sm:px-12 py-10 sm:py-16 text-center">
            <p className="text-sm text-[var(--text-tertiary)]">No pitches match your search or filter.</p>
            <button onClick={() => { setSearchQuery(""); setActiveFilter("all"); }}
              className="mt-3 text-sm font-medium text-[var(--accent)] hover:underline cursor-pointer">
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <StaggerContainer>
              <div className="space-y-3">
                {filteredPitches.map((pitch) => renderCard(pitch))}
              </div>
            </StaggerContainer>

            {/* ── Empty-space CTA when < 5 pitches ──────────────────── */}
            {pitches.length < 5 && (
              <div className="mt-4 rounded-xl border-2 border-dashed border-[var(--border)] p-6 text-center transition-colors hover:border-[var(--accent)]/30">
                <p className="text-sm text-[var(--text-tertiary)]">
                  That{"'"}s all your pitches.
                </p>
                <Link
                  href="/dashboard/leads"
                  className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-[var(--accent)] hover:underline"
                >
                  Generate more from Opportunities <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </>
        )}
      </div>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
