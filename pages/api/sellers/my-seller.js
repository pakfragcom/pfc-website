import { createServerClient } from '@supabase/ssr';
import { supabaseAdmin } from '../../../lib/supabase-admin';

function buildClient(req) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return Object.entries(req.cookies).map(([name, value]) => ({ name, value })); },
        setAll() {},
      },
    }
  );
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const supabase = buildClient(req);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { data } = await supabaseAdmin
    .from('sellers')
    .select('id, name, slug, code, status, seller_type, verification_tier, trust_score, city, contact_whatsapp, whatsapp, instagram, bio, added_at, subscription_expires_at')
    .eq('user_id', user.id)
    .maybeSingle();

  return res.status(200).json(data || null);
}
