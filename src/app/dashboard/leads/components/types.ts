import type { WebsiteStatus } from "@/lib/db-types";

/**
 * Derived lead lifecycle status — computed from pipeline, audit, and pitch data.
 * Replaces the old "tracked / not tracked" binary with a real taxonomy.
 */
export type OpportunityStatus =
  | "new"           // Just added, no actions taken
  | "audited"       // Analysis complete
  | "pitched"       // Pitch generated, not yet sent
  | "in_pipeline"   // Added to outreach pipeline
  | "won"           // Closed/converted
  | "lost"          // Rejected/dead
  | "archived";     // Manually hidden

export type LeadRow = {
  id: string;
  name: string;
  business_type: string;
  address: string;
  city: string;
  place_id: string | null;
  website: string | null;
  phone: string | null;
  website_status: WebsiteStatus;
  rating: number | null;
  review_count: number | null;
  performance_score: number | null;
  design_score: number | null;
  audited_at: string | null;
  design_analyzed_at: string | null;
  discovered_at: string;
  flagged_for_outreach: boolean;
  outreach_reason: string | null;
  issues_count: number;
  opportunity_score: number | null;
};

export type OpportunityTab = "all" | "no_website" | "has_website" | "social_only" | "platform_only" | "social_platform" | "in_pipeline" | "flagged";
export type PipelineTab = "all_pipeline" | "pipeline_in" | "pipeline_prospect" | "pipeline_contacted" | "pipeline_in_conversation" | "pipeline_won";
export type TabFilter = OpportunityTab | PipelineTab;

export const PAGE_SIZE = 25;

export const ANALYSE_STEPS: { key: string; label: string }[] = [
  { key: "fetching",           label: "Fetching site data" },
  { key: "mobile",             label: "Running Mobile PageSpeed" },
  { key: "desktop",            label: "Running Desktop PageSpeed" },
  { key: "audit_complete",     label: "Performance audit complete" },
  { key: "screenshot_mobile",  label: "Taking Mobile screenshot" },
  { key: "screenshot_desktop", label: "Taking Desktop screenshot" },
  { key: "analysing_mobile",   label: "Analysing Mobile design" },
  { key: "analysing_desktop",  label: "Analysing Desktop design" },
  { key: "design_complete",    label: "Analysis complete" },
];

export const OPPORTUNITY_FILTER_OPTIONS: { value: OpportunityTab; label: string }[] = [
  { value: "all",           label: "All" },
  { value: "no_website",    label: "No site" },
  { value: "has_website",   label: "Has site" },
  { value: "social_only",   label: "Social only" },
  { value: "platform_only", label: "Platform only" },
  { value: "in_pipeline",   label: "In pipeline" },
  { value: "flagged",       label: "Flagged" },
];

export const PIPELINE_FILTER_OPTIONS: { value: PipelineTab; label: string }[] = [
  { value: "all_pipeline",             label: "All Pipeline" },
  { value: "pipeline_prospect",        label: "Prospect" },
  { value: "pipeline_contacted",       label: "Contacted" },
  { value: "pipeline_in_conversation", label: "In Conversation" },
  { value: "pipeline_won",             label: "Won" },
];

/** Semantic colors for each opportunity status pill */
export const STATUS_BADGE: Record<OpportunityStatus, { label: string; class: string }> = {
  new:         { label: "New",         class: "border-blue-500/30 bg-blue-500/10 text-blue-400" },
  audited:     { label: "Audited",     class: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" },
  pitched:     { label: "Pitched",     class: "border-indigo-500/30 bg-indigo-500/10 text-indigo-400" },
  in_pipeline: { label: "In pipeline", class: "border-cyan-500/30 bg-cyan-500/10 text-cyan-400" },
  won:         { label: "Won",         class: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-semibold" },
  lost:        { label: "Lost",        class: "border-red-500/30 bg-red-500/10 text-red-400" },
  archived:    { label: "Archived",    class: "border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] text-[var(--color-text-tertiary)]" },
};

/** Site presence labels for the SITE column */
export const SITE_LABEL: Record<string, { label: string; color: string }> = {
  no_website:    { label: "None",    color: "text-[var(--score-high)]" },
  social_only:   { label: "Social",  color: "text-[var(--color-info)]" },
  platform_only: { label: "Platform",color: "text-[var(--badge-indigo-text)]" },
  has_website:   { label: "Has site",color: "text-[var(--color-text-tertiary)]" },
  unknown:       { label: "—",       color: "text-[var(--color-text-tertiary)]" },
};
