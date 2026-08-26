import { supabaseAdmin } from './supabase-admin';

// Tunable — the business will want to adjust these without a deploy.
const WEIGHTS = { price: 0.4, trust: 0.25, tier: 0.2, stock: 0.15 };

// Given a catalog variant + requested quantity, picks the best seller to
// fulfill it from whoever has enough stock. Scores on price (cheaper is
// better), seller trust_score, verification_tier, and how comfortable the
// stock headroom is — not just "sort by price".
export async function findBestSellerInventory(variant_id, quantity) {
  const qty = Number(quantity) || 1;

  const { data: candidates, error } = await supabaseAdmin
    .from('seller_inventory')
    .select('id, seller_id, price_pkr, stock_qty, reserved_qty, sellers(status, verification_tier, trust_score)')
    .eq('variant_id', variant_id)
    .eq('status', 'active');

  if (error || !candidates?.length) return null;

  const eligible = candidates.filter(c =>
    ['active', 'grace'].includes(c.sellers?.status) &&
    (c.stock_qty - c.reserved_qty) >= qty
  );
  if (!eligible.length) return null;

  const prices = eligible.map(c => c.price_pkr);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  const scored = eligible.map(c => {
    const priceScore = maxPrice === minPrice ? 1 : 1 - (c.price_pkr - minPrice) / (maxPrice - minPrice);
    const trustScore = (c.sellers?.trust_score ?? 0) / 100;
    const tierScore  = (c.sellers?.verification_tier ?? 0) / 3;
    const available  = c.stock_qty - c.reserved_qty;
    const stockScore = Math.min(1, available / qty);

    const score =
      WEIGHTS.price * priceScore +
      WEIGHTS.trust * trustScore +
      WEIGHTS.tier  * tierScore +
      WEIGHTS.stock * stockScore;

    return { id: c.id, seller_id: c.seller_id, price_pkr: c.price_pkr, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0];
}
