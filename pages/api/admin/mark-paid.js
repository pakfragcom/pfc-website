import { supabaseAdmin } from "../../../lib/supabase-admin";
import { isAdminAuthenticated } from "../../../lib/admin-auth";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  if (!isAdminAuthenticated(req)) return res.status(401).json({ error: "Unauthorized" });

  const { seller_id, amount_pkr, duration_months, payment_method, payment_reference } = req.body;

  if (!seller_id || !amount_pkr || !duration_months) {
    return res.status(400).json({ error: "seller_id, amount_pkr, and duration_months are required" });
  }

  const now = new Date();
  const expires = new Date(now);
  expires.setMonth(expires.getMonth() + Number(duration_months));

  // Record the subscription payment
  const { error: subError } = await supabaseAdmin.from("subscriptions").insert({
    seller_id,
    amount_pkr,
    duration_months,
    payment_method: payment_method || "bank_transfer",
    payment_reference,
    paid_at: now.toISOString(),
    activated_at: now.toISOString(),
    expires_at: expires.toISOString(),
  });

  if (subError) return res.status(500).json({ error: subError.message });

  // Update seller status + expiry
  const { data, error: sellerError } = await supabaseAdmin
    .from("sellers")
    .update({
      status: "active",
      subscription_expires_at: expires.toISOString(),
    })
    .eq("id", seller_id)
    .select()
    .single();

  if (sellerError) return res.status(500).json({ error: sellerError.message });

  return res.status(200).json(data);
}
