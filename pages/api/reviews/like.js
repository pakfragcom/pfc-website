import { supabaseAdmin } from '../../../lib/supabase-admin';
import { createApiSupabaseClient } from '../../../lib/server-supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const supabase = createApiSupabaseClient(req, res);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { review_id } = req.body;
  if (!review_id) return res.status(400).json({ error: 'review_id required' });

  // Check if already liked
  const { data: existing } = await supabaseAdmin
    .from('review_likes')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('review_id', review_id)
    .maybeSingle();

  if (existing) {
    await supabaseAdmin
      .from('review_likes')
      .delete()
      .eq('user_id', user.id)
      .eq('review_id', review_id);
    return res.status(200).json({ liked: false });
  } else {
    await supabaseAdmin
      .from('review_likes')
      .insert({ user_id: user.id, review_id });
    return res.status(200).json({ liked: true });
  }
}
