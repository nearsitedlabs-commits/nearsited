"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { ArrowLeft, Copy, ExternalLink, FileDown, Hash, Loader2, Mail, MapPin, MessageCircle, RefreshCw, Send, Share2, TrendingUp, Users, Phone } from "lucide-react";
import { PIPELINE_LABELS, PIPELINE_SALES_STATUSES } from "@/lib/ui-constants";
import PipelineSelect from "@/components/ui/PipelineSelect";
import { Toast } from "@/components/ui/Toast";
import { detectSocialPlatforms, getSocialImpactEstimates, getSocialOpportunityReasons } from "@/lib/lead-types";
import type { WebsiteStatus } from "@/lib/types";

// ── Types ─────────────────────────────────────────────────────────────────────

type Props = {
  business: Record<string, unknown>;
  pipelineStatus: string | null;
};

// ── Social Opportunity Page ─────────────────────────────────────────────────

export default function SocialOpportunityPage({ business, pipelineStatus }: Props) {
  const [currentPipelineStatus, setCurrentPipelineStatus] = useState<string | null>(pipelineStatus);
  const [generatingPitch, setGeneratingPitch] = useState(false);
  const [pitchResult, setPitchResult] = useState<{ subject: string; body: string } | null>(null);
  const [pitchError, setPitchError] = useState<string | null>(null);
  const [pitchTone, setPitchTone] = useState<"professional" | "friendly" | "luxury">("friendly");
  const [pitchLength, setPitchLength] = useState<"short" | "medium" | "detailed">("short");
  const [toast, setToast] = useState<string | null>(null);
  const [contactInfo, setContactInfo] = useState<{ email: string | null; phone: string | null; loading: boolean }>({ email: null, phone: null, loading: true });
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const biz = business as {
    id: string; name: string; business_type: string; address: string; city: string;
    place_id: string | null; website: string | null; website_status: WebsiteStatus;
    phone: string | null; rating: number | null; review_count: number | null;
  };

  const socialPlatforms = detectSocialPlatforms(biz.website);
  const impactEstimates = getSocialImpactEstimates();
  const opportunityReasons = getSocialOpportunityReasons();

  // Fetch contact info
  useEffect(() => {
    if (!biz.id) return;
    fetch(`/api/contact-info?businessId=${biz.id}`)
      .then((r) => r.json())
      .then((d) => setContactInfo({ email: d.email ?? null, phone: d.phone ?? null, loading: false }))
      .catch(() => setContactInfo((p) => ({ ...p, loading: false })));
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
          channel: contactInfo.email ? "email" : "whatsapp",
          workflow: "social_only",
          socialPlatforms,
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
  }, [biz.id, pitchTone, pitchLength, contactInfo.email, socialPlatforms]);

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

  // Determine available outreach channels
  const availableChannels: { id: string; label: string; icon: typeof MessageCircle; contact: string | null }[] = [];
  if (contactInfo.phone) availableChannels.push({ id: "whatsapp", label: "WhatsApp", icon: Phone, contact: contactInfo.phone });
  if (socialPlatforms.includes("Instagram")) availableChannels.push({ id: "instagram", label: "Instagram DM", icon: MessageCircle, contact: null });
  if (socialPlatforms.includes("Facebook")) availableChannels.push({ id: "facebook", label: "Facebook Message", icon: Users, contact: null });
  if (contactInfo.email) availableChannels.push({ id: "email", label: "Email", icon: Mail, contact: contactInfo.email });

  const [activeChannel, setActiveChannel] = useState(availableChannels[0]?.id ?? "whatsapp");

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
              <h1 className="mt-1 text-[clamp(1.5rem,4vw,2.75rem)] font-bold text-[var(--text-primary)] leading-tight max-w-[85vw] sm:max-w-[65vw] break-words [text-wrap:balance]">
                {biz.name}
              </h1>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {biz.business_type} · {biz.city} · {biz.address}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {/* Social platform badges */}
                {socialPlatforms.map((platform) => (
                  <span key={platform}
                    className="inline-flex items-center gap-1 rounded-full border border-[var(--badge-indigo-border)] bg-[var(--badge-indigo-bg)] px-2.5 py-0.5 text-[10px] font-medium text-[var(--badge-indigo-text)]">
                    <Hash className="h-3 w-3" /> {platform}
                  </span>
                ))}
                <span className="inline-flex items-center gap-1 rounded-full border border-[var(--badge-amber-border)] bg-[var(--badge-amber-bg)] px-2.5 py-0.5 text-[10px] font-medium text-[var(--badge-amber-text)]">
                  Social Presence Detected
                </span>
                {biz.website && (
                  <a href={biz.website} target="_blank" rel="noreferrer"
                    className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--status-info-text)]/40 hover:text-[var(--status-info-text)]">
                    <ExternalLink className="h-3.5 w-3.5" /> View Profile
                  </a>
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

            {/* ── DIGITAL PRESENCE CARD ──────────────────────────────────── */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 sm:p-6">
              <h3 className="mb-4 text-base font-semibold text-[var(--text-primary)]">Digital Presence Analysis</h3>
              <div className="space-y-2">
                {socialPlatforms.map((platform) => (
                  <div key={platform} className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2">
                    <span className="text-sm text-[var(--text-secondary)]">{platform}</span>
                    <span className="text-xs font-medium text-[var(--score-good)]">Present</span>
                  </div>
                ))}
                <div className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2">
                  <span className="text-sm text-[var(--text-secondary)]">Website</span>
                  <span className="text-xs font-medium text-[var(--score-high)]">Missing</span>
                </div>
              </div>
              <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--accent-tint)] px-3 py-2.5">
                <p className="text-xs font-medium text-[var(--accent)]">Potential Opportunity: <span className="font-bold">High</span></p>
              </div>
            </div>

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
            </div>

            {/* ── WEBSITE OPPORTUNITY IMPACT ──────────────────────────────── */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 sm:p-6">
              <h3 className="mb-4 text-base font-semibold text-[var(--text-primary)]">Website Opportunity Impact</h3>
              <div className="space-y-3">
                {impactEstimates.map((est) => (
                  <div key={est.label} className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-[var(--text-primary)]">{est.label}</span>
                      <span className={`text-sm font-bold ${
                        est.impact === "+++" ? "text-[var(--score-good)]" : est.impact === "++" ? "text-[var(--score-mid)]" : "text-[var(--score-high)]"
                      }`}>{est.impact}</span>
                    </div>
                    <p className="text-xs text-[var(--text-tertiary)]">{est.description}</p>
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

              {/* Channel tabs — only show available channels */}
              {availableChannels.length > 0 && (
                <div className="mb-3 flex gap-1 rounded-lg bg-[var(--bg-elevated)] p-1">
                  {availableChannels.map((ch) => {
                    const ChIcon = ch.icon;
                    return (
                      <button key={ch.id} onClick={() => setActiveChannel(ch.id)}
                        className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                          activeChannel === ch.id ? "bg-[var(--bg-surface)] text-[var(--accent)] shadow-[var(--shadow-xs)]" : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                        }`}>
                        <ChIcon className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">{ch.label}</span>
                      </button>
                    );
                  })}
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
Active on: ${socialPlatforms.join(", ") || "N/A"}
No dedicated website found

━━ Opportunity ━━
A professional website would add credibility, improve search visibility, and create a central hub for customer conversion. Strong social following provides a ready audience.

━━ Risks ━━
Relying solely on social platforms means algorithm changes can affect reach. No website means limited presence in Google local search results.

━━ Suggested Scope ━━
Build a professional website that integrates with existing social profiles, optimized for local search and mobile visitors.`}
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

