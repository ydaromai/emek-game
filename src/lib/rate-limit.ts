/**
 * WARNING: Serverless Limitation
 * This in-memory rate limiter does NOT work on Vercel serverless/Edge runtime.
 * Each Lambda invocation has isolated memory — the Map resets on every cold start.
 * For production use, migrate to Upstash Redis (@upstash/ratelimit).
 * TODO: Replace with Upstash Redis rate limiter before production launch.
 */

const rateStore = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateStore.get(key);

  if (!entry || now > entry.resetAt) {
    rateStore.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count++;
  return true;
}
