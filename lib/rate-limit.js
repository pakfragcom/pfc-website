// In-memory rate limiter — resets on cold start / per instance, so it isn't a
// substitute for a distributed limiter (Upstash) under real load, but it stops
// a single script from flooding a write endpoint from one connection.
const buckets = new Map(); // key -> { count, windowStart }

export function getClientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length) return fwd.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

export function isRateLimited(key, { windowMs = 60_000, max = 5 } = {}) {
  const now = Date.now();

  // Opportunistic cleanup so the map doesn't grow unbounded
  if (buckets.size > 5000) {
    for (const [k, rec] of buckets) {
      if (now - rec.windowStart > windowMs) buckets.delete(k);
    }
  }

  const rec = buckets.get(key);
  if (!rec || now - rec.windowStart > windowMs) {
    buckets.set(key, { count: 1, windowStart: now });
    return false;
  }
  rec.count += 1;
  return rec.count > max;
}
