import { readFileSync } from "fs";
const env = readFileSync(".env.local", "utf8").split("\n");
const getEnv = (k) => {
  const l = env.find((l) => l.trim().startsWith(k + "="));
  return l ? l.split("=").slice(1).join("=").trim() : null;
};
const url = getEnv("NEXT_PUBLIC_SUPABASE_URL");
const key = getEnv("SUPABASE_SERVICE_ROLE_KEY");
const h = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };

const userId = "6bd41059-a52d-4c8e-9612-02c10f6edc80";
const now = new Date();
const resetAt = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

const patch = await fetch(`${url}/rest/v1/subscriptions?user_id=eq.${userId}`, {
  method: "PATCH",
  headers: { ...h, Prefer: "return=representation" },
  body: JSON.stringify({
    dodo_customer_id: "manual-sync",
    dodo_subscription_id: "sub_0NgO2zS0mcTsrdjgnZtgR",
    tier: "starter",
    audits_limit: 50,
    audits_used: 0,
    credits_reset_at: resetAt,
  }),
});

if (patch.ok) {
  const result = await patch.json();
  console.log("✅ Updated:", JSON.stringify(result, null, 2));
} else {
  console.log("❌ Failed:", await patch.text());
}
