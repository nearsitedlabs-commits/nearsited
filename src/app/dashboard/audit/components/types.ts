/**
 * Shared types for the audit page components.
 * Extracted from the monolithic page.tsx to avoid circular imports.
 */

export type StrategyResult = {
  performance_score: number | null;
  seo_score?: number | null;
  fcp: string | null;
  lcp: string | null;
  tbt: string | null;
  cls: string | null;
  status: "ok" | "timeout" | "error";
};

export type DesignResult = {
  status: "ok" | "error";
  design_score?: number;
  issues?: { title: string; detail: string; point_deduction?: number; impact?: string }[];
  error?: string;
};

export type DesignRetrying = { mobile: boolean; desktop: boolean };

export type AuditStep = "idle" | "auditing" | "design" | "done";

export type ExampleTab = "weak_website" | "no_website" | "social_only" | "platform_only";

export type ExampleInfo = {
  businessLabel: string;
  currentScore?: number;
  potentialScore?: number;
  opportunityText: string;
  findings: string[];
};
