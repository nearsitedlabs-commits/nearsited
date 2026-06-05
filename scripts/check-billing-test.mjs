/**
 * Investigate what happened with the user's test payment.
 * Checks profiles, subscriptions, and Dodo API.
 */
import { readFileSync } from "fs";

const envText = readFileSync(".env.local", "utf8");
const envLines = envText.split("\n");
function getEnv(key) {
  const line = envLines.find((l) => l.trim().startsWith(key + "="));
  if (!line) return null;
  return line.split("=").slice(1).join("=").trim();
}

const SUPABASE_URL = getEnv("NEXT_PUBLIC_SUPABASE_URL");
const SERVICE_KEY = getEnv("SUPABASE_SERVICE_ROLE_KEY");
const DODO_API_KEY = getEnv("DODO_API_KEY");

const headers = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` };

async function main() {
  // 1. Profiles
  console.log("=== Profiles ===");
  const r1 = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=id,email,full_name`, { headers });
  const profiles = await r1.json();
  profiles.forEach((p) => console.log(`  ${p.id} | ${p.email} | ${p.full_name}`));

  // 2. Subscriptions with details
  console.log("\n=== Subscriptions ===");
  const r2 = await fetch(`${SUPABASE_URL}/rest/v1/subscriptions?select=*`, { headers });
  const subs = await r2.json();
  subs.forEach((s) =>
    console.log(
      `  user=${s.user_id?.substring(0, 8)}... tier=${s.tier} used=${s.audits_used}/${s.audits_limit} dodo_cust=${s.dodo_customer_id || "—"} dodo_sub=${s.dodo_subscription_id || "—"}`
    )
  );

  // 3. Try Dodo API (list subscriptions)
  console.log("\n=== Dodo API: List Subscriptions ===");
  try {
    const dodoRes = await fetch("https://api.dodopayments.com/v1/subscriptions?limit=10", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${DODO_API_KEY}`,
        "Content-Type": "application/json",
      },
    });
    console.log(`Status: ${dodoRes.status} ${dodoRes.statusText}`);
    const text = await dodoRes.text();
    try {
      const json = JSON.parse(text);
      const items = json.items || json.data || [];
      console.log(`Total subscriptions: ${items.length}`);
      items.forEach((s) =>
        console.log(
          `  id=${s.id} product=${s.product_id} status=${s.status} customer=${s.customer_id}`
        )
      );
    } catch {
      console.log(`Raw response (first 500 chars): ${text.substring(0, 500)}`);
    }
  } catch (e) {
    console.log(`Dodo API error: ${e.message}`);
  }
}

main().catch(console.error);
