import { supabaseAdmin } from '../../../lib/supabase-admin';
import { createApiSupabaseClient } from '../../../lib/server-supabase';
import { isRateLimited } from '../../../lib/rate-limit';

const PAKISTAN_CITIES = [
  'Karachi','Lahore','Islamabad','Rawalpindi','Faisalabad','Multan',
  'Peshawar','Quetta','Sialkot','Gujranwala','Hyderabad','Abbottabad',
];

export default async function handler(req, res) {
  if (req.method !== 'PATCH' && req.method !== 'POST') {
    return res.status(405).end();
  }

  const supabase = createApiSupabaseClient(req, res);

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });

  if (isRateLimited(`profile-update:${user.id}`, { windowMs: 60_000, max: 10 })) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  const { display_name, city, bio, username } = req.body;

  if (!display_name || display_name.trim().length < 2 || display_name.trim().length > 80) {
    return res.status(400).json({ error: 'Display name must be 2–80 characters' });
  }
  if (city && !PAKISTAN_CITIES.includes(city)) {
    return res.status(400).json({ error: 'Invalid city' });
  }
  if (bio && bio.length > 280) {
    return res.status(400).json({ error: 'Bio must be 280 characters or fewer' });
  }

  const updates = {
    display_name: display_name.trim(),
    city: city || null,
    bio: bio?.trim() || null,
    updated_at: new Date().toISOString(),
  };

  // One-time username change
  if (username !== undefined) {
    const clean = username.trim().toLowerCase();

    // Validate format: 3–30 chars, letters/numbers/hyphens only, no leading/trailing hyphen
    if (!/^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/.test(clean) && clean.length < 3) {
      return res.status(400).json({ error: 'Username must be 3–30 characters, letters, numbers, and hyphens only.' });
    }
    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(clean) || clean.length < 3 || clean.length > 30) {
      return res.status(400).json({ error: 'Username must be 3–30 characters, letters, numbers, and hyphens only.' });
    }

    // Check not already changed
    const { data: existing } = await supabaseAdmin
      .from('profiles')
      .select('username_changed')
      .eq('id', user.id)
      .single();
    if (existing?.username_changed) {
      return res.status(400).json({ error: 'Username can only be changed once.' });
    }

    // Check uniqueness
    const { data: taken } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('username', clean)
      .neq('id', user.id)
      .maybeSingle();
    if (taken) {
      return res.status(400).json({ error: 'That username is already taken.' });
    }

    updates.username = clean;
    updates.username_changed = true;
  }

  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ profile });
}
