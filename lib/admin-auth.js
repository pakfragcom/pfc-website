import crypto from "crypto";

const COOKIE_NAME = "pfc_admin_session";
const SESSION_MAX_AGE_MS = 60 * 60 * 8 * 1000; // 8 hours

// SHA-256 of the admin password — set ADMIN_PASS_HASH env var to override without a deploy
const PASS_HASH = process.env.ADMIN_PASS_HASH || "e4316a671221336ea479acbfefc078ebb162bf91edbff0e12dfd9622c0c41f8e";

export function verifyPassword(submitted) {
  const hash = crypto.createHash("sha256").update(submitted).digest("hex");
  const a = Buffer.from(hash);
  const b = Buffer.from(PASS_HASH);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// Token = issuedAt.HMAC(passHash, "pfc-admin-v2:" + issuedAt)
// Binding the timestamp into the signature means a stolen cookie stops working
// after SESSION_MAX_AGE_MS instead of being valid forever.
function sign(issuedAt) {
  return crypto
    .createHmac("sha256", PASS_HASH)
    .update(`pfc-admin-v2:${issuedAt}`)
    .digest("hex");
}

export function setAdminCookie(res) {
  const issuedAt = Date.now();
  const token = `${issuedAt}.${sign(issuedAt)}`;
  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${SESSION_MAX_AGE_MS / 1000}`
  );
}

export function clearAdminCookie(res) {
  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`
  );
}

export function isAdminAuthenticated(req) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return false;

  const dot = token.indexOf(".");
  if (dot === -1) return false;

  const issuedAt = Number(token.slice(0, dot));
  const sig = token.slice(dot + 1);
  if (!Number.isFinite(issuedAt)) return false;
  if (Date.now() - issuedAt > SESSION_MAX_AGE_MS) return false;

  const expected = sign(issuedAt);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// ---- Brute-force throttling (in-memory; resets on cold start / new instance) ----
// Not a substitute for a distributed limiter (Upstash) under real load, but it
// meaningfully slows a single-instance password-guessing script to uselessness.
const attempts = new Map(); // ip -> { count, blockedUntil }
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 8;

function pruneOld() {
  const now = Date.now();
  for (const [ip, rec] of attempts) {
    if (rec.blockedUntil < now && rec.firstAttempt < now - WINDOW_MS) attempts.delete(ip);
  }
}

export function isRateLimited(ip) {
  const rec = attempts.get(ip);
  if (!rec) return false;
  return Date.now() < rec.blockedUntil;
}

export function recordFailedAttempt(ip) {
  pruneOld();
  const now = Date.now();
  const rec = attempts.get(ip) || { count: 0, firstAttempt: now, blockedUntil: 0 };
  rec.count += 1;
  if (rec.count >= MAX_ATTEMPTS) {
    // Exponential backoff beyond the threshold: 1min, 2min, 4min, capped at 30min
    const overBy = rec.count - MAX_ATTEMPTS;
    const backoffMs = Math.min(60_000 * Math.pow(2, overBy), 30 * 60_000);
    rec.blockedUntil = now + backoffMs;
  }
  attempts.set(ip, rec);
}

export function clearAttempts(ip) {
  attempts.delete(ip);
}
