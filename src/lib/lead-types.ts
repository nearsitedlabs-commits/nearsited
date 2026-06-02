/**
 * Nearsited Lead Type Classification
 *
 * Determines which opportunity workflow to render based on a business's
 * digital presence signals.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export type LeadWorkflow = "website" | "social_only" | "no_digital_presence";

// ── Classification ───────────────────────────────────────────────────────────

/**
 * Map the stored website_status to the appropriate workflow.
 *
 * has_website, platform_only → "website" (has some web presence to audit)
 * social_only                → "social_only" (active on social, no website)
 * no_website, unknown        → "no_digital_presence" (nothing found)
 */
export function detectLeadWorkflow(business: {
  website_status: string;
  website: string | null;
}): LeadWorkflow {
  switch (business.website_status) {
    case "has_website":
    case "platform_only":
      return "website";
    case "social_only":
      return "social_only";
    case "no_website":
    case "unknown":
    default:
      return "no_digital_presence";
  }
}

// ── Social Platform Detection ────────────────────────────────────────────────

const SOCIAL_PLATFORM_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /facebook\.com|fb\.com/i,      label: "Facebook" },
  { pattern: /instagram\.com/i,               label: "Instagram" },
  { pattern: /tiktok\.com/i,                  label: "TikTok" },
  { pattern: /linkedin\.com/i,                label: "LinkedIn" },
  { pattern: /youtube\.com|youtu\.be/i,       label: "YouTube" },
  { pattern: /x\.com|twitter\.com/i,          label: "X / Twitter" },
  { pattern: /wa\.me|whatsapp/i,              label: "WhatsApp" },
  { pattern: /snapchat\.com/i,                label: "Snapchat" },
  { pattern: /pinterest\.com/i,               label: "Pinterest" },
  { pattern: /threads\.net/i,                 label: "Threads" },
];

/**
 * Detect which social media platforms are referenced in a URL or text.
 * Used to display detected platforms for social_only leads.
 */
export function detectSocialPlatforms(text: string | null): string[] {
  if (!text) return [];
  const found = new Set<string>();
  for (const { pattern, label } of SOCIAL_PLATFORM_PATTERNS) {
    if (pattern.test(text)) {
      found.add(label);
    }
  }
  return Array.from(found);
}

// ── Impact Estimates ─────────────────────────────────────────────────────────

export type ImpactLevel = "+++" | "++" | "+";

export type ImpactEstimate = {
  label: string;
  impact: ImpactLevel;
  description: string;
};

/**
 * Impact estimates for social-only leads.
 * Shows the business impact of NOT having a website.
 */
export function getSocialImpactEstimates(): ImpactEstimate[] {
  return [
    { label: "Trust",         impact: "+++", description: "A website builds credibility. Social profiles alone don't convey professionalism." },
    { label: "Lead Capture",  impact: "+++", description: "Websites convert visitors into leads via forms, CTAs, and contact pages." },
    { label: "Search Visibility", impact: "++", description: "Websites rank in Google. Social posts don't appear in local search results." },
    { label: "Brand Control", impact: "+++", description: "You control your website. Social platforms change algorithms and policies." },
  ];
}

/**
 * Opportunity reasons for social-only leads.
 */
export function getSocialOpportunityReasons(): string[] {
  return [
    "Strong social presence detected — you know how to engage an audience",
    "No dedicated website found — customers can't find full service information",
    "Search visibility is limited — social profiles don't appear in local search results",
    "Reliance on third-party platforms — algorithm changes could affect reach",
    "A website adds credibility and converts visitors into leads automatically",
  ];
}

/**
 * Opportunity reasons for no-digital-presence leads.
 */
export function getNoDigitalOpportunityReasons(): string[] {
  return [
    "No website detected — potential customers may struggle to discover the business online",
    "No social presence detected — limited digital footprint",
    "Credibility and discoverability opportunities exist",
    "Competitors likely have an online presence advantage",
    "Many customers now search online before making purchasing decisions",
  ];
}

/**
 * Digital foundation recommendations for no-digital-presence leads.
 */
export function getDigitalFoundationRecommendations(): { step: number; title: string; description: string }[] {
  return [
    { step: 1, title: "Professional Website",     description: "A clean, mobile-friendly website establishes credibility and provides a central hub for all business information." },
    { step: 2, title: "Google Business Profile",  description: "Optimize your Google Business listing to appear in local search and Google Maps results." },
    { step: 3, title: "Social Media Profiles",    description: "Create profiles on platforms where your customers spend time (Instagram, Facebook, LinkedIn)." },
    { step: 4, title: "Contact Funnel",           description: "Set up a simple way for customers to reach you — contact form, phone number, or booking system." },
  ];
}
