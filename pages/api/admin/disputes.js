import { supabaseAdmin } from '../../../lib/supabase-admin';
import { resolveApiAuth } from '../../../lib/api-auth';

export default async function handler(req, res) {
  const auth = await resolveApiAuth(req, res);
  if (!auth.ok) return;
  if (!auth.permissions.can_manage_sellers && !auth.permissions.is_admin) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // GET — list all disputes with transaction + seller + buyer info
  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('disputes')
      .select(`
        id, category, description, evidence_urls, resolution_notes, created_at, updated_at,
        transaction_id,
        transactions (
          id, fragrance_name, price_pkr, outcome, dispute_status, city,
          sellers ( id, name, code, slug )
        ),
        profiles:opened_by ( display_name, city )
      `)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  // PATCH — update dispute: resolution_notes + optionally resolve/escalate
  if (req.method === 'PATCH') {
    const { id, resolution_notes, dispute_status, seller_tier_action } = req.body;
    if (!id) return res.status(400).json({ error: 'id is required' });

    // Update dispute record
    const disputeUpdates = { updated_at: new Date().toISOString() };
    if (resolution_notes !== undefined) disputeUpdates.resolution_notes = resolution_notes;

    const { data: dispute, error: dErr } = await supabaseAdmin
      .from('disputes')
      .update(disputeUpdates)
      .eq('id', id)
      .select('transaction_id')
      .single();

    if (dErr) return res.status(500).json({ error: dErr.message });

    // Update transaction dispute_status if provided
    if (dispute_status) {
      await supabaseAdmin
        .from('transactions')
        .update({ dispute_status })
        .eq('id', dispute.transaction_id);
    }

    // Optional seller tier downgrade
    if (seller_tier_action === 'downgrade') {
      const { data: tx } = await supabaseAdmin
        .from('transactions')
        .select('seller_id')
        .eq('id', dispute.transaction_id)
        .single();

      if (tx?.seller_id) {
        const { data: seller } = await supabaseAdmin
          .from('sellers')
          .select('verification_tier')
          .eq('id', tx.seller_id)
          .single();

        if (seller && seller.verification_tier > 0) {
          await supabaseAdmin
            .from('sellers')
            .update({ verification_tier: seller.verification_tier - 1 })
            .eq('id', tx.seller_id);
        }
      }
    }

    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
