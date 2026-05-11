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
      .select('id, name, slug, house, category, concentration, status, image_url, created_at, submitted_by, profiles:submitted_by(display_name)')
      .order('status')
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  // PATCH — update status and/or fragrance details
  if (req.method === 'PATCH') {
    const { id, status, name, house, category, concentration, description, image_url, year_released, notes_top, notes_heart, notes_base } = req.body;
    if (!id) return res.status(400).json({ error: 'id required' });

    const updates = {};
    if (status !== undefined) {
      if (!['approved', 'pending'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
      updates.status = status;
    }
    if (name !== undefined)          updates.name          = name          || null;
    if (house !== undefined)         updates.house         = house         || null;
    if (category !== undefined)      updates.category      = category      || null;
    if (concentration !== undefined) updates.concentration = concentration || null;
    if (description !== undefined)   updates.description   = description   || null;
    if (image_url !== undefined)     updates.image_url     = image_url     || null;
    if (year_released !== undefined) updates.year_released = year_released ? Number(year_released) : null;
    if (notes_top !== undefined)     updates.notes_top     = notes_top     || null;
    if (notes_heart !== undefined)   updates.notes_heart   = notes_heart   || null;
    if (notes_base !== undefined)    updates.notes_base    = notes_base    || null;

    if (!Object.keys(updates).length) return res.status(400).json({ error: 'Nothing to update' });

    const { data, error } = await supabaseAdmin
      .from('fragrances')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    if (data.slug && (updates.image_url !== undefined || updates.status !== undefined)) {
      try { await res.revalidate(`/fragrances/${data.slug}`); } catch (_) {}
    }

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
