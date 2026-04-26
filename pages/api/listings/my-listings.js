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

  // Find the user's seller record
  const { data: seller } = await supabaseAdmin
    .from('sellers')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!seller) return res.status(200).json([]);

  const { data } = await supabaseAdmin
    .from('listings')
    .select('id, fragrance_name, house, condition, price_pkr, status, created_at, expires_at')
    .eq('seller_id', seller.id)
    .order('created_at', { ascending: false })
    .limit(20);

  return res.status(200).json(data || []);
}
