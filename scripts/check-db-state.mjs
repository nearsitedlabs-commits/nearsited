/**
 * Check current DB state for billing readiness using Supabase REST API.
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
const headers = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` };

async function restGet(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = null; }
  return { status: res.status, ok: res.ok, text: text.substring(0, 500), json };
}

async function main() {
  console.log("=== 1. Subscriptions table: sample row ===");
  const sub = await restGet("subscriptions?select=*&limit=1");
  console.log(`  Status: ${sub.status} ${sub.ok ? "OK" : "FAIL"}`);
  if (sub.ok && sub.json) console.log("  Sample:", JSON.stringify(sub.json, null, 2));
  if (!sub.ok) console.log("  Error:", sub.text);

  console.log("\n=== 2. Check contact_info column on businesses ===");
  const biz = await restGet("businesses?select=contact_info&limit=1");
  console.log(`  Status: ${biz.status} ${biz.ok ? "OK" : "FAIL"}`);
  if (!biz.ok) {
    if (biz.text.includes("column") && biz.text.includes("contact_info")) {
      console.log("  ➡ contact_info column MISSING");
    } else {
      console.log("  Error:", biz.text);
    }
  } else {
    console.log("  ➡ contact_info column EXISTS");
  }

  console.log("\n=== 3. Check channel column on pitches ===");
  const pitch = await restGet("pitches?select=channel&limit=1");
  console.log(`  Status: ${pitch.status} ${pitch.ok ? "OK" : "FAIL"}`);
  if (!pitch.ok) {
    if (pitch.text.includes("column") && pitch.text.includes("channel")) {
      console.log("  ➡ channel column MISSING");
    } else {
      console.log("  Error:", pitch.text);
    }
  } else {
    console.log("  ➡ channel column EXISTS");
  }

  console.log("\n=== 4. Subscription row count ===");
  const cnt = await restGet("subscriptions?select=id&limit=1000");
  if (cnt.ok && cnt.json) {
    console.log(`  Total rows: ${cnt.json.length}`);
    // Check if any have dodo_subscription_id
    const withDodo = cnt.json.filter(r => r.dodo_subscription_id);
    console.log(`  Rows with dodo_subscription_id: ${withDodo.length}`);
  }

  console.log("\n=== 5. Profile count vs subscription count ===");
  const prof = await restGet("profiles?select=id&limit=1000");
  if (prof.ok && prof.json) {
    console.log(`  Total profiles: ${prof.json.length}`);
  }
  if (cnt.ok && cnt.json) {
    console.log(`  Total subscriptions: ${cnt.json.length}`);
    if (prof.ok && prof.json) {
      const diff = prof.json.length - cnt.json.length;
      if (diff > 0) console.log(`  ⚠ ${diff} users without subscription row (will auto-provision on first audit)`);
      if (diff === 0) console.log("  ✅ All users have subscription rows");
    }
  }
}

main().catch(console.error);
