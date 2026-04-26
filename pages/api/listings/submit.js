import { createServerClient } from '@supabase/ssr';
import { supabaseAdmin } from '../../../lib/supabase-admin';

function buildSupabase(req, res) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return Object.entries(req.cookies).map(([name, value]) => ({ name, value }));
        },
        setAll(cookiesToSet) {
          const existing = res.getHeader('Set-Cookie');
          const arr = existing ? (Array.isArray(existing) ? existing : [existing]) : [];
          res.setHeader('Set-Cookie', [
            ...arr,
            ...cookiesToSet.map(({ name, value, options = {} }) => {
              let s = `${name}=${value}; Path=${options.path || '/'}`;
              if (options.httpOnly) s += '; HttpOnly';
              if (options.secure) s += '; Secure';
              if (options.sameSite) s += `; SameSite=${options.sameSite}`;
              if (options.maxAge !== undefined) s += `; Max-Age=${options.maxAge}`;
              return s;
            }),
          ]);
        },
      },
    }
  );
}

const VALID_CONDITIONS = ['sealed', 'partial', 'decant', 'gift_set'];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const supabase = buildSupabase(req, res);
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return res.status(401).json({ error: 'Sign in to create a listing.' });

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
    quantity, city, description, images, fragrance_id,
  } = req.body || {};

  if (!fragrance_name?.trim())               return res.status(400).json({ error: 'Fragrance name is required.' });
  if (!house?.trim())                        return res.status(400).json({ error: 'Brand / house is required.' });
  if (!VALID_CONDITIONS.includes(condition)) return res.status(400).json({ error: 'Invalid condition.' });
  if (!price_pkr || Number(price_pkr) <= 0) return res.status(400).json({ error: 'Price must be greater than 0.' });

  const { data: listing, error: insertError } = await supabaseAdmin
    .from('listings')
    .insert({
      seller_id:      seller.id,
      fragrance_id:   fragrance_id || null,
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
          <p><strong>Fragrance:</strong> ${fragrance_name.trim()} by ${house.trim()}</p>
          <p><strong>Condition:</strong> ${condition}</p>
          <p><strong>Price:</strong> Rs ${Number(price_pkr).toLocaleString()}</p>
          <p><a href="https://pakfrag.com/pfc-mgmt/listings" style="color:#557d72">Review in admin panel →</a></p>
        </div>`,
      }),
    }).catch(() => {});
  }

  return res.status(200).json({ ok: true, id: listing.id, pending: true });
}
