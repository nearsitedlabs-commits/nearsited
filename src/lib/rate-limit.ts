import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest } from "next/server";

// ── No-op fallback for when Redis is unreachable ─────────────────────────────
// Instead of crashing, rate limiting degrades gracefully (allows all requests).
const FALLBACK_LIMIT = { success: true, limit: Infinity, remaining: Infinity, reset: 0 };

// ── Redis client with error resilience ───────────────────────────────────────
let redisClient: Redis | null = null;
try {
  redisClient = Redis.fromEnv();
} catch (e) {
  console.warn("⚠️  Failed to create Redis client — rate limiting will be a no-op fallback", e);
}

// ── Rate limiter factory with fallback ───────────────────────────────────────
function createLimiter(limit: number, window: string, prefix: string) {
  if (!redisClient) {
    // Return a mock limiter that always succeeds when Redis is unavailable
    return {
      limit: async (_id: string) => FALLBACK_LIMIT,
    } as unknown as Ratelimit;
  }
  return new Ratelimit({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(limit, window as `${number} s`),
    analytics: true,
    prefix,
  });
}

// Create a new ratelimiter that allows 10 requests per 10 seconds per IP
export const rateLimiter = createLimiter(10, "10 s", "@upstash/ratelimit");

// Higher limit for authenticated users
export const authRateLimiter = createLimiter(30, "10 s", "@upstash/ratelimit/auth");

// Strict limit for expensive operations (discover, analyze-design, audit, pitch)
export const expensiveOpLimiter = createLimiter(5, "60 s", "@upstash/ratelimit/expensive");

// Per-token rate limiter for shared report links (60 req/min per token)
export const shareTokenLimiter = createLimiter(60, "60 s", "@upstash/ratelimit/share");

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
  try {
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
  } catch (err) {
    // If rate limiting throws (e.g. Redis timeout), fail open — allow the request
    console.warn("⚠️  Rate limiter threw — allowing request through as fallback:", err);
  }

  return null;
}
