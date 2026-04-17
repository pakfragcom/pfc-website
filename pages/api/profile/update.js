import { createServerClient } from '@supabase/ssr';
import { supabaseAdmin } from '../../../lib/supabase-admin';

const PAKISTAN_CITIES = [
  'Karachi','Lahore','Islamabad','Rawalpindi','Faisalabad','Multan',
  'Peshawar','Quetta','Sialkot','Gujranwala','Hyderabad','Abbottabad',
];

export default async function handler(req, res) {
  if (req.method !== 'PATCH' && req.method !== 'POST') {
    return res.status(405).end();
  }

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

  const { display_name, city, bio } = req.body;

  if (!display_name || display_name.trim().length < 2 || display_name.trim().length > 80) {
    return res.status(400).json({ error: 'Display name must be 2–80 characters' });
  }
  if (city && !PAKISTAN_CITIES.includes(city)) {
    return res.status(400).json({ error: 'Invalid city' });
  }
  if (bio && bio.length > 280) {
    return res.status(400).json({ error: 'Bio must be 280 characters or fewer' });
  }

  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .update({
      display_name: display_name.trim(),
      city: city || null,
      bio: bio?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ profile });
}
