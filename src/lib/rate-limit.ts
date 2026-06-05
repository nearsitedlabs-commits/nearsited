import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest } from "next/server";

// Create a new ratelimiter that allows 10 requests per 10 seconds per IP
export const rateLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
  analytics: true,
  prefix: "@upstash/ratelimit",
});

// Higher limit for authenticated users
export const authRateLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(30, "10 s"),
  analytics: true,
  prefix: "@upstash/ratelimit/auth",
});

// Strict limit for expensive operations (discover, analyze-design, audit, pitch)
export const expensiveOpLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "60 s"),
  analytics: true,
  prefix: "@upstash/ratelimit/expensive",
});

// Helper to get identifier from request (prefers user ID, falls back to IP)
export function getRateLimitIdentifier(request: NextRequest, userId?: string): string {
  if (userId) return userId;
  return request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "anonymous";
}

// Helper to apply rate limiting and return response if blocked
export async function checkRateLimit(
  request: NextRequest,
  limiter: Ratelimit,
  identifier: string,
): Promise<Response | null> {
  const { success, limit, remaining, reset } = await limiter.limit(identifier);

  if (!success) {
    return new Response(
      JSON.stringify({
        error: "Too many requests. Please slow down.",
        code: "RATE_LIMIT",
        retryAfter: Math.ceil((reset - Date.now()) / 1000),
        limit,
        remaining,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": reset.toString(),
          "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
        },
      },
    );
  }

  return null;
}
