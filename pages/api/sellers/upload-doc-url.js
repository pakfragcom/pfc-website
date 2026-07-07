import { supabaseAdmin } from '../../../lib/supabase-admin';
import { createApiSupabaseClient } from '../../../lib/server-supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const supabase = createApiSupabaseClient(req, res);
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
