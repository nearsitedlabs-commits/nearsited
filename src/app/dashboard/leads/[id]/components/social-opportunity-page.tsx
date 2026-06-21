"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/lib/shared-hooks";
import { useQuotaTimer } from "../hooks/useQuotaTimer";
import { useContactInfo } from "../hooks/useContactInfo";

import { Hash } from "lucide-react";
import { Toast } from "@/components/ui/Toast";
import { estimatedOpportunity } from "@/lib/scoring";
import { detectSocialPlatforms } from "@/lib/lead-types";
import { safeHref } from "@/lib/url-security";
import type { WebsiteStatus } from "@/lib/db-types";

import type { BusinessRow } from "@/lib/db-types";

// Shared components
import { LeadHeaderStrip } from "./LeadHeaderStrip";
import { PitchCard } from "./PitchCard";
import { PreCallBrief } from "./PreCallBrief";
import type { CallBriefSections } from "./PreCallBrief";
import { AIQuotaBanner } from "./AIQuotaBanner";
import { OpportunityScoreExplanation } from "./opportunity-score-explanation";

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
  const [activeChannel, setActiveChannel] = useState<"email" | "whatsapp">("email");
  const [pitchResults, setPitchResults] = useState<Record<string, { subject: string; body: string } | null>>({
    email: savedPitch ? { subject: savedPitch.subject, body: savedPitch.body } : null,
    whatsapp: null,
  });
  const pitchResult = pitchResults[activeChannel] ?? null;
  const [pitchError, setPitchError] = useState<string | null>(null);
  const [pitchTone, setPitchTone] = useState<"professional" | "friendly" | "luxury">("friendly");
  const [pitchLength, setPitchLength] = useState<"short" | "medium" | "detailed">("short");
  const [pitchFocus, setPitchFocus] = useState("all");
  const [pitchOpening, setPitchOpening] = useState<"direct" | "question" | "empathy" | "data">("direct");
  const [pitchUrgency, setPitchUrgency] = useState<"low" | "medium" | "high">("medium");
  const [aiRetryCount, setAiRetryCount] = useState(0);
  const [isGeminiQuota, setIsGeminiQuota] = useState(false);
  const [autoRetryPending, setAutoRetryPending] = useState(false);

  const { toast, showToast, setToast } = useToast();
  const { quotaError, quotaRetryTimer, setQuotaError, startQuotaTimer, clearQuotaTimer } = useQuotaTimer();
  const { contactInfo } = useContactInfo(business.id);

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

  const handleGeneratePitch = useCallback(async (force = true, overrideTone?: string, overrideLength?: string) => {
    const tone = overrideTone ?? pitchTone;
    const length = overrideLength ?? pitchLength;
    setGeneratingPitch(true);
    setPitchError(null);
    try {
      const res = await fetch("/api/pitch", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: biz.id, tone, length,
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
        setQuotaError("AI service is at capacity. Auto-retrying…");
        startQuotaTimer(5);
        setAutoRetryPending(true);
        return;
      }
      const data = await res.json();
      if (data.success && data.pitch?.subject && data.pitch?.body) {
        setPitchResults((prev) => ({ ...prev, [activeChannel]: { subject: data.pitch.subject, body: data.pitch.body } }));
        setIsGeminiQuota(false);
        setAiRetryCount(0);
        setAutoRetryPending(false);
        clearQuotaTimer();
      } else {
        setPitchError(data.error ?? "Pitch generation failed.");
      }
    } catch { setPitchError("Network error — please try again."); }
    finally { setGeneratingPitch(false); }
  }, [biz.id, pitchTone, pitchLength, activeChannel, socialPlatforms, pitchFocus, pitchOpening, pitchUrgency, setQuotaError, startQuotaTimer, clearQuotaTimer]);

  const handleCopyPitch = useCallback(() => {
    if (!pitchResult) { showToast("Generate a pitch first"); return; }
    const text = activeChannel === "email" && pitchResult.subject
      ? `${pitchResult.subject}\n\n${pitchResult.body}`
      : pitchResult.body;
    navigator.clipboard.writeText(text).then(() => showToast("Pitch copied to clipboard"));
  }, [pitchResult, activeChannel, showToast]);

  const handleRemoveFromPipeline = useCallback(async () => {
    const prev = currentPipelineStatus;
    setCurrentPipelineStatus(null);
    try {
      const res = await fetch("/api/pipeline", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: biz.id }),
      });
      if (!res.ok) { setCurrentPipelineStatus(prev); showToast("Failed to remove from pipeline"); }
      else { showToast("Removed from pipeline"); }
    } catch { setCurrentPipelineStatus(prev); showToast("Network error"); }
  }, [biz.id, currentPipelineStatus, showToast]);

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

  const handleClearQuotaTimer = useCallback(() => {
    setAutoRetryPending(false);
    setAiRetryCount(0);
    clearQuotaTimer();
  }, [clearQuotaTimer]);

  const handleUseFallback = useCallback(() => {
    setAutoRetryPending(false);
    setAiRetryCount(0);
    clearQuotaTimer();
    setPitchTone("friendly");
    setPitchLength("short");
    handleGeneratePitch(true, "friendly", "short");
  }, [clearQuotaTimer, handleGeneratePitch]);

  // Auto-retry once when quota timer auto-clears
  useEffect(() => {
    if (!autoRetryPending || quotaError !== null) return;
    setAutoRetryPending(false);
    if (aiRetryCount <= 1) handleGeneratePitch(true);
  }, [autoRetryPending, quotaError, aiRetryCount, handleGeneratePitch]);

  // ── Derived data ──────────────────────────────────────────────────────────

  const callBrief = buildSocialCallBrief(biz.name, biz.business_type, biz.city, socialPlatforms);

  return (
    <div className="min-h-screen bg-[var(--color-bg-page)]">
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
          website={null}
          websiteStatus={biz.website_status}
          rating={biz.rating}
          reviewCount={biz.review_count}
          pipelineStatus={currentPipelineStatus}
          onPipelineChange={handlePipelineChange}
          onRemovePipeline={handleRemoveFromPipeline}
          onShare={handleShare}
          backTo={backTo}
          badge={
            <>
              {socialPlatforms.map((platform) => (
                <span key={platform}
                  className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 px-2.5 py-0.5 text-[10px] font-medium text-[var(--color-accent)]">
                  <Hash className="h-3 w-3" aria-hidden="true" /> {platform}
                </span>
              ))}
              <span className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 px-2.5 py-0.5 text-[10px] font-medium text-[var(--color-warning)]">
                Social Presence Detected
              </span>
              {biz.website && safeHref(biz.website) && (
                <a href={safeHref(biz.website)!} target="_blank" rel="noreferrer"
                  className="inline-flex cursor-pointer items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-2.5 py-1 text-xs font-medium text-[var(--color-text-secondary)] transition-colors [@media(hover:hover)]:hover:border-[var(--status-info-text)]/40 [@media(hover:hover)]:hover:text-[var(--status-info-text)]">
                  View Profile
                </a>
              )}
            </>
          }
        />

        {/* ── TWO-COLUMN MAIN ───────────────────────────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">

          {/* ════ LEFT (3fr) ════════════════════════════════════════════════ */}
          <div className="space-y-6 order-2 lg:order-1">
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

          {/* ════ RIGHT (2fr) ═══════════════════════════════════════════════ */}
          <div className="space-y-6 order-1 lg:order-2">

            <PreCallBrief
              businessName={biz.name}
              businessType={biz.business_type}
              sections={callBrief}
            />

            <OpportunityScoreExplanation
              websiteStatus={biz.website_status}
              overallScore={oppScore}
              opportunityScore={oppScore}
              reviewCount={biz.review_count}
              rating={biz.rating}
              hasAudit={false}
              hasDesign={false}
              contactAvailable={!contactInfo.loading && (contactInfo.email !== null || contactInfo.phone !== null)}
              businessType={biz.business_type}
              issues={[]}
            />

          </div>
        </div>

      </div>

      <AIQuotaBanner
        quotaError={quotaError}
        isGeminiQuota={isGeminiQuota}
        quotaRetryTimer={quotaRetryTimer}
        clearQuotaTimer={handleClearQuotaTimer}
        onRetry={handleAiRetry}
        onUseFallback={handleUseFallback}
        retryCount={aiRetryCount}
      />

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
