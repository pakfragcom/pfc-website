import { supabaseAdmin } from '../../../lib/supabase-admin';
import { createApiSupabaseClient } from '../../../lib/server-supabase';
import { isRateLimited } from '../../../lib/rate-limit';

export default async function handler(req, res) {
  const supabase = createApiSupabaseClient(req, res);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  if (req.method === 'POST' && isRateLimited(`scent-profile:${user.id}`, { windowMs: 60_000, max: 10 })) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  // GET — return own scent profile
  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('scent_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  // POST — upsert scent profile
  if (req.method === 'POST') {
    const { preferred_families, usage_occasions, budget_range, city, current_scents } = req.body;

    const { data, error } = await supabaseAdmin
      .from('scent_profiles')
      .upsert({
        user_id: user.id,
        preferred_families: preferred_families || [],
        usage_occasions: usage_occasions || [],
        budget_range: budget_range || null,
        city: city || null,
        current_scents: current_scents || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  return res.status(405).end();
}
