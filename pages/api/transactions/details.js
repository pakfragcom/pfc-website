import { supabaseAdmin } from '../../../lib/supabase-admin';
import { createApiSupabaseClient } from '../../../lib/server-supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const supabase = createApiSupabaseClient(req, res);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'id is required' });

  const { data, error } = await supabaseAdmin
    .from('transactions')
    .select('id, fragrance_name, price_pkr, outcome, dispute_status, city, buyer_id, sellers(id, name, code, slug)')
    .eq('id', id)
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Transaction not found' });

  // Only the buyer can look up their transaction details this way
  if (data.buyer_id !== user.id) return res.status(403).json({ error: 'Not your transaction' });

  return res.status(200).json(data);
}
