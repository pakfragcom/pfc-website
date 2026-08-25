import { supabaseAdmin } from '../../../lib/supabase-admin';
import { createApiSupabaseClient } from '../../../lib/server-supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const supabase = createApiSupabaseClient(req, res);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { data } = await supabaseAdmin
    .from('sellers')
    .select('id, name, slug, code, status, seller_type, verification_tier, trust_score, city, contact_whatsapp, whatsapp, instagram, bio, added_at, subscription_expires_at, inventory_pilot_enabled')
    .eq('user_id', user.id)
    .maybeSingle();

  return res.status(200).json(data || null);
}
