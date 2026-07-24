/** In-memory rate limiter with configurable windows per category.
 *  Uses sliding window counters per IP. Resets stale entries periodically. */

interface RateBucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RateBucket>();

// 10 requests per minute for auth endpoints (strict)
const AUTH_LIMIT = { max: 10, windowMs: 60_000 };
// 30 requests per minute for comments via API (medium, per IP)
const COMMENT_LIMIT = { max: 30, windowMs: 60_000 };
// 5 comments per minute per user (server action rate limit, by user_id)
const COMMENT_USER_LIMIT = { max: 5, windowMs: 60_000 };

type LimitConfig = typeof AUTH_LIMIT;

function checkLimit(key: string, config: LimitConfig): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + config.windowMs });
    return true;
  }

  if (bucket.count >= config.max) {
    return false;
  }

  bucket.count++;
  return true;
}

// Periodically clean stale entries (every 2 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (now >= bucket.resetAt) {
      buckets.delete(key);
    }
  }
}, 120_000);

/** Check auth rate limit (10 req/min per IP) */
export function rateLimit(ip: string): boolean {
  return checkLimit(`auth:${ip}`, AUTH_LIMIT);
}

/** Check comment rate limit (30 req/min per IP) */
export function rateLimitComment(ip: string): boolean {
  return checkLimit(`comment:${ip}`, COMMENT_LIMIT);
}

/** Check comment rate limit per user (5 req/min per user_id) — for server actions */
export function rateLimitCommentByUser(userId: string): boolean {
  return checkLimit(`comment-user:${userId}`, COMMENT_USER_LIMIT);
}