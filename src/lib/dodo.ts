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

export type ProductTier = "solo" | "agency" | "scale";

export interface ProductInfo {
  tier: ProductTier;
  /** Monthly audit limit for this product. */
  limit: number;
}

let _dodoProducts: Record<string, ProductInfo> | null = null;

/**
 * Returns the product ID → tier/limit mapping.
 *
 * Reads product IDs from environment variables at first call, then caches:
 * - `DODO_PRODUCT_SOLO_MONTHLY`    → `{ tier: "solo",   limit: 100  }`
 * - `DODO_PRODUCT_SOLO_ANNUAL`     → `{ tier: "solo",   limit: 100  }`
 * - `DODO_PRODUCT_AGENCY_MONTHLY`  → `{ tier: "agency", limit: 500  }`
 * - `DODO_PRODUCT_AGENCY_ANNUAL`   → `{ tier: "agency", limit: 500  }`
 * - `DODO_PRODUCT_SCALE_MONTHLY`   → `{ tier: "scale",  limit: 2000 }`
 * - `DODO_PRODUCT_SCALE_ANNUAL`    → `{ tier: "scale",  limit: 2000 }`
 *
 * Throws if any of the required env vars are missing.
 */
export function getDodoProducts(): Record<string, ProductInfo> {
  if (_dodoProducts) return _dodoProducts;

  const soloMonthly    = process.env.DODO_PRODUCT_SOLO_MONTHLY;
  const soloAnnual     = process.env.DODO_PRODUCT_SOLO_ANNUAL;
  const agencyMonthly  = process.env.DODO_PRODUCT_AGENCY_MONTHLY;
  const agencyAnnual   = process.env.DODO_PRODUCT_AGENCY_ANNUAL;
  const scaleMonthly   = process.env.DODO_PRODUCT_SCALE_MONTHLY;
  const scaleAnnual    = process.env.DODO_PRODUCT_SCALE_ANNUAL;

  if (!soloMonthly || !soloAnnual || !agencyMonthly || !agencyAnnual || !scaleMonthly || !scaleAnnual) {
    throw new Error(
      "Missing one or more DODO_PRODUCT_* environment variables. " +
      "Ensure DODO_PRODUCT_SOLO_MONTHLY, DODO_PRODUCT_SOLO_ANNUAL, " +
      "DODO_PRODUCT_AGENCY_MONTHLY, DODO_PRODUCT_AGENCY_ANNUAL, " +
      "DODO_PRODUCT_SCALE_MONTHLY, and DODO_PRODUCT_SCALE_ANNUAL are set."
    );
  }

  _dodoProducts = {
    [soloMonthly]:   { tier: "solo",   limit: 100  },
    [soloAnnual]:    { tier: "solo",   limit: 100  },
    [agencyMonthly]: { tier: "agency", limit: 500  },
    [agencyAnnual]:  { tier: "agency", limit: 500  },
    [scaleMonthly]:  { tier: "scale",  limit: 2000 },
    [scaleAnnual]:   { tier: "scale",  limit: 2000 },
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

/** Free Trial audit limit — 20 lifetime, never resets. */
export const FREE_TRIAL_AUDIT_LIMIT = 20;

export type PlanTier = "free_trial" | "solo" | "agency" | "scale";
