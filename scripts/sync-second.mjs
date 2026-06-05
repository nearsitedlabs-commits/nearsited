import "./load-env.mjs";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const h = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };

const userId = "c923628e-dc34-4fac-895d-20e6cf5a2c72";
const now = new Date();
const resetAt = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

// Without dodo_subscription_id to avoid unique constraint collision
const patch = await fetch(`${url}/rest/v1/subscriptions?user_id=eq.${userId}`, {
  method: "PATCH",
  headers: { ...h, Prefer: "return=representation" },
  body: JSON.stringify({
    dodo_customer_id: null,
    dodo_subscription_id: null,
    tier: "starter",
    audits_limit: 50,
    audits_used: 0,
    credits_reset_at: resetAt,
  }),
});

if (patch.ok) {
  const result = await patch.json();
  console.log(`✅ ${result[0]?.tier} / ${result[0]?.audits_limit}`);
} else {
  console.log("❌", await patch.text());
}
