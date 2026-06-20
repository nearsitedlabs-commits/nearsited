import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Validate required environment variables once at server startup.
// The function caches its result internally so this is safe to call
// here (it runs once on first module import, not on every request).
import { validateEnv } from "@/lib/env";
validateEnv();

/**
 * Build the list of allowed origins for CSRF validation.
 *
 * Priority order:
 * 1. `NEXT_PUBLIC_SITE_URL` — configured production URL
 * 2. `CSRF_ALLOWED_ORIGINS` — comma-separated list of additional origins
 * 3. Dev fallback: `http://localhost:3000`
 *
 * The returned array is cached after first call so the split/trim
 * overhead is paid only once per server process.
 */
let _allowedOrigins: string[] | null = null;

function getAllowedOrigins(): string[] {
  if (_allowedOrigins) return _allowedOrigins;

  const origins: string[] = [];

  // Primary site URL — use server-only SITE_URL (runtime) not NEXT_PUBLIC_SITE_URL (build-time inline)
  const siteUrl = process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL;
  if (siteUrl) {
    // Strip trailing slash so `startsWith` matching works consistently
    origins.push(siteUrl.replace(/\/+$/, ""));
  }

  // Additional allowed origins (comma-separated)
  const extra = process.env.CSRF_ALLOWED_ORIGINS;
  if (extra) {
    for (const origin of extra.split(",")) {
      const trimmed = origin.trim();
      if (trimmed) {
        origins.push(trimmed.replace(/\/+$/, ""));
      }
    }
  }

  // Fallback for local development
  if (origins.length === 0) {
    origins.push("http://localhost:3000");
  }

  _allowedOrigins = origins;
  return origins;
}

/**
 * Validate the Origin or Referer header against the allowed origins list.
 *
 * Returns `true` if the request is from a trusted origin, `false` otherwise.
 * Requests without an Origin or Referer header are blocked for state-changing
 * methods (defense-in-depth — browsers always send one of these headers on
 * cross-origin POST/PATCH/DELETE requests).
 */
function isTrustedOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const host = request.headers.get("host");

  // Same-origin check: if Origin matches the request's own Host, always trust it.
  // This works regardless of env var configuration.
  if (origin && host) {
    try {
      if (new URL(origin).host === host) return true;
    } catch {
      // Malformed origin — fall through to allowlist check
    }
  }

  const allowedOrigins = getAllowedOrigins();

  // Check Origin header against configured allowlist
  if (origin) {
    if (allowedOrigins.some((allowed) => origin.startsWith(allowed))) {
      return true;
    }
  }

  // Fall back to Referer header
  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      if (allowedOrigins.some((allowed) => refererOrigin.startsWith(allowed))) {
        return true;
      }
    } catch {
      // Malformed URL — treat as untrusted
    }
  }

  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Content-Security-Policy is set in next.config.ts's headers() — it applies
  // to every response (including ones middleware never touches, like static
  // assets), so it must not be duplicated here with a different policy.

  // ── CSRF protection for API routes ────────────────────────────────────
  // State-changing methods (POST, PATCH, PUT, DELETE) on /api/* must come
  // from a trusted origin. This prevents cross-site request forgery where
  // an external site could forge requests using the user's Supabase session
  // cookie (which is automatically sent cross-origin).
  if (pathname.startsWith("/api/")) {
    const method = request.method;

    // Only protect state-changing methods
    if (["POST", "PATCH", "PUT", "DELETE"].includes(method)) {
      // ── Webhooks are exempt ─────────────────────────────────────────
      // Webhooks (e.g., Dodo Payments) send POST requests from external
      // services that don't originate from the app's own origin. They are
      // authenticated via their own signature verification (e.g., Dodo's
      // webhook secret), not by CSRF origin checking.
      if (pathname.startsWith("/api/webhooks/")) {
        return NextResponse.next();
      }

      // Skip CSRF in development — requests from other devices on the local
      // network have a different origin (e.g. 192.168.x.x) that won't match.
      if (process.env.NODE_ENV === "development") {
        return NextResponse.next();
      }

      // Validate origin
      if (!isTrustedOrigin(request)) {
        console.warn(
          `[CSRF] Blocked ${method} ${pathname} — ` +
            `origin=${request.headers.get("origin") ?? "(none)"} ` +
            `referer=${request.headers.get("referer") ?? "(none)"} ` +
            `allowed=${JSON.stringify(getAllowedOrigins())}`,
        );
        return new NextResponse(JSON.stringify({ error: "CSRF validation failed" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // API routes handle their own auth — don't run updateSession
    return NextResponse.next();
  }

  // Non-API routes: Supabase session management
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match dashboard pages, admin pages, auth pages, AND API routes:
     * - /dashboard/*, /admin/*, /(auth)/* — Supabase session management
     * - /api/* — CSRF protection (API routes handle their own auth)
     *
     * NOT matched:
     * - _next/static, _next/image (Next.js internals)
     * - /share/* (public share pages)
     * - Static files: favicon.ico, *.svg, *.png, *.jpg, *.webp, *.ico
     * - / (landing page is public)
     */
    "/dashboard/:path*",
    "/admin/:path*",
    "/(auth)/:path*",
    "/api/:path*",
  ],
};
