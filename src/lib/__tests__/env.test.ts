/**
 * Unit tests for environment variable validation (src/lib/env.ts).
 *
 * Each test resets the module registry so we get a fresh copy of the
 * validateEnv function without the cached result from a previous run.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { EnvValidationResult } from "../env";

// ── Helpers ───────────────────────────────────────────────────────────────────

const ENV = process.env as Record<string, string | undefined>;

/** Remove all env vars that validateEnv cares about — gives each test a clean slate. */
function clearEnv(): void {
  delete ENV.NEXT_PUBLIC_SUPABASE_URL;
  delete ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  delete ENV.SUPABASE_SERVICE_ROLE_KEY;
  delete ENV.DODO_API_KEY;
  delete ENV.DODO_WEBHOOK_SECRET;
  delete ENV.UPSTASH_REDIS_REST_URL;
  delete ENV.UPSTASH_REDIS_REST_TOKEN;
  delete ENV.GOOGLE_PLACES_API_KEY;
  delete ENV.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
  delete ENV.GEMINI_API_KEY;
  delete ENV.NODE_ENV;
}

/** Set all required env vars to non-empty dummy values. */
function setAll(): void {
  ENV.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY = "public-anon-key";
  ENV.SUPABASE_SERVICE_ROLE_KEY = "svc-role-key";
  ENV.DODO_API_KEY = "dodo-key";
  ENV.DODO_WEBHOOK_SECRET = "wh-secret";
  ENV.UPSTASH_REDIS_REST_URL = "https://upstash.example.com";
  ENV.UPSTASH_REDIS_REST_TOKEN = "upstash-token";
  ENV.GOOGLE_PLACES_API_KEY = "google-key";
  ENV.GEMINI_API_KEY = "gemini-key";
}

/**
 * Eject the cached module registry and re-import env.ts so the auto-init
 * picks up whatever is currently in `process.env`.
 */
async function freshEnv(): Promise<typeof import("../env")> {
  vi.resetModules();
  return import("../env");
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("validateEnv", () => {
  beforeEach(() => {
    clearEnv();
    // Silence console output during tests
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    clearEnv();
    vi.restoreAllMocks();
  });

  it("returns valid = true when all required env vars are set", async () => {
    setAll();
    const { validateEnv } = await freshEnv();
    const result: EnvValidationResult = validateEnv();
    expect(result.valid).toBe(true);
    expect(result.missing).toEqual([]);
  });

  it("returns valid = false with a list of missing vars", async () => {
    // No env vars set at all
    const { validateEnv } = await freshEnv();
    const result: EnvValidationResult = validateEnv();
    expect(result.valid).toBe(false);
    expect(result.missing.length).toBeGreaterThan(0);
    expect(result.missing).toContain("NEXT_PUBLIC_SUPABASE_URL");
    expect(result.missing).toContain("GEMINI_API_KEY");
  });

  it("treats empty strings as missing", async () => {
    ENV.NEXT_PUBLIC_SUPABASE_URL = "";
    ENV.GEMINI_API_KEY = "set";
    const { validateEnv } = await freshEnv();
    const result: EnvValidationResult = validateEnv();
    expect(result.valid).toBe(false);
    expect(result.missing).toContain("NEXT_PUBLIC_SUPABASE_URL");
  });

  it("treats whitespace-only strings as missing", async () => {
    ENV.NEXT_PUBLIC_SUPABASE_URL = "   ";
    ENV.GEMINI_API_KEY = "set";
    const { validateEnv } = await freshEnv();
    const result: EnvValidationResult = validateEnv();
    expect(result.valid).toBe(false);
    expect(result.missing).toContain("NEXT_PUBLIC_SUPABASE_URL");
  });

  it("accepts NEXT_PUBLIC_GOOGLE_PLACES_API_KEY as alternative", async () => {
    // Set all except GOOGLE_PLACES_API_KEY — use NEXT_PUBLIC_ variant instead
    setAll();
    delete ENV.GOOGLE_PLACES_API_KEY;
    ENV.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY = "public-google-key";

    const { validateEnv } = await freshEnv();
    const result: EnvValidationResult = validateEnv();
    expect(result.valid).toBe(true);
    expect(result.missing).toEqual([]);
  });

  it("caches the result so repeated calls return the same value", async () => {
    setAll();
    const { validateEnv } = await freshEnv();
    const first = validateEnv();
    const second = validateEnv();
    expect(first).toEqual(second);
  });

  it("uses console.warn in development", async () => {
    ENV.NODE_ENV = "development";
    const warnSpy = vi.spyOn(console, "warn");

    const { validateEnv } = await freshEnv();
    validateEnv();

    expect(warnSpy).toHaveBeenCalled();
    // No console.error should fire in dev
    expect(console.error).not.toHaveBeenCalled();
  });

  it("uses console.error in production", async () => {
    ENV.NODE_ENV = "production";
    const errorSpy = vi.spyOn(console, "error");

    const { validateEnv } = await freshEnv();
    validateEnv();

    expect(errorSpy).toHaveBeenCalled();
  });
});
