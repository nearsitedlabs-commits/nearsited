import "./load-env.mjs"; // loads .env.local into process.env
import { createClient } from "@supabase/supabase-js";

const KEEP = new Set([
  "sheikadin1@gmail.com",
  "nearsitedlabs@gmail.com",
]);

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
if (error) { console.error("Failed to list users:", error); process.exit(1); }

const toDelete = data.users.filter(u => !KEEP.has(u.email ?? ""));
const toKeep   = data.users.filter(u =>  KEEP.has(u.email ?? ""));

console.log(`\nAccounts to KEEP (${toKeep.length}):`);
toKeep.forEach(u => console.log(`  + ${u.email}`));

console.log(`\nAccounts to DELETE (${toDelete.length}):`);
toDelete.forEach(u => console.log(`  - ${u.email} (${u.id})`));

const DRY_RUN = process.argv[2] !== "--confirm";
if (DRY_RUN) {
  console.log("\nDRY RUN — pass --confirm to actually delete");
  process.exit(0);
}

console.log("\nDeleting...");
for (const u of toDelete) {
  const { error: delErr } = await admin.auth.admin.deleteUser(u.id);
  if (delErr) {
    console.error(`  ERROR deleting ${u.email}:`, delErr.message);
  } else {
    console.log(`  ✓ Deleted ${u.email}`);
  }
}
console.log("Done.");
