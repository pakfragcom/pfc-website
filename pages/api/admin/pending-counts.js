import { supabaseAdmin } from '../../../lib/supabase-admin';
import { resolveApiAuth } from '../../../lib/api-auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const auth = await resolveApiAuth(req, res);
  if (!auth.ok) return;

  const [{ count: reviews }, { count: fragrances }, { count: orders }] = await Promise.all([
    supabaseAdmin.from('reviews').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabaseAdmin.from('fragrances').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabaseAdmin.from('order_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
  ]);

  return res.status(200).json({ reviews: reviews ?? 0, fragrances: fragrances ?? 0, orders: orders ?? 0 });
}
