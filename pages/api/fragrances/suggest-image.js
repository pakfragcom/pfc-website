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
  if (req.method === 'GET') {
    // Return a signed upload URL for authenticated users
    const supabase = buildClient(req);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { fragrance_id, filename } = req.query;
    if (!fragrance_id || !filename) return res.status(400).json({ error: 'fragrance_id and filename required' });

    const ext = filename.split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
      return res.status(400).json({ error: 'Only jpg, png, webp allowed' });
    }

    const path = `suggestions/${fragrance_id}/${user.id}/${Date.now()}.${ext}`;

    const { data, error } = await supabaseAdmin.storage
      .from('fragrance-images')
      .createSignedUploadUrl(path);

    if (error) return res.status(500).json({ error: error.message });

    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/fragrance-images/${path}`;
    return res.status(200).json({ signedUrl: data.signedUrl, path, publicUrl });
  }

  if (req.method === 'POST') {
    // Confirm the submission after upload
    const supabase = buildClient(req);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { fragrance_id, storage_path, image_url } = req.body;
    if (!fragrance_id || !storage_path || !image_url) {
      return res.status(400).json({ error: 'fragrance_id, storage_path, image_url required' });
    }

    const { error } = await supabaseAdmin
      .from('fragrance_image_submissions')
      .insert({ fragrance_id, submitted_by: user.id, storage_path, image_url });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
