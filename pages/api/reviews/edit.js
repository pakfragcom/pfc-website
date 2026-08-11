import { supabaseAdmin } from '../../../lib/supabase-admin';
import { createApiSupabaseClient } from '../../../lib/server-supabase';
import { isRateLimited } from '../../../lib/rate-limit';
import { firstTooLong } from '../../../lib/validate';

export default async function handler(req, res) {
  if (req.method !== 'PATCH') return res.status(405).end();

  const supabase = createApiSupabaseClient(req, res);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  if (isRateLimited(`reviews-edit:${user.id}`, { windowMs: 15 * 60_000, max: 10 })) {
    return res.status(429).json({ error: 'Too many edits. Please try again later.' });
  }

  const { id, review_text, rating_overall, rating_longevity, rating_sillage, rating_value, occasion, season, cover_image_url } = req.body;

  if (!id) return res.status(400).json({ error: 'Review ID required' });
  if (!review_text || review_text.trim().length < 80) return res.status(400).json({ error: 'Review must be at least 80 characters' });
  if (review_text.trim().length > 5000) return res.status(400).json({ error: 'Review must be 5000 characters or fewer' });
  if (!rating_overall || Number(rating_overall) < 1 || Number(rating_overall) > 5) return res.status(400).json({ error: 'Overall rating must be between 1 and 5' });

  const lengthError = firstTooLong([
    ['Cover image URL', cover_image_url, 500],
  ]);
  if (lengthError) return res.status(400).json({ error: lengthError });

  const { data: existing } = await supabaseAdmin
    .from('reviews')
    .select('id, author_id')
    .eq('id', id)
    .single();

  if (!existing) return res.status(404).json({ error: 'Review not found' });
  if (existing.author_id !== user.id) return res.status(403).json({ error: 'Forbidden' });

  const { data: updated, error } = await supabaseAdmin
    .from('reviews')
    .update({
      review_text: review_text.trim(),
      rating_overall: Number(rating_overall),
      rating_longevity: rating_longevity ? Number(rating_longevity) : null,
      rating_sillage: rating_sillage ? Number(rating_sillage) : null,
      rating_value: rating_value ? Number(rating_value) : null,
      occasion: occasion || null,
      season: season || null,
      cover_image_url: cover_image_url?.trim() || null,
    })
    .eq('id', id)
    .eq('author_id', user.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ review: updated });
}
