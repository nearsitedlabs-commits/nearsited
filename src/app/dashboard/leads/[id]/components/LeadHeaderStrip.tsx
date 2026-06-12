"use client";

import Link from "next/link";
import { ArrowLeft, FileDown, MapPin, Phone, Share2, TrendingUp } from "lucide-react";
import PipelineSelect from "@/components/ui/PipelineSelect";
import { ActionMenu } from "@/components/ui/ActionMenu";
import { PIPELINE_LABELS, PIPELINE_SALES_STATUSES } from "@/lib/ui-constants";

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
  businessId, // eslint-disable-line @typescript-eslint/no-unused-vars
  businessName,
  businessType,
  city,
  address: _address,
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
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
      >
        <ArrowLeft className="h-4 w-4" /> {backTo === "discover" ? "Back to Discover" : "Back to Leads"}
      </Link>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        {/* Left: Business info */}
        <div className="min-w-0 flex-1">
          <h1 className="text-[clamp(1.5rem,4vw,2.75rem)] font-bold text-[var(--color-text-primary)] leading-tight max-w-[85vw] sm:max-w-[65vw] break-words [text-wrap:balance]">
            {businessName}
          </h1>
          {/* One-line meta: type · city · rating */}
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            {[
              businessType,
              city,
              rating != null ? `${rating.toFixed(1)}★${reviewCount != null ? ` (${reviewCount.toLocaleString()})` : ""}` : null,
            ].filter(Boolean).join(" · ")}
          </p>
          {/* Badges + Phone + Map */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {badge}
            {phone && (
              <a
                href={`tel:${phone}`}
                className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-2.5 py-1 text-xs font-medium text-[var(--color-text-secondary)] transition-colors [@media(hover:hover)]:hover:border-[var(--color-accent)]/40 [@media(hover:hover)]:hover:text-[var(--color-accent)]"
              >
                <Phone className="h-3.5 w-3.5" /> {phone}
              </a>
            )}
            {placeId && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query_place_id=${placeId}&query=${encodeURIComponent(businessName)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex cursor-pointer items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-2.5 py-1 text-xs font-medium text-[var(--color-text-secondary)] transition-colors [@media(hover:hover)]:hover:border-[var(--color-success)]/40 [@media(hover:hover)]:hover:text-[var(--color-success)]"
              >
                <MapPin className="h-3.5 w-3.5" /> Map
              </a>
            )}
          </div>
        </div>

        {/* Right: Actions — full cluster on desktop, extraActions+Pipeline+⋯ on mobile */}
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
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/10 px-3.5 py-2 text-xs font-medium text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent)] hover:text-white"
            >
              <TrendingUp className="h-3.5 w-3.5" /> Add to Pipeline
            </button>
          )}
          {/* PDF + Share inline on desktop */}
          <a
            href={`/api/export/pdf?businessId=${placeId ?? ""}`}
            className="hidden sm:inline-flex cursor-pointer items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-3.5 py-2 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-accent)]/40 hover:text-[var(--color-accent)]"
          >
            <FileDown className="h-3.5 w-3.5" /> PDF
          </a>
          <button
            onClick={onShare}
            className="hidden sm:inline-flex cursor-pointer items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-3.5 py-2 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-accent)]/40 hover:text-[var(--color-accent)]"
          >
            <Share2 className="h-3.5 w-3.5" /> Share
          </button>
          {/* ⋯ overflow on mobile — PDF + Share collapsed here */}
          <div className="sm:hidden">
            <ActionMenu
              align="end"
              items={[
                {
                  label: "Download PDF",
                  icon: <FileDown className="h-3.5 w-3.5" />,
                  onClick: () => { window.location.href = `/api/export/pdf?businessId=${placeId ?? ""}`; },
                },
                {
                  label: "Share link",
                  icon: <Share2 className="h-3.5 w-3.5" />,
                  onClick: onShare,
                },
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
