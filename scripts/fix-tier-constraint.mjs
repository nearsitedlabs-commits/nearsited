import { readFileSync } from "fs";
const env = readFileSync(".env.local", "utf8").split("\n");
const getEnv = (k) => {
  const l = env.find((l) => l.trim().startsWith(k + "="));
  return l ? l.split("=").slice(1).join("=").trim() : null;
};
const url = getEnv("NEXT_PUBLIC_SUPABASE_URL");
const key = getEnv("SUPABASE_SERVICE_ROLE_KEY");
const projectRef = url.replace("https://", "").split(".")[0];

// Use Management API to run SQL
const r = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
  body: JSON.stringify({
    query: `
      ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_tier_check;
      ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_tier_check 
        CHECK (tier IN ('free', 'starter', 'agency'));
    `,
  }),
});
const result = await r.json();
console.log("Status:", r.status);
console.log("Result:", JSON.stringify(result, null, 2));

if (r.ok) {
  console.log("\n✅ Tier constraint fixed! Now syncing subscription...");
  
  // Now update the subscription
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
    console.log("✅ Updated subscription:", JSON.stringify(result, null, 2));
  } else {
    console.log("❌ Update failed:", await patch.text());
  }
}
