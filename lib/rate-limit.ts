import type { NextRequest } from "next/server";

interface RateLimitOptions {
  limit: number;
  windowSeconds: number;
}

interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

/**
 * In-memory fallback rate limiter. No Upstash Redis credentials were
 * configured for this project at the time this was written, so this is a
 * best-effort temporary measure only.
 *
 * Important limitation: this state lives in the Node process's memory.
 * On Vercel, each serverless function instance has its own memory, and
 * instances are spun up/down and distributed across regions — an attacker
 * hitting the endpoint repeatedly may land on a fresh instance each time
 * and never actually get throttled. This slows down casual/naive abuse
 * from a single warm instance but is NOT a reliable defense in production.
 * Replace with Upstash Redis (via @upstash/ratelimit) for real protection.
 */
const hits = new Map<string, number[]>();

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

function pruneIfLarge() {
  if (hits.size <= 5000) return;
  const now = Date.now();
  for (const [key, timestamps] of hits) {
    if (timestamps.length === 0 || now - timestamps[timestamps.length - 1] > 24 * 60 * 60 * 1000) {
      hits.delete(key);
    }
  }
}

export function checkRateLimit(
  request: NextRequest,
  bucket: string,
  options: RateLimitOptions
): RateLimitResult {
  const ip = getClientIp(request);
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const windowMs = options.windowSeconds * 1000;

  const timestamps = (hits.get(key) ?? []).filter((t) => now - t < windowMs);

  if (timestamps.length >= options.limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((windowMs - (now - timestamps[0])) / 1000));
    hits.set(key, timestamps);
    return { allowed: false, retryAfterSeconds };
  }

  timestamps.push(now);
  hits.set(key, timestamps);
  pruneIfLarge();

  return { allowed: true, retryAfterSeconds: 0 };
}
