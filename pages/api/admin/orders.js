import { supabaseAdmin } from '../../../lib/supabase-admin';
import { resolveApiAuth } from '../../../lib/api-auth';

export default async function handler(req, res) {
  const auth = await resolveApiAuth(req, res);
  if (!auth.ok) return;

  if (req.method === 'GET') {
    const { status } = req.query;
    let query = supabaseAdmin
      .from('order_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (status && status !== 'all') query = query.eq('status', status);

    const STATUSES = ['pending', 'contacted', 'fulfilled', 'cancelled'];
    const [{ data, error }, ...countResults] = await Promise.all([
      query,
      ...STATUSES.map(s => supabaseAdmin.from('order_requests').select('id', { count: 'exact', head: true }).eq('status', s)),
    ]);
    if (error) return res.status(500).json({ error: error.message });

    const counts = {};
    STATUSES.forEach((s, i) => { counts[s] = countResults[i].count ?? 0; });
    counts.all = STATUSES.reduce((sum, s) => sum + counts[s], 0);

    return res.status(200).json({ orders: data, counts });
  }

  if (req.method === 'PATCH') {
    const { id, status, admin_notes } = req.body || {};
    if (!id) return res.status(400).json({ error: 'id required' });
    const updates = {};
    if (status) updates.status = status;
    if (admin_notes !== undefined) updates.admin_notes = admin_notes;
    const { error } = await supabaseAdmin.from('order_requests').update(updates).eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
