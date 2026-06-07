"use client";

export type StrategyResult = {
  performance_score: number | null;
  seo_score?: number | null;
  fcp: string | null;
  lcp: string | null;
  tbt: string | null;
  cls: string | null;
  status: "ok" | "timeout" | "error";
};

export type AuditResult = {
  mobile: StrategyResult;
  desktop: StrategyResult;
};

export type BusinessResult = {
  id: string;
  name: string;
  address: string;
  place_id?: string;
  website?: string;
  phone?: string | null;
  rating?: number;
  review_count?: number;
  website_status: string;
  flagged_for_outreach?: boolean;
  outreach_reason?: string | null;
  audit?: AuditResult | null;
  business_type?: string;
  city?: string;
  design_score?: number;
};
