import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Validate required environment variables once at server startup.
// The function caches its result internally so this is safe to call
// here (it runs once on first module import, not on every request).
import { validateEnv } from "@/lib/env";
validateEnv();

// Only run middleware on pages that need auth — skip API routes (they do their own auth),
// static assets, Next.js internals, and public files to reduce server load.
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Only match dashboard pages and auth pages — NOT:
     * - _next/static, _next/image (Next.js internals)
     * - /api/* (API routes handle auth themselves)
     * - /share/* (public share pages)
     * - Static files: favicon.ico, *.svg, *.png, *.jpg, *.webp, *.ico
     * - / (landing page is public)
     */
    "/dashboard/:path*",
    "/admin/:path*",
    "/(auth)/:path*",
  ],
};
