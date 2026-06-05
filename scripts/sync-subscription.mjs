/**
 * Manually sync a Dodo subscription to a user in the database.
 *
 * Usage: node scripts/sync-subscription.mjs <dodo_subscription_id> <user_email>
 *
 * This is a one-time recovery script for webhooks that arrived before the
 * metadata.user_id lookup was implemented.
 */
import "./load-env.mjs";
import DodoPayments from "dodopayments";

const SUBSCRIPTION_ID = process.argv[2];
const USER_EMAIL = process.argv[3];

if (!SUBSCRIPTION_ID || !USER_EMAIL) {
  console.error("Usage: node scripts/sync-subscription.mjs <dodo_subscription_id> <user_email>");
  console.error("  e.g. node scripts/sync-subscription.mjs sub_0NgO2zS0mcTsrdjgnZtgR nearsitedlabs@gmail.com");
  process.exit(1);
}

async function main() {
  // 1. Get Dodo subscription details
  const apiKey = process.env.DODO_API_KEY;
  const isTestMode = apiKey?.startsWith("S-") ?? false;

  const dodo = new DodoPayments({
    bearerToken: apiKey,
    environment: isTestMode ? "test_mode" : "live_mode",
  });

  console.log(`Fetching Dodo subscription ${SUBSCRIPTION_ID}...`);
  const sub = await dodo.subscriptions.retrieve(SUBSCRIPTION_ID);
  console.log(`  Status: ${sub.status}`);
  console.log(`  Product: ${sub.product_id}`);
  console.log(`  Customer: ${sub.customer.email} (${sub.customer.customer_id})`);

  // 2. Find user in Supabase
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const headers = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` };

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?select=id,email&email=eq.${encodeURIComponent(USER_EMAIL)}`,
    { headers }
  );
  const profiles = await res.json();

  if (!Array.isArray(profiles) || profiles.length === 0) {
    console.error(`No profile found with email: ${USER_EMAIL}`);
    process.exit(1);
  }

  const userId = profiles[0].id;
  console.log(`Found user: ${userId} (${profiles[0].email})`);

  // 3. Check DODO_PRODUCTS for the product mapping
  const { DODO_PRODUCTS, FREE_AUDIT_LIMIT } = await import("../src/lib/dodo.js");
  const productInfo = DODO_PRODUCTS[sub.product_id];

  if (!productInfo) {
    console.warn(`Unknown product ID: ${sub.product_id}`);
    console.warn(`Mapping to free tier as fallback`);
  }

  const tier = productInfo?.tier ?? "free";
  const limit = productInfo?.limit ?? FREE_AUDIT_LIMIT;
  const now = new Date();
  const resetAt = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

  // 4. Upsert subscription row
  const upsertRes = await fetch(`${SUPABASE_URL}/rest/v1/subscriptions?user_id=eq.${userId}`, {
    method: "PATCH",
    headers: { ...headers, "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify({
      dodo_customer_id: sub.customer.customer_id,
      dodo_subscription_id: sub.subscription_id,
      tier,
      audits_limit: limit,
      audits_used: 0,
      credits_reset_at: resetAt,
    }),
  });

  if (upsertRes.ok) {
    console.log(`✅ Synced! user=${userId} tier=${tier} audits_limit=${limit}`);
  } else {
    const text = await upsertRes.text();
    console.error(`❌ Failed to sync: ${text}`);
  }
}

main().catch(console.error);
