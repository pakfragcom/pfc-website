import { supabaseAdmin } from '../../../lib/supabase-admin';
import { createApiSupabaseClient } from '../../../lib/server-supabase';
import { isRateLimited } from '../../../lib/rate-limit';
import { resolveOrCreateVariant } from '../../../lib/product-variants';

const VALID_CONDITIONS = ['sealed', 'partial', 'decant', 'gift_set'];
const VALID_STATUSES = ['active', 'paused', 'out_of_stock'];

async function resolvePilotSeller(req, res) {
  const supabase = createApiSupabaseClient(req, res);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: res.status(401).json({ error: 'Unauthorized' }) };

  const { data: seller } = await supabaseAdmin
    .from('sellers')
    .select('id, inventory_pilot_enabled')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!seller) return { error: res.status(403).json({ error: 'No seller profile found.' }) };
  if (!seller.inventory_pilot_enabled) {
    return { error: res.status(403).json({ error: 'Inventory management isn\'t enabled for your account yet.' }) };
  }

  return { seller };
}

export default async function handler(req, res) {
  const { seller, error } = await resolvePilotSeller(req, res);
  if (error) return;

  if (req.method === 'GET') {
    const { data, error: fetchError } = await supabaseAdmin
      .from('seller_inventory')
      .select('id, condition, stock_qty, reserved_qty, price_pkr, is_negotiable, status, updated_at, product_variants(id, size_ml, concentration, fragrances(id, name, house, slug, image_url))')
      .eq('seller_id', seller.id)
      .order('updated_at', { ascending: false });

    if (fetchError) return res.status(500).json({ error: fetchError.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    if (isRateLimited(`seller-inventory:${seller.id}`, { windowMs: 60_000, max: 20 })) {
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    const { fragrance_id, size_ml, concentration, condition, stock_qty, price_pkr, is_negotiable } = req.body || {};

    if (!fragrance_id) return res.status(400).json({ error: 'Select a fragrance from the catalog.' });
    const sizeNum = Number(size_ml);
    if (!Number.isInteger(sizeNum) || sizeNum <= 0 || sizeNum > 5000) {
      return res.status(400).json({ error: 'Size (ml) must be a whole number between 1 and 5000.' });
    }
    if (!VALID_CONDITIONS.includes(condition)) return res.status(400).json({ error: 'Invalid condition.' });
    const qty = Number(stock_qty);
    if (!Number.isInteger(qty) || qty < 0) return res.status(400).json({ error: 'Stock must be a whole number, 0 or more.' });
    const price = Number(price_pkr);
    if (!price || price <= 0) return res.status(400).json({ error: 'Price must be greater than 0.' });

    const variant_id = await resolveOrCreateVariant({ fragrance_id, size_ml: sizeNum, concentration });
    if (!variant_id) return res.status(400).json({ error: 'Could not resolve this fragrance/size combination.' });

    // One row per seller+variant+condition — update in place if it already exists
    const { data: existing } = await supabaseAdmin
      .from('seller_inventory')
      .select('id')
      .eq('seller_id', seller.id)
      .eq('variant_id', variant_id)
      .eq('condition', condition)
      .maybeSingle();

    const row = {
      seller_id: seller.id,
      variant_id,
      condition,
      stock_qty: qty,
      price_pkr: price,
      is_negotiable: Boolean(is_negotiable),
      status: qty > 0 ? 'active' : 'out_of_stock',
      updated_at: new Date().toISOString(),
    };

    const { data: saved, error: saveError } = existing
      ? await supabaseAdmin.from('seller_inventory').update(row).eq('id', existing.id).select('id').single()
      : await supabaseAdmin.from('seller_inventory').insert(row).select('id').single();

    if (saveError) return res.status(400).json({ error: saveError.message });
    return res.status(200).json({ ok: true, id: saved.id, updated: !!existing });
  }

  if (req.method === 'PATCH') {
    if (isRateLimited(`seller-inventory:${seller.id}`, { windowMs: 60_000, max: 30 })) {
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    const { id, stock_qty, price_pkr, is_negotiable, status } = req.body || {};
    if (!id) return res.status(400).json({ error: 'id required' });

    const updates = { updated_at: new Date().toISOString() };
    if (stock_qty !== undefined) {
      const qty = Number(stock_qty);
      if (!Number.isInteger(qty) || qty < 0) return res.status(400).json({ error: 'Stock must be a whole number, 0 or more.' });
      updates.stock_qty = qty;
    }
    if (price_pkr !== undefined) {
      const price = Number(price_pkr);
      if (!price || price <= 0) return res.status(400).json({ error: 'Price must be greater than 0.' });
      updates.price_pkr = price;
    }
    if (is_negotiable !== undefined) updates.is_negotiable = Boolean(is_negotiable);
    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status.' });
      updates.status = status;
    }

    const { data, error: updateError } = await supabaseAdmin
      .from('seller_inventory')
      .update(updates)
      .eq('id', id)
      .eq('seller_id', seller.id) // ownership check — can't touch another seller's row
      .select('id')
      .maybeSingle();

    if (updateError) return res.status(400).json({ error: updateError.message });
    if (!data) return res.status(404).json({ error: 'Not found.' });
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'DELETE') {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: 'id required' });

    const { error: deleteError } = await supabaseAdmin
      .from('seller_inventory')
      .delete()
      .eq('id', id)
      .eq('seller_id', seller.id);

    if (deleteError) return res.status(400).json({ error: deleteError.message });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
