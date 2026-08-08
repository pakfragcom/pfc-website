import { supabaseAdmin } from '../../../lib/supabase-admin';
import { resolveApiAuth } from '../../../lib/api-auth';

export default async function handler(req, res) {
  const auth = await resolveApiAuth(req, res);
  if (!auth.ok) return;
  if (!auth.permissions.can_manage_houses) return res.status(403).json({ error: 'Forbidden' });

  // GET — list all houses
  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('fragrance_houses')
      .select('id, house, slug, director, city, status, tier, description, established_year, instagram, website, logo_url, subscription_expires_at, is_sponsor, sponsor_order, sponsor_banner_url')
      .order('house');
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  // PATCH — update house profile fields
  if (req.method === 'PATCH') {
    const { id, description, established_year, instagram, website, city, status, logo_url, tier, is_sponsor, sponsor_order, sponsor_banner_url } = req.body;
    if (!id) return res.status(400).json({ error: 'id required' });

    const VALID_TIERS = ['diamond', 'platinum', 'gold', 'emerging'];
    const updates = {};
    if (description !== undefined) updates.description = description || null;
    if (established_year !== undefined) updates.established_year = established_year ? parseInt(established_year) : null;
    if (instagram !== undefined) updates.instagram = instagram || null;
    if (website !== undefined) updates.website = website || null;
    if (city !== undefined) updates.city = city || null;
    if (status !== undefined) updates.status = status;
    if (logo_url !== undefined) updates.logo_url = logo_url || null;
    if (tier !== undefined && VALID_TIERS.includes(tier)) updates.tier = tier;
    if (is_sponsor !== undefined) updates.is_sponsor = !!is_sponsor;
    if (sponsor_order !== undefined) updates.sponsor_order = sponsor_order === '' || sponsor_order === null ? null : parseInt(sponsor_order);
    if (sponsor_banner_url !== undefined) updates.sponsor_banner_url = sponsor_banner_url || null;

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
