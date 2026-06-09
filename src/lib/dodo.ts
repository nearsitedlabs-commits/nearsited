import DodoPayments from "dodopayments";

// Singleton Dodo client
// Env vars: DODO_API_KEY (bearer token), DODO_WEBHOOK_SECRET (webhook signature key)
let _client: DodoPayments | null = null;
export function getDodoClient(): DodoPayments {
  if (!_client) {
    const apiKey = process.env.DODO_API_KEY;
    // Dodo test API keys start with "S-" — auto-detect environment
    const isTestMode = apiKey?.startsWith("S-") ?? false;
    _client = new DodoPayments({
      bearerToken: apiKey,
      webhookKey: process.env.DODO_WEBHOOK_SECRET ?? null,
      environment: isTestMode ? "test_mode" : "live_mode",
    });
    console.log(`[DODO] Initialized in ${isTestMode ? "TEST" : "LIVE"} mode`);
  }
  return _client;
}

// ── Product-to-tier mapping ────────────────────────────────────────────────────

export type ProductTier = "starter" | "agency";

export interface ProductInfo {
  tier: ProductTier;
  /** Monthly audit limit for this product. */
  limit: number;
  /** Monthly city-search limit for this product. */
  searches: number;
}

let _dodoProducts: Record<string, ProductInfo> | null = null;

/**
 * Returns the product ID → tier/limit/searches mapping.
 *
 * Reads product IDs from environment variables at first call, then caches:
 * - `DODO_PRODUCT_STARTER_MONTHLY` → `{ tier: "starter", limit: 50,  searches: 3 }`
 * - `DODO_PRODUCT_STARTER_ANNUAL`  → `{ tier: "starter", limit: 50,  searches: 3 }`
 * - `DODO_PRODUCT_AGENCY_MONTHLY`  → `{ tier: "agency",  limit: 200, searches: 10 }`
 * - `DODO_PRODUCT_AGENCY_ANNUAL`   → `{ tier: "agency",  limit: 200, searches: 10 }`
 *
 * Throws if any of the required env vars are missing.
 */
export function getDodoProducts(): Record<string, ProductInfo> {
  if (_dodoProducts) return _dodoProducts;

  const starterMonthly = process.env.DODO_PRODUCT_STARTER_MONTHLY;
  const starterAnnual = process.env.DODO_PRODUCT_STARTER_ANNUAL;
  const agencyMonthly = process.env.DODO_PRODUCT_AGENCY_MONTHLY;
  const agencyAnnual = process.env.DODO_PRODUCT_AGENCY_ANNUAL;

  if (!starterMonthly || !starterAnnual || !agencyMonthly || !agencyAnnual) {
    throw new Error(
      "Missing one or more DODO_PRODUCT_* environment variables. " +
      "Ensure DODO_PRODUCT_STARTER_MONTHLY, DODO_PRODUCT_STARTER_ANNUAL, " +
      "DODO_PRODUCT_AGENCY_MONTHLY, and DODO_PRODUCT_AGENCY_ANNUAL are set."
    );
  }

  _dodoProducts = {
    [starterMonthly]: { tier: "starter", limit: 50,  searches: 3  },
    [starterAnnual]:  { tier: "starter", limit: 50,  searches: 3  },
    [agencyMonthly]:  { tier: "agency",  limit: 200, searches: 10 },
    [agencyAnnual]:   { tier: "agency",  limit: 200, searches: 10 },
  };

  return _dodoProducts;
}

/** @deprecated Use `getDodoProducts()` instead — env vars may not be available at import time. */
export const DODO_PRODUCTS: Record<string, ProductInfo> =
  typeof window === "undefined"
    ? (() => {
        try {
          return getDodoProducts();
        } catch {
          return {};
        }
      })()
    : {};

export const FREE_AUDIT_LIMIT = 20; // 10 full workflows per month (audit + design each)
export const FREE_SEARCH_LIMIT = 3;

export type PlanTier = "free" | "starter" | "agency";
