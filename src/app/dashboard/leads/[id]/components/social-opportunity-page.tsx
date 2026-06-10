"use client";

import { useCallback, useEffect, useState } from "react";

import { FileDown, Hash, Share2 } from "lucide-react";
import { Toast } from "@/components/ui/Toast";
import { estimatedOpportunity } from "@/lib/scoring";
import { detectSocialPlatforms } from "@/lib/lead-types";
import { safeHref } from "@/lib/url-security";
import type { WebsiteStatus } from "@/lib/db-types";

import type { BusinessRow } from "@/lib/db-types";

// Shared components
import { LeadHeaderStrip } from "./LeadHeaderStrip";
import { StatsRow } from "./StatsRow";
import { PitchCard } from "./PitchCard";
import { PreCallBrief } from "./PreCallBrief";
import type { CallBriefSections } from "./PreCallBrief";
import { AIQuotaBanner } from "./AIQuotaBanner";

// ── Types ─────────────────────────────────────────────────────────────────────

type SavedPitch = { id: string; subject: string; body: string; tone: string };

type Props = {
  business: BusinessRow;
  pipelineStatus: string | null;
  savedPitch: SavedPitch | null;
  backTo?: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildSocialCallBrief(
  name: string,
  type: string,
  city: string | null,
  socialPlatforms: string[],
): CallBriefSections {
  const platforms = socialPlatforms.length > 0 ? socialPlatforms.join(", ") : "social media";
  return {
    hook: `${name} — ${type ?? "local business"}${city ? ` in ${city}` : ""}. Active on ${platforms} but no owned website — every online lead finds them through rented land.`,
    pain: "Social algorithms control reach. A change in ranking, policy, or ad costs can cut off leads overnight. No website = no presence in Google local search results.",
    scope: "Build a professional website that integrates with existing social profiles, optimized for local search and mobile visitors. Add contact forms and booking.",
    objection: `"Our social pages are enough." Response: Social reach is declining algorithmically. A website is your digital storefront — open 24/7, fully under your control, and findable on Google.`,
  };
}

// ── Social Opportunity Page ─────────────────────────────────────────────────

export default function SocialOpportunityPage({ business, pipelineStatus, savedPitch, backTo = "leads" }: Props) {
  const [currentPipelineStatus, setCurrentPipelineStatus] = useState<string | null>(pipelineStatus);
  const [generatingPitch, setGeneratingPitch] = useState(false);
  const [pitchResult, setPitchResult] = useState<{ subject: string; body: string } | null>(
    savedPitch ? { subject: savedPitch.subject, body: savedPitch.body } : null,
  );
  const [pitchError, setPitchError] = useState<string | null>(null);
  const [pitchTone, setPitchTone] = useState<"professional" | "friendly" | "luxury">("friendly");
  const [pitchLength, setPitchLength] = useState<"short" | "medium" | "detailed">("short");
  const [pitchFocus, setPitchFocus] = useState("all");
  const [pitchOpening, setPitchOpening] = useState<"direct" | "question" | "empathy" | "data">("direct");
  const [pitchUrgency, setPitchUrgency] = useState<"low" | "medium" | "high">("medium");
  const [toast, setToast] = useState<string | null>(null);
  const [activeChannel, setActiveChannel] = useState<string>("email");
  const [contactInfo, setContactInfo] = useState<{ email: string | null; phone: string | null; loading: boolean }>({
    email: null, phone: null, loading: true,
  });

  // AI quota error state
  const [aiQuotaError, setAiQuotaError] = useState<string | null>(null);
  const [aiQuotaTimer, setAiQuotaTimer] = useState(0);
  const [aiRetryCount, setAiRetryCount] = useState(0);
  const [isGeminiQuota, setIsGeminiQuota] = useState(false);

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
  const oppScore = estimatedOpportunity({
    website_status: biz.website_status,
    website: biz.website ?? null,
    rating: biz.rating ?? null,
    user_ratings_total: biz.review_count ?? null,
  });

  // Fetch contact info
  useEffect(() => {
    if (!biz.id) return;
    fetch(`/api/contact-info?businessId=${biz.id}`)
      .then((r) => r.json())
      .then((d) => setContactInfo({ email: d.email ?? null, phone: d.phone ?? null, loading: false }))
      .catch(() => setContactInfo((p) => ({ ...p, loading: false })));
  }, [biz.id]);

  // Background rating refresh
  useEffect(() => {
    if (!biz.id) return;
    fetch("/api/refresh-ratings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId: biz.id }),
    }).catch(() => {});
  }, [biz.id]);


  // ── Handlers ──────────────────────────────────────────────────────────────

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

  const handleGeneratePitch = useCallback(async (force = true) => {
    setGeneratingPitch(true);
    setPitchError(null);
    setAiQuotaError(null);
    try {
      const res = await fetch("/api/pitch", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: biz.id, tone: pitchTone, length: pitchLength,
          channel: activeChannel,
          workflow: "social_only",
          socialPlatforms,
          focus: pitchFocus, opening: pitchOpening, urgency: pitchUrgency,
          force,
        }),
      });
      if (res.status === 429) {
        setIsGeminiQuota(true);
        setAiRetryCount((c) => c + 1);
        setAiQuotaError("AI service is at capacity. Auto-retrying…");
        setAiQuotaTimer(5);
        const interval = setInterval(() => {
          setAiQuotaTimer((prev) => {
            if (prev <= 1) { clearInterval(interval); return 0; }
            return prev - 1;
          });
        }, 1000);
        return;
      }
      const data = await res.json();
      if (data.success && data.pitch?.subject && data.pitch?.body) {
        setPitchResult({ subject: data.pitch.subject, body: data.pitch.body });
        setAiRetryCount(0);
        setAiQuotaError(null);
      } else {
        setPitchError(data.error ?? "Pitch generation failed.");
      }
    } catch { setPitchError("Network error — please try again."); }
    finally { setGeneratingPitch(false); }
  }, [biz.id, pitchTone, pitchLength, activeChannel, socialPlatforms, pitchFocus, pitchOpening, pitchUrgency]);

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

  const handleAiRetry = useCallback(() => {
    handleGeneratePitch(true);
  }, [handleGeneratePitch]);

  const handleUseFallback = useCallback(() => {
    setPitchTone("friendly");
    setPitchLength("short");
    handleGeneratePitch(true);
  }, [handleGeneratePitch]);

  const clearQuotaTimer = useCallback(() => {
    setAiQuotaError(null);
    setAiQuotaTimer(0);
    setAiRetryCount(0);
  }, []);

  // Auto-retry once with 5s backoff
  useEffect(() => {
    if (!aiQuotaError || aiRetryCount > 1 || aiQuotaTimer > 0) return;
    if (aiRetryCount === 1) {
      const t = setTimeout(() => handleGeneratePitch(true), 5000);
      return () => clearTimeout(t);
    }
  }, [aiQuotaError, aiRetryCount, aiQuotaTimer, handleGeneratePitch]);

  // ── Derived data ──────────────────────────────────────────────────────────

  const callBrief = buildSocialCallBrief(biz.name, biz.business_type, biz.city, socialPlatforms);

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">

        {/* ── HEADER STRIP ──────────────────────────────────────────────── */}
        <LeadHeaderStrip
          businessId={biz.id}
          businessName={biz.name}
          businessType={biz.business_type}
          city={biz.city}
          address={biz.address}
          placeId={biz.place_id}
          phone={biz.phone}
          rating={biz.rating}
          reviewCount={biz.review_count}
          pipelineStatus={currentPipelineStatus}
          onPipelineChange={handlePipelineChange}
          onShare={handleShare}
          backTo={backTo}
          badge={
            <>
              {socialPlatforms.map((platform) => (
                <span key={platform}
                  className="inline-flex items-center gap-1 rounded-full border border-[var(--badge-indigo-border)] bg-[var(--badge-indigo-bg)] px-2.5 py-0.5 text-[10px] font-medium text-[var(--badge-indigo-text)]">
                  <Hash className="h-3 w-3" /> {platform}
                </span>
              ))}
              <span className="inline-flex items-center gap-1 rounded-full border border-[var(--badge-amber-border)] bg-[var(--badge-amber-bg)] px-2.5 py-0.5 text-[10px] font-medium text-[var(--badge-amber-text)]">
                Social Presence Detected
              </span>
              {biz.website && safeHref(biz.website) && (
                <a href={safeHref(biz.website)!} target="_blank" rel="noreferrer"
                  className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--status-info-text)]/40 hover:text-[var(--status-info-text)]">
                  View Profile
                </a>
              )}
            </>
          }
        />

        {/* ── STATS ROW ─────────────────────────────────────────────────── */}
        <StatsRow
          opportunityScore={oppScore}
          isVerified={false}
          estimatedValue={null}
          reviewVelocity30d={null}
          localCompetitors={null}
        />

        {/* ── TWO-COLUMN MAIN ───────────────────────────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-5">

          {/* ════ LEFT (≈60%) ════════════════════════════════════════════════ */}
          <div className="space-y-6 lg:col-span-3 order-2 lg:order-1">
            <PitchCard
              businessId={biz.id}
              contactInfo={contactInfo}
              outreachChannel={activeChannel as "email" | "whatsapp"}
              setOutreachChannel={(ch) => setActiveChannel(ch)}
              pitchConfig={{
                tone: pitchTone,
                length: pitchLength,
                focus: pitchFocus,
                opening: pitchOpening,
                urgency: pitchUrgency,
              }}
              setPitchConfig={(cfg) => {
                setPitchTone(cfg.tone as typeof pitchTone);
                setPitchLength(cfg.length as typeof pitchLength);
                setPitchFocus(cfg.focus);
                setPitchOpening(cfg.opening as typeof pitchOpening);
                setPitchUrgency(cfg.urgency as typeof pitchUrgency);
              }}
              canGenerate={true}
              generatingPitch={generatingPitch}
              handleGeneratePitch={handleGeneratePitch}
              pitchError={pitchError}
              pitchResult={pitchResult}
              handleCopyPitch={handleCopyPitch}
            />
          </div>

          {/* ════ RIGHT (≈40%) ═══════════════════════════════════════════════ */}
          <div className="space-y-6 lg:col-span-2 order-1 lg:order-2">

            <PreCallBrief
              businessName={biz.name}
              businessType={biz.business_type}
              sections={callBrief}
            />

            {/* Export */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 sm:p-6">
              <h2 className="mb-3 text-base font-semibold text-[var(--text-primary)]">Export</h2>
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

      <AIQuotaBanner
        quotaError={aiQuotaError}
        isGeminiQuota={isGeminiQuota}
        quotaRetryTimer={aiQuotaTimer}
        clearQuotaTimer={clearQuotaTimer}
        onRetry={handleAiRetry}
        onUseFallback={handleUseFallback}
        retryCount={aiRetryCount}
      />

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
