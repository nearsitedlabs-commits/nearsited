/**
 * Nearsited — Database Migration Runner
 *
 * Runs all migrations from docs/SCHEMA.md §5 against the Supabase database.
 * Uses a direct PostgreSQL connection via the postgres.js library.
 *
 * Usage: node scripts/run-migrations.mjs
 *
 * Environment variables (from .env.local):
 *   SUPABASE_DB_PASSWORD  — Database password (from Supabase Dashboard > Project Settings > Database)
 *   Or set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY for the REST API fallback.
 */

import postgres from "postgres";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL is required");
  process.exit(1);
}

// Extract project ref from URL: https://<ref>.supabase.co
const projectRef = SUPABASE_URL.replace("https://", "").split(".")[0];

// ── SQL Migrations (from SCHEMA.md §5) ──────────────────────────────────────

const MIGRATIONS = [
  // §5.1 — Businesses cleanup
  {
    name: "5.1 — Businesses cleanup",
    sql: `
      alter table if exists public.businesses drop constraint if exists businesses_website_type_check;
      alter table public.businesses
        drop column if exists website_url,
        drop column if exists gmb_place_id,
        drop column if exists gmb_rating,
        drop column if exists gmb_review_count,
        drop column if exists category,
        drop column if exists website_type,
        drop column if exists country,
        drop column if exists cached_at;
    `,
  },
  // §5.2 — Add SEO score to audits
  {
    name: "5.2 — Add seo_score to audits",
    sql: `
      alter table public.audits add column if not exists seo_score integer;
    `,
  },
  // §5.3 — Add pitch metadata
  {
    name: "5.3 — Add pitch metadata columns",
    sql: `
      alter table public.pitches
        add column if not exists tone text,
        add column if not exists lead_type text,
        add column if not exists pitch_status text default 'draft';
    `,
  },
  // §5.4 — Ensure RLS on pitches and mockups
  {
    name: "5.4 — Ensure RLS on pitches and mockups",
    sql: `
      alter table public.pitches enable row level security;
      do $$ begin
        if not exists (select 1 from pg_policies where tablename='pitches' and policyname='users manage own pitches') then
          create policy "users manage own pitches" on public.pitches
            for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
        end if;
      end $$;

      alter table public.mockups enable row level security;
      do $$ begin
        if not exists (select 1 from pg_policies where tablename='mockups' and policyname='users manage own mockups') then
          create policy "users manage own mockups" on public.mockups
            for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
        end if;
      end $$;
    `,
  },
  // §5.5 — Realign pipeline stages
  {
    name: "5.5 — Realign pipeline stages",
    sql: `
      alter table public.pipeline drop constraint if exists pipeline_stage_check;
      alter table public.pipeline drop constraint if exists pipeline_status_check;
      alter table public.pipeline add constraint pipeline_status_check check (status in (
        'new_lead','analysed','pitch_generated','contacted','in_conversation','won','lost'));

      update public.pipeline set status='new_lead'  where status='prospect';
      update public.pipeline set status='analysed'  where status='interested';
      update public.pipeline set status='won'       where status='closed';
      update public.pipeline set status='lost'      where status='rejected';
      update public.pipeline set status='new_lead'  where status is null;

      alter table public.pipeline drop column if exists stage;
    `,
  },
  // §5.6 — Territories column rename
  {
    name: "5.6 — Territories column rename",
    sql: `
      alter table public.territories rename column category to business_type;
    `,
  },
  // §5.7 — Businesses UX columns (add now, build later)
  {
    name: "5.7 — Add ux_score and ux_analyzed_at to businesses",
    sql: `
      alter table public.businesses
        add column if not exists ux_score integer,
        add column if not exists ux_analyzed_at timestamptz;
    `,
  },
  // §5.12 — Add contact_info JSONB column to businesses (vibecode fixes)
  {
    name: "5.12 — Add contact_info JSONB column to businesses",
    sql: `
      alter table public.businesses add column if not exists contact_info jsonb default '{}'::jsonb;
    `,
  },
  // §5.13 — Add channel column to pitches (vibecode fixes)
  {
    name: "5.13 — Add channel column with CHECK constraint to pitches",
    sql: `
      alter table public.pitches add column if not exists channel text default 'email';
      alter table public.pitches drop constraint if exists pitches_channel_check;
      alter table public.pitches add constraint pitches_channel_check check (channel in ('email', 'whatsapp'));
      update public.pitches set channel = 'email' where channel is null;
    `,
  },
];

// ── Run via direct PostgreSQL connection ─────────────────────────────────────

async function runViaPostgres() {
  if (!DB_PASSWORD) {
    console.log("ℹ️  SUPABASE_DB_PASSWORD not set — trying Management API fallback…");
    return false;
  }

  const host = `db.${projectRef}.supabase.co`;
  const connectionString = `postgresql://postgres:${DB_PASSWORD}@${host}:5432/postgres`;

  console.log(`🔌 Connecting to ${host}…`);

  const sql = postgres(connectionString, {
    ssl: true,
    connect_timeout: 15,
    max: 1,
  });

  for (const migration of MIGRATIONS) {
    console.log(`\n▶ Running: ${migration.name}`);
    try {
      // Split by semicolons and execute each statement separately
      const statements = migration.sql
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      for (const stmt of statements) {
        await sql.unsafe(stmt + ";");
      }
      console.log(`  ✅ ${migration.name} — OK`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      // Some migrations may fail if objects don't exist — that's OK
      if (message.includes("does not exist") || message.includes("already exists")) {
        console.log(`  ⚠️  ${migration.name} — skipped (${message})`);
      } else {
        console.error(`  ❌ ${migration.name} — FAILED: ${message}`);
        throw err;
      }
    }
  }

  await sql.end();
  console.log("\n✅ All migrations complete!");
  return true;
}

// ── Run via Management API (REST fallback) ──────────────────────────────────

async function runViaManagementApi() {
  if (!SERVICE_ROLE_KEY) {
    console.log("❌ Neither SUPABASE_DB_PASSWORD nor SUPABASE_SERVICE_ROLE_KEY is set");
    console.log("\n📋 To run migrations manually:");
    console.log("   1. Go to https://supabase.com/dashboard/project/" + projectRef + "/sql/new");
    console.log("   2. Copy-paste the SQL from docs/SCHEMA.md §5");
    console.log("   3. Run each section in order");
    return false;
  }

  // Try the Supabase Management API
  const mgmtUrl = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;
  console.log(`🔌 Trying Management API at ${mgmtUrl}…`);

  for (const migration of MIGRATIONS) {
    console.log(`\n▶ Running: ${migration.name}`);
    try {
      const response = await fetch(mgmtUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ query: migration.sql }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error(`  ❌ ${migration.name} — HTTP ${response.status}: ${text}`);
        return false;
      }

      console.log(`  ✅ ${migration.name} — OK`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("does not exist") || message.includes("already exists")) {
        console.log(`  ⚠️  ${migration.name} — skipped (${message})`);
      } else {
        console.error(`  ❌ ${migration.name} — FAILED: ${message}`);
        throw err;
      }
    }
  }

  console.log("\n✅ All migrations complete!");
  return true;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🚀 Nearsited Migration Runner");
  console.log(`📁 Project: ${projectRef}\n`);

  // Try direct PostgreSQL first, then Management API
  const ok = await runViaPostgres();
  if (!ok) {
    await runViaManagementApi();
  }
}

main().catch((err) => {
  console.error("\n💥 Migration runner failed:", err.message);
  process.exit(1);
});
