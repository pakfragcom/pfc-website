import { createServerClient } from '@supabase/ssr';
import { isAdminAuthenticated } from './admin-auth';
import { supabaseAdmin } from './supabase-admin';

const ADMIN_IDENTITY = {
  type: 'admin',
  displayName: 'Admin',
  permissions: {
    is_admin: true,
    can_manage_sellers: true,
    can_manage_houses: true,
    can_manage_reviews: true,
  },
};

/**
 * Core identity resolver — returns an identity object or null (unauthenticated / not authorized).
 * Exported so pages needing custom guards (e.g. team.js) can call it directly.
 */
export async function resolveIdentity(req, res) {
  if (isAdminAuthenticated(req)) return ADMIN_IDENTITY;

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

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role, display_name')
    .eq('id', user.id)
    .single();

  if (!profile) return null;

  if (profile.role === 'admin') {
    return { ...ADMIN_IDENTITY, displayName: profile.display_name || user.email };
  }

  if (profile.role !== 'moderator') return null;

  const { data: perms } = await supabaseAdmin
    .from('moderator_permissions')
    .select('can_manage_sellers, can_manage_houses, can_manage_reviews')
    .eq('user_id', user.id)
    .maybeSingle();

  return {
    type: 'moderator',
    displayName: profile.display_name || user.email,
    permissions: {
      is_admin: false,
      can_manage_sellers: perms?.can_manage_sellers ?? false,
      can_manage_houses: perms?.can_manage_houses ?? false,
      can_manage_reviews: perms?.can_manage_reviews ?? false,
    },
  };
}

/**
 * Standard getServerSideProps guard used by all pfc-mgmt pages via re-export.
 * Returns { props: { identity } } or redirects to login.
 */
export async function getServerSideProps({ req, res }) {
  const identity = await resolveIdentity(req, res);
  if (!identity) {
    return { redirect: { destination: '/pfc-mgmt/login', permanent: false } };
  }
  return { props: { identity } };
}
