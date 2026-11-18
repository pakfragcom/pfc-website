// POST /api/shop/orders: place an order from the cart. Signed-in customers
// only. The server re-prices every line from shop_products; nothing the
// browser sends about price or availability is trusted.
import { supabaseAdmin } from '../../../lib/supabase-admin';
import { createApiSupabaseClient } from '../../../lib/server-supabase';
import { isRateLimited } from '../../../lib/rate-limit';
import { isShopEnabled, getSetting } from '../../../lib/shop';
import {
  validateCheckout, priceOrder, makeOrderNumber, OPEN_ORDER_CAP, OPEN_STATUSES,
} from '../../../lib/shop-order';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  res.setHeader('Cache-Control', 'no-store');

  const supabase = createApiSupabaseClient(req, res);
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return res.status(401).json({ error: 'Please sign in to place your order.' });

  if (isRateLimited(`shop-order:${user.id}`, { windowMs: 60 * 60_000, max: 8 })) {
    return res.status(429).json({ error: 'Too many orders in a short time. Please try again later.' });
  }
  if (!(await isShopEnabled())) return res.status(404).json({ error: 'The shop is closed right now.' });

  const v = validateCheckout(req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });
  const input = v.value;

  // DB-backed cap (the in-memory limiter resets per instance).
  const { count: openCount } = await supabaseAdmin
    .from('checkout_orders')
    .select('id', { count: 'exact', head: true })
    .eq('buyer_id', user.id)
    .in('status', OPEN_STATUSES);
  if ((openCount || 0) >= OPEN_ORDER_CAP) {
    return res.status(429).json({ error: `You already have ${OPEN_ORDER_CAP} unpaid orders. Pay or cancel one before placing another (message us on WhatsApp).` });
  }

  const { data: products, error: prodErr } = await supabaseAdmin
    .from('shop_products')
    .select('id, price_pkr, availability, is_active, variant_id, source_seller_id, source_inventory_id')
    .in('id', input.lines.map((l) => l.id))
    .limit(20);
  if (prodErr) {
    console.error('[shop-order] products:', prodErr.message);
    return res.status(500).json({ error: 'Could not place the order. Please try again.' });
  }

  const shippingFee = Number(await getSetting('shipping_fee_pkr')) || 0;
  const priced = priceOrder(products || [], input.lines, shippingFee);
  if (!priced.ok) {
    return res.status(409).json({ error: 'Some items are no longer available. We removed them from your cart.', missing: priced.missing });
  }

  // Insert the order, retrying on the rare order-number collision.
  let order = null;
  for (let attempt = 0; attempt < 4 && !order; attempt++) {
    const { data, error } = await supabaseAdmin
      .from('checkout_orders')
      .insert({
        buyer_id: user.id,
        order_number: makeOrderNumber(),
        status: priced.status,
        subtotal_pkr: priced.subtotal,
        shipping_pkr: priced.shipping,
        total_pkr: priced.total,
        customer_name: input.name,
        customer_email: user.email || null,
        contact_whatsapp: input.phone,
        shipping_city: input.city,
        shipping_address: input.address,
        customer_note: input.note,
        payment_provider: 'bank_transfer',
      })
      .select('id, order_number')
      .single();
    if (!error) order = data;
    else if (error.code !== '23505') {
      console.error('[shop-order] insert:', error.message);
      return res.status(500).json({ error: 'Could not place the order. Please try again.' });
    }
  }
  if (!order) return res.status(500).json({ error: 'Could not place the order. Please try again.' });

  const { error: lineErr } = await supabaseAdmin.from('order_line_items').insert(
    priced.lines.map((l) => ({
      order_id: order.id,
      shop_product_id: l.id,
      variant_id: l.product.variant_id,
      seller_id: l.product.source_seller_id || null,
      seller_inventory_id: l.product.source_inventory_id || null,
      unit_price_pkr: l.unit,
      quantity: l.qty,
      line_subtotal_pkr: l.subtotal,
    }))
  );
  if (lineErr) {
    console.error('[shop-order] lines:', lineErr.message);
    await supabaseAdmin.from('checkout_orders').delete().eq('id', order.id);
    return res.status(500).json({ error: 'Could not place the order. Please try again.' });
  }

  // Remember the address for next time (first one becomes the default).
  const { count: addrCount } = await supabaseAdmin
    .from('customer_addresses')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);
  if (!addrCount) {
    await supabaseAdmin.from('customer_addresses').insert({
      user_id: user.id, full_name: input.name, phone: input.phone,
      city: input.city, address: input.address, is_default: true,
    });
  }

  return res.status(201).json({ order_number: order.order_number, status: priced.status });
}
