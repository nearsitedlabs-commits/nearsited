/**
 * Webhook Idempotency — Duplicate Event Detection
 *
 * Dodo Payments uses at-least-once delivery, meaning the same webhook event
 * can arrive multiple times. This module stores processed event IDs in Redis
 * with a TTL so duplicate deliveries are detected and silently acknowledged.
 *
 * Degrades gracefully: if Redis is unavailable, the checks become no-ops and
 * every event is processed (no false-positive duplicate detection).
 *
 * Redis key scheme: `webhook:event:<event_id>` → `"1"`
 * TTL: 24 hours (well beyond any realistic duplicate delivery window).
 */

import { Redis } from "@upstash/redis";

const IDEMPOTENCY_TTL = 86_400; // 24 hours in seconds

let redisClient: Redis | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    redisClient = Redis.fromEnv();
  } catch (e) {
    console.warn(
      "⚠️  [WEBHOOK_IDEMPOTENCY] Failed to create Redis client — idempotency will be a no-op fallback",
      e,
    );
  }
} else {
  console.log("[WEBHOOK_IDEMPOTENCY] Upstash Redis not configured — idempotency disabled");
}

/**
 * Check whether a given webhook event ID has already been processed.
 *
 * @param eventId - The unique event identifier from the Dodo webhook payload.
 * @returns `true` if the event was already processed, `false` otherwise.
 *          Returns `false` (allow) if Redis is unavailable.
 */
export async function isProcessed(eventId: string): Promise<boolean> {
  if (!redisClient) return false;

  try {
    const key = `webhook:event:${eventId}`;
    const exists = await redisClient.exists(key);
    return exists === 1;
  } catch (err) {
    console.error("[WEBHOOK_IDEMPOTENCY] Redis exists check failed — allowing through:", err);
    return false;
  }
}

/**
 * Mark a webhook event ID as processed in Redis with a 24-hour TTL.
 *
 * @param eventId - The unique event identifier to mark.
 */
export async function markProcessed(eventId: string): Promise<void> {
  if (!redisClient) return;

  try {
    const key = `webhook:event:${eventId}`;
    await redisClient.set(key, "1", { ex: IDEMPOTENCY_TTL });
  } catch (err) {
    console.error("[WEBHOOK_IDEMPOTENCY] Redis set failed — event will not be marked:", err);
  }
}
