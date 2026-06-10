"use client";

import Link from "next/link";
import { ArrowLeft, FileDown, MapPin, Phone, Share2, TrendingUp } from "lucide-react";
import PipelineSelect from "@/components/ui/PipelineSelect";
import { PIPELINE_LABELS, PIPELINE_SALES_STATUSES } from "@/lib/ui-constants";
import { PoweredByGoogle } from "@/components/ui/PoweredByGoogle";

type Props = {
  /** Business ID (for PDF export link) */
  businessId: string;
  /** Business display name */
  businessName: string;
  /** Business type/category */
  businessType: string | null;
  /** City */
  city: string | null;
  /** Full address */
  address: string | null;
  /** Place ID for Maps link */
  placeId: string | null;
  /** Phone number */
  phone: string | null;
  /** Google rating */
  rating: number | null;
  /** Review count */
  reviewCount: number | null;
  /** Current pipeline status */
  pipelineStatus: string | null;
  /** Pipeline change handler */
  onPipelineChange: (status: string) => Promise<void>;
  /** Share handler */
  onShare: () => Promise<void>;
  /** Where the back link goes */
  backTo?: string;
  /** Optional extra action buttons rendered after Pipeline (e.g. Analyse) */
  extraActions?: React.ReactNode;
  /** Optional badge rendered after business type (e.g. "No Digital Presence") */
  badge?: React.ReactNode;
};

/**
 * Full-width header strip with:
 * - Back link
 * - Business name (h1), one-line meta: industry · city · rating · phone · Map
 * - Right-aligned action cluster: [+ Pipeline] [PDF] [Share]
 */
export function LeadHeaderStrip({
  _businessId,
  businessName,
  businessType,
  city,
  address,
  placeId,
  phone,
  rating,
  reviewCount,
  pipelineStatus,
  onPipelineChange,
  onShare,
  backTo = "leads",
  extraActions,
  badge,
}: Props) {
  return (
    <div className="mb-6">
      <Link
        href={backTo === "discover" ? "/dashboard/discover" : "/dashboard/leads"}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
      >
        <ArrowLeft className="h-4 w-4" /> {backTo === "discover" ? "Back to Discover" : "Back to Leads"}
      </Link>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        {/* Left: Business info */}
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
            Opportunity Details
          </p>
          <h1 className="mt-1 text-[clamp(1.5rem,4vw,2.75rem)] font-bold text-[var(--text-primary)] leading-tight max-w-[85vw] sm:max-w-[65vw] break-words [text-wrap:balance]">
            {businessName}
          </h1>
          {/* One-line meta */}
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {[businessType, city, address].filter(Boolean).join(" · ")}
          </p>
          {/* Badges + Phone + Map */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {badge}
            {phone && (
              <span className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)]">
                <Phone className="h-3.5 w-3.5" /> {phone}
              </span>
            )}
            {placeId && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query_place_id=${placeId}&query=${encodeURIComponent(businessName)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--score-good)]/40 hover:text-[var(--score-good)]"
              >
                <MapPin className="h-3.5 w-3.5" /> Map
              </a>
            )}
          </div>
          {/* Rating */}
          {(rating != null || reviewCount != null) && (
            <div className="mt-3 flex items-center gap-3">
              {rating != null && (
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-[var(--score-good)]">{rating.toFixed(1)}</span>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`h-3.5 w-3.5 ${star <= Math.round(rating) ? "text-[var(--score-good)]" : "text-[var(--text-muted)]"}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <PoweredByGoogle />
                </div>
              )}
              {reviewCount != null && (
                <span className="text-xs text-[var(--text-tertiary)]">{reviewCount.toLocaleString()} reviews</span>
              )}
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {extraActions}
          {pipelineStatus ? (
            <PipelineSelect
              value={pipelineStatus}
              onChange={onPipelineChange}
              options={PIPELINE_SALES_STATUSES.map((s) => ({ value: s, label: PIPELINE_LABELS[s] }))}
            />
          ) : (
            <button
              onClick={() => onPipelineChange("new_lead")}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--accent)]/40 bg-[var(--accent-tint)] px-3 py-1.5 text-xs font-medium text-[var(--accent)] transition-colors hover:bg-[var(--accent)] hover:text-white"
            >
              <TrendingUp className="h-3.5 w-3.5" /> Add to Pipeline
            </button>
          )}
          <a
            href={`/api/export/pdf?businessId=${placeId ?? ""}`}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
          >
            <FileDown className="h-3.5 w-3.5" /> PDF
          </a>
          <button
            onClick={onShare}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
          >
            <Share2 className="h-3.5 w-3.5" /> Share
          </button>
        </div>
      </div>
    </div>
  );
}
