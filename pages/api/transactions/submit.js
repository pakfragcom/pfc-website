import { supabaseAdmin } from '../../../lib/supabase-admin';
import { createApiSupabaseClient } from '../../../lib/server-supabase';
import { isRateLimited } from '../../../lib/rate-limit';
import { escapeLikePattern } from '../../../lib/escape-like';
import { firstTooLong } from '../../../lib/validate';

const VALID_ITEM_TYPES = ['sealed', 'partial', 'decant', 'gift_set'];
const VALID_OUTCOMES   = ['success', 'issue', 'scam'];

function slugify(str) {
  return str.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '')
    + '-' + Math.random().toString(36).slice(2, 7);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const supabase = createApiSupabaseClient(req, res);
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return res.status(401).json({ error: 'Sign in to log a transaction.' });

  if (isRateLimited(`transactions:${user.id}`, { windowMs: 60 * 60_000, max: 15 })) {
    return res.status(429).json({ error: 'Too many transactions logged. Please try again later.' });
  }

  const {
    seller_id,
    items,           // array of { fragrance_name, house, item_type, price_pkr, quantity, notes }
    outcome,
    city,
    notes,           // transaction-level notes
    review_text,
    rating_delivery,
    rating_accuracy,
    rating_communication,
  } = req.body || {};

  // --- Validate ---
  if (!seller_id)                          return res.status(400).json({ error: 'Seller is required.' });
  if (!VALID_OUTCOMES.includes(outcome))   return res.status(400).json({ error: 'Invalid outcome.' });
  if (!Array.isArray(items) || items.length === 0)
    return res.status(400).json({ error: 'At least one item is required.' });
  if (items.length > 20)
    return res.status(400).json({ error: 'Maximum 20 items per transaction.' });

  for (const [i, item] of items.entries()) {
    if (!item.fragrance_name?.trim())              return res.status(400).json({ error: `Item ${i + 1}: fragrance name is required.` });
    if (!VALID_ITEM_TYPES.includes(item.item_type)) return res.status(400).json({ error: `Item ${i + 1}: invalid type.` });
    if (!item.price_pkr || Number(item.price_pkr) <= 0) return res.status(400).json({ error: `Item ${i + 1}: price must be greater than 0.` });

    const itemLengthError = firstTooLong([
      [`Item ${i + 1} fragrance name`, item.fragrance_name, 200],
      [`Item ${i + 1} house`, item.house, 200],
      [`Item ${i + 1} notes`, item.notes, 500],
    ]);
    if (itemLengthError) return res.status(400).json({ error: itemLengthError });
  }

  const lengthError = firstTooLong([
    ['City', city, 100],
    ['Notes', notes, 1000],
    ['Review text', review_text, 3000],
  ]);
  if (lengthError) return res.status(400).json({ error: lengthError });

  // Validate ratings if provided
  for (const [key, val] of Object.entries({ rating_delivery, rating_accuracy, rating_communication })) {
    if (val !== undefined && val !== null) {
      const n = Number(val);
      if (!Number.isInteger(n) || n < 1 || n > 5)
        return res.status(400).json({ error: `${key} must be 1–5.` });
    }
  }

  // --- Verify seller ---
  const { data: seller } = await supabaseAdmin
    .from('sellers')
    .select('id')
    .eq('id', seller_id)
    .in('status', ['active', 'grace'])
    .maybeSingle();
  if (!seller) return res.status(400).json({ error: 'Seller not found or not active.' });

  // --- Anti-manipulation checks ---
  const accountAge = Date.now() - new Date(user.created_at).getTime();
  if (accountAge < 7 * 24 * 60 * 60 * 1000)
    return res.status(403).json({ error: 'Your account must be at least 7 days old to log transactions.' });

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabaseAdmin
    .from('transactions')
    .select('id', { count: 'exact', head: true })
    .eq('buyer_id', user.id)
    .eq('seller_id', seller_id)
    .gte('created_at', thirtyDaysAgo);
  const flagged = count >= 3;

  // --- Resolve fragrance IDs for each item ---
  const resolvedItems = await Promise.all(items.map(async (item) => {
    const name  = item.fragrance_name.trim();
    const house = item.house?.trim() || null;

    let fragrance_id = item.fragrance_id || null;

    if (!fragrance_id && name) {
      const { data: existing } = await supabaseAdmin
        .from('fragrances')
        .select('id')
        .ilike('name', escapeLikePattern(name))
        .limit(1)
        .maybeSingle();

      if (existing) {
        fragrance_id = existing.id;
      } else if (house) {
        // Auto-create a pending fragrance record
        const { data: newFrag } = await supabaseAdmin
          .from('fragrances')
          .insert({
            name,
            house,
            slug:   slugify(name),
            status: 'pending',
          })
          .select('id')
          .maybeSingle();
        if (newFrag) fragrance_id = newFrag.id;
      }
    }

    return {
      fragrance_name: name,
      house,
      fragrance_id,
      item_type:  item.item_type,
      price_pkr:  Number(item.price_pkr),
      quantity:   Math.max(1, Number(item.quantity) || 1),
      notes:      item.notes?.trim() || null,
    };
  }));

  const totalPkr  = resolvedItems.reduce((sum, i) => sum + i.price_pkr * i.quantity, 0);
  const itemCount = resolvedItems.reduce((sum, i) => sum + i.quantity, 0);

  // --- Insert transaction header ---
  const { data: txn, error: txnError } = await supabaseAdmin
    .from('transactions')
    .insert({
      buyer_id:             user.id,
      seller_id,
      // Legacy single-item columns left null for multi-item
      fragrance_name:       resolvedItems.length === 1 ? resolvedItems[0].fragrance_name : null,
      house:                resolvedItems.length === 1 ? resolvedItems[0].house : null,
      fragrance_id:         resolvedItems.length === 1 ? resolvedItems[0].fragrance_id : null,
      condition:            resolvedItems.length === 1 ? resolvedItems[0].item_type : null,
      price_pkr:            totalPkr,
      city:                 city?.trim() || null,
      outcome,
      notes:                notes?.trim() || null,
      review_text:          review_text?.trim() || null,
      rating_delivery:      rating_delivery     ? Number(rating_delivery)     : null,
      rating_accuracy:      rating_accuracy     ? Number(rating_accuracy)     : null,
      rating_communication: rating_communication ? Number(rating_communication) : null,
      item_count:           itemCount,
      flagged,
    })
    .select('id')
    .single();

  if (txnError) return res.status(400).json({ error: txnError.message });

  // --- Insert line items ---
  const { error: itemsError } = await supabaseAdmin
    .from('transaction_items')
    .insert(resolvedItems.map(item => ({ ...item, transaction_id: txn.id })));

  if (itemsError) {
    // Clean up orphan transaction header
    await supabaseAdmin.from('transactions').delete().eq('id', txn.id);
    return res.status(400).json({ error: itemsError.message });
  }

  return res.status(200).json({ ok: true, id: txn.id, flagged });
}
