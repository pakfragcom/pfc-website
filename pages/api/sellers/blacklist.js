import { supabaseAdmin } from '../../../lib/supabase-admin';
import { getClientIp, isRateLimited } from '../../../lib/rate-limit';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  if (isRateLimited(`sellers-blacklist:${getClientIp(req)}`, { windowMs: 60_000, max: 30 })) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  const { data, error } = await supabaseAdmin
    .from('blacklisted_sellers')
    .select('name, reason, added_at')
    .order('added_at', { ascending: false })
    .limit(200);

  if (error) return res.status(500).json([]);

  return res.status(200).json(data || []);
}
