import { createServerClient } from '@supabase/ssr';
import { supabaseAdmin } from '../../../lib/supabase-admin';

function buildSupabase(req, res) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return Object.entries(req.cookies).map(([name, value]) => ({ name, value }));
        },
        setAll(cookiesToSet) {
          const existing = res.getHeader('Set-Cookie');
          const arr = existing ? (Array.isArray(existing) ? existing : [existing]) : [];
          res.setHeader('Set-Cookie', [
            ...arr,
            ...cookiesToSet.map(({ name, value, options = {} }) => {
              let s = `${name}=${value}; Path=${options.path || '/'}`;
              if (options.httpOnly) s += '; HttpOnly';
              if (options.secure) s += '; Secure';
              if (options.sameSite) s += `; SameSite=${options.sameSite}`;
              if (options.maxAge !== undefined) s += `; Max-Age=${options.maxAge}`;
              return s;
            }),
          ]);
        },
      },
    }
  );
}

const VALID_CATEGORIES = ['not_received', 'condition_misrepresented', 'fake', 'price_dispute', 'other'];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const supabase = buildSupabase(req, res);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  const { transaction_id, category, description, evidence_urls = [] } = req.body;

  if (!transaction_id) return res.status(400).json({ error: 'transaction_id is required' });
  if (!category || !VALID_CATEGORIES.includes(category)) return res.status(400).json({ error: 'Invalid category' });
  if (!description || description.trim().length < 10) return res.status(400).json({ error: 'Description must be at least 10 characters' });

  // Verify the transaction belongs to this user as the buyer
  const { data: tx, error: txErr } = await supabaseAdmin
    .from('transactions')
    .select('id, buyer_id, dispute_status')
    .eq('id', transaction_id)
    .maybeSingle();

  if (txErr || !tx) return res.status(404).json({ error: 'Transaction not found' });
  if (tx.buyer_id !== user.id) return res.status(403).json({ error: 'You can only dispute your own transactions' });

  // Check for existing open dispute
  const { data: existing } = await supabaseAdmin
    .from('disputes')
    .select('id')
    .eq('transaction_id', transaction_id)
    .maybeSingle();

  if (existing) return res.status(409).json({ error: 'A dispute already exists for this transaction' });

  // Clean evidence URLs
  const cleanUrls = (Array.isArray(evidence_urls) ? evidence_urls : [])
    .map(u => u.trim())
    .filter(u => u.startsWith('http'));

  // Insert dispute and update transaction status atomically
  const { data: dispute, error: insertErr } = await supabaseAdmin
    .from('disputes')
    .insert({
      transaction_id,
      opened_by: user.id,
      category,
      description: description.trim(),
      evidence_urls: cleanUrls,
    })
    .select()
    .single();

  if (insertErr) return res.status(500).json({ error: insertErr.message });

  await supabaseAdmin
    .from('transactions')
    .update({ dispute_status: 'open' })
    .eq('id', transaction_id);

  return res.status(201).json(dispute);
}
