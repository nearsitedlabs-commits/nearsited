import type { WebsiteStatus } from "@/lib/db-types";

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

export type OpportunityTab = "all" | "no_website" | "has_website" | "social_platform" | "flagged";
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
  { value: "all",             label: "All" },
  { value: "no_website",      label: "No Website" },
  { value: "has_website",     label: "Has Website" },
  { value: "social_platform", label: "Social / Platform" },
  { value: "flagged",         label: "Flagged" },
];

export const PIPELINE_FILTER_OPTIONS: { value: PipelineTab; label: string }[] = [
  { value: "all_pipeline",             label: "All Pipeline" },
  { value: "pipeline_prospect",        label: "Prospect" },
  { value: "pipeline_contacted",       label: "Contacted" },
  { value: "pipeline_in_conversation", label: "In Conversation" },
  { value: "pipeline_won",             label: "Won" },
];
