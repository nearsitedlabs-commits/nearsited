import { readFileSync } from "fs";
const env = readFileSync(".env.local", "utf8").split("\n");
const getEnv = (k) => {
  const l = env.find((l) => l.trim().startsWith(k + "="));
  return l ? l.split("=").slice(1).join("=").trim() : null;
};
const url = getEnv("NEXT_PUBLIC_SUPABASE_URL");
const key = getEnv("SUPABASE_SERVICE_ROLE_KEY");
const h = { apikey: key, Authorization: `Bearer ${key}` };

const r = await fetch(`${url}/rest/v1/subscriptions?select=*`, { headers: h });
const subs = await r.json();
console.log("=== All Subscriptions ===");
subs.forEach((s) =>
  console.log(
    `tier=${s.tier} used=${s.audits_used}/${s.audits_limit} dodo_cust=${s.dodo_customer_id || "—"} dodo_sub=${s.dodo_subscription_id || "—"}`
  )
);
