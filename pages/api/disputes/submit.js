import { supabaseAdmin } from '../../../lib/supabase-admin';
import { createApiSupabaseClient } from '../../../lib/server-supabase';
import { isRateLimited } from '../../../lib/rate-limit';
import { firstTooLong } from '../../../lib/validate';

const VALID_CATEGORIES = ['not_received', 'condition_misrepresented', 'fake', 'price_dispute', 'other'];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const supabase = createApiSupabaseClient(req, res);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  if (isRateLimited(`disputes:${user.id}`, { windowMs: 60 * 60_000, max: 5 })) {
    return res.status(429).json({ error: 'Too many disputes submitted. Please try again later.' });
  }

  const { transaction_id, category, description, evidence_urls = [] } = req.body;

  if (!transaction_id) return res.status(400).json({ error: 'transaction_id is required' });
  if (!category || !VALID_CATEGORIES.includes(category)) return res.status(400).json({ error: 'Invalid category' });
  if (!description || description.trim().length < 10) return res.status(400).json({ error: 'Description must be at least 10 characters' });
  if (description.trim().length > 3000) return res.status(400).json({ error: 'Description must be 3000 characters or fewer' });

  if (!Array.isArray(evidence_urls) || evidence_urls.length > 10) {
    return res.status(400).json({ error: 'Maximum 10 evidence links' });
  }
  const evidenceLengthError = firstTooLong(evidence_urls.map((url, i) => [`Evidence link ${i + 1}`, url, 500]));
  if (evidenceLengthError) return res.status(400).json({ error: evidenceLengthError });

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
