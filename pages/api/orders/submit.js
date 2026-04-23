import { supabaseAdmin } from '../../../lib/supabase-admin';

const REQUIRED = ['fragrance_name', 'type', 'requester_name', 'whatsapp'];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

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
        html: `<p><strong>${body.requester_name}</strong> requested <strong>${body.fragrance_name}</strong> (${body.type.toUpperCase()}, qty ${body.quantity || 1})</p>
               <p>WhatsApp: ${body.whatsapp}</p>
               ${body.city ? `<p>City: ${body.city}</p>` : ''}
               ${body.budget ? `<p>Budget: ${body.budget}</p>` : ''}
               ${isGift ? `<p>🎁 Gift for: ${body.gift_recipient_name || '—'} | Occasion: ${body.gift_occasion || '—'}</p>` : ''}
               <p><a href="https://pakfrag.com/pfc-mgmt/orders">View in admin panel →</a></p>`,
      }),
    }).catch(() => {});
  }

  return res.status(200).json({ ok: true, id: data.id });
}
