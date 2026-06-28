import { supabaseAdmin } from '../../../lib/supabase-admin';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const q = (req.query.q || '').trim();
  const type = req.query.type || 'ALL';

  // Require at least 2 chars — prevents full-list fishing with a single wildcard
  if (q.length < 2) return res.status(200).json([]);

  let query = supabaseAdmin
    .from('sellers')
    .select('name, code, seller_type, slug, verification_tier')
    .in('status', ['active', 'grace'])
    .or(`name.ilike.%${q}%,code.ilike.%${q}%`)
    .limit(15)
    .order('name');

  if (type === 'BNIB' || type === 'DECANT') {
    query = query.eq('seller_type', type);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json([]);

  return res.status(200).json(
    (data || []).map(s => ({
      name: s.name,
      code: s.code,
      type: s.seller_type,
      slug: s.slug || null,
      tier: s.verification_tier ?? 0,
    }))
  );
}
