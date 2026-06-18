import type { PlanTier } from "@/lib/dodo";

/**
 * All feature limits and capabilities for each tier, computed from the
 * tier string. Single source of truth — never duplicate these values.
 */

export type TierFeatures = {
  /** Display label (e.g. "Free Trial", "Solo"). */
  label: string;
  /** Monthly audit limit. Null = unlimited. Free Trial is lifetime (not monthly). */
  auditsLimit: number | null;
  /** Whether the audit limit is lifetime (free trial) vs monthly (paid). */
  auditsLifetime: boolean;
  /** Max pipeline leads. Null = unlimited. */
  pipelineLimit: number | null;
  /** Max saved searches. Null = unlimited. */
  savedSearchLimit: number | null;
  /** Number of user seats included. */
  seats: number;
  /** Whether team workspace / shared pipeline is available. */
  teamWorkspace: boolean;
  /** API access level. */
  apiAccess: "none" | "read-only" | "full";
  /** Whether custom pitch templates are available. */
  customTemplates: boolean;
  /** Whether white-label (brand removal) is available. */
  whiteLabel: boolean;
  /** Support level. */
  supportLevel: "email" | "priority" | "slack-discord";
};

const TIER_FEATURES: Record<PlanTier, TierFeatures> = {
  free_trial: {
    label: "Free Trial",
    auditsLimit: 20,
    auditsLifetime: true,
    pipelineLimit: 10,
    savedSearchLimit: 0,
    seats: 1,
    teamWorkspace: false,
    apiAccess: "none",
    customTemplates: false,
    whiteLabel: false,
    supportLevel: "email",
  },
  solo: {
    label: "Solo",
    auditsLimit: 100,
    auditsLifetime: false,
    pipelineLimit: null,
    savedSearchLimit: 5,
    seats: 1,
    teamWorkspace: false,
    apiAccess: "none",
    customTemplates: false,
    whiteLabel: false,
    supportLevel: "email",
  },
  agency: {
    label: "Agency",
    auditsLimit: 500,
    auditsLifetime: false,
    pipelineLimit: null,
    savedSearchLimit: null,
    seats: 3,
    teamWorkspace: true,
    apiAccess: "read-only",
    customTemplates: true,
    whiteLabel: false,
    supportLevel: "priority",
  },
  scale: {
    label: "Scale",
    auditsLimit: 2000,
    auditsLifetime: false,
    pipelineLimit: null,
    savedSearchLimit: null,
    seats: 10,
    teamWorkspace: true,
    apiAccess: "full",
    customTemplates: true,
    whiteLabel: true,
    supportLevel: "slack-discord",
  },
};

/**
 * Returns feature limits for the given tier.
 * Falls back to `free_trial` for unknown/undefined tiers.
 */
export function getTierFeatures(tier: string | null | undefined): TierFeatures {
  if (tier && tier in TIER_FEATURES) {
    return TIER_FEATURES[tier as PlanTier];
  }
  return TIER_FEATURES.free_trial;
}

/**
 * Returns the audit limit for a tier, accounting for lifetime vs monthly.
 * Free Trial returns the lifetime cap; paid tiers return monthly cap.
 */
export function getAuditLimit(tier: string | null | undefined): number {
  const features = getTierFeatures(tier);
  return features.auditsLimit ?? Infinity;
}

/**
 * Returns the display label for a tier.
 */
export function getTierLabel(tier: string | null | undefined): string {
  return getTierFeatures(tier).label;
}
