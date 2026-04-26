import { supabaseAdmin } from '../../../lib/supabase-admin';
import { resolveApiAuth } from '../../../lib/api-auth';

export default async function handler(req, res) {
  const auth = await resolveApiAuth(req, res);
  if (!auth.ok) return;
  if (!auth.permissions.can_manage_reviews) return res.status(403).json({ error: 'Forbidden' });

  // GET — list all reviews with author info
  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('reviews')
      .select('id, fragrance_name, house, category, rating_overall, review_text, status, featured, reject_reason, created_at, published_at, profiles(display_name, city)')
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  // PATCH — approve, reject, or toggle featured
  if (req.method === 'PATCH') {
    const { id, status, reject_reason, featured } = req.body;
    if (!id) return res.status(400).json({ error: 'id required' });

    const updates = {};

    if (featured !== undefined) {
      updates.featured = !!featured;
    } else {
      if (!status) return res.status(400).json({ error: 'status required' });
      updates.status = status;
      updates.reject_reason = reject_reason || null;
      if (status === 'approved') updates.published_at = new Date().toISOString();
    }

    const { data, error } = await supabaseAdmin
      .from('reviews')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    // Trigger on-demand ISR so approved reviews appear immediately everywhere
    if (status === 'approved') {
      const paths = ['/', '/reviews'];

      if (data?.fragrance_id) {
        const { data: frag } = await supabaseAdmin
          .from('fragrances')
          .select('slug')
          .eq('id', data.fragrance_id)
          .single();
        if (frag?.slug) paths.push(`/fragrances/${frag.slug}`);
      }

      await Promise.allSettled(paths.map(p => res.revalidate(p)));
    }

    return res.status(200).json(data);
  }

  return res.status(405).end();
}
