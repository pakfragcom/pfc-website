import Head from 'next/head';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient } from '../../lib/auth-context';
import AdminNav from '../../components/admin/AdminNav';

const CATEGORY_LABELS = {
  designer: 'Designer', middle_eastern: 'Middle Eastern',
  niche: 'Niche', local: 'Local Brand',
};
const CATEGORIES = ['designer', 'middle_eastern', 'niche', 'local'];

const STATUS_COLORS = {
  pending:  'text-yellow-400 bg-yellow-500/10 ring-yellow-500/20',
  approved: 'text-emerald-400 bg-emerald-500/10 ring-emerald-500/20',
};

const ADMIN_IDENTITY = {
  type: 'admin', displayName: 'Admin',
  permissions: { is_admin: true, can_manage_sellers: true, can_manage_houses: true, can_manage_reviews: true },
};

function EditPanel({ frag, onSave, onClose }) {
  const [form, setForm] = useState({
    name:          frag.name          || '',
    house:         frag.house         || '',
    category:      frag.category      || '',
    concentration: frag.concentration || '',
    description:   frag.description   || '',
    image_url:     frag.image_url     || '',
    year_released: frag.year_released || '',
    notes_top:     frag.notes_top     || '',
    notes_heart:   frag.notes_heart   || '',
    notes_base:    frag.notes_base    || '',
  });
  const [saving, setSaving] = useState(false);
  const [autofilling, setAutofilling] = useState(false);
  const [autoMsg, setAutoMsg] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const fileRef = useRef(null);

  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadMsg('Uploading…');
    try {
      const urlRes = await fetch('/api/admin/fragrances/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fragrance_id: frag.id, filename: file.name }),
      });
      if (!urlRes.ok) throw new Error('Failed to get upload URL');
      const { signedUrl, publicUrl } = await urlRes.json();
      const uploadRes = await fetch(signedUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      if (!uploadRes.ok) throw new Error('Upload failed');
      setForm(f => ({ ...f, image_url: publicUrl }));
      setUploadMsg('✓ Uploaded');
    } catch (err) {
      setUploadMsg('Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }));
  }

  async function autoFill() {
    if (!form.name || !form.house) return;
    setAutofilling(true);
    setAutoMsg('');
    try {
      const p = new URLSearchParams({ name: form.name, house: form.house });
      const res = await fetch(`/api/fragrances/lookup?${p}`);
      const data = await res.json();
      if (data.found) {
        setForm(f => ({
          ...f,
          image_url:     data.image_url     || f.image_url,
          description:   data.description   || f.description,
          concentration: data.concentration || f.concentration,
          year_released: data.year_released ? String(data.year_released) : f.year_released,
        }));
        setAutoMsg('✓ Auto-filled from web');
      } else {
        setAutoMsg('No info found online');
      }
    } catch {
      setAutoMsg('Lookup failed');
    } finally {
      setAutofilling(false);
    }
  }

  async function save() {
    setSaving(true);
    const res = await fetch('/api/admin/fragrances', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: frag.id, ...form, year_released: form.year_released || null }),
    });
    if (res.ok) { onSave(); }
    else { setSaving(false); }
  }

  const inputCls = 'w-full bg-black/40 ring-1 ring-white/10 rounded-lg px-3 py-1.5 text-white text-xs placeholder-gray-600 outline-none focus:ring-white/20 transition';

  return (
    <div className="mt-4 pt-4 border-t border-white/8 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-gray-300">Edit Details</span>
        <div className="flex items-center gap-2">
          <button onClick={autoFill} disabled={autofilling || !form.name || !form.house}
            className="text-[11px] px-2.5 py-1 rounded-md bg-[#2a5c4f]/30 hover:bg-[#2a5c4f]/50 text-[#94aea7] hover:text-white transition disabled:opacity-40">
            {autofilling ? 'Looking up…' : 'Auto-fill from web'}
          </button>
          {autoMsg && <span className="text-[11px] text-gray-500">{autoMsg}</span>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] text-gray-500 mb-1">Name</label>
          <input value={form.name} onChange={set('name')} className={inputCls} />
        </div>
        <div>
          <label className="block text-[10px] text-gray-500 mb-1">House</label>
          <input value={form.house} onChange={set('house')} className={inputCls} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block text-[10px] text-gray-500 mb-1">Category</label>
          <select value={form.category} onChange={set('category')}
            className={inputCls + ' appearance-none'}>
            {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] text-gray-500 mb-1">Concentration</label>
          <input value={form.concentration} onChange={set('concentration')} placeholder="EDP, EDT…" className={inputCls} />
        </div>
        <div>
          <label className="block text-[10px] text-gray-500 mb-1">Year</label>
          <input type="number" value={form.year_released} onChange={set('year_released')} placeholder="2015" className={inputCls} />
        </div>
      </div>

      <div>
        <label className="block text-[10px] text-gray-500 mb-1">Image</label>
        <div className="flex gap-2 items-center">
          <input value={form.image_url} onChange={set('image_url')} placeholder="https://… or upload below" className={inputCls + ' flex-1'} />
          {form.image_url && (
            <img src={form.image_url} alt="" className="w-8 h-8 rounded object-contain bg-white/5 border border-white/10 flex-shrink-0"
              onError={e => { e.target.style.display = 'none'; }} />
          )}
        </div>
        <div className="flex items-center gap-2 mt-1.5">
          <label className={[
            'text-[11px] px-2.5 py-1 rounded-md cursor-pointer transition',
            uploading ? 'bg-white/5 text-gray-600' : 'bg-[#2a5c4f]/30 hover:bg-[#2a5c4f]/50 text-[#94aea7] hover:text-white'
          ].join(' ')}>
            {uploading ? 'Uploading…' : 'Upload photo'}
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only"
              disabled={uploading} onChange={handleImageUpload} />
          </label>
          {uploadMsg && <span className="text-[11px] text-gray-500">{uploadMsg}</span>}
        </div>
      </div>

      <div>
        <label className="block text-[10px] text-gray-500 mb-1">Description</label>
        <textarea value={form.description} onChange={set('description')} rows={2}
          className={inputCls + ' resize-none'} placeholder="Brief description…" />
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[['notes_top','Top Notes'],['notes_heart','Heart Notes'],['notes_base','Base Notes']].map(([f,l]) => (
          <div key={f}>
            <label className="block text-[10px] text-gray-500 mb-1">{l}</label>
            <input value={form[f]} onChange={set(f)} placeholder="comma-separated" className={inputCls} />
          </div>
        ))}
      </div>

      <div className="flex gap-2 pt-1">
        <button onClick={save} disabled={saving}
          className="text-xs bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 px-3 py-1.5 rounded-lg transition disabled:opacity-50">
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
        <button onClick={onClose}
          className="text-xs bg-white/5 hover:bg-white/10 text-gray-400 px-3 py-1.5 rounded-lg transition">
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function AdminFragrances({ identity = ADMIN_IDENTITY }) {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const [fragrances, setFragrances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [actionLoading, setActionLoading] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [activeTab, setActiveTab] = useState('fragrances');
  const [imgSubs, setImgSubs] = useState([]);
  const [imgSubsLoading, setImgSubsLoading] = useState(false);
  const [imgActionLoading, setImgActionLoading] = useState(null);

  async function load() {
    const res = await fetch('/api/admin/fragrances');
    if (res.status === 401) { router.push('/pfc-mgmt/login'); return; }
    const data = await res.json();
    setFragrances(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function loadImgSubs() {
    setImgSubsLoading(true);
    const res = await fetch('/api/admin/fragrances/image-submissions');
    if (res.ok) setImgSubs(await res.json());
    setImgSubsLoading(false);
  }

  useEffect(() => { load(); }, []);
  useEffect(() => { if (activeTab === 'images') loadImgSubs(); }, [activeTab]);

  async function approveImg(id) {
    setImgActionLoading(id);
    await fetch('/api/admin/fragrances/image-submissions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'approved' }),
    });
    await loadImgSubs();
    setImgActionLoading(null);
  }

  async function rejectImg(id) {
    setImgActionLoading(id);
    await fetch('/api/admin/fragrances/image-submissions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'rejected' }),
    });
    await loadImgSubs();
    setImgActionLoading(null);
  }

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
                Approve community-submitted fragrances. Use Edit to upload images.
              </p>
            </div>
            {counts.pending > 0 && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-yellow-500/15 text-yellow-400 ring-1 ring-yellow-500/25">
                {counts.pending} pending
              </span>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-white/8 pb-4">
            {[['fragrances', 'Fragrances'], ['images', 'Image Queue']].map(([id, label]) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={['text-sm px-4 py-1.5 rounded-lg font-medium transition',
                  activeTab === id ? 'bg-white text-black' : 'text-gray-400 hover:text-white'].join(' ')}>
                {label}
              </button>
            ))}
          </div>

          {/* Image submissions tab */}
          {activeTab === 'images' && (
            <div>
              {imgSubsLoading ? (
                <div className="text-gray-500 text-sm py-10 text-center">Loading…</div>
              ) : imgSubs.filter(s => s.status === 'pending').length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-gray-500 text-sm">No pending image submissions.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {imgSubs.filter(s => s.status === 'pending').map(sub => (
                    <div key={sub.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex items-center gap-4">
                      <img src={sub.image_url} alt=""
                        className="w-20 h-20 rounded-xl object-contain bg-black/40 border border-white/8 flex-shrink-0"
                        onError={e => { e.target.style.display='none'; }} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white text-sm">{sub.fragrances?.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{sub.fragrances?.house}</p>
                        <p className="text-xs text-gray-600 mt-1">By {sub.profiles?.display_name || 'Unknown'} · {new Date(sub.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => approveImg(sub.id)} disabled={imgActionLoading === sub.id}
                          className="text-xs bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 px-3 py-1.5 rounded-lg transition disabled:opacity-50">
                          Approve
                        </button>
                        <button onClick={() => rejectImg(sub.id)} disabled={imgActionLoading === sub.id}
                          className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg transition disabled:opacity-50">
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'fragrances' && <>
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
                  Ask users to submit fragrances at{' '}
                  <a href="/fragrances/submit" className="text-[#94aea7] hover:text-white transition" target="_blank">
                    /fragrances/submit
                  </a>.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(frag => (
                <div key={frag.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="flex items-start gap-4">
                    {/* Thumbnail */}
                    <div className="w-10 h-10 rounded-lg flex-shrink-0 bg-white/5 border border-white/8 overflow-hidden">
                      {frag.image_url
                        ? <img src={frag.image_url} alt="" className="w-full h-full object-cover" onError={e => { e.target.style.display='none'; }} />
                        : <div className="w-full h-full flex items-center justify-center text-white/15 text-xs">?</div>
                      }
                    </div>

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
                        {!frag.image_url && (
                          <span className="text-[10px] text-gray-600 ring-1 ring-white/8 rounded px-1.5 py-0.5">no image</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                        {frag.profiles?.display_name && <span>By {frag.profiles.display_name}</span>}
                        <span>· {new Date(frag.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {frag.status !== 'approved' && (
                        <button onClick={() => approve(frag.id)} disabled={actionLoading === frag.id}
                          className="text-xs bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 px-3 py-1.5 rounded-lg transition disabled:opacity-50">
                          Approve
                        </button>
                      )}
                      {frag.status === 'approved' && (
                        <button onClick={() => reject(frag.id)} disabled={actionLoading === frag.id}
                          className="text-xs bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 px-3 py-1.5 rounded-lg transition disabled:opacity-50">
                          Unpublish
                        </button>
                      )}
                      <button
                        onClick={() => setEditingId(editingId === frag.id ? null : frag.id)}
                        className="text-xs bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white px-3 py-1.5 rounded-lg transition">
                        {editingId === frag.id ? 'Close' : 'Edit'}
                      </button>
                      <button onClick={() => del(frag.id)} disabled={actionLoading === frag.id}
                        className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg transition disabled:opacity-50">
                        Delete
                      </button>
                    </div>
                  </div>

                  {editingId === frag.id && (
                    <EditPanel
                      frag={frag}
                      onSave={() => { setEditingId(null); load(); }}
                      onClose={() => setEditingId(null)}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
          </>}
        </div>
      </div>
    </>
  );
}

export { getServerSideProps } from '../../lib/admin-guard';
