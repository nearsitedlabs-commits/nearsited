"use client";

import Link from "next/link";
import { ArrowLeft, ExternalLink, FileDown, MapPin, Phone, Share2, TrendingUp } from "lucide-react";
import { getLeadWebUrl } from "@/components/ui/LeadAffordances";
import PipelineSelect from "@/components/ui/PipelineSelect";
import { ActionMenu } from "@/components/ui/ActionMenu";
import { Button } from "@/components/ui/Button";
import { StarRating } from "@/components/ui/StarRating";
import { PIPELINE_LABELS, PIPELINE_SALES_STATUSES } from "@/lib/ui-constants";

type ActionMenuItem = {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  destructive?: boolean;
};

type Props = {
  businessId: string;
  businessName: string;
  businessType: string | null;
  city: string | null;
  address: string | null;
  placeId: string | null;
  phone: string | null;
  website?: string | null;
  websiteStatus?: string | null;
  rating: number | null;
  reviewCount: number | null;
  pipelineStatus: string | null;
  onPipelineChange: (status: string) => Promise<void>;
  /** Called to remove the lead from pipeline (DELETE) */
  onRemovePipeline?: () => Promise<void>;
  onShare: () => Promise<void>;
  backTo?: string;
  extraActions?: React.ReactNode;
  /** Extra items prepended to the ⋯ ActionMenu (before PDF/Share) */
  extraMenuItems?: ActionMenuItem[];
  badge?: React.ReactNode;
};

export function LeadHeaderStrip({
  businessId,
  businessName,
  businessType,
  city,
  address: _address,
  placeId,
  phone,
  website,
  websiteStatus,
  rating,
  reviewCount,
  pipelineStatus,
  onPipelineChange,
  onRemovePipeline,
  onShare,
  backTo = "leads",
  extraActions,
  extraMenuItems,
  badge,
}: Props) {
  const backHref = backTo === "discover" ? "/dashboard/discover" : "/dashboard/leads";
  const backLabel = backTo === "discover" ? "Back to Discover" : "Back to Leads";

  return (
    <div className="mb-6">
      {/* Icon-only back arrow — 44×44 tap target */}
      <Link
        href={backHref}
        aria-label={backLabel}
        className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-text-tertiary)] transition-colors [@media(hover:hover)]:hover:bg-[var(--accent-tint)] [@media(hover:hover)]:hover:text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]/40"
      >
        <ArrowLeft className="h-5 w-5" aria-hidden="true" />
      </Link>

      <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-4">
        {/* Left: Business info */}
        <div className="min-w-0 flex-1">
          <h1
            title={businessName}
            className="line-clamp-2 text-[1.375rem] font-bold leading-tight text-[var(--color-text-primary)] sm:text-2xl [text-wrap:balance] max-w-full"
          >
            {businessName}
          </h1>

          {/* One-line meta: type · city · ★ rating */}
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            {[businessType, city].filter(Boolean).join(" · ")}
            {rating != null && (
              <>
                {(businessType || city) ? " · " : ""}
                <StarRating value={rating} count={reviewCount} />
              </>
            )}
          </p>

          {/* Badges + Phone + Map */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {badge}
            {getLeadWebUrl(websiteStatus ?? "unknown", website ?? null) && (
              <a
                href={getLeadWebUrl(websiteStatus ?? "unknown", website ?? null)!}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--color-accent)]/20 bg-[var(--color-bg-elevated)] px-2.5 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] transition-colors min-h-[44px] sm:min-h-0 sm:py-1 [@media(hover:hover)]:hover:border-[var(--color-accent)]/45 [@media(hover:hover)]:hover:text-[var(--color-accent)]"
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /> Website
              </a>
            )}
            {phone && (
              <a
                href={`tel:${phone}`}
                className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--color-accent)]/20 bg-[var(--color-bg-elevated)] px-2.5 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] transition-colors min-h-[44px] sm:min-h-0 sm:py-1 [@media(hover:hover)]:hover:border-[var(--color-accent)]/45 [@media(hover:hover)]:hover:text-[var(--color-accent)]"
              >
                <Phone className="h-3.5 w-3.5" aria-hidden="true" /> {phone}
              </a>
            )}
            {placeId && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query_place_id=${placeId}&query=${encodeURIComponent(businessName)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex cursor-pointer items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--color-accent)]/20 bg-[var(--color-bg-elevated)] px-2.5 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] transition-colors min-h-[44px] sm:min-h-0 sm:py-1 [@media(hover:hover)]:hover:border-[var(--color-success)]/40 [@media(hover:hover)]:hover:text-[var(--color-success)]"
              >
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> Map
              </a>
            )}
          </div>
        </div>

        {/* Right: Pipeline selector + ⋯ ActionMenu (PDF + Share always collapsed) */}
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
          {extraActions}
          {pipelineStatus ? (
            <PipelineSelect
              value={pipelineStatus}
              onChange={onPipelineChange}
              onRemove={onRemovePipeline}
              options={PIPELINE_SALES_STATUSES.map((s) => ({ value: s, label: PIPELINE_LABELS[s] }))}
            />
          ) : (
            <Button
              variant="secondary"
              size="sm"
              icon={<TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />}
              onClick={() => onPipelineChange("new_lead")}
              className="text-[var(--color-accent)] border-[var(--color-accent)]/30 [@media(hover:hover)]:hover:text-[var(--color-accent)]"
            >
              Add to Pipeline
            </Button>
          )}
          <ActionMenu
            align="end"
            items={[
              ...(extraMenuItems ?? []),
              {
                label: "Download PDF report",
                icon: <FileDown className="h-3.5 w-3.5" aria-hidden="true" />,
                onClick: () => { window.location.href = `/api/export/pdf?businessId=${businessId}`; },
              },
              {
                label: "Copy share link",
                icon: <Share2 className="h-3.5 w-3.5" aria-hidden="true" />,
                onClick: onShare,
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
