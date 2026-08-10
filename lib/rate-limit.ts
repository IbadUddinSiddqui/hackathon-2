// lib/rate-limit.ts
// Dependency-free in-memory fixed-window rate limiter for API abuse protection
// (P2-EPIC-05). Single-instance only — a multi-instance deployment needs a
// shared store (e.g. Redis); note that in TASK_GRAPH.md.

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

const DEFAULT_LIMIT = 60;
const DEFAULT_WINDOW_MS = 60_000;

/** Best-effort client IP from proxy headers. */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

/** Fixed-window check. `key` should already include the IP. */
export function checkRateLimit(
  key: string,
  limit: number = DEFAULT_LIMIT,
  windowMs: number = DEFAULT_WINDOW_MS
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.count += 1;
  return { allowed: true, remaining: limit - bucket.count, resetAt: bucket.resetAt };
}

/**
 * Convenience guard for route handlers: returns a 429 Response when the
 * request (keyed by IP) exceeds the limit, otherwise null. Return it directly:
 * `const limited = enforceRateLimit(request, {...}); if (limited) return limited;`
 */
export function enforceRateLimit(
  request: Request,
  opts: { key: string; limit: number; windowMs: number }
): Response | null {
  const ip = getClientIp(request);
  const result = checkRateLimit(`${opts.key}:${ip}`, opts.limit, opts.windowMs);
  if (result.allowed) return null;

  const retryAfter = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
  return Response.json(
    { error: "Too many requests, please try again later" },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfter) },
    }
  );
}

// Periodically sweep expired buckets so the map can't grow unbounded.
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}, 60_000);
