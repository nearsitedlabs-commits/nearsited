import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * CSRF protection via Origin / Host comparison (OWASP recommended).
 *
 * Primary check: Origin header host === request Host header (same-origin).
 * Secondary check: Origin is in CSRF_ALLOWED_ORIGINS (for future cross-origin
 *   clients e.g. a mobile app or separate frontend domain).
 *
 * Referer is intentionally not used — it can be stripped by privacy tools
 * and is unreliable as a security signal.
 *
 * Edge Runtime note: module-level state resets per request in Edge Runtime,
 * so no caching is used here. All logic is stateless.
 */
function isTrustedOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  // Primary: same-origin — Origin host matches the request Host.
  // Works on any domain without configuration.
  const host = request.headers.get("host");
  if (host) {
    try {
      if (new URL(origin).host === host) return true;
    } catch {
      // Malformed origin — fall through
    }
  }

  // Secondary: explicit allowlist for cross-origin clients (e.g. mobile app).
  // Set CSRF_ALLOWED_ORIGINS=https://app.example.com,https://other.example.com
  const extra = process.env.CSRF_ALLOWED_ORIGINS;
  if (extra) {
    const allowed = extra.split(",").map((s) => s.trim().replace(/\/+$/, ""));
    if (allowed.some((a) => origin.startsWith(a))) return true;
  }

  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── CSRF protection for state-changing API calls ───────────────────────────
  if (pathname.startsWith("/api/")) {
    const method = request.method;

    if (["POST", "PATCH", "PUT", "DELETE"].includes(method)) {
      // Webhooks are exempt — authenticated via their own signature (e.g. Dodo secret).
      if (pathname.startsWith("/api/webhooks/")) {
        return NextResponse.next();
      }

      // Skip in development — cross-device testing from another network IP
      // would fail the same-origin check even though it's the same developer.
      if (process.env.NODE_ENV === "development") {
        return NextResponse.next();
      }

      if (!isTrustedOrigin(request)) {
        console.warn(
          `[CSRF] Blocked ${method} ${pathname} — ` +
            `origin=${request.headers.get("origin") ?? "(none)"} ` +
            `host=${request.headers.get("host") ?? "(none)"}`,
        );
        return new NextResponse(JSON.stringify({ error: "CSRF validation failed" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // API routes handle their own auth — don't run updateSession.
    return NextResponse.next();
  }

  // Non-API routes: refresh Supabase session cookie.
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/(auth)/:path*",
    "/api/:path*",
  ],
};
