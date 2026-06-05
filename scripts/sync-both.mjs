import { readFileSync } from "fs";
const env = readFileSync(".env.local", "utf8").split("\n");
const getEnv = (k) => {
  const l = env.find((l) => l.trim().startsWith(k + "="));
  return l ? l.split("=").slice(1).join("=").trim() : null;
};
const url = getEnv("NEXT_PUBLIC_SUPABASE_URL");
const key = getEnv("SUPABASE_SERVICE_ROLE_KEY");
const h = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };

const userIds = [
  "6bd41059-a52d-4c8e-9612-02c10f6edc80",
  "c923628e-dc34-4fac-895d-20e6cf5a2c72",
];

const now = new Date();
const resetAt = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

for (const userId of userIds) {
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
    console.log(`✅ ${userId.substring(0, 8)}... → ${result[0]?.tier} / ${result[0]?.audits_limit}`);
  } else {
    console.log(`❌ ${userId.substring(0, 8)}... → ${await patch.text()}`);
  }
}
