// Limits for /api/transactions/submit. These are enforced from counts in
// the database so they hold across every serverless instance — the
// in-memory limiter in rate-limit.js resets per instance, which is how a
// script posted ~650 fake "scam" reports in one evening (Aug 2026).

export const SELLER_REPEAT_WINDOW_DAYS = 30;
// 3rd report against the same seller in the window is kept but flagged
// for admin review; the 4th and beyond are rejected outright.
export const SELLER_REPEAT_FLAG_AT = 2;
export const SELLER_REPEAT_REJECT_AT = 3;
// Hard ceiling on transactions one account can log in a rolling 24h.
export const DAILY_CAP = 10;

export function evaluateSellerRepeat(priorCountInWindow) {
  const n = Number(priorCountInWindow) || 0;
  if (n >= SELLER_REPEAT_REJECT_AT) return { allowed: false, flagged: true };
  return { allowed: true, flagged: n >= SELLER_REPEAT_FLAG_AT };
}

export function exceedsDailyCap(priorCountToday) {
  return (Number(priorCountToday) || 0) >= DAILY_CAP;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isUuid(value) {
  return typeof value === 'string' && UUID_RE.test(value);
}

// Defense in depth for free-text fields: the site already escapes on
// render, but stored markup should never reach the database at all.
export function stripHtml(value) {
  if (typeof value !== 'string') return value;
  return value.replace(/<[^>]*>/g, '').trim();
}
