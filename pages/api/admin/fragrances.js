import { supabaseAdmin } from '../../../lib/supabase-admin';
import { resolveApiAuth } from '../../../lib/api-auth';

export default async function handler(req, res) {
  const auth = await resolveApiAuth(req, res);
  if (!auth.ok) return;
  if (!auth.permissions.is_admin && !auth.permissions.can_manage_reviews) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // GET — list all fragrances ordered by status then name
  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('fragrances')
      .select('id, name, slug, house, category, concentration, status, created_at, submitted_by, profiles:submitted_by(display_name)')
      .order('status')
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  // PATCH — approve or reject a fragrance
  if (req.method === 'PATCH') {
    const { id, status } = req.body;
    if (!id || !status) return res.status(400).json({ error: 'id and status required' });
    if (!['approved', 'pending'].includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const { data, error } = await supabaseAdmin
      .from('fragrances')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  // DELETE — remove a fragrance
  if (req.method === 'DELETE') {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id required' });

    const { error } = await supabaseAdmin.from('fragrances').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
