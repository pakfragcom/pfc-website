import { supabaseAdmin } from '../../../lib/supabase-admin';
import { createApiSupabaseClient } from '../../../lib/server-supabase';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Return a signed upload URL for authenticated users
    const supabase = createApiSupabaseClient(req, res);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { fragrance_id, filename } = req.query;
    if (!fragrance_id || !filename) return res.status(400).json({ error: 'fragrance_id and filename required' });

    const { data: fragrance } = await supabaseAdmin
      .from('fragrances')
      .select('id')
      .eq('id', fragrance_id)
      .maybeSingle();
    if (!fragrance) return res.status(404).json({ error: 'Fragrance not found' });

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
    const supabase = createApiSupabaseClient(req, res);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { fragrance_id, storage_path } = req.body;
    if (!fragrance_id || !storage_path) {
      return res.status(400).json({ error: 'fragrance_id and storage_path required' });
    }

    // storage_path must be the one this user was actually issued a signed URL for
    const expectedPrefix = `suggestions/${fragrance_id}/${user.id}/`;
    if (!storage_path.startsWith(expectedPrefix)) {
      return res.status(403).json({ error: 'Invalid storage path' });
    }

    // Confirm the file was actually uploaded before recording the submission
    const dir = storage_path.slice(0, storage_path.lastIndexOf('/'));
    const filename = storage_path.slice(storage_path.lastIndexOf('/') + 1);
    const { data: listing, error: listErr } = await supabaseAdmin.storage
      .from('fragrance-images')
      .list(dir, { search: filename });
    if (listErr || !listing?.some((f) => f.name === filename)) {
      return res.status(400).json({ error: 'Uploaded file not found' });
    }

    const image_url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/fragrance-images/${storage_path}`;

    const { error } = await supabaseAdmin
      .from('fragrance_image_submissions')
      .insert({ fragrance_id, submitted_by: user.id, storage_path, image_url });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
