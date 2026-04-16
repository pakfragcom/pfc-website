import { supabaseAdmin } from '../../../lib/supabase-admin';
import { isAdminAuthenticated } from '../../../lib/admin-auth';

export default async function handler(req, res) {
  if (!isAdminAuthenticated(req)) return res.status(401).json({ error: 'Unauthorized' });

  // GET — list all houses
  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('fragrance_houses')
      .select('id, house, slug, director, city, status, description, established_year, instagram, website, subscription_expires_at')
      .order('house');
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  // PATCH — update house profile fields
  if (req.method === 'PATCH') {
    const { id, description, established_year, instagram, website, city, status } = req.body;
    if (!id) return res.status(400).json({ error: 'id required' });

    const updates = {};
    if (description !== undefined) updates.description = description || null;
    if (established_year !== undefined) updates.established_year = established_year ? parseInt(established_year) : null;
    if (instagram !== undefined) updates.instagram = instagram || null;
    if (website !== undefined) updates.website = website || null;
    if (city !== undefined) updates.city = city || null;
    if (status !== undefined) updates.status = status;

    const { data, error } = await supabaseAdmin
      .from('fragrance_houses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  return res.status(405).end();
}
