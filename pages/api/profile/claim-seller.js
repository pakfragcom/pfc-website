import { createServerClient } from '@supabase/ssr';
import { supabaseAdmin } from '../../../lib/supabase-admin';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const supabase = createServerClient(
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

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });

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
