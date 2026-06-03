"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { ArrowLeft, Copy, ExternalLink, FileText, Loader2, Search, Trash2, Check, TrendingUp, X } from "lucide-react";
import { Toast } from "@/components/ui/Toast";
import { detectLeadWorkflow } from "@/lib/lead-types";

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
  } | { name: string; website_status?: string; website?: string; performance_score?: number | null; design_score?: number | null }[];
};

type FilterKey = "all" | "has_website" | "no_website" | "social_only" | "platform_only";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all",          label: "All" },
  { key: "has_website",  label: "Weak Website" },
  { key: "no_website",   label: "No Website" },
  { key: "social_only",  label: "Social Only" },
  { key: "platform_only", label: "Platform Only" },
];

// Future-proofing: channel-based filter chips (currently show count, filter ready)
const CHANNEL_FILTERS = ["Email", "WhatsApp", "Contact Form"] as const;

const OPPORTUNITY_BADGES: Record<string, { label: string; style: string }> = {
  has_website:   { label: "Weak Website Opportunity",  style: "bg-[var(--badge-green-bg)] text-[var(--badge-green-text)] border border-[var(--badge-green-border)]" },
  no_website:    { label: "No Website Opportunity",     style: "bg-[var(--badge-red-bg)] text-[var(--badge-red-text)] border border-[var(--badge-red-border)]" },
  social_only:   { label: "Social Presence Opportunity", style: "bg-[var(--badge-amber-bg)] text-[var(--badge-amber-text)] border border-[var(--badge-amber-border)]" },
  platform_only: { label: "Platform Dependency Opportunity", style: "bg-[var(--badge-indigo-bg)] text-[var(--badge-indigo-text)] border border-[var(--badge-indigo-border)]" },
};

const CHANNEL_BADGES: Record<string, { label: string; style: string }> = {
  email:         { label: "EMAIL",         style: "bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)]" },
  whatsapp:      { label: "WHATSAPP",      style: "bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)]" },
  contact_form:  { label: "CONTACT FORM",  style: "bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)]" },
  linkedin:      { label: "LINKEDIN",      style: "bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)]" },
  instagram:     { label: "INSTAGRAM",     style: "bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)]" },
  facebook:      { label: "FACEBOOK",      style: "bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)]" },
};

// ── Helper ────────────────────────────────────────────────────────────────────

function getOpportunityContext(pitch: Pitch): string | null {
  const biz = Array.isArray(pitch.businesses) ? pitch.businesses[0] : pitch.businesses;
  if (!biz) return null;
  const wf = detectLeadWorkflow({ website_status: biz.website_status ?? "unknown", website: biz.website ?? null });
  if (wf === "website") {
    const perf = biz.performance_score;
    if (perf != null && perf < 70) {
      const potential = Math.min(95, perf + 25);
      return `Website Score ${perf} → ${potential} · Potential Opportunity +${potential - perf}`;
    }
    if (perf != null) return `Website Score: ${perf}/100`;
    return "Weak Website Opportunity — performance issues identified";
  }
  if (wf === "social_only") return "Social Presence Opportunity — no owned website yet";
  if (biz.website_status === "platform_only") return "Platform Dependency — no owned website, reliant on third party";
  return "No Website Opportunity — no digital presence detected";
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PitchesPage() {
  const supabase = createClient();
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [pipelineStatuses, setPipelineStatuses] = useState<Record<string, string>>({});
  const [addingToPipeline, setAddingToPipeline] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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

    // Fetch pipeline statuses for all businesses
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
      console.error("[PITCHES] Delete failed:", error.message);
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
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, status: "new_lead" }),
      });
      if (res.ok) {
        setPipelineStatuses((prev) => ({ ...prev, [businessId]: "new_lead" }));
        setToast("Added to pipeline");
      } else {
        setToast("Failed to add to pipeline");
      }
    } catch {
      setToast("Network error");
    } finally {
      setAddingToPipeline(null);
    }
  };

  // Filtered + searched pitches
  const filteredPitches = useMemo(() => {
    let result = pitches;
    if (activeFilter !== "all") {
      result = result.filter((p) => p.lead_type === activeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) => {
        const biz = Array.isArray(p.businesses) ? p.businesses[0] : p.businesses;
        const bizName = biz?.name?.toLowerCase() ?? "";
        return bizName.includes(q) || p.subject.toLowerCase().includes(q) || p.body.toLowerCase().includes(q);
      });
    }
    return result;
  }, [pitches, activeFilter, searchQuery]);

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] p-6">
        <div className="mx-auto max-w-5xl animate-pulse space-y-4">
          <div className="h-8 w-48 rounded-lg bg-[var(--bg-elevated)]" />
          <div className="h-64 rounded-xl bg-[var(--bg-elevated)]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <Link href="/dashboard" className="mb-2 inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] transition-colors duration-150 hover:text-[var(--text-primary)]">
              <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </Link>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Pitches</p>
            <h1 className="mt-1 text-2xl font-bold text-[var(--text-primary)]">Generated Pitches</h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">AI-written outreach for your opportunities</p>
          </div>
          <button
            onClick={() => fetchPitches(true)}
            disabled={refreshing}
            className="cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-2 text-[var(--text-tertiary)] transition-colors duration-150 hover:border-[var(--accent)]/30 hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-40"
            title="Refresh"
          >
            <Loader2 className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Search + Filters */}
        <div className="mb-6 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search businesses, subjects, or pitch content..."
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] py-2.5 pl-10 pr-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] transition-colors duration-150 focus:border-[var(--accent)]"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filter chips — opportunity type */}
          <div className="flex flex-wrap items-center gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors duration-150 ${
                  activeFilter === f.key
                    ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                    : "border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
                }`}
              >
                {f.label}
              </button>
            ))}
            {filteredPitches.length < pitches.length && (
              <span className="text-xs text-[var(--text-tertiary)] self-center ml-1">
                {filteredPitches.length} of {pitches.length}
              </span>
            )}
          </div>

          {/* Future-proofing: channel filter chips — informational only */}
          {pitches.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] mr-1">Channel</span>
              {CHANNEL_FILTERS.map((channel) => {
                const count = pitches.filter((p) => p.channel?.toLowerCase() === channel.toLowerCase().replace(" ", "_")).length;
                return (
                  <span
                    key={channel}
                    className="inline-flex cursor-default items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--bg-elevated)]/50 px-2.5 py-1 text-[10px] font-medium text-[var(--text-tertiary)] opacity-60"
                  >
                    {channel}
                    {count > 0 && <span className="text-[9px]">({count})</span>}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Empty state */}
        {pitches.length === 0 ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-12 py-20 text-center">
            <FileText className="mx-auto h-10 w-10 text-[var(--text-tertiary)]" />
            <h2 className="mt-4 text-lg font-semibold text-[var(--text-primary)]">No pitches generated yet.</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--text-tertiary)]">
              Generate outreach from any opportunity to build your outreach workspace.
            </p>
            <Link href="/dashboard/discover"
              className="mt-6 inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-[var(--accent-hover)]">
              View Opportunities
            </Link>
          </div>
        ) : filteredPitches.length === 0 ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-12 py-16 text-center">
            <Search className="mx-auto h-8 w-8 text-[var(--text-tertiary)]" />
            <p className="mt-3 text-sm text-[var(--text-tertiary)]">No pitches match your search or filter.</p>
            <button onClick={() => { setSearchQuery(""); setActiveFilter("all"); }}
              className="mt-3 text-sm font-medium text-[var(--accent)] hover:underline cursor-pointer">
              Clear filters
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPitches.map((pitch) => {
              const biz = Array.isArray(pitch.businesses) ? pitch.businesses[0] : pitch.businesses;
              const pitchRow = pitch as Pitch & { business_id?: string };
              const bizId = pitchRow.business_id;
              const pipelineStatus = bizId ? pipelineStatuses[bizId] : undefined;
              const isExpanded = expandedId === pitch.id;
              const opportunityBadge = pitch.lead_type ? OPPORTUNITY_BADGES[pitch.lead_type] : null;
              const channelBadge = pitch.channel ? CHANNEL_BADGES[pitch.channel] : null;
              const opportunityContext = getOpportunityContext(pitch);

              return (
                <div
                  key={pitch.id}
                  className={`rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 transition-all duration-150 ${
                    isExpanded ? "shadow-[var(--brand-shadow-sm)]" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: Content */}
                    <div className="flex-1 min-w-0">
                      {/* Line 1: Business Name + Opportunity Badge */}
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-[var(--text-primary)]" dir="auto">{biz?.name ?? "Unknown"}</span>
                        {opportunityBadge && (
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${opportunityBadge.style}`}>
                            {opportunityBadge.label}
                          </span>
                        )}
                      </div>

                      {/* Line 2: Subject */}
                      <p className="text-sm font-medium text-[var(--accent)]" dir="auto">{pitch.subject}</p>

                      {/* Line 3: Opportunity Context */}
                      {opportunityContext && (
                        <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">{opportunityContext}</p>
                      )}

                      {/* Line 4: Channel Badge + Meta */}
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {channelBadge && (
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-semibold tracking-wider ${channelBadge.style}`}>
                            {channelBadge.label}
                          </span>
                        )}
                        {pitch.tone && <span className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">{pitch.tone}</span>}
                        <span className="text-[10px] text-[var(--text-tertiary)]">
                          {new Date(pitch.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      </div>

                      {/* Line 5: Preview / Full content */}
                      {isExpanded ? (
                        <div className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-3">
                          <p className="whitespace-pre-wrap text-xs text-[var(--text-secondary)] leading-relaxed" dir="auto">{pitch.body}</p>
                        </div>
                      ) : (
                        <p className="mt-2 text-xs text-[var(--text-tertiary)] leading-relaxed line-clamp-3">
                          {pitch.body}
                        </p>
                      )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex shrink-0 flex-col gap-1.5">
                      {/* Copy */}
                      <button
                        onClick={() => handleCopy(pitch)}
                        className="cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-2 text-[var(--text-tertiary)] transition-colors duration-150 hover:border-[var(--accent)]/30 hover:text-[var(--accent)]"
                        title="Copy to clipboard"
                      >
                        {copiedId === pitch.id ? <Check className="h-4 w-4 text-[var(--score-good)]" /> : <Copy className="h-4 w-4" />}
                      </button>

                      {/* Pipeline */}
                      {bizId && (
                        pipelineStatus ? (
                          <Link
                            href={`/dashboard/leads/${bizId}`}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-[11px] font-medium text-[var(--text-secondary)] transition-colors duration-150 hover:border-[var(--accent)]/30 hover:text-[var(--accent)]"
                          >
                            <ExternalLink className="h-3.5 w-3.5" /> View Pipeline
                          </Link>
                        ) : (
                          <button
                            onClick={() => handleAddToPipeline(bizId)}
                            disabled={addingToPipeline === bizId}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--accent)]/40 bg-[var(--accent-tint)] px-3 py-2 text-[11px] font-medium text-[var(--accent)] transition-colors duration-150 hover:bg-[var(--accent)] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {addingToPipeline === bizId ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <TrendingUp className="h-3.5 w-3.5" />
                            )}
                            Add To Pipeline
                          </button>
                        )
                      )}

                      {/* Delete */}
                      {deleteConfirmId === pitch.id ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleDelete(pitch.id)}
                            disabled={deletingId === pitch.id}
                            className="cursor-pointer rounded-lg border border-red-500/30 bg-red-500/15 px-2 py-1.5 text-[10px] font-medium text-[var(--badge-red-text)] transition-colors hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {deletingId === pitch.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Confirm"}
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1.5 text-[10px] font-medium text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)]"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(pitch.id)}
                          className="cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-2 text-[var(--text-tertiary)] transition-colors duration-150 hover:border-red-500/30 hover:text-[var(--badge-red-text)]"
                          title="Delete pitch"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}

                      {/* Expand/Collapse */}
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : pitch.id)}
                        className="cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-[11px] font-medium text-[var(--text-tertiary)] transition-colors duration-150 hover:border-[var(--accent)]/30 hover:text-[var(--accent)]"
                      >
                        {isExpanded ? "Collapse" : "Expand Card"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
