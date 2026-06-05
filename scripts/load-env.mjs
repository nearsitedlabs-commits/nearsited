/**
 * Safe environment loader for scripts.
 *
 * Reads `.env.local` and loads variables into `process.env`.
 * This avoids having each script manually parse the file with readFileSync,
 * which was a security concern (file reading could be cached/leaked).
 *
 * Usage:
 *   import "./load-env.mjs";
 *   const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
 *
 * SECURITY NOTE:
 *   - This file is for local/CI script use only
 *   - Never commit .env.local to version control
 *   - Never pipe process.env to stdout in production
 */

import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env.local");

if (!existsSync(envPath)) {
  console.warn("⚠️  .env.local not found at", envPath);
  console.warn("   Create it from .env.example or set environment variables manually.");
  process.exit(1);
}

const text = readFileSync(envPath, "utf8");
let loaded = 0;

for (const line of text.split("\n")) {
  const trimmed = line.trim();

  // Skip comments and empty lines
  if (!trimmed || trimmed.startsWith("#")) continue;

  const eqIndex = trimmed.indexOf("=");
  if (eqIndex === -1) continue;

  const key = trimmed.slice(0, eqIndex).trim();
  const value = trimmed.slice(eqIndex + 1).trim();

  // Only set if not already set (environment variables take precedence)
  if (!process.env[key]) {
    // Handle quoted values
    const cleaned =
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
        ? value.slice(1, -1)
        : value;
    process.env[key] = cleaned;
    loaded++;
  }
}

// Log only in non-production, without revealing sensitive values
if (process.env.NODE_ENV !== "production") {
  const keys = Object.keys(process.env).filter(
    (k) => text.includes(`${k}=`),
  );
  console.log(`🔐 Loaded ${loaded} env vars: ${keys.join(", ")}`);
}
