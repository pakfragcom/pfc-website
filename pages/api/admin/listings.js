import { supabaseAdmin } from '../../../lib/supabase-admin';
import { resolveApiAuth } from '../../../lib/api-auth';

const VALID_CONDITIONS = ['sealed', 'partial', 'decant', 'gift_set'];

export default async function handler(req, res) {
  const auth = await resolveApiAuth(req, res);
  if (!auth.ok) return;
  if (!auth.permissions.can_manage_sellers) return res.status(403).json({ error: 'Forbidden' });

  // GET — list listings (filter by status)
  if (req.method === 'GET') {
    const { status = 'pending' } = req.query;
    const query = supabaseAdmin
      .from('listings')
      .select(`
        id, fragrance_name, house, concentration, condition, fill_level_pct,
        price_pkr, is_negotiable, quantity, city, description, status,
        created_at, expires_at,
        sellers(id, name, slug, verification_tier, code)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (status !== 'all') query.eq('status', status);

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  // POST — manually create a listing on behalf of a seller
  if (req.method === 'POST') {
    const {
      seller_id, fragrance_name, house, concentration, condition,
      fill_level_pct, price_pkr, is_negotiable, quantity, city, description,
    } = req.body;

    if (!seller_id) return res.status(400).json({ error: 'seller_id required' });
    if (!fragrance_name?.trim()) return res.status(400).json({ error: 'Fragrance name required' });
    if (!house?.trim()) return res.status(400).json({ error: 'House required' });
    if (!VALID_CONDITIONS.includes(condition)) return res.status(400).json({ error: 'Invalid condition' });
    if (!price_pkr || Number(price_pkr) <= 0) return res.status(400).json({ error: 'Price required' });

    const { data, error } = await supabaseAdmin
      .from('listings')
      .insert({
        seller_id,
        fragrance_name: fragrance_name.trim(),
        house: house.trim(),
        concentration: concentration?.trim() || null,
        condition,
        fill_level_pct: ['partial', 'decant'].includes(condition) ? (Number(fill_level_pct) || null) : null,
        price_pkr: Number(price_pkr),
        is_negotiable: Boolean(is_negotiable),
        quantity: Math.max(1, Number(quantity) || 1),
        city: city?.trim() || null,
        description: description?.trim() || null,
        status: 'active', // Admin-created listings go live immediately
      })
      .select('id')
      .single();

    if (error) return res.status(500).json({ error: error.message });

    try { await res.revalidate('/marketplace'); } catch (_) {}
    return res.status(201).json({ ok: true, id: data.id });
  }

  // PATCH — approve, reject, mark sold, or expire
  if (req.method === 'PATCH') {
    const { id, status, reject_reason } = req.body;
    if (!id || !status) return res.status(400).json({ error: 'id and status required' });

    const validStatuses = ['active', 'rejected', 'sold', 'expired'];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const updates = { status };
    if (status === 'rejected' && reject_reason) updates.reject_reason = reject_reason;

    const { data, error } = await supabaseAdmin
      .from('listings')
      .update(updates)
      .eq('id', id)
      .select('id, seller_id, fragrance_id')
      .single();

    if (error) return res.status(500).json({ error: error.message });

    if (status === 'active') {
      const paths = ['/marketplace'];
      if (data.fragrance_id) {
        const { data: frag } = await supabaseAdmin
          .from('fragrances')
          .select('slug')
          .eq('id', data.fragrance_id)
          .single();
        if (frag?.slug) paths.push(`/fragrances/${frag.slug}`);
      }
      await Promise.allSettled(paths.map(p => res.revalidate(p)));
    }

    return res.status(200).json({ ok: true, id: data.id });
  }

  return res.status(405).end();
}
