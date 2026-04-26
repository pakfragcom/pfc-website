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

  const { seller_id, doc_type, filename } = req.body;
  if (!seller_id || !doc_type || !filename) {
    return res.status(400).json({ error: 'seller_id, doc_type, filename required' });
  }

  const allowed_types = ['cnic_front', 'cnic_back', 'business_proof'];
  if (!allowed_types.includes(doc_type)) {
    return res.status(400).json({ error: 'Invalid doc_type' });
  }

  // Verify the seller belongs to this user
  const { data: seller } = await supabaseAdmin
    .from('sellers')
    .select('id')
    .eq('id', seller_id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!seller) return res.status(403).json({ error: 'Forbidden' });

  const ext = filename.split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '');
  const path = `${seller_id}/${doc_type}-${Date.now()}.${ext}`;

  const { data, error } = await supabaseAdmin.storage
    .from('seller-documents')
    .createSignedUploadUrl(path);

  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ signedUrl: data.signedUrl, path });
}
