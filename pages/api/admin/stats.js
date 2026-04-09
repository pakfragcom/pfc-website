import { supabaseAdmin } from "../../../lib/supabase-admin";
import { isAdminAuthenticated } from "../../../lib/admin-auth";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();
  if (!isAdminAuthenticated(req)) return res.status(401).json({ error: "Unauthorized" });

  const now = new Date();
  const in14Days = new Date(now);
  in14Days.setDate(in14Days.getDate() + 14);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [sellersRes, revenueRes] = await Promise.all([
    supabaseAdmin
      .from("sellers")
      .select("id, status, subscription_expires_at"),
    supabaseAdmin
      .from("subscriptions")
      .select("amount_pkr, paid_at")
      .gte("paid_at", startOfMonth.toISOString()),
  ]);

  if (sellersRes.error) return res.status(500).json({ error: sellersRes.error.message });
  if (revenueRes.error) return res.status(500).json({ error: revenueRes.error.message });

  const sellers = sellersRes.data || [];
  const payments = revenueRes.data || [];

  const active = sellers.filter((s) => s.status === "active").length;
  const grace = sellers.filter((s) => s.status === "grace").length;
  const expired = sellers.filter((s) => s.status === "expired").length;
  const pending = sellers.filter((s) => s.status === "pending").length;
  const expiringSoon = sellers.filter((s) => {
    if (s.status !== "active" || !s.subscription_expires_at) return false;
    const exp = new Date(s.subscription_expires_at);
    return exp <= in14Days && exp >= now;
  }).length;

  const revenueThisMonth = payments.reduce((sum, p) => sum + (p.amount_pkr || 0), 0);

  return res.status(200).json({
    active,
    grace,
    expired,
    pending,
    expiringsoon: expiringSoon,
    revenue_this_month: revenueThisMonth,
  });
}
