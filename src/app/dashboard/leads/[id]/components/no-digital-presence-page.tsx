"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { ArrowLeft, Copy, FileDown, Loader2, MapPin, Phone, RefreshCw, Send, Share2, TrendingUp } from "lucide-react";
import { PIPELINE_LABELS, PIPELINE_SALES_STATUSES } from "@/lib/ui-constants";
import PipelineSelect from "@/components/ui/PipelineSelect";
import { Toast } from "@/components/ui/Toast";
import { getNoDigitalOpportunityReasons } from "@/lib/lead-types";
import { PoweredByGoogle } from "@/components/ui/PoweredByGoogle";

// ── Types ─────────────────────────────────────────────────────────────────────

type Props = {
  business: Record<string, unknown>;
  pipelineStatus: string | null;
};

// ── No Digital Presence Page ─────────────────────────────────────────────────

export default function NoDigitalPresencePage({ business, pipelineStatus }: Props) {
  const [currentPipelineStatus, setCurrentPipelineStatus] = useState<string | null>(pipelineStatus);
  const [generatingPitch, setGeneratingPitch] = useState(false);
  const [pitchResult, setPitchResult] = useState<{ subject: string; body: string } | null>(null);
  const [pitchError, setPitchError] = useState<string | null>(null);
  const [pitchTone, setPitchTone] = useState<"professional" | "friendly" | "luxury">("friendly");
  const [pitchLength, setPitchLength] = useState<"short" | "medium" | "detailed">("short");
  const [toast, setToast] = useState<string | null>(null);
  const [contactInfo, setContactInfo] = useState<{ phone: string | null; loading: boolean }>({ phone: null, loading: true });
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const biz = business as {
    id: string; name: string; business_type: string; address: string; city: string;
    place_id: string | null; phone: string | null; rating: number | null; review_count: number | null;
  };

  const opportunityReasons = getNoDigitalOpportunityReasons();

  // Fetch contact info for phone number
  useEffect(() => {
    if (!biz.id) return;
    fetch(`/api/contact-info?businessId=${biz.id}`)
      .then((r) => r.json())
      .then((d) => setContactInfo({ phone: d.phone ?? null, loading: false }))
      .catch(() => setContactInfo((p) => ({ ...p, loading: false })));
  }, [biz.id]);

  // Background rating refresh — fire-and-forget, never blocks render
  useEffect(() => {
    if (!biz.id) return;
    fetch("/api/refresh-ratings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId: biz.id }),
    }).catch(() => { /* silent — background only */ });
  }, [biz.id]);

  const handlePipelineChange = useCallback(async (newStatus: string) => {
    const prev = currentPipelineStatus;
    setCurrentPipelineStatus(newStatus);
    try {
      const res = await fetch("/api/pipeline", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: biz.id, status: newStatus }),
      });
      if (!res.ok) { setCurrentPipelineStatus(prev); showToast("Failed to update pipeline status"); }
    } catch { setCurrentPipelineStatus(prev); showToast("Network error"); }
  }, [biz.id, currentPipelineStatus, showToast]);

  const handleGeneratePitch = useCallback(async () => {
    setGeneratingPitch(true);
    setPitchError(null);
    try {
      const res = await fetch("/api/pitch", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: biz.id, tone: pitchTone, length: pitchLength,
          channel: contactInfo.phone ? "whatsapp" : "email",
          workflow: "no_digital_presence",
        }),
      });
      if (res.status === 429) { setPitchError("AI quota exceeded — please try again later."); return; }
      const data = await res.json();
      if (data.success && data.pitch?.subject && data.pitch?.body) {
        setPitchResult({ subject: data.pitch.subject, body: data.pitch.body });
      } else {
        setPitchError(data.error ?? "Pitch generation failed.");
      }
    } catch { setPitchError("Network error — please try again."); }
    finally { setGeneratingPitch(false); }
  }, [biz.id, pitchTone, pitchLength, contactInfo.phone]);

  const handleCopyPitch = useCallback(() => {
    if (!pitchResult) { showToast("Generate a pitch first"); return; }
    navigator.clipboard.writeText(pitchResult.body).then(() => showToast("Pitch copied to clipboard"));
  }, [pitchResult, showToast]);

  const handleShare = useCallback(async () => {
    try {
      const res = await fetch("/api/share", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: biz.id }),
      });
      if (!res.ok) { showToast("Failed to create share link"); return; }
      const data = await res.json();
      await navigator.clipboard.writeText(data.url);
      showToast("Share link copied to clipboard");
    } catch { showToast("Network error"); }
  }, [biz.id, showToast]);

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">

        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <div className="mb-6">
          <Link href="/dashboard/leads"
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]">
            <ArrowLeft className="h-4 w-4" /> Back to Leads
          </Link>
          <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Opportunity Details</p>
              <h1 className="mt-1 text-[clamp(1.5rem,4vw,2.75rem)] font-bold text-[var(--text-primary)] leading-tight max-w-[85vw] break-words [text-wrap:balance]">
                {biz.name}
              </h1>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {biz.business_type} · {biz.city} · {biz.address}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-[var(--badge-red-border)] bg-[var(--badge-red-bg)] px-2.5 py-0.5 text-[10px] font-medium text-[var(--badge-red-text)]">
                  No Digital Presence Found
                </span>
                {biz.phone && (
                  <span className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)]">
                    <Phone className="h-3.5 w-3.5" /> {biz.phone}
                  </span>
                )}
                {biz.place_id && (
                  <a href={`https://www.google.com/maps/place/?q=place_id:${biz.place_id}`} target="_blank" rel="noreferrer"
                    className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--score-good)]/40 hover:text-[var(--score-good)]">
                    <MapPin className="h-3.5 w-3.5" /> Map
                  </a>
                )}
              </div>
              {/* Google Reviews */}
              {(biz.rating != null || biz.review_count != null) && (
                <div className="mt-3 flex items-center gap-3">
                  {biz.rating != null && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-[var(--score-good)]">{biz.rating.toFixed(1)}</span>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg key={star} className={`h-3.5 w-3.5 ${star <= Math.round(biz.rating!) ? "text-[var(--score-good)]" : "text-[var(--text-muted)]"}`} fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                  )}
                  {biz.review_count != null && (
                    <span className="text-xs text-[var(--text-tertiary)]">{biz.review_count.toLocaleString()} reviews</span>
                  )}
                  <PoweredByGoogle />
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {currentPipelineStatus ? (
                <PipelineSelect
                  value={currentPipelineStatus}
                  onChange={handlePipelineChange}
                  options={PIPELINE_SALES_STATUSES.map((s) => ({ value: s, label: PIPELINE_LABELS[s] }))}
                />
              ) : (
                <button onClick={() => handlePipelineChange("new_lead")}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--accent)]/40 bg-[var(--accent-tint)] px-3 py-1.5 text-xs font-medium text-[var(--accent)] transition-colors hover:bg-[var(--accent)] hover:text-white">
                  <TrendingUp className="h-3.5 w-3.5" /> Add to Pipeline
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── TWO-COLUMN LAYOUT ─────────────────────────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-2">

          {/* ════ LEFT COLUMN ════════════════════════════════════════════════ */}
          <div className="space-y-6 order-2 lg:order-1">

            {/* ── WHY THIS IS AN OPPORTUNITY ──────────────────────────────── */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 sm:p-6">
              <h3 className="mb-4 text-base font-semibold text-[var(--text-primary)]">Why This Is An Opportunity</h3>
              <ul className="space-y-2">
                {opportunityReasons.map((reason, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--accent-tint)] px-3 py-2.5">
                <p className="text-xs font-medium text-[var(--accent)]">Opportunity Level: <span className="font-bold">Very High</span></p>
                <p className="mt-0.5 text-[10px] text-[var(--accent)]/70">Business currently lacks owned digital assets.</p>
              </div>
            </div>

            {/* ── WEBSITE OPPORTUNITY ──────────────────────────────────────── */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 sm:p-6">
              <h3 className="mb-4 text-base font-semibold text-[var(--text-primary)]">Website Opportunity</h3>
              <p className="mb-3 text-xs text-[var(--text-secondary)]">A professional website provides benefits that no other channel can replace.</p>
              <div className="space-y-3">
                {[
                  { label: "More Visibility", desc: "Websites appear in Google searches. Customers can find you at the exact moment they need your service." },
                  { label: "More Trust", desc: "A professional website builds credibility instantly. Most consumers research a business online before visiting." },
                  { label: "Better Lead Generation", desc: "Websites capture leads through contact forms, booking systems, and clear calls-to-action — even when you're closed." },
                  { label: "Better Customer Experience", desc: "Hours, services, pricing, and location available 24/7. Customers get answers without calling." },
                ].map((benefit) => (
                  <div key={benefit.label} className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-3">
                    <p className="text-sm font-medium text-[var(--text-primary)]">{benefit.label}</p>
                    <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">{benefit.desc}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* ════ RIGHT COLUMN ═══════════════════════════════════════════════ */}
          <div className="space-y-6 order-1 lg:order-2">

            {/* ── READY-TO-SEND OUTREACH ────────────────────────────────── */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 sm:p-6">
              <h3 className="mb-3 text-base font-semibold text-[var(--text-primary)]">Ready-to-Send Outreach</h3>

              {/* Show available channel info */}
              {!contactInfo.loading && contactInfo.phone && (
                <div className="mb-3 flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2">
                  <Phone className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                  <span className="text-xs text-[var(--text-secondary)]">{contactInfo.phone}</span>
                </div>
              )}

              {/* Pitch controls */}
              <div className="mb-3 flex flex-wrap gap-2">
                <PipelineSelect
                  value={pitchTone}
                  onChange={(v) => setPitchTone(v as typeof pitchTone)}
                  options={[
                    { value: "professional", label: "Professional" },
                    { value: "friendly", label: "Friendly" },
                    { value: "luxury", label: "Luxury" },
                  ]}
                />
                <PipelineSelect
                  value={pitchLength}
                  onChange={(v) => setPitchLength(v as typeof pitchLength)}
                  options={[
                    { value: "short", label: "Short" },
                    { value: "medium", label: "Medium" },
                    { value: "detailed", label: "Detailed" },
                  ]}
                />
                <button onClick={handleGeneratePitch} disabled={generatingPitch}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50">
                  {generatingPitch ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                  {generatingPitch ? "Generating…" : "Generate"}
                </button>
              </div>

              {pitchError && (
                <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">{pitchError}</div>
              )}

              {pitchResult ? (
                <div className="space-y-2 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-3">
                  <p className="text-sm font-medium text-[var(--text-primary)]">{pitchResult.subject}</p>
                  <p className="whitespace-pre-wrap text-xs text-[var(--text-secondary)] leading-relaxed">{pitchResult.body}</p>
                  <div className="flex gap-2 mt-2">
                    <button onClick={handleCopyPitch}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--accent)]/40 hover:text-[var(--accent)]">
                      <Copy className="h-3 w-3" /> Copy
                    </button>
                    <button onClick={handleGeneratePitch} disabled={generatingPitch}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--accent)]/40 hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50">
                      {generatingPitch ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                      Regenerate
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[var(--text-tertiary)]">Generate a pitch to start outreach.</p>
              )}
            </div>

            {/* ── CLIENT CALL SUMMARY ─────────────────────────────────────── */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 sm:p-6">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-[var(--text-primary)]">Client Call Summary</h3>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">Read this 60 seconds before a sales call.</p>
                </div>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 text-xs text-[var(--text-secondary)] whitespace-pre-line leading-relaxed">
                {`━━ Current Situation ━━
${biz.name} — ${biz.business_type ?? "business"} in ${biz.city}
No website detected · No social media presence found
${biz.phone ? `Contact number available: ${biz.phone}` : "No contact number available"}

━━ Opportunity ━━
Business has no owned digital assets. This is a greenfield opportunity to build a complete digital foundation from scratch — website, Google Business profile, and social presence.

━━ Risks ━━
Customers searching online may not find this business. Competitors with online presence likely capture potential leads.

━━ Suggested Scope ━━
Build a professional website, set up Google Business Profile, create social media accounts, and establish a contact funnel.`}
              </div>
            </div>

            {/* ── EXPORT ──────────────────────────────────────────────────── */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 sm:p-6">
              <h3 className="mb-3 text-base font-semibold text-[var(--text-primary)]">Export</h3>
              <div className="flex flex-wrap gap-2">
                <a href={`/api/export/pdf?businessId=${biz.id}`}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--accent)]/40 hover:text-[var(--accent)]">
                  <FileDown className="h-3.5 w-3.5" /> PDF Report
                </a>
                <button onClick={handleShare}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--accent)]/40 hover:text-[var(--accent)]">
                  <Share2 className="h-3.5 w-3.5" /> Share Link
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
