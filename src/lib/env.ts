/**
 * Environment variable validation.
 *
 * Run `validateEnv()` once at server startup to detect missing or misconfigured
 * env vars before they cause silent runtime failures.
 *
 * Usage (in middleware.ts):
 * ```ts
 * import { validateEnv } from "@/lib/env";
 * validateEnv(); // runs once — cached after first call
 * ```
 */

export interface EnvValidationResult {
  valid: boolean;
  missing: string[];
}

/** Whether the modules in this project have been validated during this process. */
let _validated = false;

/**
 * The canonical list of environment variables the app needs to function.
 *
 * Naming convention:
 * - `NEXT_PUBLIC_*` — publicly exposed to the browser (Next.js inlines them at build time).
 * - Everything else — server-only, never ships to the client.
 */
export const REQUIRED_ENV_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DODO_API_KEY",
  "DODO_WEBHOOK_SECRET",
  "GOOGLE_PLACES_API_KEY",
  "GEMINI_API_KEY",
  "SCREENSHOT_API_KEY",
] as const;

/**
 * Validate that all required environment variables are set and non-empty.
 *
 * - In **production**, missing vars are logged with `console.error` so they're
 *   visible in server logs / hosted dashboards.
 * - In **development**, missing vars are logged with `console.warn` for a less
 *   intrusive experience during local iteration.
 * - After the first call the result is cached, so it's safe to call from
 *   middleware (which runs on every request).
 *
 * @returns `{ valid, missing }` — the caller can decide how to handle failures.
 */
export function validateEnv(): EnvValidationResult {
  if (_validated) {
    // Return cached result so we don't spam logs on every middleware invocation.
    return getCachedResult();
  }

  const missing: string[] = [];

  for (const name of REQUIRED_ENV_VARS) {
    const value = process.env[name];
    if (!value || value.trim() === "") {
      missing.push(name);
    }
  }

  // Also check the NEXT_PUBLIC_ variant of GOOGLE_PLACES_API_KEY as an
  // alternative name (some projects expose it publicly).
  const googleApiKey =
    process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
  if (!googleApiKey || googleApiKey.trim() === "") {
    // Avoid double-counting if already in missing list
    if (!missing.includes("GOOGLE_PLACES_API_KEY")) {
      missing.push("GOOGLE_PLACES_API_KEY (or NEXT_PUBLIC_GOOGLE_PLACES_API_KEY)");
    }
  } else {
    // If GOOGLE_PLACES_API_KEY was flagged as missing but the NEXT_PUBLIC_
    // variant exists, remove it from the missing list.
    const idx = missing.indexOf("GOOGLE_PLACES_API_KEY");
    if (idx !== -1) {
      missing.splice(idx, 1);
    }
  }

  const valid = missing.length === 0;
  const isDev = process.env.NODE_ENV === "development";
  const logFn = isDev ? console.warn : console.error;

  if (!valid) {
    if (isDev) {
      logFn(
        `⚠️  Environment validation: ${missing.length} variable(s) missing.\n` +
          `   ${missing.join("\n   ")}`,
      );
    } else {
      logFn(
        `❌ Environment validation: ${missing.length} required variable(s) not set.\n` +
          `   ${missing.join("\n   ")}`,
      );
    }
  } else {
    console.log("✅ All required environment variables are set.");
  }

  _validated = true;
  _cachedResult = { valid, missing };

  return { valid, missing };
}

// ── Internal cache ────────────────────────────────────────────────────────────

let _cachedResult: EnvValidationResult = { valid: true, missing: [] };

function getCachedResult(): EnvValidationResult {
  return _cachedResult;
}

// ── Auto-run on import in server environments ─────────────────────────────────

// When this module is imported on the server (not the client), run validation
// immediately so misconfigured deployments fail fast.
if (typeof window === "undefined" && !_validated) {
  validateEnv();
}
