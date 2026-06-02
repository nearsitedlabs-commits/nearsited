/**
 * Nearsited UI Constants — Single source of truth for labels, colours,
 * status-pill configs, and pipeline metadata used across multiple pages.
 *
 * Never inline these values — import from here instead.
 * All colour references use CSS custom properties from globals.css.
 */

// ── Pipeline ──────────────────────────────────────────────────────────────────

export const PIPELINE_LABELS: Record<string, string> = {
  new_lead:        "Prospect",
  analysed:        "Analysed",
  contacted:       "Contacted",
  in_conversation: "In Conversation",
  won:             "Won",
  lost:            "Lost",
};

export const PIPELINE_STATUSES = Object.keys(PIPELINE_LABELS);

/**
 * Sales-stage-only statuses for user-facing dropdowns.
 * Hides "analysed" and "pitch_generated" (product events, not sales stages).
 */
export const PIPELINE_SALES_STATUSES = ["new_lead", "contacted", "in_conversation", "won", "lost"];

/** Tailwind classes for each pipeline status badge — references CSS variables */
export const PIPELINE_BADGE_STYLES: Record<string, string> = {
  new_lead:        "bg-[var(--bg-surface-2)] text-[var(--pipeline-new)] border border-[var(--border)]",
  analysed:        "bg-[var(--pipeline-analysed-tint)] text-[var(--pipeline-analysed)] border border-[var(--pipeline-analysed)]/30",
  contacted:       "bg-[var(--pipeline-contacted-tint)] text-[var(--pipeline-contacted)] border border-[var(--pipeline-contacted)]/30",
  in_conversation: "bg-[var(--pipeline-conversation-tint)] text-[var(--pipeline-conversation)] border border-[var(--pipeline-conversation)]/30",
  won:             "bg-[var(--pipeline-won-tint)] text-[var(--pipeline-won)] border border-[var(--pipeline-won)]/30",
  lost:            "bg-[var(--pipeline-lost-tint)] text-[var(--pipeline-lost)] border border-[var(--pipeline-lost)]/30",
};

/** Tailwind bar colour for each pipeline stage (used in dashboard pipeline chart) */
export const PIPELINE_BAR_COLORS: Record<string, string> = {
  new_lead:        "bg-[var(--pipeline-new)]",
  analysed:        "bg-[var(--pipeline-analysed)]",
  contacted:       "bg-[var(--pipeline-contacted)]",
  in_conversation: "bg-[var(--pipeline-conversation)]",
  won:             "bg-[var(--pipeline-won)]",
  lost:            "bg-[var(--pipeline-lost)]",
};

// ── Opportunity Indicators (for Discovery Page) ──────────────────────────────

export type OpportunityLevel = "high" | "medium" | "low" | "website" | "social" | "no_website";

export const OPPORTUNITY_INDICATORS: Record<string, { label: string; color: string; dotColor: string }> = {
  high:        { label: "High Opportunity",     color: "text-[var(--badge-green-text)] border-[var(--badge-green-border)] bg-[var(--badge-green-bg)]",     dotColor: "bg-[var(--badge-green-text)]" },
  medium:      { label: "Medium Opportunity",   color: "text-[var(--badge-amber-text)] border-[var(--badge-amber-border)] bg-[var(--badge-amber-bg)]",   dotColor: "bg-[var(--badge-amber-text)]" },
  low:         { label: "Low Opportunity",      color: "text-[var(--badge-red-text)] border-[var(--badge-red-border)] bg-[var(--badge-red-bg)]",         dotColor: "bg-[var(--badge-red-text)]" },
  website:     { label: "Website Opportunity",  color: "text-[var(--badge-green-text)] border-[var(--badge-green-border)] bg-[var(--badge-green-bg)]",     dotColor: "bg-[var(--badge-green-text)]" },
  social:      { label: "Social Presence Only", color: "text-[var(--badge-amber-text)] border-[var(--badge-amber-border)] bg-[var(--badge-amber-bg)]",   dotColor: "bg-[var(--badge-amber-text)]" },
  no_website:  { label: "No Website Found",     color: "text-[var(--badge-red-text)] border-[var(--badge-red-border)] bg-[var(--badge-red-bg)]",         dotColor: "bg-[var(--badge-red-text)]" },
};

/**
 * Map a business's website_status + score to an opportunity indicator key.
 */
export function getOpportunityLevel(websiteStatus: string, score: number | null): string {
  if (websiteStatus === "has_website") {
    if (score === null) return "website";
    if (score >= 70) return "high";
    if (score >= 40) return "medium";
    return "low";
  }
  if (websiteStatus === "no_website") return "no_website";
  if (websiteStatus === "social_only") return "social";
  if (websiteStatus === "platform_only") {
    if (score !== null && score >= 70) return "high";
    return "website";
  }
  return "medium";
}

// ── Website Status ────────────────────────────────────────────────────────────

export const WEBSITE_STATUS_LABELS: Record<string, string> = {
  has_website:   "Has site",
  no_website:    "No site",
  social_only:   "Social only",
  platform_only: "Platform only",
  unknown:       "Unknown",
};

// ── Score Status Pills ─────────────────────────────────────────────────────────

/** Tailwind classes for "Strong Opportunity" / "Needs Improvement" status pills */
export const SCORE_STATUS_PILLS: Record<string, string> = {
  Strong:              "bg-[var(--status-success-bg)] text-[var(--status-success-text)] border border-[var(--status-success-text)]/30",
  Good:                "bg-[var(--status-success-bg)] text-[var(--status-success-text)] border border-[var(--status-success-text)]/30",
  "Needs Improvement": "bg-[var(--status-warning-bg)] text-[var(--status-warning-text)] border border-[var(--status-warning-text)]/30",
  Poor:                "bg-[var(--status-error-bg)] text-[var(--status-error-text)] border border-[var(--status-error-text)]/30",
};

// ── Impact Pill ────────────────────────────────────────────────────────────────

export const IMPACT_PILL_STYLES: Record<string, string> = {
  High:   "bg-[var(--status-error-bg)] text-[var(--status-error-text)] border border-[var(--status-error-text)]/30",
  Medium: "bg-[var(--status-warning-bg)] text-[var(--status-warning-text)] border border-[var(--status-warning-text)]/30",
  Low:    "bg-[var(--status-success-bg)] text-[var(--status-success-text)] border border-[var(--status-success-text)]/30",
};

// ── Issues Count Pill ──────────────────────────────────────────────────────────

export const ISSUES_COUNT_STYLES =
  "bg-[var(--status-warning-bg)] text-[var(--status-warning-text)] border border-[var(--status-warning-text)]/30";

// ── Outreach ──────────────────────────────────────────────────────────────────

export const OUTREACH_REASONS: Record<string, string> = {
  no_website:    "No website — needs an online presence",
  social_only:   "Social media only — needs a dedicated website",
  platform_only: "Uses third-party platform — needs a branded website",
  scored_high:   "High opportunity score — ready for outreach",
};

// ── Pipeline stage text colours (for dashboard stat labels) ───────────────────

export const PIPELINE_TEXT_COLORS: Record<string, string> = {
  new_lead:        "text-[var(--pipeline-new)]",
  analysed:        "text-[var(--pipeline-analysed)]",
  contacted:       "text-[var(--pipeline-contacted)]",
  in_conversation: "text-[var(--pipeline-conversation)]",
  won:             "text-[var(--pipeline-won)]",
  lost:            "text-[var(--pipeline-lost)]",
};

// ── Pitch Status Labels ─────────────────────────────────────────────────────────

export const PITCH_STATUS_LABELS: Record<string, string> = {
  draft:   "Draft",
  sent:    "Sent",
  replied: "Replied",
};

// ── Lead Type Labels ────────────────────────────────────────────────────────────

export const LEAD_TYPE_LABELS: Record<string, string> = {
  has_website:   "Has site",
  no_website:    "No site",
  social_only:   "Social only",
  platform_only: "Platform only",
  unknown:       "Unknown",
};
