import {
  verifyPassword,
  setAdminCookie,
  clearAdminCookie,
  isRateLimited,
  recordFailedAttempt,
  clearAttempts,
} from "../../../lib/admin-auth";

function getClientIp(req) {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.length) return fwd.split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
}

export default function handler(req, res) {
  if (req.method === "POST") {
    const ip = getClientIp(req);

    if (isRateLimited(ip)) {
      return res.status(429).json({ error: "Too many attempts. Try again later." });
    }

    const { password } = req.body;

    if (!verifyPassword(password || "")) {
      recordFailedAttempt(ip);
      return res.status(401).json({ error: "Invalid password" });
    }

    clearAttempts(ip);
    setAdminCookie(res);
    return res.status(200).json({ ok: true });
  }

  if (req.method === "DELETE") {
    clearAdminCookie(res);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
