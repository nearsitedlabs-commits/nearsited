import { readFileSync } from "fs";
const env = readFileSync(".env.local", "utf8").split("\n");
const getEnv = (k) => {
  const l = env.find((l) => l.trim().startsWith(k + "="));
  return l ? l.split("=").slice(1).join("=").trim() : null;
};
const url = getEnv("NEXT_PUBLIC_SUPABASE_URL");
const key = getEnv("SUPABASE_SERVICE_ROLE_KEY");
const h = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };

// Try inserting a test row
const r = await fetch(`${url}/rest/v1/subscriptions?select=*&limit=1`, { headers: h });
const subs = await r.json();
console.log("Sample subscription:", JSON.stringify(subs[0], null, 2));
console.log("Tier value:", subs[0]?.tier);
