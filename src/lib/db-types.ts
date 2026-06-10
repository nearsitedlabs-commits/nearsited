// ─────────────────────────────────────────────────────────────────────────────
// Nearsited — Database Row Types (Single Source of Truth)
//
// Every Supabase query result should be typed against these interfaces.
// Column names in snake_case match the actual DB columns exactly.
// Timestamps are ISO 8601 strings. Nullable columns use `| null`.
// JSONB columns are `Record<string, unknown> | null`.
// ─────────────────────────────────────────────────────────────────────────────

// ── Enums (mirrored from docs/SCHEMA.md §3) ─────────────────────────────────

export type WebsiteStatus =
  | "has_website"
  | "no_website"
  | "social_only"
  | "platform_only"
  | "unknown";

export type PipelineStatus =
  | "new_lead"
  | "analysed"
  | "contacted"
  | "in_conversation"
  | "won"
  | "lost";

export type Strategy = "mobile" | "desktop";

export type PitchTone = "professional" | "friendly" | "luxury";

export type PitchStatus = "draft" | "sent" | "replied";

export type ImpactLevel = "High" | "Medium" | "Low";

// ── Table Row Interfaces ────────────────────────────────────────────────────

/**
 * Maps to the `businesses` table (§2.2).
 *
 * One row per discovered business per user. Headline scores are denormalised
 * here for fast list rendering; per-strategy detail lives in `audits` /
 * `design_analyses` / `ux_analyses`.
 */
export interface BusinessRow {
  id: string;
  user_id: string;

  // Identity
  name: string | null;
  place_id: string | null;
  business_type: string | null;
  address: string | null;
  city: string | null;

  // Contact
  phone: string | null;
  website: string | null;

  // Classification
  website_status: WebsiteStatus | null;

  // Google ratings
  rating: number | null;
  review_count: number | null;

  // Denormalised headline scores
  performance_score: number | null;
  design_score: number | null;
  ux_score: number | null;
  opportunity_score: number | null;

  // Outreach flags
  flagged_for_outreach: boolean;
  outreach_reason: string | null;

  // Lifecycle timestamps
  created_at: string;
  discovered_at: string;
  audited_at: string | null;
  design_analyzed_at: string | null;
  ux_analyzed_at: string | null;

  // Contact info (undocumented in schema but used in code)
  contact_info: Record<string, unknown> | null;
}

/**
 * Maps to the `audits` table (§2.4).
 *
 * Two rows per audit run (mobile + desktop). Written via admin client.
 */
export interface AuditRow {
  id: string;
  business_id: string;
  user_id: string;

  strategy: Strategy;

  performance_score: number | null;
  seo_score: number | null;

  fcp: string | null;
  lcp: string | null;
  tbt: string | null;
  cls: string | null;

  has_ssl: boolean | null;

  audit_data: Record<string, unknown> | null;

  created_at: string;
}

/**
 * Maps to the `design_analyses` table (§2.5).
 *
 * Two rows per analysis run (mobile + desktop). Gemini 2.5 Flash vision on
 * static screenshots. Written via admin client.
 */
export interface DesignAnalysisRow {
  id: string;
  business_id: string;
  user_id: string;

  strategy: Strategy;

  design_score: number | null;

  criteria_scores: Record<string, unknown> | null;
  issues: Record<string, unknown> | null;
  screenshot_url: string | null;
  raw_analysis: Record<string, unknown> | null;

  analyzed_at: string;
}

/**
 * Maps to the `pipeline` table (§2.7).
 *
 * Lead funnel tracking. One row per business per user.
 */
export interface PipelineRow {
  id: string;
  business_id: string;
  user_id: string;

  status: PipelineStatus;
  notes: string | null;

  stage_entered_at: string | null;

  created_at: string;
  updated_at: string;
}

/**
 * Maps to the `pitches` table (§2.8).
 *
 * Generated outreach emails. Written via admin client.
 */
export interface PitchRow {
  id: string;
  business_id: string;
  user_id: string;

  subject: string | null;
  body: string | null;

  tone: PitchTone | null;
  lead_type: WebsiteStatus | null;
  pitch_status: PitchStatus;
  channel: "email" | "whatsapp" | null;

  created_at: string;
}

/**
 * Maps to the `places_cache` table (§2.3).
 *
 * NOT per-user. One row per unique Google place_id, platform-wide, forever
 * (90-day staleness refresh). Includes undocumented columns: `rating`,
 * `review_count`, `ratings_fetched_at`.
 */
export interface PlacesCacheRow {
  place_id: string;

  website: string | null;
  website_status: WebsiteStatus | null;
  details_fetched_at: string;

  // Undocumented columns (refreshed by rating sync)
  rating: number | null;
  review_count: number | null;
  ratings_fetched_at: string | null;
}

/**
 * Maps to the `subscriptions` table (§2.10).
 *
 * Billing / audit-credit tracking. Provisioned on signup (free tier) and
 * updated by the Dodo Payments webhook.
 */
export interface SubscriptionRow {
  id: string;
  user_id: string;

  dodo_customer_id: string | null;
  dodo_subscription_id: string | null;

  tier: string | null;
  audits_used: number;
  audits_limit: number;
  searches_used: number;
  searches_limit: number;
  credits_reset_at: string | null;

  created_at: string;
}

/**
 * Maps to the `territories` table (§2.13).
 *
 * Saved search alerts (basis of v2 Radar). Used live by `/api/saved-searches`.
 */
export interface TerritoryRow {
  id: string;
  user_id: string;

  name: string | null;
  city: string | null;
  business_type: string | null;

  last_scanned_at: string | null;
  alert_enabled: boolean | null;

  created_at: string;
}

/**
 * Maps to the `share_links` table (§2.12).
 *
 * Public read-only URLs for leads. Tokens are random UUIDs — the URL is
 * effectively unguessable. Writes via admin client.
 */
export interface ShareLinkRow {
  id: string;
  business_id: string;
  user_id: string;

  token: string;

  created_at: string;
  expires_at: string | null;
}

/**
 * Maps to the `profiles` table (auth-linked user profiles).
 * Used by the dodo webhook to look up users by email.
 */
export interface ProfileRow {
  id: string;
  email: string | null;
}

// ── Derived / Composite Types ───────────────────────────────────────────────

/**
 * `BusinessRow` extended with UI-only fields used in the leads list view.
 *
 * - `issues_count`: number of design/UX issues detected (computed at render)
 * - `pipeline_status`: the current pipeline stage if a pipeline row exists
 */
export interface LeadListBusiness extends BusinessRow {
  issues_count?: number;
  pipeline_status?: string | null;
}

/**
 * Flat shape for the pipeline page.
 *
 * Combines pipeline metadata (`pipeline_id`, `pipeline_status`, `created_at`)
 * with the lead's business fields in a single flat object.
 */
export interface PipelineBusiness {
  // Pipeline fields
  pipeline_id: string;
  pipeline_status: PipelineStatus;
  stage_entered_at: string | null;
  created_at: string;

  // Business fields (subset of BusinessRow)
  id: string;
  user_id: string;
  name: string | null;
  place_id: string | null;
  business_type: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  website: string | null;
  website_status: WebsiteStatus | null;
  rating: number | null;
  review_count: number | null;
  performance_score: number | null;
  design_score: number | null;
  ux_score: number | null;
  opportunity_score: number | null;
  flagged_for_outreach: boolean;
  outreach_reason: string | null;
  discovered_at: string;
  audited_at: string | null;
  design_analyzed_at: string | null;
  ux_analyzed_at: string | null;
}

/**
 * Shape for the public share page (`/share/[token]`).
 *
 * Contains the business row and the full set of audit / design analysis rows
 * for both mobile and desktop strategies.
 */
export interface ShareData {
  business: BusinessRow;
  mobileAudit: AuditRow | null;
  desktopAudit: AuditRow | null;
  mobileDesign: DesignAnalysisRow | null;
  desktopDesign: DesignAnalysisRow | null;
}

// ── Database Type for Supabase Client ───────────────────────────────────────
//
// This is the type shape that @supabase/supabase-js expects for its generic
// parameter. Each table maps to a "GenericTable"-like shape with Row, Insert,
// Update, and Relationships keys. This enables type-safe `from()` calls
// throughout the codebase, eliminating `as any` casts.

/**
 * Minimal GenericTable shape matching what @supabase/supabase-js expects
 * internally. Only the keys used by the type system are included.
 * The intersection with `Record<string, unknown>` satisfies the
 * Supabase type constraint even for interfaces without an explicit
 * index signature.
 */
type TableDef<Row> = {
  Row: Row & Record<string, unknown>;
  Insert: Row & Record<string, unknown>;
  Update: Partial<Row> & Record<string, unknown>;
  Relationships: [];
};

/**
 * Nearsited's Database type — pass as a generic to `createClient<Database>()`
 * or `createAdminClient<Database>()` for fully typed query builders.
 */
export interface Database {
  public: {
    Tables: {
      businesses: TableDef<BusinessRow>;
      audits: TableDef<AuditRow>;
      design_analyses: TableDef<DesignAnalysisRow>;
      pipeline: TableDef<PipelineRow>;
      pitches: TableDef<PitchRow>;
      places_cache: TableDef<PlacesCacheRow>;
      subscriptions: TableDef<SubscriptionRow>;
      territories: TableDef<TerritoryRow>;
      share_links: TableDef<ShareLinkRow>;
      profiles: TableDef<ProfileRow>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
