import { supabaseAdmin } from '../../../lib/supabase-admin';
import { resolveApiAuth } from '../../../lib/api-auth';

const STATUSES = ['open', 'contacted', 'fulfilled', 'expired', 'cancelled'];

export default async function handler(req, res) {
  const auth = await resolveApiAuth(req, res);
  if (!auth.ok) return;

  if (req.method === 'GET') {
    const { status } = req.query;
    let query = supabaseAdmin
      .from('iso_requests')
      .select('id, fragrance_name, fragrance_id, type, fill_level, decant_amount, notes, requester_name, whatsapp, status, admin_notes, fulfilled_seller_id, created_at, expires_at, fulfilled_at, sellers(name, code)')
      .order('created_at', { ascending: false })
      .limit(200);
    if (status && status !== 'all') query = query.eq('status', status);

    const [{ data, error }, ...countResults] = await Promise.all([
      query,
      ...STATUSES.map(s => supabaseAdmin.from('iso_requests').select('id', { count: 'exact', head: true }).eq('status', s)),
    ]);
    if (error) return res.status(500).json({ error: error.message });

    const counts = {};
    STATUSES.forEach((s, i) => { counts[s] = countResults[i].count ?? 0; });
    counts.all = STATUSES.reduce((sum, s) => sum + counts[s], 0);

    return res.status(200).json({ requests: data, counts });
  }

  if (req.method === 'PATCH') {
    const { id, status, admin_notes, fulfilled_seller_id } = req.body || {};
    if (!id) return res.status(400).json({ error: 'id required' });

    const updates = {};
    if (admin_notes !== undefined) updates.admin_notes = admin_notes;

    if (fulfilled_seller_id !== undefined) {
      updates.fulfilled_seller_id = fulfilled_seller_id || null;
      if (fulfilled_seller_id) {
        updates.status = 'fulfilled';
        updates.fulfilled_at = new Date().toISOString();
      }
    } else if (status) {
      if (!STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' });
      updates.status = status;
      if (status === 'fulfilled') updates.fulfilled_at = new Date().toISOString();
    }

    const { error } = await supabaseAdmin.from('iso_requests').update(updates).eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
