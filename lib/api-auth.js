import { createServerClient } from '@supabase/ssr';
import { isAdminAuthenticated } from './admin-auth';
import { supabaseAdmin } from './supabase-admin';

const ADMIN_PERMISSIONS = {
  is_admin: true,
  can_manage_sellers: true,
  can_manage_houses: true,
  can_manage_reviews: true,
};

function buildSupabaseClient(req) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return Object.entries(req.cookies).map(([name, value]) => ({ name, value }));
        },
        setAll() {
          // API routes don't need to refresh session cookies
        },
      },
    }
  );
}

/**
 * Resolves API auth for admin panel routes.
 * Returns { ok: true, type, permissions } or sends 401 and returns { ok: false }.
 *
 * Usage:
 *   const auth = await resolveApiAuth(req, res);
 *   if (!auth.ok) return;
 *   if (!auth.permissions.can_manage_sellers) return res.status(403).json({ error: 'Forbidden' });
 */
export async function resolveApiAuth(req, res) {
  if (isAdminAuthenticated(req)) {
    return { ok: true, type: 'admin', permissions: ADMIN_PERMISSIONS };
  }

  const supabase = buildSupabaseClient(req);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return { ok: false };
  }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile) {
    res.status(401).json({ error: 'Unauthorized' });
    return { ok: false };
  }

  if (profile.role === 'admin') {
    return { ok: true, type: 'admin', permissions: ADMIN_PERMISSIONS };
  }

  if (profile.role !== 'moderator') {
    res.status(401).json({ error: 'Unauthorized' });
    return { ok: false };
  }

  const { data: perms } = await supabaseAdmin
    .from('moderator_permissions')
    .select('can_manage_sellers, can_manage_houses, can_manage_reviews')
    .eq('user_id', user.id)
    .maybeSingle();

  return {
    ok: true,
    type: 'moderator',
    permissions: {
      is_admin: false,
      can_manage_sellers: perms?.can_manage_sellers ?? false,
      can_manage_houses: perms?.can_manage_houses ?? false,
      can_manage_reviews: perms?.can_manage_reviews ?? false,
    },
  };
}
