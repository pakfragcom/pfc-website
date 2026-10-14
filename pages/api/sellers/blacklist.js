import { getBlacklistCache } from '../../../lib/blacklist-cache';
import { getClientIp, isRateLimited } from '../../../lib/rate-limit';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  if (isRateLimited(`sellers-blacklist:${getClientIp(req)}`, { windowMs: 60_000, max: 30 })) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  const rows = await getBlacklistCache();
  return res.status(200).json(rows);
}
