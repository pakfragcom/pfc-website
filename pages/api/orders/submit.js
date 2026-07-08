import { supabaseAdmin } from '../../../lib/supabase-admin';
import { escHtml, firstTooLong } from '../../../lib/validate';
import { isRateLimited, getClientIp } from '../../../lib/rate-limit';

const REQUIRED = ['fragrance_name', 'type', 'requester_name', 'whatsapp'];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  if (isRateLimited(`orders:${getClientIp(req)}`, { windowMs: 10 * 60_000, max: 5 })) {
    return res.status(429).json({ error: 'Too many requests. Please try again in a few minutes.' });
  }

  const body = req.body || {};

  for (const field of REQUIRED) {
    if (!body[field]?.toString().trim()) {
      return res.status(400).json({ error: `${field} is required` });
    }
  }

  const validTypes = ['bnib', 'partial', 'decant', 'gift'];
  if (!validTypes.includes(body.type)) {
    return res.status(400).json({ error: 'Invalid type' });
  }

  const lengthError = firstTooLong([
    ['Fragrance name', body.fragrance_name, 200],
    ['Budget', body.budget, 50],
    ['Requester name', body.requester_name, 100],
    ['WhatsApp number', body.whatsapp, 30],
    ['City', body.city, 100],
    ['Referral source', body.referral_source, 200],
    ['Gift recipient name', body.gift_recipient_name, 100],
    ['Gift occasion', body.gift_occasion, 100],
    ['Gift message', body.gift_message, 500],
  ]);
  if (lengthError) return res.status(400).json({ error: lengthError });

  const isGift = body.type === 'gift';

  const { data, error } = await supabaseAdmin
    .from('order_requests')
    .insert({
      fragrance_name:     body.fragrance_name.trim(),
      fragrance_id:       body.fragrance_id || null,
      type:               body.type,
      quantity:           Math.max(1, parseInt(body.quantity) || 1),
      budget:             body.budget?.trim() || null,
      is_gift:            isGift,
      gift_recipient_name: isGift ? (body.gift_recipient_name?.trim() || null) : null,
      gift_occasion:      isGift ? (body.gift_occasion?.trim() || null) : null,
      gift_message:       isGift ? (body.gift_message?.trim() || null) : null,
      requester_name:     body.requester_name.trim(),
      whatsapp:           body.whatsapp.trim(),
      city:               body.city?.trim() || null,
      referral_source:    body.referral_source?.trim() || null,
    })
    .select('id')
    .single();

  if (error) {
    console.error('order_requests insert error:', error);
    return res.status(500).json({ error: 'Failed to save request' });
  }

  // Non-blocking admin email notification
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'iamabdullahawan@gmail.com';
  if (process.env.RESEND_API_KEY) {
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      body: JSON.stringify({
        from: 'PFC Orders <noreply@pakfrag.com>',
        to: adminEmail,
        subject: `New order request: ${body.fragrance_name} (${body.type.toUpperCase()})`,
        html: `<p><strong>${escHtml(body.requester_name)}</strong> requested <strong>${escHtml(body.fragrance_name)}</strong> (${escHtml(body.type.toUpperCase())}, qty ${parseInt(body.quantity) || 1})</p>
               <p>WhatsApp: ${escHtml(body.whatsapp)}</p>
               ${body.city ? `<p>City: ${escHtml(body.city)}</p>` : ''}
               ${body.budget ? `<p>Budget: ${escHtml(body.budget)}</p>` : ''}
               ${isGift ? `<p>Gift for: ${escHtml(body.gift_recipient_name || '—')} | Occasion: ${escHtml(body.gift_occasion || '—')}</p>` : ''}
               <p><a href="https://pakfrag.com/pfc-mgmt/orders">View in admin panel →</a></p>`,
      }),
    }).catch(err => console.error('[orders/submit] admin notification email failed:', err.message));
  }

  return res.status(200).json({ ok: true, id: data.id });
}
