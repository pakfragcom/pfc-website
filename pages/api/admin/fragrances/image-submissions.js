import { resolveApiAuth } from '../../../../lib/api-auth';
import { supabaseAdmin } from '../../../../lib/supabase-admin';

export default async function handler(req, res) {
  const auth = await resolveApiAuth(req, res);
  if (!auth.ok) return;

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('fragrance_image_submissions')
      .select('id, fragrance_id, image_url, storage_path, status, created_at, fragrances(name, house, slug), profiles(display_name)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'PATCH') {
    const { id, status, reject_reason } = req.body;
    if (!id || !status) return res.status(400).json({ error: 'id and status required' });

    const { data: sub, error: fetchErr } = await supabaseAdmin
      .from('fragrance_image_submissions')
      .select('fragrance_id, image_url')
      .eq('id', id)
      .single();

    if (fetchErr || !sub) return res.status(404).json({ error: 'Submission not found' });

    await supabaseAdmin
      .from('fragrance_image_submissions')
      .update({ status, reject_reason: reject_reason || null })
      .eq('id', id);

    // On approval, update the fragrance's image_url
    if (status === 'approved') {
      await supabaseAdmin
        .from('fragrances')
        .update({ image_url: sub.image_url })
        .eq('id', sub.fragrance_id);

      // Revalidate the fragrance page
      const { data: frag } = await supabaseAdmin
        .from('fragrances')
        .select('slug')
        .eq('id', sub.fragrance_id)
        .single();
      if (frag?.slug) {
        try { await res.revalidate(`/fragrances/${frag.slug}`); } catch (_) {}
      }
    }

    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
