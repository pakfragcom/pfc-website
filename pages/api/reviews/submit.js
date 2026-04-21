import { createServerClient } from '@supabase/ssr';
import { supabaseAdmin } from '../../../lib/supabase-admin';

function slugify(str) {
  return str.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '')
    + '-' + Math.random().toString(36).slice(2, 7);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const supabase = createServerClient(
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

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });

  const {
    fragrance_name, house, category, fragrance_id,
    rating_overall, rating_longevity, rating_sillage, rating_value,
    review_text, occasion, season, cover_image_url,
  } = req.body;

  if (!fragrance_name?.trim()) return res.status(400).json({ error: 'Fragrance name is required.' });
  if (!house?.trim())          return res.status(400).json({ error: 'House / brand is required.' });
  if (!category)               return res.status(400).json({ error: 'Please select a category.' });
  if (!rating_overall)         return res.status(400).json({ error: 'Please give an overall rating.' });
  if (!review_text || review_text.trim().length < 80)
    return res.status(400).json({ error: 'Review must be at least 80 characters.' });

  // Ensure profile exists
  const rawName = user.user_metadata?.full_name || user.user_metadata?.name
    || user.email?.split('@')[0] || 'User';
  const base = rawName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 20) || 'user';
  const username = `${base}-${user.id.slice(0, 6)}`;

  await supabaseAdmin.from('profiles').upsert(
    { id: user.id, username, display_name: rawName },
    { onConflict: 'id', ignoreDuplicates: true }
  );

  // Check role for auto-approval
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  const isPrivileged = profile?.role === 'admin' || profile?.role === 'moderator';

  // Resolve house_id from fragrance_houses
  let house_id = null;
  const { data: houseRow } = await supabaseAdmin
    .from('fragrance_houses')
    .select('id')
    .ilike('house', house.trim())
    .maybeSingle();
  if (houseRow) house_id = houseRow.id;

  // Resolve or create fragrance record
  let resolvedFragranceId = fragrance_id || null;
  if (!resolvedFragranceId) {
    const { data: existing } = await supabaseAdmin
      .from('fragrances')
      .select('id')
      .ilike('name', fragrance_name.trim())
      .ilike('house', house.trim())
      .maybeSingle();
    if (existing) {
      resolvedFragranceId = existing.id;
    } else {
      const { data: newFrag } = await supabaseAdmin
        .from('fragrances')
        .insert({
          name:     fragrance_name.trim(),
          house:    house.trim(),
          category,
          slug:     slugify(fragrance_name),
          house_id,
          status:   'pending',
        })
        .select('id')
        .single();
      if (newFrag) resolvedFragranceId = newFrag.id;
    }
  }

  // Backfill house_id on fragrance if missing
  if (resolvedFragranceId && house_id) {
    await supabaseAdmin
      .from('fragrances')
      .update({ house_id })
      .eq('id', resolvedFragranceId)
      .is('house_id', null);
  }

  const now = new Date().toISOString();
  const { error: reviewError } = await supabaseAdmin.from('reviews').insert({
    author_id:        user.id,
    slug:             slugify(fragrance_name),
    fragrance_name:   fragrance_name.trim(),
    house:            house.trim(),
    category,
    fragrance_id:     resolvedFragranceId,
    house_id,
    rating_overall:   Number(rating_overall),
    rating_longevity: rating_longevity ? Number(rating_longevity) : null,
    rating_sillage:   rating_sillage   ? Number(rating_sillage)   : null,
    rating_value:     rating_value     ? Number(rating_value)     : null,
    review_text:      review_text.trim(),
    occasion:         occasion || null,
    season:           season   || null,
    cover_image_url:  cover_image_url?.trim() || null,
    status:           isPrivileged ? 'approved' : 'pending',
    published_at:     isPrivileged ? now : null,
  });

  if (reviewError) return res.status(400).json({ error: reviewError.message });

  // Email notification to admin (non-blocking)
  if (!isPrivileged && process.env.RESEND_API_KEY) {
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'iamabdullahawan@gmail.com';
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Pakistan Fragrance Community <noreply@pakfrag.com>',
        to: adminEmail,
        subject: `New review pending: ${fragrance_name.trim()} by ${house.trim()}`,
        html: `
          <div style="font-family:sans-serif;max-width:480px">
            <h2 style="color:#2a5c4f">New Review Pending Approval</h2>
            <p><strong>Fragrance:</strong> ${fragrance_name.trim()}</p>
            <p><strong>House:</strong> ${house.trim()}</p>
            <p><strong>Rating:</strong> ${rating_overall}/5</p>
            <p><strong>Preview:</strong> ${review_text.trim().slice(0, 200)}…</p>
            <p><a href="https://pakfrag.com/pfc-mgmt/reviews" style="color:#557d72">Review in admin panel →</a></p>
          </div>
        `,
      }),
    }).catch(() => {}); // fire and forget
  }

  return res.status(200).json({ ok: true, auto_approved: isPrivileged });
}
