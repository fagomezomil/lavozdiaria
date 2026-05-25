/** In-memory rate limiter with configurable windows per category.
 *  Uses sliding window counters per IP. Resets stale entries periodically. */

interface RateBucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RateBucket>();

// 10 requests per minute for auth endpoints (strict)
const AUTH_LIMIT = { max: 10, windowMs: 60_000 };
// 30 requests per minute for comments (medium)
const COMMENT_LIMIT = { max: 30, windowMs: 60_000 };

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