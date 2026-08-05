import { supabaseAdmin } from '../../../lib/supabase-admin';
import { createApiSupabaseClient } from '../../../lib/server-supabase';
import { isRateLimited } from '../../../lib/rate-limit';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const supabase = createApiSupabaseClient(req, res);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  if (isRateLimited(`wishlist:${user.id}`, { windowMs: 60_000, max: 30 })) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  const { fragrance_id } = req.body;
  if (!fragrance_id) return res.status(400).json({ error: 'fragrance_id required' });

  // Check if already wishlisted
  const { data: existing } = await supabaseAdmin
    .from('fragrance_wishlist')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('fragrance_id', fragrance_id)
    .maybeSingle();

  if (existing) {
    await supabaseAdmin
      .from('fragrance_wishlist')
      .delete()
      .eq('user_id', user.id)
      .eq('fragrance_id', fragrance_id);
    return res.status(200).json({ wishlisted: false });
  } else {
    await supabaseAdmin
      .from('fragrance_wishlist')
      .insert({ user_id: user.id, fragrance_id });
    return res.status(200).json({ wishlisted: true });
  }
}
