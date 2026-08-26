import { resolveApiAuth } from '../../../lib/api-auth';
import { supabaseAdmin } from '../../../lib/supabase-admin';
import { findBestSellerInventory } from '../../../lib/inventory-routing';

// Admin-only dev tool for exercising the reserve -> commit RPC chain before
// a real payment gateway exists (Sprint 4). This performs REAL writes —
// it creates a real order, decrements real stock — it is not a dry run.
// The commit_reservation call here is exactly what the real payment
// webhook will call later; do not let that call drift from what ships.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const auth = await resolveApiAuth(req, res);
  if (!auth.ok) return;
  if (!auth.permissions.is_admin) return res.status(403).json({ error: 'Forbidden' });

  const { buyer_id, variant_id, seller_inventory_id, quantity } = req.body || {};
  const qty = Number(quantity) || 1;

  if (!buyer_id) return res.status(400).json({ error: 'buyer_id required — a real auth user id to simulate as the buyer' });
  if (!seller_inventory_id && !variant_id) {
    return res.status(400).json({ error: 'Provide either seller_inventory_id directly, or a variant_id to auto-route.' });
  }

  let targetInventoryId = seller_inventory_id;
  if (!targetInventoryId) {
    const best = await findBestSellerInventory(variant_id, qty);
    if (!best) return res.status(400).json({ error: 'No seller has enough stock for this variant.' });
    targetInventoryId = best.id;
  }

  const { data: inventoryRow } = await supabaseAdmin
    .from('seller_inventory')
    .select('id, price_pkr')
    .eq('id', targetInventoryId)
    .maybeSingle();
  if (!inventoryRow) return res.status(404).json({ error: 'seller_inventory row not found' });

  // 1) Draft order — mirrors what the real checkout API creates in Sprint 4
  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .insert({
      buyer_id,
      status: 'pending_payment',
      subtotal_pkr: inventoryRow.price_pkr * qty,
      total_pkr: inventoryRow.price_pkr * qty,
      payment_provider: 'dev-simulator',
    })
    .select('id')
    .single();
  if (orderError) return res.status(400).json({ error: orderError.message });

  // 2) Reserve — mirrors what the buyer's own browser session does at
  // add-to-cart/checkout-begin (p_buyer_id is only honored here because
  // there's no auth.uid() in a service-role call; a real buyer session
  // can never override their own auth.uid() this way).
  const { data: reservationId, error: reserveError } = await supabaseAdmin.rpc('reserve_seller_inventory', {
    p_seller_inventory_id: targetInventoryId,
    p_quantity: qty,
    p_buyer_id: buyer_id,
  });
  if (reserveError) {
    await supabaseAdmin.from('orders').update({ status: 'cancelled' }).eq('id', order.id);
    return res.status(400).json({ error: `reserve failed: ${reserveError.message}` });
  }

  // 3) Commit — the exact call the real payment webhook will make on success
  const { data: lineItemId, error: commitError } = await supabaseAdmin.rpc('commit_reservation', {
    p_reservation_id: reservationId,
    p_order_id: order.id,
    p_unit_price_pkr: inventoryRow.price_pkr,
  });
  if (commitError) {
    await supabaseAdmin.from('orders').update({ status: 'cancelled' }).eq('id', order.id);
    return res.status(400).json({ error: `commit failed: ${commitError.message}` });
  }

  await supabaseAdmin.from('orders').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', order.id);

  return res.status(200).json({ ok: true, order_id: order.id, line_item_id: lineItemId, seller_inventory_id: targetInventoryId });
}
