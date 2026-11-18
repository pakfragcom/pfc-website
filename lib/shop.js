// SERVER-ONLY shop reads: import this only inside getStaticProps /
// getServerSideProps / API routes, never for use in a component (display
// helpers live in lib/shop-format.js). Uses the service
// role because shop_settings has no browser policy and we want one code
// path; every query here is bounded.
import { supabaseAdmin } from './supabase-admin';

export const CATALOG_REVALIDATE = 600;

export async function isShopEnabled() {
  const { data } = await supabaseAdmin
    .from('shop_settings')
    .select('value')
    .eq('key', 'shop_enabled')
    .maybeSingle();
  return data?.value === 'true';
}

export async function getSetting(key) {
  const { data } = await supabaseAdmin
    .from('shop_settings')
    .select('value')
    .eq('key', key)
    .maybeSingle();
  return data?.value ?? '';
}

const PRODUCT_SELECT = `
  id, price_pkr, availability, authenticity_badge, images, is_featured, sort_order,
  variant:product_variants!shop_products_variant_id_fkey ( id, size_ml, concentration, kind ),
  fragrance:fragrances!shop_products_fragrance_id_fkey (
    id, name, slug, house, category, concentration, description, image_url,
    house_ref:fragrance_houses!fragrances_house_id_fkey ( slug )
  )
`;

function toOffer(row) {
  if (!row?.fragrance || !row?.variant) return null;
  const f = row.fragrance;
  return {
    id: row.id,
    price_pkr: row.price_pkr,
    availability: row.availability,
    badge: row.authenticity_badge || null,
    image: (row.images && row.images[0]) || f.image_url || null,
    is_featured: !!row.is_featured,
    variant: {
      id: row.variant.id,
      size_ml: row.variant.size_ml,
      concentration: row.variant.concentration || f.concentration || null,
      kind: row.variant.kind || 'bottle',
    },
    fragrance: {
      id: f.id,
      name: f.name,
      slug: f.slug,
      house: f.house,
      house_slug: f.house_ref?.slug || null,
      category: f.category,
      description: f.description || null,
    },
  };
}

/** Every active offer, featured first. Bounded at 200 (the catalogue is small by design). */
export async function fetchOffers() {
  const { data, error } = await supabaseAdmin
    .from('shop_products')
    .select(PRODUCT_SELECT)
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('sort_order')
    .order('created_at')
    .limit(200);
  if (error) {
    console.error('[shop] offers fetch error:', error.message);
    return [];
  }
  return (data || []).map(toOffer).filter(Boolean);
}

/** One card per fragrance for the catalogue grid. */
export function groupOffersByFragrance(offers) {
  const byFragrance = new Map();
  for (const o of offers) {
    const key = o.fragrance.slug;
    if (!byFragrance.has(key)) {
      byFragrance.set(key, {
        slug: key,
        name: o.fragrance.name,
        house: o.fragrance.house,
        house_slug: o.fragrance.house_slug,
        category: o.fragrance.category,
        image: o.image,
        from_pkr: o.price_pkr,
        in_stock: o.availability === 'in_stock',
        kinds: new Set([o.variant.kind]),
        badge: o.badge,
        is_featured: o.is_featured,
        offer_count: 1,
      });
      continue;
    }
    const c = byFragrance.get(key);
    c.from_pkr = Math.min(c.from_pkr, o.price_pkr);
    c.in_stock = c.in_stock || o.availability === 'in_stock';
    c.kinds.add(o.variant.kind);
    c.badge = c.badge || o.badge;
    c.is_featured = c.is_featured || o.is_featured;
    c.image = c.image || o.image;
    c.offer_count += 1;
  }
  return Array.from(byFragrance.values()).map((c) => ({ ...c, kinds: Array.from(c.kinds) }));
}

/** Public offer data for the cart page (ids from the browser's cart). Bounded at 20. */
export async function fetchOffersByIds(ids) {
  if (!ids.length) return [];
  const { data, error } = await supabaseAdmin
    .from('shop_products')
    .select(PRODUCT_SELECT)
    .in('id', ids.slice(0, 20))
    .eq('is_active', true)
    .limit(20);
  if (error) {
    console.error('[shop] cart fetch error:', error.message);
    return [];
  }
  return (data || []).map(toOffer).filter(Boolean);
}

const ORDER_SELECT = `
  id, order_number, status, subtotal_pkr, shipping_pkr, total_pkr, quoted_total_pkr, quote_note,
  customer_name, contact_whatsapp, shipping_city, shipping_address, customer_note, tracking_ref,
  created_at, quoted_at, paid_at, shipped_at, delivered_at, cancelled_at, cancel_reason,
  items:order_line_items ( id, quantity, unit_price_pkr, line_subtotal_pkr,
    variant:product_variants!order_line_items_variant_id_fkey ( size_ml, concentration, kind,
      fragrance:fragrances!product_variants_fragrance_id_fkey ( name, slug, house, image_url ) ) )
`;

/** One order, only if it belongs to buyerId. */
export async function fetchOrderForBuyer(orderNumber, buyerId) {
  const { data, error } = await supabaseAdmin
    .from('checkout_orders')
    .select(ORDER_SELECT)
    .eq('order_number', orderNumber)
    .eq('buyer_id', buyerId)
    .maybeSingle();
  if (error) console.error('[shop] order fetch error:', error.message);
  return data || null;
}

/** A buyer's recent orders (newest first). */
export async function fetchOrdersForBuyer(buyerId) {
  const { data, error } = await supabaseAdmin
    .from('checkout_orders')
    .select('order_number, status, total_pkr, quoted_total_pkr, created_at, items:order_line_items ( quantity )')
    .eq('buyer_id', buyerId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) console.error('[shop] orders fetch error:', error.message);
  return data || [];
}

/** Fragrance + its active offers for /shop/[slug]; null when nothing is on sale. */
export async function fetchProductBySlug(slug) {
  const { data: fragrance } = await supabaseAdmin
    .from('fragrances')
    .select('id')
    .eq('slug', slug)
    .eq('status', 'approved')
    .maybeSingle();
  if (!fragrance) return null;

  const { data, error } = await supabaseAdmin
    .from('shop_products')
    .select(PRODUCT_SELECT)
    .eq('fragrance_id', fragrance.id)
    .eq('is_active', true)
    .order('sort_order')
    .limit(50);
  if (error) {
    console.error('[shop] product fetch error:', error.message);
    return null;
  }
  const offers = (data || []).map(toOffer).filter(Boolean);
  if (offers.length === 0) return null;
  return { fragrance: offers[0].fragrance, offers };
}

