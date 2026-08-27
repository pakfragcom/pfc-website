import { supabaseAdmin } from '../../../lib/supabase-admin';
import { escHtml, firstTooLong } from '../../../lib/validate';
import { isRateLimited, getClientIp } from '../../../lib/rate-limit';
import { createApiSupabaseClient } from '../../../lib/server-supabase';

const REQUIRED = ['fragrance_name', 'type', 'requester_name', 'whatsapp'];
const VALID_TYPES = ['bnib', 'partial', 'decant'];
const VALID_FILL_LEVELS = ['high', 'mid', 'low'];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  if (isRateLimited(`iso:${getClientIp(req)}`, { windowMs: 10 * 60_000, max: 5 })) {
    return res.status(429).json({ error: 'Too many requests. Please try again in a few minutes.' });
  }

  const body = req.body || {};

  for (const field of REQUIRED) {
    if (!body[field]?.toString().trim()) {
      return res.status(400).json({ error: `${field} is required` });
    }
  }

  if (!VALID_TYPES.includes(body.type)) {
    return res.status(400).json({ error: 'Invalid type' });
  }
  if (body.type === 'partial' && !VALID_FILL_LEVELS.includes(body.fill_level)) {
    return res.status(400).json({ error: 'Select a fill level for a partial bottle' });
  }
  if (body.type === 'decant' && !body.decant_amount?.toString().trim()) {
    return res.status(400).json({ error: 'Enter how much you\'re looking for' });
  }

  const lengthError = firstTooLong([
    ['Fragrance name', body.fragrance_name, 200],
    ['Decant amount', body.decant_amount, 20],
    ['Notes', body.notes, 500],
    ['Requester name', body.requester_name, 100],
    ['WhatsApp number', body.whatsapp, 30],
  ]);
  if (lengthError) return res.status(400).json({ error: lengthError });

  // Opportunistic — posting works with no account, but if the visitor
  // happens to be logged in, record it (see plan: makes a future move to
  // sign-in-required posting a policy change, not a schema migration).
  let userId = null;
  try {
    const supabase = createApiSupabaseClient(req, res);
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id || null;
  } catch {
    // best-effort only
  }

  const { data, error } = await supabaseAdmin
    .from('iso_requests')
    .insert({
      fragrance_name:  body.fragrance_name.trim(),
      fragrance_id:    body.fragrance_id || null,
      type:            body.type,
      fill_level:      body.type === 'partial' ? body.fill_level : null,
      decant_amount:   body.type === 'decant' ? body.decant_amount.trim() : null,
      notes:           body.notes?.trim() || null,
      requester_name:  body.requester_name.trim(),
      whatsapp:        body.whatsapp.trim(),
      user_id:         userId,
    })
    .select('id')
    .single();

  if (error) {
    console.error('iso_requests insert error:', error);
    return res.status(500).json({ error: 'Failed to save request' });
  }

  // Non-blocking admin email notification
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'iamabdullahawan@gmail.com';
  if (process.env.RESEND_API_KEY) {
    const typeLabel = body.type === 'partial'
      ? `Partial (${escHtml(body.fill_level)})`
      : body.type === 'decant'
        ? `Decant (${escHtml(body.decant_amount.trim())})`
        : 'BNIB';
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      body: JSON.stringify({
        from: 'PFC ISO <noreply@pakfrag.com>',
        to: adminEmail,
        subject: `New ISO: ${body.fragrance_name} (${body.type.toUpperCase()})`,
        html: `<p><strong>${escHtml(body.requester_name)}</strong> is looking for <strong>${escHtml(body.fragrance_name)}</strong> — ${typeLabel}</p>
               <p>WhatsApp: ${escHtml(body.whatsapp)}</p>
               ${body.notes ? `<p>Notes: ${escHtml(body.notes.trim())}</p>` : ''}
               <p><a href="https://pakfrag.com/pfc-mgmt/iso">View in admin panel →</a></p>`,
      }),
    }).catch(err => console.error('[iso/submit] admin notification email failed:', err.message));
  }

  return res.status(200).json({ ok: true, id: data.id });
}
