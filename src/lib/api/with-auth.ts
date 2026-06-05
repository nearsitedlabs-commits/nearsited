/**
 * Shared authentication and authorization wrapper for API routes.
 *
 * Provides a uniform auth pattern so every API route doesn't repeat
 * the same `createClient()` → `auth.getUser()` → `401` check.
 *
 * Usage:
 *   import { withAuth } from "@/lib/api/with-auth";
 *
 *   export const POST = withAuth(async (request, { user, supabase }) => {
 *     // user is guaranteed to be non-null here
 *     // supabase is an authenticated server client
 *   });
 *
 * Security note:
 *   This does NOT replace the middleware — it adds a defense-in-depth layer
 *   for API routes that the middleware intentionally skips (see middleware.ts).
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  rateLimiter,
  checkRateLimit,
  getRateLimitIdentifier,
} from "@/lib/rate-limit";
import type { User } from "@supabase/supabase-js";

// ── Types ──────────────────────────────────────────────────────────────────────

export type AuthHandler = (context: {
  request: NextRequest;
  user: User;
  supabase: Awaited<ReturnType<typeof createClient>>;
}) => Promise<NextResponse>;

export type AuthOptions = {
  /** Whether to require authentication (default: true) */
  requireAuth?: boolean;
  /** Rate limiter to use (default: standard rateLimiter) */
  limiter?: typeof rateLimiter;
};

// ── Wrapper ────────────────────────────────────────────────────────────────────

export function withAuth(
  handler: AuthHandler,
  options: AuthOptions = {},
) {
  return async (request: NextRequest) => {
    const { requireAuth = true, limiter = rateLimiter } = options;

    try {
      const supabase = await createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        if (requireAuth) {
          console.log("[AUTH] Unauthorized access attempt:", {
            path: request.nextUrl.pathname,
            error: authError?.message,
          });
          return NextResponse.json(
            { error: "Unauthorized — please sign in" },
            { status: 401 },
          );
        }
        // For optional auth, proceed without user
        return handler({
          request,
          user: null as unknown as User,
          supabase,
        });
      }

      // Apply rate limiting only for authenticated routes
      const identifier = getRateLimitIdentifier(request, user.id);
      const blocked = await checkRateLimit(request, limiter, identifier);
      if (blocked) return blocked;

      return handler({ request, user, supabase });
    } catch (error) {
      console.error("[AUTH] Unexpected error in withAuth wrapper:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  };
}
