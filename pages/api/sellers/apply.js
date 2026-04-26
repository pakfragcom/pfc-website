import { createServerClient } from '@supabase/ssr';
import { supabaseAdmin } from '../../../lib/supabase-admin';

function buildClient(req) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return Object.entries(req.cookies).map(([name, value]) => ({ name, value })); },
        setAll() {},
      },
    }
  );
}

function slugify(str) {
  return str.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '');
}

function genCode(length = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const supabase = buildClient(req);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  // Prevent duplicate applications
  const { data: existing } = await supabaseAdmin
    .from('sellers')
    .select('id, status')
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) {
    return res.status(409).json({ error: 'You already have a seller profile.', seller: existing });
  }

  const { name, city, whatsapp, seller_type, bio, instagram } = req.body;

  if (!name?.trim()) return res.status(400).json({ error: 'Name is required.' });
  if (!city?.trim()) return res.status(400).json({ error: 'City is required.' });
  if (!whatsapp?.trim()) return res.status(400).json({ error: 'WhatsApp number is required.' });
  if (!seller_type) return res.status(400).json({ error: 'Seller type is required.' });

  // Generate unique slug
  const baseSlug = slugify(name.trim()) || 'seller';
  let slug = baseSlug;
  const { data: slugExists } = await supabaseAdmin.from('sellers').select('id').eq('slug', slug).maybeSingle();
  if (slugExists) slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;

  // Generate verification code
  let code = genCode();
  // Ensure uniqueness
  const { data: codeExists } = await supabaseAdmin.from('sellers').select('id').eq('code', code).maybeSingle();
  if (codeExists) code = genCode(10);

  const { data: seller, error } = await supabaseAdmin
    .from('sellers')
    .insert({
      name: name.trim(),
      slug,
      code,
      city: city.trim(),
      contact_whatsapp: whatsapp.trim(),
      whatsapp: whatsapp.trim(),
      seller_type,
      bio: bio?.trim() || null,
      instagram: instagram?.trim() || null,
      status: 'pending',
      verification_tier: 0,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  // Notify admin
  if (process.env.RESEND_API_KEY) {
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'iamabdullahawan@gmail.com';
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Pakistan Fragrance Community <noreply@pakfrag.com>',
        to: adminEmail,
        subject: `New seller application: ${name.trim()}`,
        html: `<div style="font-family:sans-serif;max-width:480px">
          <h2 style="color:#2a5c4f">New Seller Application</h2>
          <p><strong>Name:</strong> ${name.trim()}</p>
          <p><strong>City:</strong> ${city.trim()}</p>
          <p><strong>Type:</strong> ${seller_type}</p>
          <p><strong>WhatsApp:</strong> ${whatsapp.trim()}</p>
          <p><a href="https://pakfrag.com/pfc-mgmt/sellers" style="color:#557d72">Review in admin panel →</a></p>
        </div>`,
      }),
    }).catch(() => {});
  }

  return res.status(201).json({ ok: true, seller });
}
