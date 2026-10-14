import { getSellersCache } from '../../../lib/sellers-cache';
import { getClientIp, isRateLimited } from '../../../lib/rate-limit';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  if (isRateLimited(`sellers-search:${getClientIp(req)}`, { windowMs: 60_000, max: 30 })) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  const q = (req.query.q || '').trim().slice(0, 100).toLowerCase();
  const type = req.query.type || 'ALL';

  // Require at least 2 chars — prevents full-list fishing with a single wildcard
  if (q.length < 2) return res.status(200).json([]);

  const rows = await getSellersCache();

  let matches = rows.filter(s => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q));
  if (type === 'BNIB' || type === 'DECANT') {
    matches = matches.filter(s => s.seller_type === type);
  }

  return res.status(200).json(
    matches.slice(0, 15).map(s => ({
      name: s.name,
      code: s.code,
      type: s.seller_type,
      slug: s.slug || null,
      tier: s.verification_tier ?? 0,
    }))
  );
}
