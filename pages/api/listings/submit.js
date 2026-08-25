import { supabaseAdmin } from '../../../lib/supabase-admin';
import { escHtml, firstTooLong } from '../../../lib/validate';
import { isRateLimited } from '../../../lib/rate-limit';
import { createApiSupabaseClient } from '../../../lib/server-supabase';
import { resolveOrCreateVariant } from '../../../lib/product-variants';

const VALID_CONDITIONS = ['sealed', 'partial', 'decant', 'gift_set'];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const supabase = createApiSupabaseClient(req, res);
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return res.status(401).json({ error: 'Sign in to create a listing.' });

  if (isRateLimited(`listings:${user.id}`, { windowMs: 60 * 60_000, max: 10 })) {
    return res.status(429).json({ error: 'Too many listings submitted. Please try again later.' });
  }

  // Resolve seller claimed by this user
  const { data: seller } = await supabaseAdmin
    .from('sellers')
    .select('id, seller_type, status')
    .eq('user_id', user.id)
    .in('status', ['active', 'grace'])
    .maybeSingle();

  if (!seller) {
    return res.status(403).json({ error: 'Only verified sellers with a claimed profile can post listings.' });
  }

  const {
    fragrance_name, house, concentration, condition,
    fill_level_pct, price_pkr, is_negotiable,
    quantity, city, description, images, fragrance_id, size_ml,
  } = req.body || {};

  if (!fragrance_name?.trim())               return res.status(400).json({ error: 'Fragrance name is required.' });
  if (!house?.trim())                        return res.status(400).json({ error: 'Brand / house is required.' });
  if (!VALID_CONDITIONS.includes(condition)) return res.status(400).json({ error: 'Invalid condition.' });
  if (!price_pkr || Number(price_pkr) <= 0) return res.status(400).json({ error: 'Price must be greater than 0.' });

  const lengthError = firstTooLong([
    ['Fragrance name', fragrance_name, 200],
    ['Brand / house', house, 200],
    ['Concentration', concentration, 50],
    ['Description', description, 2000],
    ['City', city, 100],
  ]);
  if (lengthError) return res.status(400).json({ error: lengthError });

  // Resolve (or create) a catalog variant when the seller linked a canonical
  // fragrance and gave a size — optional, additive, doesn't block the listing.
  let variant_id = null;
  if (fragrance_id && size_ml) {
    const sizeNum = Number(size_ml);
    if (!Number.isInteger(sizeNum) || sizeNum <= 0 || sizeNum > 5000) {
      return res.status(400).json({ error: 'Size (ml) must be a whole number between 1 and 5000.' });
    }
    variant_id = await resolveOrCreateVariant({ fragrance_id, size_ml, concentration });
  }

  const { data: listing, error: insertError } = await supabaseAdmin
    .from('listings')
    .insert({
      seller_id:      seller.id,
      fragrance_id:   fragrance_id || null,
      variant_id,
      fragrance_name: fragrance_name.trim(),
      house:          house.trim(),
      concentration:  concentration?.trim() || null,
      condition,
      fill_level_pct: condition === 'partial' || condition === 'decant'
        ? (Number(fill_level_pct) || null)
        : null,
      price_pkr:      Number(price_pkr),
      is_negotiable:  Boolean(is_negotiable),
      quantity:       Math.max(1, Number(quantity) || 1),
      city:           city?.trim() || null,
      description:    description?.trim() || null,
      images:         Array.isArray(images) ? images.filter(Boolean).slice(0, 5) : [],
      status:         'pending',
    })
    .select('id')
    .single();

  if (insertError) return res.status(400).json({ error: insertError.message });

  // Notify admin
  if (process.env.RESEND_API_KEY) {
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'iamabdullahawan@gmail.com';
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Pakistan Fragrance Community <noreply@pakfrag.com>',
        to: adminEmail,
        subject: `New listing pending: ${fragrance_name.trim()} — Rs ${Number(price_pkr).toLocaleString()}`,
        html: `<div style="font-family:sans-serif;max-width:480px">
          <h2 style="color:#2a5c4f">Listing Pending Approval</h2>
          <p><strong>Fragrance:</strong> ${escHtml(fragrance_name.trim())} by ${escHtml(house.trim())}</p>
          <p><strong>Condition:</strong> ${escHtml(condition)}</p>
          <p><strong>Price:</strong> Rs ${Number(price_pkr).toLocaleString()}</p>
          <p><a href="https://pakfrag.com/pfc-mgmt/listings" style="color:#557d72">Review in admin panel →</a></p>
        </div>`,
      }),
    }).catch(err => console.error('[listings/submit] admin notification email failed:', err.message));
  }

  return res.status(200).json({ ok: true, id: listing.id, pending: true });
}
