import { supabaseAdmin } from '../../../lib/supabase-admin';
import { createApiSupabaseClient } from '../../../lib/server-supabase';
import { isRateLimited } from '../../../lib/rate-limit';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const supabase = createApiSupabaseClient(req, res);

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });

  if (isRateLimited(`claim-seller:${user.id}`, { windowMs: 10 * 60_000, max: 8 })) {
    return res.status(429).json({ error: 'Too many attempts. Please try again later.' });
  }

  const { code } = req.body;
  if (!code || typeof code !== 'string' || !code.trim()) {
    return res.status(400).json({ error: 'Verification code is required' });
  }

  const { data: seller, error: findError } = await supabaseAdmin
    .from('sellers')
    .select('id, name, code, seller_type, status, subscription_expires_at, city, user_id')
    .ilike('code', code.trim())
    .maybeSingle();

  if (findError) return res.status(500).json({ error: findError.message });
  if (!seller) return res.status(400).json({ error: 'Verification code not found' });
  if (seller.user_id !== null) {
    return res.status(400).json({ error: 'This seller account is already claimed' });
  }

  const { error: updateError } = await supabaseAdmin
    .from('sellers')
    .update({ user_id: user.id })
    .eq('id', seller.id);

  if (updateError) {
    if (updateError.code === '23505') {
      return res.status(400).json({ error: 'You already have a seller account linked' });
    }
    return res.status(500).json({ error: updateError.message });
  }

  const { id: _id, user_id: _uid, ...safeSeller } = seller;
  return res.status(200).json({ seller: { ...safeSeller, id: seller.id } });
}
