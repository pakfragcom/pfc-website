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

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const supabase = buildClient(req);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { seller_id, cnic_front_path, cnic_back_path, business_proof_path } = req.body;
  if (!seller_id || !cnic_front_path) {
    return res.status(400).json({ error: 'seller_id and cnic_front_path required' });
  }

  // Verify ownership
  const { data: seller } = await supabaseAdmin
    .from('sellers')
    .select('id, verification_tier')
    .eq('id', seller_id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!seller) return res.status(403).json({ error: 'Forbidden' });

  // Check for existing pending request
  const { data: existing } = await supabaseAdmin
    .from('seller_tier_requests')
    .select('id')
    .eq('seller_id', seller_id)
    .eq('status', 'pending')
    .maybeSingle();

  if (existing) {
    return res.status(409).json({ error: 'A tier upgrade request is already pending.' });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const makePath = p => p ? `${supabaseUrl}/storage/v1/object/seller-documents/${p}` : null;

  const { error } = await supabaseAdmin.from('seller_tier_requests').insert({
    seller_id,
    requested_tier: 2,
    cnic_front_url: makePath(cnic_front_path),
    cnic_back_url: makePath(cnic_back_path),
    business_proof_url: makePath(business_proof_path),
  });

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
        subject: `L2 verification request from ${seller.id}`,
        html: `<div style="font-family:sans-serif;max-width:480px">
          <h2 style="color:#2a5c4f">L2 Document Verification Request</h2>
          <p>Seller ID: ${seller_id}</p>
          <p><a href="https://pakfrag.com/pfc-mgmt/sellers" style="color:#557d72">Review in admin panel →</a></p>
        </div>`,
      }),
    }).catch(() => {});
  }

  return res.status(200).json({ ok: true });
}
