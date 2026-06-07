import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { FREE_AUDIT_LIMIT } from "@/lib/dodo";

const DEFAULT_REDIRECT = "/dashboard";

/**
 * Known safe path prefixes for redirect targets.
 * All redirects must start with one of these prefixes.
 */
const SAFE_REDIRECT_PREFIXES = [
  "/dashboard",
  "/admin",
  "/login",
  "/signup",
  "/pricing",
  "/privacy",
  "/terms",
  "/share/",
  "/reset-password",
];

/**
 * Validates that a redirect destination is safe:
 * 1. Must be a relative URL starting with "/" and match a known safe prefix
 * 2. Must not contain a protocol (://) or protocol-relative prefix (//)
 * 3. Must not contain encoded variations of protocol patterns (e.g., %3A%2F%2F)
 * 4. Must not be a path traversal attempt (e.g., /../../evil.com)
 *
 * Returns the validated path, or falls back to DEFAULT_REDIRECT (/dashboard).
 */
function safeRedirect(destination: string | null): string {
  if (!destination) return DEFAULT_REDIRECT;

  // Decode URL-encoded characters to catch encoded attacks
  const decoded = decodeURIComponent(destination);

  // Block absolute URLs with any protocol scheme
  if (decoded.includes("://")) return DEFAULT_REDIRECT;

  // Block protocol-relative URLs and UNC paths
  if (decoded.startsWith("//")) return DEFAULT_REDIRECT;
  if (decoded.startsWith("\\\\")) return DEFAULT_REDIRECT;

  // Block path traversal that could escape to external URLs
  if (decoded.includes("..")) return DEFAULT_REDIRECT;

  // Block URLs with @ symbol (could be used to hide hostname via userinfo)
  if (decoded.includes("@")) return DEFAULT_REDIRECT;

  // Must be a relative URL starting with "/"
  if (!decoded.startsWith("/")) return DEFAULT_REDIRECT;

  // Validate against the allowlist of known safe path prefixes
  const isSafe = SAFE_REDIRECT_PREFIXES.some((prefix) => decoded.startsWith(prefix));
  if (!isSafe) return DEFAULT_REDIRECT;

  return decoded;
}

async function ensureSubscription(userId: string) {
  const admin = createAdminClient();
  const now = new Date();
  const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any).from("subscriptions").upsert(
    { user_id: userId, tier: "free", audits_limit: FREE_AUDIT_LIMIT, audits_used: 0, credits_reset_at: nextReset },
    { onConflict: "user_id", ignoreDuplicates: true }
  );
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = safeRedirect(searchParams.get("next"));

  const supabase = await createClient();

  // Handle email confirmation links (token_hash + type)
  if (tokenHash && type) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as "email" | "signup" | "recovery" | "invite" | "magiclink",
    });

    if (!error) {
      if (data.user) await ensureSubscription(data.user.id);
      return NextResponse.redirect(new URL(next, origin).toString());
    }

    return NextResponse.redirect(new URL("/login?error=confirmation_failed", origin).toString());
  }

  // Handle OAuth callback (code)
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      if (data.user) await ensureSubscription(data.user.id);
      return NextResponse.redirect(new URL(next, origin).toString());
    }

    return NextResponse.redirect(new URL("/login?error=auth_failed", origin).toString());
  }

  // No recognized params — redirect to login
  return NextResponse.redirect(new URL("/login", origin).toString());
}
