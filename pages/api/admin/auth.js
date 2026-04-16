import { verifyPassword, setAdminCookie, clearAdminCookie } from "../../../lib/admin-auth";

export default function handler(req, res) {
  if (req.method === "POST") {
    const { password } = req.body;

    if (!verifyPassword(password || "")) {
      return res.status(401).json({ error: "Invalid password" });
    }

    setAdminCookie(res);
    return res.status(200).json({ ok: true });
  }

  if (req.method === "DELETE") {
    clearAdminCookie(res);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
