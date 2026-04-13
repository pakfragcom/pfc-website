import { supabaseAdmin } from '../../../lib/supabase-admin';
import { isAdminAuthenticated } from '../../../lib/admin-auth';

export default async function handler(req, res) {
  if (!isAdminAuthenticated(req)) return res.status(401).json({ error: 'Unauthorized' });

  // GET — list all reviews with author info
  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('reviews')
      .select('id, fragrance_name, house, category, rating_overall, review_text, status, reject_reason, created_at, published_at, profiles(display_name, city)')
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  // PATCH — approve or reject
  if (req.method === 'PATCH') {
    const { id, status, reject_reason } = req.body;
    if (!id || !status) return res.status(400).json({ error: 'id and status required' });

    const updates = { status, reject_reason: reject_reason || null };
    if (status === 'approved') updates.published_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('reviews')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  return res.status(405).end();
}
