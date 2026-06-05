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

// Product ID → plan tier + monthly audit limit
export const DODO_PRODUCTS: Record<string, { tier: "starter" | "agency"; limit: number }> = {
  pdt_0NgKrmYBX9pAp9NhbeMqp: { tier: "starter", limit: 50  }, // Starter Monthly
  pdt_0NgKs5x6MXKvmMOQemKP2: { tier: "starter", limit: 50  }, // Starter Annual
  pdt_0NgKsF0ROmm9U603GRqMm: { tier: "agency",  limit: 200 }, // Agency Monthly
  pdt_0NgKsQO5UXCVGZskhrv89: { tier: "agency",  limit: 200 }, // Agency Annual
};

export const FREE_AUDIT_LIMIT = 10;

export type PlanTier = "free" | "starter" | "agency";
