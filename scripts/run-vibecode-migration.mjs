/**
 * Nearsited — Run vibecode-fixes migration directly
 *
 * This script runs the pending DB migrations (contact_info JSONB column
 * on businesses, channel column on pitches) using the Supabase client
 * with the service role key.
 *
 * Usage: node scripts/run-vibecode-migration.mjs
 *
 * Environment:
 *   NEXT_PUBLIC_SUPABASE_URL  — Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY — Service role key (bypasses RLS)
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  process.exit(1);
}

// ── SQL Statements ───────────────────────────────────────────────────────────

const statements = [
  // 1. Add contact_info JSONB column to businesses
  `alter table public.businesses add column if not exists contact_info jsonb default '{}'::jsonb;`,

  // 2. Add channel column to pitches
  `alter table public.pitches add column if not exists channel text default 'email';`,

  // 3. Add CHECK constraint for channel values
  `alter table public.pitches drop constraint if exists pitches_channel_check;`,
  `alter table public.pitches add constraint pitches_channel_check check (channel in ('email', 'whatsapp'));`,

  // 4. Backfill existing pitches
  `update public.pitches set channel = 'email' where channel is null;`,
];

// ── Execute via postgres.js (direct PostgreSQL connection) ───────────────────

async function runViaPostgres() {
  let postgres;
  try {
    postgres = (await import("postgres")).default;
  } catch {
    return false;
  }

  const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD;
  if (!DB_PASSWORD) return false;

  const projectRef = SUPABASE_URL.replace("https://", "").split(".")[0];
  const host = `db.${projectRef}.supabase.co`;
  const connectionString = `postgresql://postgres:${DB_PASSWORD}@${host}:5432/postgres`;

  console.log(`🔌 Connecting to ${host} via direct PostgreSQL…`);
  const sql = postgres(connectionString, { ssl: true, connect_timeout: 15, max: 1 });

  try {
    for (const stmt of statements) {
      console.log(`  ▶ ${stmt.split(" ").slice(0, 6).join(" ")}…`);
      await sql.unsafe(stmt);
    }
    console.log("✅ All migrations complete via direct PostgreSQL!");
    await sql.end();
    return true;
  } catch (err) {
    console.error("❌ Direct PostgreSQL failed:", err.message);
    await sql.end().catch(() => {});
    return false;
  }
}

// ── Execute via Supabase REST API (service role key) ────────────────────────
//
// Use the Supabase client to check connectivity, then try the SQL endpoint
// via the Management API or the internal SQL endpoint.

async function runViaRestApi() {
  console.log("🔌 Trying Supabase REST API with service role key…");

  const projectRef = SUPABASE_URL.replace("https://", "").split(".")[0];

  // First verify the connection works
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error: testErr } = await supabase.from("businesses").select("id").limit(1);
  if (testErr) {
    console.error("❌ Cannot connect to Supabase:", testErr.message);
    return false;
  }
  console.log("  ✅ Supabase connection verified");

  // Try the Management API SQL endpoint
  // Note: This requires the service role JWT, which sometimes works
  const mgmtUrl = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;

  for (const stmt of statements) {
    console.log(`  ▶ ${stmt.split(" ").slice(0, 6).join(" ")}…`);
    try {
      const response = await fetch(mgmtUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ query: stmt }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error(`  ❌ HTTP ${response.status}: ${text}`);
        return false;
      }
    } catch (err) {
      console.error(`  ❌ Request failed: ${err.message}`);
      return false;
    }
  }

  console.log("✅ All migrations complete via Management API!");
  return true;
}

// ── Print SQL for manual execution ──────────────────────────────────────────

function printManualInstructions() {
  console.log("\n📋 To run these migrations manually:");
  console.log("   1. Go to https://supabase.com/dashboard/project/" +
    SUPABASE_URL.replace("https://", "").split(".")[0] + "/sql/new");
  console.log("   2. Copy-paste the following SQL and run it:\n");
  console.log("-- ============================================================");
  console.log("-- Migration: Add contact_info JSONB column to businesses");
  console.log("-- ============================================================");
  console.log(
    "alter table public.businesses add column if not exists contact_info jsonb default '{}'::jsonb;"
  );
  console.log("");
  console.log("-- ============================================================");
  console.log("-- Migration: Add channel column to pitches");
  console.log("-- ============================================================");
  console.log(
    "alter table public.pitches add column if not exists channel text default 'email';"
  );
  console.log("");
  console.log("-- Add CHECK constraint for channel values");
  console.log(
    "alter table public.pitches drop constraint if exists pitches_channel_check;"
  );
  console.log(
    "alter table public.pitches add constraint pitches_channel_check check (channel in ('email', 'whatsapp'));"
  );
  console.log("");
  console.log("-- Update existing pitches to have channel = 'email' where NULL");
  console.log(
    "update public.pitches set channel = 'email' where channel is null;"
  );
  console.log("");
  console.log("-- Also available in: scripts/migrate-vibecode-fixes.sql");
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🚀 Nearsited Vibecode Fixes Migration");
  console.log(`📁 Project: ${SUPABASE_URL.replace("https://", "").split(".")[0]}\n`);

  // Try direct PostgreSQL first (needs SUPABASE_DB_PASSWORD)
  const ok = await runViaPostgres();
  if (ok) {
    console.log("\n✅ All 4 migration steps completed successfully!");
    process.exit(0);
  }

  console.log("ℹ️  Direct PostgreSQL not available (SUPABASE_DB_PASSWORD not set)");

  // Try Management API with service role key
  const ok2 = await runViaRestApi();
  if (ok2) {
    console.log("\n✅ All 4 migration steps completed successfully!");
    process.exit(0);
  }

  console.log("❌ Could not run migrations automatically.");
  printManualInstructions();
  process.exit(1);
}

main().catch((err) => {
  console.error("\n💥 Migration failed:", err.message);
  console.log("\n📋 Manual SQL available in: scripts/migrate-vibecode-fixes.sql");
  process.exit(1);
});
