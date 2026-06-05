import type { WebsiteStatus } from "@/lib/db-types";

/**
 * Shared Business type representing a lead/business row from the database.
 * Used across pages that display or interact with business/lead data.
 * Individual pages may extend this with local fields (e.g. issues_count).
 */
export interface Business {
  id: string;
  name: string;
  business_type: string;
  address: string;
  city: string;
  place_id: string | null;
  website: string | null;
  website_status: WebsiteStatus;
  phone?: string | null;
  rating?: number | null;
  review_count?: number | null;
  performance_score?: number | null;
  design_score?: number | null;
  ux_score?: number | null;
  opportunity_score?: number | null;
  audited_at?: string | null;
  design_analyzed_at?: string | null;
  ux_analyzed_at?: string | null;
  discovered_at?: string;
  flagged_for_outreach?: boolean;
  outreach_reason?: string | null;
}

/**
 * Social/aggregator domains that should be classified as "social_only"
 * rather than "has_website". These are not real business websites.
 */
const SOCIAL_DOMAINS = [
  "facebook.com",
  "fb.com",
  "fb.me",
  "instagram.com",
  "linktr.ee",
  "linktree",
  "twitter.com",
  "x.com",
  "tiktok.com",
  "linkedin.com",
  "wa.me",
  "business.site",
  "sites.google.com",
];

/**
 * Platform/third-party domains that should be classified as "platform_only"
 * rather than "has_website". These include booking platforms, food delivery
 * services, free website builders, and business directories.
 */
const PLATFORM_DOMAINS = [
  // Booking / reservation platforms
  "booking.com",
  "opentable.com",
  "thefork.com",
  "resy.com",
  "fresha.com",
  "treatwell.com",
  "booksy.com",
  "simplybook.me",
  "setmore.com",
  // Food delivery
  "doordash.com",
  "ubereats.com",
  "grubhub.com",
  "deliveroo.com",
  "justeat.com",
  "glovoapp.com",
  "zomato.com",
  "swiggy.com",
  "seamless.com",
  "square.site",
  "clover.com",
  // Free website builders (matched as subdomains)
  "wixsite.com",
  "weebly.com",
  "godaddysites.com",
  "myshopify.com",
  "wordpress.com",
  "blogspot.com",
  "webnode",
  "jimdo",
  "strikingly.com",
  "carrd.co",
  // Business directories
  "yellowpages",
  "yelp.com",
  "tripadvisor.com",
  "justdial.com",
];

/**
 * Classify a URL into a canonical WebsiteStatus.
 *
 * - null / empty / whitespace → "no_website"
 * - URL host matches a social/aggregator domain → "social_only"
 * - URL host matches a platform/third-party domain → "platform_only"
 * - otherwise → "has_website"
 *
 * Domain matching is case-insensitive and ignores leading "www.".
 * Subdomains of listed domains also match (e.g. m.facebook.com).
 */
export function classifyWebsite(url: string | null): WebsiteStatus {
  if (!url || typeof url !== "string" || !url.trim()) {
    return "no_website";
  }

  let hostname: string;
  try {
    hostname = new URL(url.trim()).hostname.toLowerCase();
  } catch {
    // Invalid URL — treat as no_website
    return "no_website";
  }

  // Strip leading "www." for matching
  const normalized = hostname.startsWith("www.") ? hostname.slice(4) : hostname;

  // Check social domains first
  for (const domain of SOCIAL_DOMAINS) {
    // Match exact domain or subdomain (e.g. m.facebook.com matches facebook.com)
    if (normalized === domain || normalized.endsWith("." + domain)) {
      return "social_only";
    }
  }

  // Check platform domains second
  for (const domain of PLATFORM_DOMAINS) {
    if (normalized === domain || normalized.endsWith("." + domain)) {
      return "platform_only";
    }
  }

  return "has_website";
}
