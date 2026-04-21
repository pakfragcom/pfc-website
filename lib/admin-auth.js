import crypto from "crypto";

const COOKIE_NAME = "pfc_admin_session";
const COOKIE_MAX_AGE = 60 * 60 * 8; // 8 hours

// SHA-256 of the admin password — safe to store; not reversible
const PASS_HASH = "e4316a671221336ea479acbfefc078ebb162bf91edbff0e12dfd9622c0c41f8e";

// Session token is HMAC of the pass hash — adds a second layer
const SESSION_TOKEN = crypto
  .createHmac("sha256", PASS_HASH)
  .update("pfc-admin-v1")
  .digest("hex");

export function verifyPassword(submitted) {
  const hash = crypto.createHash("sha256").update(submitted).digest("hex");
  const a = Buffer.from(hash);
  const b = Buffer.from(PASS_HASH);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function setAdminCookie(res) {
  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=${SESSION_TOKEN}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${COOKIE_MAX_AGE}`
  );
}

export function clearAdminCookie(res) {
  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`
  );
}

export function isAdminAuthenticated(req) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(SESSION_TOKEN);
  // timingSafeEqual throws if lengths differ — return false instead
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
