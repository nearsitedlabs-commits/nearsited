"use client";

import Link from "next/link";
import { ArrowLeft, ExternalLink, Loader2, MapPin, RefreshCw, TrendingUp } from "lucide-react";
import PipelineSelect from "@/components/ui/PipelineSelect";
import { PIPELINE_LABELS, PIPELINE_SALES_STATUSES } from "@/lib/ui-constants";
import { PoweredByGoogle } from "@/components/ui/PoweredByGoogle";
import { safeHref } from "@/lib/url-security";

type LeadHeroSectionProps = {
  biz: {
    id: string;
    name: string;
    business_type: string;
    address: string;
    city: string;
    place_id: string | null;
    website: string | null;
    website_status: string;
    rating: number | null;
    review_count: number | null;
    audited_at: string | null;
    design_analyzed_at: string | null;
  };
  currentPipelineStatus: string | null;
  hasWebsite: boolean;
  runningFullAnalysis: boolean;
  handlePipelineChange: (newStatus: string) => Promise<void>;
  handleFullAnalysis: () => Promise<void>;
  handleCancelAnalysis: () => void;
  backTo?: string;
};

export function LeadHeroSection({
  biz,
  currentPipelineStatus,
  hasWebsite,
  runningFullAnalysis,
  handlePipelineChange,
  handleFullAnalysis,
  handleCancelAnalysis,
  backTo = "leads",
}: LeadHeroSectionProps) {
  return (
    <div className="mb-6">
      <Link
        href={backTo === "discover" ? "/dashboard/discover" : "/dashboard/leads"}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] transition-colors duration-150 hover:text-[var(--text-primary)]"
      >
        <ArrowLeft className="h-4 w-4" /> {backTo === "discover" ? "Back to Discover" : "Back to Leads"}
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Opportunity Details</p>
          <h1 className="mt-1 text-[clamp(1.5rem,4vw,2.75rem)] font-bold text-[var(--text-primary)] leading-tight max-w-[85vw] sm:max-w-[65vw] lg:max-w-[50vw] break-words [text-wrap:balance]">
            {biz.name}
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {biz.business_type} · {biz.city} · {biz.address}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {biz.place_id && (
              <a href={`https://www.google.com/maps/place/?q=place_id:${biz.place_id}`}
                target="_blank" rel="noreferrer"
                className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] transition-colors duration-150 hover:border-[var(--score-good)]/40 hover:text-[var(--score-good)]">
                <MapPin className="h-3.5 w-3.5" /> Map
              </a>
            )}
            {biz.website && (
              <a href={safeHref(biz.website) ?? "#"} target="_blank" rel="noreferrer"
                className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] transition-colors duration-150 hover:border-[var(--status-info-text)]/40 hover:text-[var(--status-info-text)]">
                <ExternalLink className="h-3.5 w-3.5" /> Website
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

        {/* Header actions: Pipeline + Analyse + Cancel */}
        <div className="flex flex-col items-start sm:items-end gap-3 w-full sm:w-auto">
          <div className="flex flex-wrap items-center gap-2">
            {hasWebsite && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleFullAnalysis}
                  disabled={runningFullAnalysis}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--accent)]/40 bg-[var(--accent-tint)] px-3 py-2 text-xs font-medium text-[var(--accent)] transition-colors duration-150 hover:bg-[var(--accent)] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {runningFullAnalysis ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                  {runningFullAnalysis ? "Analysing…" : (biz.audited_at ? "Re-analyse" : "Analyse")}
                </button>
                {runningFullAnalysis && (
                  <button
                    type="button"
                    onClick={handleCancelAnalysis}
                    className="cursor-pointer text-xs font-medium text-[var(--text-tertiary)] underline-offset-2 hover:text-[var(--text-secondary)] underline transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            )}
            {currentPipelineStatus ? (
              <PipelineSelect
                value={currentPipelineStatus}
                onChange={handlePipelineChange}
                options={PIPELINE_SALES_STATUSES.map((s) => ({ value: s, label: PIPELINE_LABELS[s] }))}
              />
            ) : (
              <button
                onClick={() => handlePipelineChange("new_lead")}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--accent)]/40 bg-[var(--accent-tint)] px-3 py-2 text-xs font-medium text-[var(--accent)] transition-colors duration-150 hover:bg-[var(--accent)] hover:text-white"
              >
                <TrendingUp className="h-3.5 w-3.5" /> Add to Pipeline
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
