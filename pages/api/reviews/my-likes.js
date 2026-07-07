import { supabaseAdmin } from '../../../lib/supabase-admin';
import { createApiSupabaseClient } from '../../../lib/server-supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const supabase = createApiSupabaseClient(req, res);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return res.status(200).json({});

  const ids = (req.query.ids || '').split(',').filter(Boolean);
  if (!ids.length) return res.status(200).json({});

  const { data } = await supabaseAdmin
    .from('review_likes')
    .select('review_id')
    .eq('user_id', user.id)
    .in('review_id', ids);

  const result = {};
  (data || []).forEach(l => { result[l.review_id] = true; });
  return res.status(200).json(result);
}
