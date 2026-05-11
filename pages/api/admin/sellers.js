import { supabaseAdmin } from "../../../lib/supabase-admin";
import { resolveApiAuth } from "../../../lib/api-auth";

export default async function handler(req, res) {
  const auth = await resolveApiAuth(req, res);
  if (!auth.ok) return;
  if (!auth.permissions.can_manage_sellers) return res.status(403).json({ error: 'Forbidden' });

  // GET — list all sellers with tier + trust score
  if (req.method === "GET") {
    const { data, error } = await supabaseAdmin
      .from("sellers")
      .select("id, name, code, seller_type, status, verification_tier, trust_score, slug, subscription_expires_at, contact_whatsapp, city, added_at, user_id")
      .order("name");

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  // POST — add new seller
  if (req.method === "POST") {
    const { name, code, seller_type, contact_whatsapp, city, verification_tier } = req.body;
    if (!name || !code || !seller_type) {
      return res.status(400).json({ error: "name, code, and seller_type are required" });
    }

    const { data, error } = await supabaseAdmin
      .from("sellers")
      .insert({
        name, code, seller_type,
        status: "active",
        contact_whatsapp,
        city,
        verification_tier: Number(verification_tier ?? 0),
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    try { await res.revalidate("/tools/verify-seller"); } catch (_) {}

    return res.status(201).json(data);
  }

  // PATCH — update seller (status, tier, trust_score, etc.)
  if (req.method === "PATCH") {
    const { id, recalculate_trust, ...updates } = req.body;
    if (!id) return res.status(400).json({ error: "id is required" });

    // Optionally recalculate trust score from the view before saving
    if (recalculate_trust) {
      const { data: scoreRow } = await supabaseAdmin
        .from("seller_trust_scores")
        .select("trust_score")
        .eq("seller_id", id)
        .maybeSingle();
      if (scoreRow) updates.trust_score = scoreRow.trust_score;
    }

    // Ensure verification_tier is a number if provided
    if (updates.verification_tier !== undefined) {
      updates.verification_tier = Number(updates.verification_tier);
    }

    const { data, error } = await supabaseAdmin
      .from("sellers")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    try { await res.revalidate("/tools/verify-seller"); } catch (_) {}

    return res.status(200).json(data);
  }

  // DELETE — remove a seller
  if (req.method === "DELETE") {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: "id is required" });

    const { error } = await supabaseAdmin.from("sellers").delete().eq("id", id);
    if (error) return res.status(500).json({ error: error.message });

    try { await res.revalidate("/tools/verify-seller"); } catch (_) {}

    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
