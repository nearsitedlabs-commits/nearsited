import "./load-env.mjs";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const h = { apikey: key, Authorization: `Bearer ${key}` };

const r = await fetch(`${url}/rest/v1/subscriptions?select=*`, { headers: h });
const subs = await r.json();
console.log("=== All Subscriptions ===");
subs.forEach((s) =>
  console.log(
    `tier=${s.tier} used=${s.audits_used}/${s.audits_limit} dodo_cust=${s.dodo_customer_id || "—"} dodo_sub=${s.dodo_subscription_id || "—"}`
  )
);
