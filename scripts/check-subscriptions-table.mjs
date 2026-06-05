/**
 * Quick script to check if the subscriptions table exists in Supabase.
 * Run: node scripts/check-subscriptions-table.mjs
 */
import { readFileSync } from "fs";

// Read .env.local
const envText = readFileSync(".env.local", "utf8");
const envLines = envText.split("\n");

function getEnv(key) {
  const line = envLines.find((l) => l.trim().startsWith(key + "="));
  if (!line) return null;
  return line.split("=").slice(1).join("=").trim();
}

const SUPABASE_URL = getEnv("NEXT_PUBLIC_SUPABASE_URL");
const SERVICE_KEY = getEnv("SUPABASE_SERVICE_ROLE_KEY");

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌ Missing env vars");
  process.exit(1);
}

console.log("Supabase URL:", SUPABASE_URL);
console.log("Service key present: YES\n");

async function main() {
  // Method 1: REST API direct query
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/subscriptions?select=count&limit=0`,
      {
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
        },
      }
    );
    console.log(`REST API status: ${res.status}`);
    if (res.ok) {
      console.log("✅ subscriptions table EXISTS");
      return;
    } else {
      const text = await res.text();
      console.log(`REST API error (${res.status}): ${text.substring(0, 300)}`);
      if (text.includes("relation") && text.includes("does not exist")) {
        console.log("❌ subscriptions table DOES NOT EXIST");
      }
    }
  } catch (e) {
    console.log("REST API failed:", e.message);
  }

  // Method 2: Check via information_schema using Management API
  const projectRef = SUPABASE_URL.replace("https://", "").split(".")[0];
  try {
    const res = await fetch(
      `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SERVICE_KEY}`,
        },
        body: JSON.stringify({
          query: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('subscriptions', 'profiles', 'businesses') ORDER BY table_name;`,
        }),
      }
    );
    const data = await res.json();
    console.log(`\nManagement API status: ${res.status}`);
    if (res.ok) {
      console.log("Tables found:", JSON.stringify(data, null, 2));
      const tables = (Array.isArray(data) ? data : []).map(
        (r) => r.table_name
      );
      if (tables.includes("subscriptions")) {
        console.log("✅ subscriptions table EXISTS");
      } else {
        console.log("❌ subscriptions table NOT in the list");
        console.log("Existing tables:", tables.join(", "));
      }
    } else {
      console.log("Management API response:", JSON.stringify(data).substring(0, 300));
    }
  } catch (e) {
    console.log("Management API failed:", e.message);
  }
}

main().catch(console.error);
