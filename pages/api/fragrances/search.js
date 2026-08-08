import { supabaseAdmin } from '../../../lib/supabase-admin';
import { escapeLikePattern } from '../../../lib/escape-like';
import { getClientIp, isRateLimited } from '../../../lib/rate-limit';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  if (isRateLimited(`fragrances-search:${getClientIp(req)}`, { windowMs: 60_000, max: 30 })) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  const q = (req.query.q || '').trim().slice(0, 100);
  if (q.length < 2) return res.status(200).json([]);

  const { data, error } = await supabaseAdmin
    .from('fragrances')
    .select('id, name, house')
    .eq('status', 'approved')
    .ilike('name', `%${escapeLikePattern(q)}%`)
    .order('name')
    .limit(8);

  if (error) return res.status(500).json([]);

  return res.status(200).json(data || []);
}
