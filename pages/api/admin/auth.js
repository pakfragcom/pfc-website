import { setAdminCookie, clearAdminCookie } from "../../../lib/admin-auth";

export default function handler(req, res) {
  if (req.method === "POST") {
    const { password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      return res.status(500).json({ error: "Admin password not configured" });
    }

    if (password !== adminPassword) {
      return res.status(401).json({ error: "Invalid password" });
    }

    setAdminCookie(res, adminPassword);
    return res.status(200).json({ ok: true });
  }

  if (req.method === "DELETE") {
    clearAdminCookie(res);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
