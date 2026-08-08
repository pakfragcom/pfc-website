import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient } from '../../lib/auth-context';
import AdminNav from '../../components/admin/AdminNav';

const BANNER_MIN_RATIO = 2.8;
const BANNER_MAX_RATIO = 3.2;
const BANNER_MAX_BYTES = 2 * 1024 * 1024;

function validateBannerFile(file) {
  return new Promise((resolve, reject) => {
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      reject(new Error('Only PNG, JPEG, or WebP images are allowed.'));
      return;
    }
    if (file.size > BANNER_MAX_BYTES) {
      reject(new Error('Image must be under 2MB.'));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const { naturalWidth: w, naturalHeight: h } = img;
      URL.revokeObjectURL(url);
      const ratio = w / h;
      if (ratio < BANNER_MIN_RATIO || ratio > BANNER_MAX_RATIO) {
        reject(new Error(`Image must be a wide banner, roughly 3:1 (e.g. 1200×400). Yours is ${w}×${h}.`));
        return;
      }
      if (w < 800 || h < 267 || w > 2400 || h > 800) {
        reject(new Error(`Image dimensions must be roughly between 800×267 and 2400×800px. Yours is ${w}×${h}.`));
        return;
      }
      resolve();
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read image file.'));
    };
    img.src = url;
  });
}

function EditModal({ house, onClose, onSuccess }) {
  const [form, setForm] = useState({
    description: house.description || '',
    established_year: house.established_year || '',
    instagram: house.instagram || '',
    website: house.website || '',
    city: house.city || '',
    logo_url: house.logo_url || '',
    tier: house.tier || 'emerging',
    is_sponsor: house.is_sponsor || false,
    sponsor_order: house.sponsor_order ?? '',
    sponsor_banner_url: house.sponsor_banner_url || '',
  });
  const [logoError, setLogoError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bannerUploading, setBannerUploading] = useState(false);
  const [bannerError, setBannerError] = useState('');
  const bannerFileRef = useRef(null);

  async function handleBannerFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerError('');
    setBannerUploading(true);
    try {
      await validateBannerFile(file);

      const urlRes = await fetch('/api/admin/houses/upload-banner-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ house_id: house.id, filename: file.name }),
      });
      if (!urlRes.ok) {
        const d = await urlRes.json();
        throw new Error(d.error || 'Could not start upload');
      }
      const { signedUrl, publicUrl } = await urlRes.json();

      const putRes = await fetch(signedUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      if (!putRes.ok) throw new Error('Upload failed');

      setForm(f => ({ ...f, sponsor_banner_url: publicUrl }));
    } catch (err) {
      setBannerError(err.message || 'Upload failed. Please try again.');
    } finally {
      setBannerUploading(false);
      if (bannerFileRef.current) bannerFileRef.current.value = '';
    }
  }

  async function submit(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/admin/houses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: house.id, ...form, logo_url: form.logo_url || null, tier: form.tier }),
      });
      if (res.ok) { onSuccess(); }
      else { const d = await res.json(); setError(d.error || 'Failed'); setLoading(false); }
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="bg-[#111] ring-1 ring-white/10 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h3 className="font-semibold text-lg mb-1">Edit House Profile</h3>
        <p className="text-sm text-gray-400 mb-5">{house.house} · <a href={`/houses/${house.slug}`} target="_blank" rel="noopener noreferrer" className="text-[#94aea7] hover:text-white">/houses/{house.slug} ↗</a></p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Description <span className="text-gray-400">(shown on profile page + Google)</span></label>
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
              <label className="text-xs text-gray-400 block mb-1">Established Year</label>
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
              <label className="text-xs text-gray-400 block mb-1">City</label>
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
            <label className="text-xs text-gray-400 block mb-1">MBP Tier <span className="text-gray-400">(fixed per quarter · controls placement on /mbp)</span></label>
            <select
              value={form.tier}
              onChange={e => setForm({ ...form, tier: e.target.value })}
              className="w-full bg-black/40 ring-1 ring-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-white/25 appearance-none"
            >
              <option value="diamond">◆ Diamond — Rs 24,000 / quarter</option>
              <option value="platinum">◈ Platinum — Rs 12,000 / quarter</option>
              <option value="gold">✦ Gold — Rs 6,000 / quarter</option>
              <option value="emerging">★ Emerging — Free</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Instagram handle <span className="text-gray-400">(without @)</span></label>
            <input
              type="text"
              value={form.instagram}
              onChange={e => setForm({ ...form, instagram: e.target.value })}
              placeholder="e.g. scentnstories"
              className="w-full bg-black/40 ring-1 ring-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-white/25"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Website URL</label>
            <input
              type="url"
              value={form.website}
              onChange={e => setForm({ ...form, website: e.target.value })}
              placeholder="https://..."
              className="w-full bg-black/40 ring-1 ring-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-white/25"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Logo URL <span className="text-gray-400">(paste any image URL — shown on MBP page &amp; house profile)</span></label>
            <input
              type="url"
              value={form.logo_url}
              onChange={e => { setForm({ ...form, logo_url: e.target.value }); setLogoError(false); }}
              placeholder="https://example.com/logo.png"
              className="w-full bg-black/40 ring-1 ring-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-white/25"
            />
            {form.logo_url && (
              <div className="mt-2 flex items-center gap-3">
                <div className="w-16 h-16 rounded-xl bg-white/5 ring-1 ring-white/10 overflow-hidden flex items-center justify-center flex-shrink-0">
                  {logoError ? (
                    <span className="text-[10px] text-gray-400 text-center px-1">Failed to load</span>
                  ) : (
                    <img
                      src={form.logo_url}
                      alt="Logo preview"
                      className="w-full h-full object-contain p-1.5"
                      onError={() => setLogoError(true)}
                      onLoad={() => setLogoError(false)}
                    />
                  )}
                </div>
                <p className="text-xs text-gray-400">{logoError ? 'Image could not be loaded — check the URL.' : 'Looks good! This is how it will appear on cards.'}</p>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-white/10">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                id="is_sponsor"
                checked={form.is_sponsor}
                onChange={e => setForm({ ...form, is_sponsor: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-white">Featured in /mbp carousel</span>
            </label>

            {form.is_sponsor && (
              <div className="mt-3 space-y-3 pl-6">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Display order <span className="text-gray-400">(lower shows first)</span></label>
                  <input
                    type="number"
                    value={form.sponsor_order}
                    onChange={e => setForm({ ...form, sponsor_order: e.target.value })}
                    placeholder="e.g. 1"
                    className="w-full bg-black/40 ring-1 ring-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-white/25"
                  />
                </div>

                <div>
                  <p className="text-xs text-gray-400 mb-1">
                    Ad banner <span className="text-gray-400">(wide banner, ~1200×400px, under 2MB — shown full-width in the /mbp carousel)</span>
                  </p>
                  <label className="block cursor-pointer">
                    <div className={[
                      'rounded-xl border-2 border-dashed p-4 text-center transition',
                      form.sponsor_banner_url ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-white/10 hover:border-white/25',
                    ].join(' ')}>
                      {bannerUploading ? (
                        <p className="text-xs text-gray-400">Uploading…</p>
                      ) : form.sponsor_banner_url ? (
                        <p className="text-xs text-emerald-400">✓ Banner uploaded — click to replace</p>
                      ) : (
                        <p className="text-xs text-gray-300">Click to upload banner image</p>
                      )}
                    </div>
                    <input
                      ref={bannerFileRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      disabled={bannerUploading}
                      className="sr-only"
                      onChange={handleBannerFile}
                    />
                  </label>
                  {bannerError && <p className="text-xs text-red-400 mt-1">{bannerError}</p>}
                  {form.sponsor_banner_url && !bannerUploading && (
                    <div className="mt-2 rounded-lg overflow-hidden border border-white/10" style={{ aspectRatio: '3 / 1' }}>
                      <img src={form.sponsor_banner_url} alt="Banner preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading || bannerUploading}
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
  const withLogo = houses.filter(h => h.logo_url).length;
  const tierCounts = { diamond: 0, platinum: 0, gold: 0, emerging: 0 };
  houses.forEach(h => { if (tierCounts[h.tier] !== undefined) tierCounts[h.tier]++; });

  if (!identity.permissions.can_manage_houses && !identity.permissions.is_admin) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <AdminNav currentPage="houses" identity={identity} onLogout={handleLogout} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-1">Access restricted</p>
            <p className="text-gray-400 text-xs">You don&apos;t have permission to manage houses.</p>
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
              <p className="text-sm text-gray-400 mt-1">
                {withProfile}/{houses.length} descriptions &nbsp;·&nbsp; {withLogo}/{houses.length} logos &nbsp;·&nbsp;
                ◆ {tierCounts.diamond} &nbsp;◈ {tierCounts.platinum} &nbsp;✦ {tierCounts.gold} &nbsp;★ {tierCounts.emerging}
              </p>
            </div>
            <div className="text-xs text-gray-400 text-right max-w-xs">
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
            <div className="text-gray-400 text-sm py-10 text-center">Loading…</div>
          ) : (
            <div className="space-y-2">
              {filtered.map(house => (
                <div key={house.id} className="flex items-center gap-4 rounded-xl bg-white/[0.03] ring-1 ring-white/8 px-4 py-3 hover:bg-white/5 transition">
                  {/* Logo thumbnail or status dot */}
                  {house.logo_url ? (
                    <div className="w-8 h-8 rounded-lg bg-white/5 ring-1 ring-white/10 overflow-hidden flex items-center justify-center flex-shrink-0">
                      <img src={house.logo_url} alt="" className="w-full h-full object-contain p-0.5" />
                    </div>
                  ) : (
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${house.status === 'active' ? 'bg-emerald-400' : house.status === 'grace' ? 'bg-yellow-400' : 'bg-red-400'}`} />
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-white">{house.house}</span>
                      {house.tier && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                          house.tier === 'diamond'  ? 'bg-sky-500/10 text-sky-400' :
                          house.tier === 'platinum' ? 'bg-white/8 text-gray-300' :
                          house.tier === 'gold'     ? 'bg-amber-500/10 text-amber-400' :
                          'bg-emerald-500/10 text-emerald-500'
                        }`}>
                          {house.tier === 'diamond' ? '◆' : house.tier === 'platinum' ? '◈' : house.tier === 'gold' ? '✦' : '★'} {house.tier}
                        </span>
                      )}
                      {house.description && (
                        <span className="text-[10px] bg-white/5 text-gray-400 px-1.5 py-0.5 rounded">profile</span>
                      )}
                      {house.logo_url && (
                        <span className="text-[10px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded">logo</span>
                      )}
                      {house.is_sponsor && (
                        <span className="text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded">★ featured</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {house.director || '—'}
                      {house.city && ` · ${house.city}`}
                      {house.established_year && ` · Est. ${house.established_year}`}
                    </p>
                    {house.description && (
                      <p className="text-xs text-gray-400 mt-1 line-clamp-1">{house.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a
                      href={`/houses/${house.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-gray-400 hover:text-[#94aea7] transition"
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
