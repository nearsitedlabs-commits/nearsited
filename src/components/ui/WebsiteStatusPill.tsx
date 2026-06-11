import { Pill, type PillVariant } from "@/components/ui/Pill";
import { WEBSITE_STATUS_LABELS } from "@/lib/ui-constants";
import type { WebsiteStatus } from "@/lib/db-types";

// ── Config ────────────────────────────────────────────────────────────────────

const STATUS_VARIANT: Record<WebsiteStatus, PillVariant> = {
  has_website:   "info",
  no_website:    "danger",
  social_only:   "warning",
  platform_only: "warning",
  unknown:       "neutral",
};

// ── Component ─────────────────────────────────────────────────────────────────

export function WebsiteStatusPill({
  status,
  size = "sm",
}: {
  status: string;
  size?: "sm" | "md";
}) {
  const key = (status as WebsiteStatus) in STATUS_VARIANT ? (status as WebsiteStatus) : "unknown";
  return (
    <Pill variant={STATUS_VARIANT[key]} size={size} dot>
      {WEBSITE_STATUS_LABELS[key] ?? "Unknown"}
    </Pill>
  );
}
WebsiteStatusPill.displayName = "WebsiteStatusPill";
