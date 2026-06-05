import { readFileSync } from "fs";
const env = readFileSync(".env.local", "utf8").split("\n");
const getEnv = (k) => {
  const l = env.find((l) => l.trim().startsWith(k + "="));
  return l ? l.split("=").slice(1).join("=").trim() : null;
};
const url = getEnv("NEXT_PUBLIC_SUPABASE_URL");
const key = getEnv("SUPABASE_SERVICE_ROLE_KEY");
const h = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };

// Find user by email
const r = await fetch(`${url}/rest/v1/profiles?select=id,email&email=eq.adulsheik@gmail.com`, { headers: h });
const profiles = await r.json();
console.log("Profiles:", JSON.stringify(profiles, null, 2));

if (Array.isArray(profiles) && profiles.length > 0) {
  const userId = profiles[0].id;
  const now = new Date();
  const resetAt = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
  
  // Update subscription row
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
    console.log("❌ Patch failed:", await patch.text());
  }
} else {
  // Try ALL profiles
  const r2 = await fetch(`${url}/rest/v1/profiles?select=id,email`, { headers: h });
  const all = await r2.json();
  console.log("All profiles:", JSON.stringify(all, null, 2));
}
