import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient } from '../../lib/auth-context';
import AdminNav from '../../components/admin/AdminNav';

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={[
        'relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none',
        checked ? 'bg-emerald-500' : 'bg-white/15',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
      ].join(' ')}
    >
      <span
        className={[
          'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200',
          checked ? 'translate-x-4' : 'translate-x-0',
        ].join(' ')}
      />
    </button>
  );
}

export default function TeamPage({ identity }) {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const [moderators, setModerators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [toggling, setToggling] = useState({});

  async function load() {
    const res = await fetch('/api/admin/team');
    if (!res.ok) { setLoading(false); return; }
    const data = await res.json();
    setModerators(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleLogout() {
    if (identity?.type === 'admin') await fetch('/api/admin/auth', { method: 'DELETE' });
    else await supabase.auth.signOut();
    router.push('/pfc-mgmt/login');
  }

  async function handleAdd(e) {
    e.preventDefault();
    setAdding(true); setAddError('');
    const res = await fetch('/api/admin/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (res.ok) {
      setEmail('');
      await load();
    } else {
      const d = await res.json();
      setAddError(d.error || 'Failed');
    }
    setAdding(false);
  }

  async function handleToggle(userId, permission, value) {
    const key = `${userId}:${permission}`;
    setToggling(t => ({ ...t, [key]: true }));
    setModerators(mods => mods.map(m =>
      m.id === userId
        ? { ...m, permissions: { ...m.permissions, [permission]: value } }
        : m
    ));
    const res = await fetch('/api/admin/team', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, permission, value }),
    });
    if (!res.ok) {
      setModerators(mods => mods.map(m =>
        m.id === userId
          ? { ...m, permissions: { ...m.permissions, [permission]: !value } }
          : m
      ));
    }
    setToggling(t => { const n = { ...t }; delete n[key]; return n; });
  }

  async function handleRevoke(userId, name) {
    if (!confirm(`Remove moderator access for ${name}?`)) return;
    await fetch('/api/admin/team', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    });
    await load();
  }

  return (
    <>
      <Head>
        <title>Team | PFC Admin</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <AdminNav currentPage="team" identity={identity} onLogout={handleLogout} />

        <div className="max-w-3xl mx-auto px-6 py-8">
          <h1 className="text-2xl font-bold mb-2">Team</h1>
          <p className="text-sm text-gray-500 mb-8">Grant moderators access to specific sections of the admin panel.</p>

          {/* Add moderator */}
          <div className="bg-white/[0.03] ring-1 ring-white/10 rounded-2xl p-5 mb-8">
            <h2 className="text-sm font-medium text-gray-300 mb-3">Grant Access</h2>
            <form onSubmit={handleAdd} className="flex gap-3">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="team@example.com"
                required
                className="flex-1 bg-black/40 ring-1 ring-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:ring-white/25"
              />
              <button
                type="submit"
                disabled={adding}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition"
              >
                {adding ? 'Adding…' : 'Add'}
              </button>
            </form>
            {addError && <p className="text-sm text-red-400 mt-2">{addError}</p>}
            <p className="text-xs text-gray-600 mt-2">The user must already have a PFC account. All permissions start off — enable them below.</p>
          </div>

          {/* Moderators list */}
          <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-4">Moderators ({moderators.length})</h2>

          {loading ? (
            <p className="text-gray-500 text-sm">Loading…</p>
          ) : moderators.length === 0 ? (
            <p className="text-gray-600 text-sm">No moderators yet. Add someone above.</p>
          ) : (
            <div className="space-y-3">
              {moderators.map(mod => (
                <div key={mod.id} className="bg-white/[0.03] ring-1 ring-white/10 rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <p className="font-medium text-sm text-white">{mod.display_name || mod.username}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{mod.email}</p>
                    </div>
                    <button
                      onClick={() => handleRevoke(mod.id, mod.display_name || mod.username)}
                      className="text-xs text-gray-600 hover:text-red-400 transition px-2 py-1 rounded-lg"
                    >
                      Revoke
                    </button>
                  </div>

                  <div className="space-y-3">
                    {[
                      { key: 'can_manage_sellers', label: 'Sellers', desc: 'Add, edit, mark paid, delete sellers' },
                      { key: 'can_manage_houses', label: 'Houses', desc: 'Edit house profiles and descriptions' },
                      { key: 'can_manage_reviews', label: 'Reviews', desc: 'Approve and reject submitted reviews' },
                    ].map(({ key, label, desc }) => (
                      <div key={key} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-200">{label}</p>
                          <p className="text-xs text-gray-600">{desc}</p>
                        </div>
                        <Toggle
                          checked={mod.permissions[key] ?? false}
                          onChange={v => handleToggle(mod.id, key, v)}
                          disabled={!!toggling[`${mod.id}:${key}`]}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export async function getServerSideProps({ req, res }) {
  const { resolveIdentity } = await import('../../lib/admin-guard');
  const identity = await resolveIdentity(req, res);
  if (!identity) return { redirect: { destination: '/pfc-mgmt/login', permanent: false } };
  if (!identity.permissions.is_admin) return { redirect: { destination: '/pfc-mgmt', permanent: false } };
  return { props: { identity } };
}
