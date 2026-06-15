"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, useReducedMotion } from "@/lib/motion";
import { FadeUp, StaggerContainer } from "@/lib/motion";
import { Loader2, Pencil } from "lucide-react";
import { computeOverall, uxDesignScore, trustScore, projection, computeOpportunityScore, estimatedOpportunity } from "@/lib/scoring";
import type { WebsiteStatus } from "@/lib/db-types";
import type { BusinessRow, AuditRow, DesignAnalysisRow } from "@/lib/db-types";
import { Toast } from "@/components/ui/Toast";
import { useToast } from "@/lib/shared-hooks";

// Hooks
import { useContactInfo } from "./hooks/useContactInfo";
import { useQuotaTimer } from "./hooks/useQuotaTimer";
import { usePitchGeneration } from "./hooks/usePitchGeneration";
import { useLeadAnalysis } from "./hooks/useLeadAnalysis";

// Sub-components
import { buildPreCallBriefSections } from "./components/OpportunityBullets";
import { LeadHeaderStrip } from "./components/LeadHeaderStrip";
import { PitchCard, type PitchToneConfig } from "./components/PitchCard";
import { PreCallBrief } from "./components/PreCallBrief";
import { LeadExportSection } from "./components/LeadExportSection";
import { AIQuotaBanner } from "./components/AIQuotaBanner";
import { OpportunityScoreExplanation } from "./components/opportunity-score-explanation";
import { StatsRow } from "./components/StatsRow";
import { BusinessEditPanel } from "./components/BusinessEditPanel";
import { AnalysisProgressBanner } from "./components/AnalysisProgressBanner";
import { DesignErrorBanner } from "./components/DesignErrorBanner";
import { IssuesCard } from "./components/IssuesCard";
import { AuditDetailsCard } from "./components/AuditDetailsCard";
import { HistoryCard } from "./components/HistoryCard";

// ── Animation constants ───────────────────────────────────────────────────────

const EASE_OUT = [0.25, 0.1, 0.25, 1] as const;

const sectionContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const sectionCard = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE_OUT } },
};

// ── Types ─────────────────────────────────────────────────────────────────────

type SavedPitch = { id: string; subject: string; body: string; tone: string };

type Props = {
  business: BusinessRow;
  audits: AuditRow[];
  designAnalyses: DesignAnalysisRow[];
  pipelineStatus: string | null;
  savedPitch: SavedPitch | null;
  backTo?: string;
  autoAnalyze?: boolean;
};

// ── Conditional animation wrappers ────────────────────────────────────────────

function LayoutWrapper({ reduce, children }: { reduce: boolean; children: React.ReactNode }) {
  if (reduce) return <div className="space-y-6">{children}</div>;
  return <StaggerContainer className="space-y-6">{children}</StaggerContainer>;
}

function MaybeFadeUp({ reduce, children }: { reduce: boolean; children: React.ReactNode }) {
  if (reduce) return <>{children}</>;
  return <FadeUp>{children}</FadeUp>;
}

// ── Main Component ────────────────────────────────────────────────────────────

function urlToDisplayName(name: string): string {
  if (!name || name.includes(" ")) return name;
  if (!name.includes(".") && !name.startsWith("http")) return name;
  let n = name.replace(/^https?:\/\//i, "").replace(/^www\./i, "");
  n = n.split(/[./?#]/)[0];
  n = n.replace(/[-_]/g, " ").trim();
  n = n.replace(/\b\w/g, (c) => c.toUpperCase());
  return n || name;
}

export default function LeadDetailClient({ business, audits, designAnalyses, pipelineStatus, savedPitch, backTo = "leads", autoAnalyze = false }: Props) {
  const { toast, showToast, setToast } = useToast();
  const shouldReduce = !!useReducedMotion();
  const [showAllIssues, setShowAllIssues] = useState(false);
  const [showTechDetails, setShowTechDetails] = useState(false);
  const [currentPipelineStatus, setCurrentPipelineStatus] = useState<string | null>(pipelineStatus);
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [editOverrides, setEditOverrides] = useState<{ name?: string; city?: string | null; business_type?: string | null; opportunity_score?: number | null; rating?: number | null; review_count?: number | null }>({});
  const [quotaRetryCount, setQuotaRetryCount] = useState(0);

  const biz = { ...(business as {
    id: string; name: string; business_type: string; address: string; city: string;
    place_id: string | null; website: string | null; website_status: WebsiteStatus;
    rating: number | null; review_count: number | null; performance_score: number | null;
    design_score: number | null; opportunity_score: number | null;
    audited_at: string | null; design_analyzed_at: string | null;
  }), ...editOverrides };

  // ── Hooks ──────────────────────────────────────────────────────────────────

  const { contactInfo, manualEmail: _manualEmail, setManualEmail: _setManualEmail } = useContactInfo(biz.id);
  const quota = useQuotaTimer();

  const pitch = usePitchGeneration({
    businessId: biz.id,
    websiteStatus: biz.website_status,
    showToast,
    setQuotaError: quota.setQuotaError,
    startQuotaTimer: quota.startQuotaTimer,
    savedPitch: savedPitch ? { subject: savedPitch.subject, body: savedPitch.body } : null,
  });

  const analysis = useLeadAnalysis({
    businessId: biz.id,
    website: biz.website,
    websiteStatus: biz.website_status,
    pitchTone: pitch.pitchTone,
    pitchLength: pitch.pitchLength,
    hasAudit: !!biz.audited_at && !biz.design_analyzed_at,
    showToast,
    setQuotaError: quota.setQuotaError,
    startQuotaTimer: quota.startQuotaTimer,
    onPitchResult: pitch.setPitchResult,
  });

  // ── Derived scores ─────────────────────────────────────────────────────────

  const mobileAudit   = audits?.find((a) => a.strategy === "mobile");
  const desktopAudit  = audits?.find((a) => a.strategy === "desktop");
  const mobileDesign  = designAnalyses?.find((a) => a.strategy === "mobile");
  const desktopDesign = designAnalyses?.find((a) => a.strategy === "desktop");
  const activeDesign  = mobileDesign ?? desktopDesign;

  const designScore      = biz.design_score ?? 0;
  const criteria         = activeDesign?.criteria_scores as Record<string, number> | undefined;
  const uxDesignScoreVal = criteria ? uxDesignScore(criteria as { modernity: number; readability: number; cta: number; hierarchy: number; trust: number }) : 0;
  const trustScoreVal    = criteria ? trustScore(criteria as { trust: number }) : 0;
  const mobilePerfScore  = mobileAudit?.performance_score ?? null;
  const desktopPerfScore = desktopAudit?.performance_score ?? null;

  const overall = computeOverall({
    performance: desktopPerfScore ?? 0,
    seo:         desktopAudit?.seo_score ?? 0,
    mobile:      mobilePerfScore ?? 0,
    uxDesign:    uxDesignScoreVal,
    trust:       trustScoreVal,
  });

  const allIssues = [
    ...((mobileDesign?.issues  as unknown as { title: string; detail: string; point_deduction?: number; impact: "High" | "Medium" | "Low" }[]) ?? []),
    ...((desktopDesign?.issues as unknown as { title: string; detail: string; point_deduction?: number; impact: "High" | "Medium" | "Low" }[]) ?? []),
  ].slice(0, 5);

  const hasAudit   = !!biz.audited_at;
  const hasDesign  = !!biz.design_analyzed_at;
  const hasWebsite = !!biz.website;

  const projScore                 = allIssues.length > 0 ? projection(overall, allIssues) : overall;
  const opportunityDelta          = Math.max(0, projScore - overall);
  const effectiveOpportunityScore = biz.opportunity_score ??
    computeOpportunityScore(overall || biz.performance_score || biz.design_score || 50, biz.review_count ?? 0, biz.rating ?? 0, biz.business_type ?? undefined);
  const displayOpportunityScore   = hasAudit
    ? effectiveOpportunityScore
    : estimatedOpportunity({
        website_status: biz.website_status as WebsiteStatus,
        website: biz.website ?? null,
        rating: biz.rating ?? null,
        user_ratings_total: biz.review_count ?? null,
      });
  // When no audit rows exist (quick-audit saves to businesses cols only, not audits table),
  // computeOverall returns 0. Fall back to stored opportunity_score for the call summary.
  const hasAuditRows = !!(mobileAudit || desktopAudit);
  const summaryOverall   = hasAuditRows ? overall   : (biz.opportunity_score ?? overall);
  const summaryProjScore = hasAuditRows ? projScore : (biz.opportunity_score ?? projScore);
  const preCallBriefSections = buildPreCallBriefSections(
    urlToDisplayName(biz.name), biz.business_type ?? "business", biz.city,
    summaryOverall, summaryProjScore,
    allIssues as { title: string; detail: string; impact: string }[],
    mobilePerfScore, desktopPerfScore, biz.rating, biz.review_count,
  );

  // Bridge individual pitch state → PitchCard's combined config object
  const pitchConfig: PitchToneConfig = {
    tone: pitch.pitchTone as PitchToneConfig["tone"],
    length: pitch.pitchLength as PitchToneConfig["length"],
    opening: pitch.pitchOpening as PitchToneConfig["opening"],
    urgency: pitch.pitchUrgency as PitchToneConfig["urgency"],
    focus: pitch.pitchFocus,
  };
  const { setPitchTone, setPitchLength, setPitchOpening, setPitchUrgency, setPitchFocus } = pitch;
  const setPitchConfig = useCallback((config: PitchToneConfig) => {
    setPitchTone(config.tone);
    setPitchLength(config.length);
    setPitchOpening(config.opening);
    setPitchUrgency(config.urgency);
    setPitchFocus(config.focus);
  }, [setPitchTone, setPitchLength, setPitchOpening, setPitchUrgency, setPitchFocus]);

  // ── Auto-start analysis when directed from discover with ?analyze=1 ─────────

  useEffect(() => {
    if (autoAnalyze && !hasAuditRows && hasWebsite && !analysis.runningFullAnalysis) {
      analysis.handleFullAnalysis();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentional mount-only — auto-start once

  // ── Handlers ───────────────────────────────────────────────────────────────

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const handlePipelineChange = useCallback(async (newStatus: string) => {
    const prevStatus = currentPipelineStatus;
    setCurrentPipelineStatus(newStatus);
    try {
      const res = await fetch("/api/pipeline", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: biz.id, status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error("[LEAD] Pipeline update failed:", data.error ?? res.status);
        setCurrentPipelineStatus(prevStatus);
        showToast("Failed to update pipeline status");
      }
    } catch (err) {
      console.error("[LEAD] Pipeline update network error:", err);
      setCurrentPipelineStatus(prevStatus);
      showToast("Network error — could not update pipeline");
    }
  }, [biz.id, currentPipelineStatus, showToast]);

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const handleShare = useCallback(async () => {
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: biz.id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error("[LEAD] Share API failed:", data.error ?? res.status);
        showToast("Failed to create share link");
        return;
      }
      const data = await res.json();
      await navigator.clipboard.writeText(data.url);
      showToast("Share link copied to clipboard");
    } catch (err) {
      console.error("[LEAD] Share failed:", err);
      showToast("Network error — could not create share link");
    }
  }, [biz.id, showToast]);

  // ── Render ────────────────────────────────────────────────────────────────

  const initialVariant = shouldReduce ? "visible" : "hidden";

  return (
    <div className="min-h-screen bg-[var(--color-bg-page)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <LayoutWrapper reduce={shouldReduce}>
          <MaybeFadeUp reduce={shouldReduce}>
            <LeadHeaderStrip
              businessId={biz.id}
              businessName={urlToDisplayName(biz.name)}
              businessType={biz.business_type}
              city={biz.city}
              address={biz.address}
              placeId={biz.place_id}
              phone={business.phone}
              rating={biz.rating}
              reviewCount={biz.review_count}
              pipelineStatus={currentPipelineStatus}
              onPipelineChange={handlePipelineChange}
              onShare={handleShare}
              backTo={backTo}
              extraActions={
                <>
                  {!biz.place_id && (
                    <button
                      type="button"
                      onClick={() => setShowEditPanel((v) => !v)}
                      title="Edit business details"
                      className="shrink-0 rounded-[var(--radius-sm)] p-1.5 text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text-secondary)] transition-colors"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}
                  {hasWebsite && (
                    <button
                      onClick={analysis.handleFullAnalysis}
                      disabled={analysis.runningFullAnalysis}
                      className={hasAudit
                        ? "inline-flex cursor-pointer items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-3 py-2 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-accent)]/40 hover:text-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-50"
                        : "inline-flex cursor-pointer items-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--color-accent)] px-3 py-2 text-xs font-medium text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                      }
                    >
                      {analysis.runningFullAnalysis && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      {analysis.runningFullAnalysis ? "Analysing…" : hasAudit ? "Re-analyse" : "Analyse Opportunity"}
                    </button>
                  )}
                </>
              }
            />
            {showEditPanel && !biz.place_id && (
              <div className="mb-4">
                <BusinessEditPanel
                  bizId={biz.id}
                  initialName={biz.name}
                  initialCity={biz.city}
                  initialBusinessType={biz.business_type}
                  onSaved={(updated) => {
                    setEditOverrides((prev) => ({ ...prev, ...updated }));
                    setShowEditPanel(false);
                    showToast("Business details updated");
                  }}
                  onClose={() => setShowEditPanel(false)}
                />
              </div>
            )}
          </MaybeFadeUp>

          <MaybeFadeUp reduce={shouldReduce}>
            <motion.div
              className="mb-8"
              initial={shouldReduce ? {} : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={shouldReduce ? undefined : { duration: 0.35, ease: EASE_OUT }}
            >
              <StatsRow
                opportunityScore={displayOpportunityScore}
                isVerified={hasAudit && hasDesign}
                estimatedValue={null}
                reviewVelocity30d={null}
                localCompetitors={null}
              />
            </motion.div>
          </MaybeFadeUp>

          {!hasAudit && !hasDesign && hasWebsite && (
            <MaybeFadeUp reduce={shouldReduce}>
              <div className="flex items-center justify-between gap-4 rounded-[var(--radius-md)] border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/5 px-5 py-4">
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">Scores not yet verified</p>
                  <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">Run an analysis to get real performance, design, and SEO scores.</p>
                </div>
                <button
                  onClick={analysis.handleFullAnalysis}
                  disabled={analysis.runningFullAnalysis}
                  className="shrink-0 inline-flex cursor-pointer items-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--color-accent)] px-3 py-2 text-xs font-medium text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {analysis.runningFullAnalysis && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {analysis.runningFullAnalysis ? "Analysing…" : "Analyse Now"}
                </button>
              </div>
            </MaybeFadeUp>
          )}

          <MaybeFadeUp reduce={shouldReduce}>
            <AnalysisProgressBanner
              running={analysis.runningFullAnalysis}
              completedKeys={analysis.completedKeys}
              activeKeys={analysis.activeKeys}
            />
          </MaybeFadeUp>

          <MaybeFadeUp reduce={shouldReduce}>
            <DesignErrorBanner
              error={analysis.designError}
              running={analysis.runningFullAnalysis}
              hasWebsite={hasWebsite}
              onRetry={analysis.handleFullAnalysis}
            />
          </MaybeFadeUp>

          {/* Mobile-only contact row: tap-to-call + open in Maps */}
          {(business.phone || biz.address || biz.place_id) && (
            <MaybeFadeUp reduce={shouldReduce}>
              <div className="flex items-center gap-2 lg:hidden">
                {business.phone && (
                  <a
                    href={`tel:${business.phone}`}
                    className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] px-3 py-2 text-xs text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-accent)]/40 hover:text-[var(--color-accent)]"
                  >
                    {business.phone}
                  </a>
                )}
                {(biz.address || biz.place_id) && (
                  <a
                    href={biz.place_id
                      ? `https://www.google.com/maps/search/?api=1&query_place_id=${biz.place_id}`
                      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(biz.address ?? biz.name)}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] px-3 py-2 text-xs text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-accent)]/40 hover:text-[var(--color-accent)]"
                  >
                    Maps ↗
                  </a>
                )}
              </div>
            </MaybeFadeUp>
          )}

          <MaybeFadeUp reduce={shouldReduce}>
            <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">

              {/* ── LEFT COLUMN — pitch + audit data ── */}
              <motion.div className="space-y-6" variants={sectionContainer} initial={initialVariant} animate="visible">
                <motion.div variants={sectionCard}>
                  <PitchCard
                    businessId={biz.id}
                    contactInfo={contactInfo}
                    outreachChannel={pitch.outreachChannel}
                    setOutreachChannel={pitch.setOutreachChannel}
                    pitchConfig={pitchConfig}
                    setPitchConfig={setPitchConfig}
                    canGenerate={true}
                    generatingPitch={pitch.generatingPitch}
                    handleGeneratePitch={pitch.handleGeneratePitch}
                    pitchError={pitch.pitchError}
                    pitchResult={pitch.pitchResult}
                    handleCopyPitch={pitch.handleCopyPitch}
                  />
                </motion.div>
                {/* Mobile-only: PreCallBrief surfaces right after Pitch (desktop: in right col) */}
                <motion.div variants={sectionCard} className="lg:hidden">
                  <PreCallBrief
                    businessName={urlToDisplayName(biz.name)}
                    businessType={biz.business_type ?? "business"}
                    sections={preCallBriefSections}
                  />
                </motion.div>
                <motion.div variants={sectionCard}>
                  <IssuesCard
                    issues={allIssues}
                    showAll={showAllIssues}
                    onToggleShowAll={() => setShowAllIssues((v) => !v)}
                    reducedMotion={shouldReduce}
                    projDelta={opportunityDelta}
                  />
                </motion.div>
                <motion.div variants={sectionCard}>
                  <AuditDetailsCard
                    mobileAudit={mobileAudit}
                    desktopAudit={desktopAudit}
                    desktopPerfScore={desktopPerfScore}
                    mobilePerfScore={mobilePerfScore}
                    uxDesignScoreVal={uxDesignScoreVal}
                    designScore={designScore}
                    trustScoreVal={trustScoreVal}
                    overall={overall}
                    showTechDetails={showTechDetails}
                    onToggleTechDetails={() => setShowTechDetails((v) => !v)}
                  />
                </motion.div>
                <motion.div variants={sectionCard}>
                  <HistoryCard audits={audits ?? []} designAnalyses={designAnalyses ?? []} />
                </motion.div>
              </motion.div>

              {/* ── RIGHT COLUMN — brief + score context + export ── */}
              <motion.div className="space-y-6" variants={sectionContainer} initial={initialVariant} animate="visible">
                {/* Desktop-only: PreCallBrief (mobile version is above IssuesCard in left col) */}
                <motion.div variants={sectionCard} className="hidden lg:block">
                  <PreCallBrief
                    businessName={urlToDisplayName(biz.name)}
                    businessType={biz.business_type ?? "business"}
                    sections={preCallBriefSections}
                  />
                </motion.div>
                <motion.div variants={sectionCard}>
                  <OpportunityScoreExplanation
                    websiteStatus={biz.website_status}
                    overallScore={overall}
                    opportunityScore={effectiveOpportunityScore}
                    reviewCount={biz.review_count}
                    rating={biz.rating}
                    hasAudit={hasAudit}
                    hasDesign={hasDesign}
                    contactAvailable={!contactInfo.loading && (contactInfo.email !== null || contactInfo.phone !== null)}
                    businessType={biz.business_type}
                    issues={allIssues}
                  />
                </motion.div>
                <motion.div variants={sectionCard}>
                  <LeadExportSection businessId={biz.id} handleShare={handleShare} />
                </motion.div>
              </motion.div>

            </div>
          </MaybeFadeUp>
        </LayoutWrapper>
      </div>

      <AIQuotaBanner
        quotaError={quota.quotaError}
        isGeminiQuota
        quotaRetryTimer={quota.quotaRetryTimer}
        clearQuotaTimer={quota.clearQuotaTimer}
        onRetry={() => { setQuotaRetryCount((c) => c + 1); void pitch.handleGeneratePitch(true); }}
        onUseFallback={() => showToast("Lighter model unavailable — please retry in a moment")}
        retryCount={quotaRetryCount}
      />
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}