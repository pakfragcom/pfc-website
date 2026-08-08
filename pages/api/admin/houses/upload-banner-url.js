import { resolveApiAuth } from '../../../../lib/api-auth';
import { supabaseAdmin } from '../../../../lib/supabase-admin';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const auth = await resolveApiAuth(req, res);
  if (!auth.ok) return;
  if (!auth.permissions.can_manage_houses) return res.status(403).json({ error: 'Forbidden' });

  const { house_id, filename } = req.body;
  if (!house_id || !filename) {
    return res.status(400).json({ error: 'house_id and filename required' });
  }

  const { data: house } = await supabaseAdmin
    .from('fragrance_houses')
    .select('id')
    .eq('id', house_id)
    .maybeSingle();
  if (!house) return res.status(404).json({ error: 'House not found' });

  const ext = filename.split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '');
  const allowed = ['jpg', 'jpeg', 'png', 'webp'];
  if (!allowed.includes(ext)) {
    return res.status(400).json({ error: 'Only jpg, png, webp allowed' });
  }

  const path = `${house_id}/${Date.now()}.${ext}`;

  const { data, error } = await supabaseAdmin.storage
    .from('sponsor-banners')
    .createSignedUploadUrl(path);

  if (error) return res.status(500).json({ error: error.message });

  const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/sponsor-banners/${path}`;

  return res.status(200).json({
    signedUrl: data.signedUrl,
    token: data.token,
    path,
    publicUrl,
  });
}
