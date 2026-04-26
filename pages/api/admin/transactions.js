import { resolveApiAuth } from '../../../lib/api-auth';
import { supabaseAdmin } from '../../../lib/supabase-admin';

export default async function handler(req, res) {
  const auth = await resolveApiAuth(req, res);
  if (!auth.ok) return;
  if (!auth.permissions.can_manage_sellers && !auth.permissions.is_admin) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (req.method === 'GET') {
    const page   = Math.max(0, Number(req.query.page || 0));
    const limit  = 50;
    const offset = page * limit;
    const flaggedOnly = req.query.flagged === '1';

    let q = supabaseAdmin
      .from('transactions')
      .select(`
        id, fragrance_name, house, price_pkr, condition, city, outcome,
        dispute_status, flagged, notes, created_at,
        sellers!inner(id, name, code),
        profiles!buyer_id(id, display_name, username)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (flaggedOnly) q = q.eq('flagged', true);

    const { data, count, error } = await q;
    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json({ transactions: data, total: count, page, limit });
  }

  if (req.method === 'PATCH') {
    const { id, dispute_status, flagged } = req.body || {};
    if (!id) return res.status(400).json({ error: 'Transaction ID required.' });

    const updates = {};
    if (dispute_status !== undefined) updates.dispute_status = dispute_status;
    if (flagged !== undefined)        updates.flagged = Boolean(flagged);

    const { error } = await supabaseAdmin
      .from('transactions')
      .update(updates)
      .eq('id', id);

    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
