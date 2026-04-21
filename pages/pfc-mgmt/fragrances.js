import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient } from '../../lib/auth-context';
import AdminNav from '../../components/admin/AdminNav';

const CATEGORY_LABELS = {
  designer: 'Designer', middle_eastern: 'Middle Eastern',
  niche: 'Niche', local: 'Local Brand',
};

const STATUS_COLORS = {
  pending:  'text-yellow-400 bg-yellow-500/10 ring-yellow-500/20',
  approved: 'text-emerald-400 bg-emerald-500/10 ring-emerald-500/20',
};

const ADMIN_IDENTITY = {
  type: 'admin', displayName: 'Admin',
  permissions: { is_admin: true, can_manage_sellers: true, can_manage_houses: true, can_manage_reviews: true },
};

export default function AdminFragrances({ identity = ADMIN_IDENTITY }) {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const [fragrances, setFragrances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [actionLoading, setActionLoading] = useState(null);

  async function load() {
    const res = await fetch('/api/admin/fragrances');
    if (res.status === 401) { router.push('/pfc-mgmt/login'); return; }
    const data = await res.json();
    setFragrances(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleLogout() {
    if (identity?.type === 'admin') await fetch('/api/admin/auth', { method: 'DELETE' });
    else await supabase.auth.signOut();
    router.push('/pfc-mgmt/login');
  }

  async function approve(id) {
    setActionLoading(id);
    await fetch('/api/admin/fragrances', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'approved' }),
    });
    await load();
    setActionLoading(null);
  }

  async function reject(id) {
    setActionLoading(id);
    await fetch('/api/admin/fragrances', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'pending' }),
    });
    await load();
    setActionLoading(null);
  }

  async function del(id) {
    if (!confirm('Delete this fragrance permanently?')) return;
    setActionLoading(id);
    await fetch('/api/admin/fragrances', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    await load();
    setActionLoading(null);
  }

  const filtered = fragrances.filter(f => filter === 'all' || f.status === filter);
  const counts = {
    pending:  fragrances.filter(f => f.status === 'pending').length,
    approved: fragrances.filter(f => f.status === 'approved').length,
  };

  const FILTERS = [
    { id: 'pending',  label: `Pending (${counts.pending})` },
    { id: 'approved', label: `Approved (${counts.approved})` },
    { id: 'all',      label: `All (${fragrances.length})` },
  ];

  return (
    <>
      <Head>
        <title>Fragrances | PFC Admin</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <AdminNav currentPage="fragrances" identity={identity} onLogout={handleLogout} />

        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Fragrance Directory</h1>
              <p className="text-xs text-gray-500 mt-1">
                Approve community-submitted fragrances to make them visible in the directory.
              </p>
            </div>
            {counts.pending > 0 && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-yellow-500/15 text-yellow-400 ring-1 ring-yellow-500/25">
                {counts.pending} pending
              </span>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-6">
            {FILTERS.map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)}
                className={['text-xs px-3 py-1.5 rounded-lg font-medium transition',
                  filter === f.id ? 'bg-white text-black' : 'bg-white/5 ring-1 ring-white/10 text-gray-400 hover:text-white'].join(' ')}>
                {f.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-gray-500 text-sm py-10 text-center">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 text-sm">No {filter !== 'all' ? filter : ''} fragrances.</p>
              {filter === 'pending' && (
                <p className="text-gray-600 text-xs mt-2">
                  To add fragrances, go to{' '}
                  <a href="/fragrances" className="text-[#94aea7] hover:text-white transition" target="_blank">
                    the directory
                  </a>{' '}
                  or ask users to submit reviews — their fragrance names will appear here once linked.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(frag => (
                <div key={frag.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3 flex-wrap">
                      <div>
                        <h3 className="font-semibold text-white">{frag.name}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {frag.house}
                          {frag.concentration ? ` · ${frag.concentration}` : ''}
                          {' · '}{CATEGORY_LABELS[frag.category] || frag.category}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ring-1 ${STATUS_COLORS[frag.status]}`}>
                        {frag.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
                      {frag.profiles?.display_name && <span>By {frag.profiles.display_name}</span>}
                      <span>· {new Date(frag.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {frag.status !== 'approved' && (
                      <button
                        onClick={() => approve(frag.id)}
                        disabled={actionLoading === frag.id}
                        className="text-xs bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                      >
                        Approve
                      </button>
                    )}
                    {frag.status === 'approved' && (
                      <button
                        onClick={() => reject(frag.id)}
                        disabled={actionLoading === frag.id}
                        className="text-xs bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                      >
                        Unpublish
                      </button>
                    )}
                    <button
                      onClick={() => del(frag.id)}
                      disabled={actionLoading === frag.id}
                      className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                    >
                      Delete
                    </button>
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

export { getServerSideProps } from '../../lib/admin-guard';
