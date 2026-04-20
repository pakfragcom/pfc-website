import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient } from '../../lib/auth-context';
import AdminNav from '../../components/admin/AdminNav';

function EditModal({ house, onClose, onSuccess }) {
  const [form, setForm] = useState({
    description: house.description || '',
    established_year: house.established_year || '',
    instagram: house.instagram || '',
    website: house.website || '',
    city: house.city || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setLoading(true); setError('');
    const res = await fetch('/api/admin/houses', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: house.id, ...form }),
    });
    if (res.ok) { onSuccess(); }
    else { const d = await res.json(); setError(d.error || 'Failed'); setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="bg-[#111] ring-1 ring-white/10 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h3 className="font-semibold text-lg mb-1">Edit House Profile</h3>
        <p className="text-sm text-gray-400 mb-5">{house.house} · <a href={`/houses/${house.slug}`} target="_blank" rel="noopener noreferrer" className="text-[#94aea7] hover:text-white">/houses/{house.slug} ↗</a></p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Description <span className="text-gray-600">(shown on profile page + Google)</span></label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows={4}
              placeholder="Brief description of this fragrance house — their style, story, speciality..."
              className="w-full bg-black/40 ring-1 ring-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-white/25 resize-none placeholder-gray-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Established Year</label>
              <input
                type="number"
                value={form.established_year}
                onChange={e => setForm({ ...form, established_year: e.target.value })}
                placeholder="e.g. 2019"
                min="1900" max="2030"
                className="w-full bg-black/40 ring-1 ring-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-white/25"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">City</label>
              <input
                type="text"
                value={form.city}
                onChange={e => setForm({ ...form, city: e.target.value })}
                placeholder="e.g. Karachi"
                className="w-full bg-black/40 ring-1 ring-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-white/25"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 block mb-1">Instagram handle <span className="text-gray-600">(without @)</span></label>
            <input
              type="text"
              value={form.instagram}
              onChange={e => setForm({ ...form, instagram: e.target.value })}
              placeholder="e.g. scentnstories"
              className="w-full bg-black/40 ring-1 ring-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-white/25"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 block mb-1">Website URL</label>
            <input
              type="url"
              value={form.website}
              onChange={e => setForm({ ...form, website: e.target.value })}
              placeholder="https://..."
              className="w-full bg-black/40 ring-1 ring-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-white/25"
            />
          </div>

          {error && <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-xl transition"
            >
              {loading ? 'Saving…' : 'Save Profile'}
            </button>
            <button type="button" onClick={onClose}
              className="px-4 bg-white/5 hover:bg-white/10 text-gray-400 text-sm rounded-xl transition">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const ADMIN_IDENTITY = { type: 'admin', displayName: 'Admin', permissions: { is_admin: true, can_manage_sellers: true, can_manage_houses: true, can_manage_reviews: true } };

export default function AdminHouses({ identity = ADMIN_IDENTITY }) {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');

  async function load() {
    const res = await fetch('/api/admin/houses');
    if (res.status === 401) { router.push('/pfc-mgmt/login'); return; }
    const data = await res.json();
    setHouses(data); setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleLogout() {
    if (identity?.type === 'admin') await fetch('/api/admin/auth', { method: 'DELETE' });
    else await supabase.auth.signOut();
    router.push('/pfc-mgmt/login');
  }

  const filtered = useMemo(() => {
    if (!search) return houses;
    const q = search.toLowerCase();
    return houses.filter(h => h.house.toLowerCase().includes(q) || (h.director || '').toLowerCase().includes(q));
  }, [houses, search]);

  const withProfile = houses.filter(h => h.description).length;
  const withCity = houses.filter(h => h.city).length;

  if (!identity.permissions.can_manage_houses && !identity.permissions.is_admin) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <AdminNav currentPage="houses" identity={identity} onLogout={handleLogout} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-1">Access restricted</p>
            <p className="text-gray-600 text-xs">You don&apos;t have permission to manage houses.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Houses | PFC Admin</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      {editing && (
        <EditModal
          house={editing}
          onClose={() => setEditing(null)}
          onSuccess={() => { setEditing(null); load(); }}
        />
      )}

      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <AdminNav currentPage="houses" identity={identity} onLogout={handleLogout} />

        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">House Profiles</h1>
              <p className="text-sm text-gray-500 mt-1">
                {withProfile} / {houses.length} have descriptions &nbsp;·&nbsp;
                {withCity} / {houses.length} have city
              </p>
            </div>
            <div className="text-xs text-gray-600 text-right max-w-xs">
              Descriptions power house profile pages + Google rich snippets
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-6 h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#2a5c4f] to-[#94aea7] transition-all"
              style={{ width: `${houses.length ? (withProfile / houses.length) * 100 : 0}%` }}
            />
          </div>

          {/* Search */}
          <div className="mb-5">
            <input
              type="text"
              placeholder="Search houses..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full max-w-sm bg-white/5 ring-1 ring-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-gray-600 outline-none focus:ring-white/25"
            />
          </div>

          {loading ? (
            <div className="text-gray-500 text-sm py-10 text-center">Loading…</div>
          ) : (
            <div className="space-y-2">
              {filtered.map(house => (
                <div key={house.id} className="flex items-center gap-4 rounded-xl bg-white/[0.03] ring-1 ring-white/8 px-4 py-3 hover:bg-white/5 transition">
                  {/* Status dot */}
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${house.status === 'active' ? 'bg-emerald-400' : house.status === 'grace' ? 'bg-yellow-400' : 'bg-red-400'}`} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-white">{house.house}</span>
                      {house.description && (
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded">profile</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5 truncate">
                      {house.director || '—'}
                      {house.city && ` · ${house.city}`}
                      {house.established_year && ` · Est. ${house.established_year}`}
                    </p>
                    {house.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">{house.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a
                      href={`/houses/${house.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-gray-600 hover:text-[#94aea7] transition"
                    >
                      ↗
                    </a>
                    <button
                      onClick={() => setEditing(house)}
                      className="text-xs bg-white/8 hover:bg-white/15 text-gray-300 px-3 py-1.5 rounded-lg transition"
                    >
                      {house.description ? 'Edit' : 'Add Profile'}
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
