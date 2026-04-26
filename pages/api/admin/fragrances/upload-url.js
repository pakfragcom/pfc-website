import { resolveApiAuth } from '../../../../lib/api-auth';
import { supabaseAdmin } from '../../../../lib/supabase-admin';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const auth = await resolveApiAuth(req, res);
  if (!auth.ok) return;

  const { fragrance_id, filename } = req.body;
  if (!fragrance_id || !filename) {
    return res.status(400).json({ error: 'fragrance_id and filename required' });
  }

  const ext = filename.split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '');
  const allowed = ['jpg', 'jpeg', 'png', 'webp'];
  if (!allowed.includes(ext)) {
    return res.status(400).json({ error: 'Only jpg, png, webp allowed' });
  }

  const path = `fragrances/${fragrance_id}/${Date.now()}.${ext}`;

  const { data, error } = await supabaseAdmin.storage
    .from('fragrance-images')
    .createSignedUploadUrl(path);

  if (error) return res.status(500).json({ error: error.message });

  const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/fragrance-images/${path}`;

  return res.status(200).json({
    signedUrl: data.signedUrl,
    token: data.token,
    path,
    publicUrl,
  });
}
