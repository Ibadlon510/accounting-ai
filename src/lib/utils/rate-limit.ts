/**
 * Lightweight in-memory rate limiter.
 * Suitable for single-instance deployments (Render).
 * Uses a Map keyed by an arbitrary string (e.g. IP + route).
 */
const store = new Map<string, { count: number; resetAt: number }>();

/**
 * Returns true if the request is allowed, false if rate-limited.
 * @param key     - unique key, e.g. `"register:1.2.3.4"`
 * @param limit   - max requests in the window
 * @param windowMs - window size in milliseconds
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) return false;

  entry.count += 1;
  return true;
}

/** Pull the real client IP from common proxy headers, falling back to a default. */
export function getClientIp(request: Request): string {
  const headers = request.headers;
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("x-real-ip") ??
    "unknown"
  );
}
