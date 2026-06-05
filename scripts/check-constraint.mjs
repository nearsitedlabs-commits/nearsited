import "./load-env.mjs";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const h = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };

// Try inserting a test row
const r = await fetch(`${url}/rest/v1/subscriptions?select=*&limit=1`, { headers: h });
const subs = await r.json();
console.log("Sample subscription:", JSON.stringify(subs[0], null, 2));
console.log("Tier value:", subs[0]?.tier);
