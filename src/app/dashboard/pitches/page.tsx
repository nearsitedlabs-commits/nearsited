"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { ArrowLeft, FileText, Copy, Loader2, Trash2, Check } from "lucide-react";
import { PITCH_STATUS_LABELS, LEAD_TYPE_LABELS } from "@/lib/ui-constants";
import { Toast } from "@/components/ui/Toast";

type Pitch = {
  id: string;
  subject: string;
  body: string;
  tone: string | null;
  lead_type: string | null;
  pitch_status: string;
  created_at: string;
  businesses: { name: string } | { name: string }[];
};

const STATUS_STYLES: Record<string, string> = {
  draft:   "bg-[var(--bg-elevated)] text-[var(--text-tertiary)] border border-[var(--border)]",
  sent:    "bg-blue-500/15  text-blue-400  border border-blue-500/30",
  replied: "bg-green-500/15 text-green-400 border border-green-500/30",
};

export default function PitchesPage() {
  const supabase = createClient();
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const fetchPitches = useCallback(async (showLoader = false) => {
    if (showLoader) setRefreshing(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); setRefreshing(false); return; }
    const { data } = await supabase
      .from("pitches")
      .select("id, subject, body, tone, lead_type, pitch_status, created_at, businesses:business_id(name)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setPitches((data ?? []) as Pitch[]);
    setLoading(false);
    setRefreshing(false);
  }, [supabase]);

  // Fetch on mount + refetch on window focus — catches new pitches generated from Lead Detail
  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    fetchPitches(true);
    const onFocus = () => fetchPitches();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchPitches]);

  const handleCopy = async (pitch: Pitch) => {
    await navigator.clipboard.writeText(`Subject: ${pitch.subject}\n\n${pitch.body}`);
    setCopiedId(pitch.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteConfirm = async (id: string) => {
    if (!window.confirm("Delete this pitch? This action cannot be undone.")) return;
    setDeletingId(id);
    const { error: deleteError } = await supabase.from("pitches").delete().eq("id", id);
    if (deleteError) {
      console.error("[PITCHES] Delete failed:", deleteError.message);
      setToast("Failed to delete pitch — please try again.");
      setDeletingId(null);
      return;
    }
    setPitches((prev) => prev.filter((p) => p.id !== id));
    setDeletingId(null);
    setToast("Pitch deleted");
  };

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
        <Link href="/dashboard" className="mb-6 inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] transition-colors duration-150 hover:text-[var(--text-primary)]">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>

        <div className="mb-8 flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-[var(--text-tertiary)]">Pitches</p>
            <h1 className="mt-1 text-3xl font-bold text-[var(--text-primary)]">Generated Pitches</h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">Your AI-written outreach emails</p>
          </div>
          <button
            onClick={() => fetchPitches(true)}
            disabled={refreshing}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] transition-colors duration-150 hover:border-[var(--accent)]/40 hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Loader2 className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {pitches.length === 0 ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-12 text-center">
            <FileText className="mx-auto h-8 w-8 text-[var(--text-tertiary)]" />
            <p className="mt-3 text-sm text-[var(--text-tertiary)]">No pitches yet.</p>
            <Link href="/dashboard/discover" className="mt-2 inline-block text-sm font-medium text-[var(--accent)] hover:underline">
              Discover businesses and generate pitches
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {pitches.map((pitch) => {
              const biz = Array.isArray(pitch.businesses) ? pitch.businesses[0] : pitch.businesses;
              const isExpanded = expandedId === pitch.id;
              return (
                <div key={pitch.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-[var(--text-primary)]">{biz?.name ?? "Unknown"}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLES[pitch.pitch_status] ?? STATUS_STYLES.draft}`}>
                          {PITCH_STATUS_LABELS[pitch.pitch_status] ?? pitch.pitch_status}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-medium text-[var(--accent)]">{pitch.subject}</p>
                      <p
                        className={`mt-1 cursor-pointer text-xs text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)] ${isExpanded ? "" : "line-clamp-2"}`}
                        onClick={() => setExpandedId(isExpanded ? null : pitch.id)}
                      >
                        {pitch.body}
                        {!isExpanded && <span className="ml-1 text-[var(--accent)]">…more</span>}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-[var(--text-tertiary)]">
                        {pitch.tone && <span>Tone: {pitch.tone}</span>}
                        {pitch.lead_type && <span>Type: {LEAD_TYPE_LABELS[pitch.lead_type] ?? pitch.lead_type}</span>}
                        <span>{new Date(pitch.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <button
                        onClick={() => handleCopy(pitch)}
                        className="cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-2 text-[var(--text-tertiary)] transition-colors duration-150 hover:border-[var(--accent)]/30 hover:text-[var(--accent)]"
                        title="Copy to clipboard"
                      >
                        {copiedId === pitch.id ? <Check className="h-4 w-4 text-[var(--score-good)]" /> : <Copy className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => handleDeleteConfirm(pitch.id)}
                        disabled={deletingId === pitch.id}
                        className="cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-2 text-[var(--text-tertiary)] transition-colors duration-150 hover:border-red-500/30 hover:text-[var(--badge-red-text)] disabled:cursor-not-allowed disabled:opacity-40"
                        title="Delete pitch"
                      >
                        {deletingId === pitch.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
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
