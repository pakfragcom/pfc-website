// GET /api/shop/cart?ids=uuid,uuid → public offer details for the cart page.
// Returns only what the product page already shows (no seller or cost data).
import { isShopEnabled, fetchOffersByIds } from '../../../lib/shop';
import { isRateLimited, getClientIp } from '../../../lib/rate-limit';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  if (isRateLimited(`shop-cart:${getClientIp(req)}`, { windowMs: 60_000, max: 60 })) {
    return res.status(429).json({ error: 'Too many requests.' });
  }
  if (!(await isShopEnabled())) return res.status(404).json({ error: 'Shop is closed.' });

  const ids = String(req.query.ids || '').split(',').filter((s) => UUID_RE.test(s)).slice(0, 20);
  const offers = await fetchOffersByIds(ids);
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({ offers });
}
