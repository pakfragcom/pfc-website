import crypto from "crypto";

const COOKIE_NAME = "pfc_admin_session";
const COOKIE_MAX_AGE = 60 * 60 * 8; // 8 hours

function signToken(password) {
  return crypto
    .createHmac("sha256", password)
    .update("pfc-admin-session")
    .digest("hex");
}

export function setAdminCookie(res, password) {
  const token = signToken(password);
  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${COOKIE_MAX_AGE}`
  );
}

export function clearAdminCookie(res) {
  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`
  );
}

export function isAdminAuthenticated(req) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return false;
  const expected = signToken(password);
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}
