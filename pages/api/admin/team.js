import { supabaseAdmin } from '../../../lib/supabase-admin';
import { resolveApiAuth } from '../../../lib/api-auth';

export default async function handler(req, res) {
  const auth = await resolveApiAuth(req, res);
  if (!auth.ok) return;
  if (!auth.permissions.is_admin) return res.status(403).json({ error: 'Forbidden' });

  // GET — list moderators with permissions
  if (req.method === 'GET') {
    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('id, display_name, username, created_at')
      .eq('role', 'moderator');

    if (error) return res.status(500).json({ error: error.message });

    const moderators = await Promise.all((profiles || []).map(async (p) => {
      const { data: perms } = await supabaseAdmin
        .from('moderator_permissions')
        .select('can_manage_sellers, can_manage_houses, can_manage_reviews, granted_at')
        .eq('user_id', p.id)
        .maybeSingle();

      let email = null;
      try {
        const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(p.id);
        email = user?.email || null;
      } catch (_) {}

      return { ...p, email, permissions: perms || { can_manage_sellers: false, can_manage_houses: false, can_manage_reviews: false } };
    }));

    return res.status(200).json(moderators);
  }

  // POST — grant moderator access by email
  if (req.method === 'POST') {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'email is required' });

    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) return res.status(500).json({ error: listError.message });

    const user = users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
    if (!user) return res.status(404).json({ error: 'No account found with that email' });

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ role: 'moderator' })
      .eq('id', user.id);

    if (profileError) return res.status(500).json({ error: profileError.message });

    await supabaseAdmin.from('moderator_permissions').upsert({
      user_id: user.id,
      can_manage_sellers: false,
      can_manage_houses: false,
      can_manage_reviews: false,
      granted_by: 'admin',
      granted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    return res.status(200).json({ ok: true });
  }

  // PATCH — toggle a single permission
  if (req.method === 'PATCH') {
    const { user_id, permission, value } = req.body;
    if (!user_id || !permission || value === undefined) {
      return res.status(400).json({ error: 'user_id, permission, and value are required' });
    }
    const allowed = ['can_manage_sellers', 'can_manage_houses', 'can_manage_reviews'];
    if (!allowed.includes(permission)) return res.status(400).json({ error: 'Invalid permission' });

    const { error } = await supabaseAdmin
      .from('moderator_permissions')
      .update({ [permission]: value, updated_at: new Date().toISOString() })
      .eq('user_id', user_id);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  // DELETE — revoke moderator access
  if (req.method === 'DELETE') {
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ error: 'user_id is required' });

    await supabaseAdmin.from('moderator_permissions').delete().eq('user_id', user_id);
    await supabaseAdmin.from('profiles').update({ role: 'member' }).eq('id', user_id);

    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
