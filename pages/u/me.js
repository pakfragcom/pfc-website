import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { createServerClient } from '@supabase/ssr';
import { supabaseAdmin } from '../../lib/supabase-admin';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';

const PAKISTAN_CITIES = [
  'Karachi','Lahore','Islamabad','Rawalpindi','Faisalabad','Multan',
  'Peshawar','Quetta','Sialkot','Gujranwala','Hyderabad','Abbottabad',
  'Bahawalpur','Sargodha','Sukkur','Other',
];

const RESERVED_USERNAMES = ['me','admin','api','auth','pfc-mgmt','login','signup','callback'];

const STATUS_COLORS = {
  active: 'text-emerald-400 bg-emerald-500/10 ring-emerald-500/20',
  grace:  'text-yellow-400 bg-yellow-500/10 ring-yellow-500/20',
  expired:'text-red-400 bg-red-500/10 ring-red-500/20',
  pending:'text-blue-400 bg-blue-500/10 ring-blue-500/20',
};

const CATEGORY_LABELS = {
  designer: 'Designer', middle_eastern: 'Middle Eastern', niche: 'Niche', local: 'Local Brand',
};

function daysUntil(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
}

function DaysChip({ days }) {
  if (days === null) return <span className="text-gray-600">—</span>;
  if (days < 0) return <span className="text-red-400 text-xs">{Math.abs(days)}d overdue</span>;
  if (days <= 7) return <span className="text-red-400 text-xs font-medium">{days}d left</span>;
  if (days <= 14) return <span className="text-orange-400 text-xs font-medium">{days}d left</span>;
  return <span className="text-gray-400 text-xs">{days}d left</span>;
}

// ── Edit Profile Modal ──────────────────────────────────────────────
function EditProfileModal({ profile, onClose, onSave }) {
  const [form, setForm] = useState({
    display_name: profile.display_name || '',
    city: profile.city || '',
    bio: profile.bio || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function submit(e) {
    e.preventDefault();
    setLoading(true); setError('');
    const res = await fetch('/api/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      onClose();
      router.reload();
    } else {
      const d = await res.json();
      setError(d.error || 'Failed to save');
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="bg-[#111] ring-1 ring-white/10 rounded-2xl p-6 w-full max-w-md">
        <h3 className="font-semibold text-lg mb-5">Edit Profile</h3>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Display Name</label>
            <input
              type="text"
              value={form.display_name}
              onChange={e => setForm({ ...form, display_name: e.target.value })}
              maxLength={80}
              required
              className="w-full bg-black/40 ring-1 ring-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-white/25"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">City</label>
            <select
              value={form.city}
              onChange={e => setForm({ ...form, city: e.target.value })}
              className="w-full bg-black/40 ring-1 ring-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-white/25"
            >
              <option value="">Select city</option>
              {PAKISTAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">
              Bio <span className="text-gray-600">{form.bio.length}/280</span>
            </label>
            <textarea
              value={form.bio}
              onChange={e => setForm({ ...form, bio: e.target.value })}
              maxLength={280}
              rows={3}
              placeholder="Tell the community about your fragrance journey…"
              className="w-full bg-black/40 ring-1 ring-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-white/25 resize-none"
            />
          </div>

          {error && <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-gray-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-gradient-to-r from-[#2a5c4f] to-[#4a7a6e] py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
            >
              {loading ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Seller Card ──────────────────────────────────────────────
function SellerCard({ seller }) {
  const [copied, setCopied] = useState(false);
  const days = daysUntil(seller.subscription_expires_at);
  const expiryDate = seller.subscription_expires_at
    ? new Date(seller.subscription_expires_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  function copyCode() {
    navigator.clipboard.writeText(seller.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-semibold text-white">Seller Account</h2>
          <p className="text-xs text-gray-500 mt-0.5">{seller.name}</p>
        </div>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ${STATUS_COLORS[seller.status] || STATUS_COLORS.pending}`}>
          {seller.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-black/30 rounded-xl p-3">
          <p className="text-xs text-gray-500 mb-1">Verification Code</p>
          <div className="flex items-center gap-2">
            <span className="font-mono font-semibold text-white">{seller.code}</span>
            <button
              onClick={copyCode}
              className="text-xs text-gray-500 hover:text-white transition"
              title="Copy code"
            >
              {copied ? (
                <svg className="h-3.5 w-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
              ) : (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
              )}
            </button>
          </div>
        </div>

        <div className="bg-black/30 rounded-xl p-3">
          <p className="text-xs text-gray-500 mb-1">Type</p>
          <span className="font-medium text-white">{seller.seller_type}</span>
        </div>

        <div className="bg-black/30 rounded-xl p-3">
          <p className="text-xs text-gray-500 mb-1">Expires</p>
          <p className="text-white text-xs">{expiryDate || '—'}</p>
        </div>

        <div className="bg-black/30 rounded-xl p-3">
          <p className="text-xs text-gray-500 mb-1">Time Left</p>
          <DaysChip days={days} />
        </div>
      </div>

      {seller.status === 'expired' && (
        <p className="mt-3 text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
          Your subscription has expired. Contact admin to renew.
        </p>
      )}
      {seller.status === 'grace' && (
        <p className="mt-3 text-xs text-yellow-400 bg-yellow-500/10 rounded-lg px-3 py-2">
          Grace period active — renew soon to keep your verified badge.
        </p>
      )}

      <Link
        href="/tools/verify-seller"
        className="mt-3 inline-flex items-center gap-1.5 text-xs text-[#94aea7] hover:text-white transition"
      >
        View public listing
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
      </Link>
    </div>
  );
}

// ── Claim Seller Section ──────────────────────────────────────────────
function ClaimSellerSection({ onClaimed }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function submit(e) {
    e.preventDefault();
    setLoading(true); setError('');
    const res = await fetch('/api/profile/claim-seller', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    if (res.ok) {
      router.reload();
    } else {
      const d = await res.json();
      setError(d.error || 'Something went wrong');
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h2 className="text-sm font-semibold text-white mb-1">Verified Seller?</h2>
      <p className="text-xs text-gray-500 mb-4">
        If you are a PFC-verified seller, enter your verification code below to link your account and see your subscription status.
      </p>
      <form onSubmit={submit} className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          placeholder="e.g. AK-001"
          className="flex-1 bg-black/40 ring-1 ring-white/10 rounded-xl px-3 py-2 text-sm text-white font-mono placeholder-gray-600 outline-none focus:ring-white/25 uppercase"
        />
        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="px-4 py-2 rounded-xl bg-[#2a5c4f] text-sm font-medium text-white hover:brightness-110 transition disabled:opacity-50"
        >
          {loading ? '…' : 'Claim'}
        </button>
      </form>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}

// ── Admin Section ──────────────────────────────────────────────
function AdminSection() {
  return (
    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-5">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-amber-500/15 flex items-center justify-center flex-shrink-0">
          <svg className="h-4 w-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.955 11.955 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/>
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">Site Administrator</p>
          <p className="text-xs text-gray-500">You have full admin access</p>
        </div>
        <Link
          href="/pfc-mgmt"
          className="px-3 py-1.5 rounded-lg bg-amber-500/15 text-xs font-medium text-amber-400 hover:bg-amber-500/25 transition ring-1 ring-amber-500/20"
        >
          Admin Dashboard →
        </Link>
      </div>
    </div>
  );
}

// ── My Reviews Section ──────────────────────────────────────────────
function MyReviewsSection({ reviews }) {
  const approved = reviews.filter(r => r.status === 'approved');
  const pending = reviews.filter(r => r.status === 'pending');
  const rejected = reviews.filter(r => r.status === 'rejected');

  if (reviews.length === 0) {
    return (
      <div>
        <h2 className="text-sm uppercase tracking-widest text-gray-500 mb-4">My Reviews</h2>
        <div className="text-center py-12 border border-white/10 rounded-2xl">
          <p className="text-gray-500 text-sm">No reviews yet.</p>
          <Link href="/reviews/submit" className="mt-3 inline-block text-sm text-[#94aea7] hover:text-white transition">
            Write your first review →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm uppercase tracking-widest text-gray-500">My Reviews</h2>
        <Link href="/reviews/submit" className="text-xs text-[#94aea7] hover:text-white transition">
          + Write Review
        </Link>
      </div>

      <div className="space-y-3">
        {approved.map(review => <ReviewCard key={review.id} review={review} />)}
        {pending.map(review => <ReviewCard key={review.id} review={review} pending />)}
        {rejected.map(review => <ReviewCard key={review.id} review={review} rejected />)}
      </div>
    </div>
  );
}

function ReviewCard({ review, pending, rejected }) {
  const inner = (
    <div className={`flex items-start gap-4 rounded-2xl border p-4 transition-all ${
      pending
        ? 'border-amber-500/15 bg-amber-500/[0.03]'
        : rejected
        ? 'border-red-500/15 bg-red-500/[0.03] opacity-60'
        : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20'
    }`}>
      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#2a5c4f]/40 to-[#94aea7]/20 flex-shrink-0 overflow-hidden">
        {review.cover_image_url && (
          <img src={review.cover_image_url} alt="" className="w-full h-full object-cover opacity-70" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-white text-sm leading-snug">{review.fragrance_name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{review.house} · {CATEGORY_LABELS[review.category]}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {pending && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20">
                Awaiting review
              </span>
            )}
            {rejected && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-red-500/10 text-red-400 ring-1 ring-red-500/20">
                Not approved
              </span>
            )}
            {!pending && !rejected && (
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i} className={`h-3 w-3 ${i < Math.round(review.rating_overall) ? 'text-[#94aea7]' : 'text-white/15'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                ))}
              </div>
            )}
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">{review.review_text}</p>
        {rejected && review.reject_reason && (
          <p className="text-xs text-red-400/70 mt-1.5">Reason: {review.reject_reason}</p>
        )}
      </div>
    </div>
  );

  if (!pending && !rejected && review.slug) {
    return <Link href={`/reviews/${review.slug}`}>{inner}</Link>;
  }
  return inner;
}

// ── Main Page ──────────────────────────────────────────────
export default function MyProfile({ profile, reviews, seller, isAdmin }) {
  const [editOpen, setEditOpen] = useState(false);
  const router = useRouter();
  const isWelcome = router.query.welcome === '1';

  const initials = (profile.display_name || 'U')
    .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const joinDate = new Date(profile.created_at).toLocaleDateString('en-PK', { month: 'long', year: 'numeric' });

  return (
    <>
      <Head>
        <title>My Profile | PFC</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div className="bg-black min-h-screen text-white">
        <Header />

        <main className="pt-24 pb-20">
          {/* Welcome banner for first-time users */}
          {isWelcome && (
            <div className="max-w-4xl mx-auto px-6 mb-0 -mt-2">
              <div className="rounded-xl border border-[#2a5c4f]/40 bg-[#2a5c4f]/10 px-5 py-4 flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#2a5c4f]/30 flex items-center justify-center mt-0.5">
                  <svg className="w-4 h-4 text-[#94aea7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Welcome to PFC!</p>
                  <p className="text-xs text-gray-400 mt-0.5">You&apos;re signed in. Set your display name and city so the community knows who you are.</p>
                </div>
                <button onClick={() => setEditOpen(true)}
                  className="ml-auto flex-shrink-0 text-xs text-[#94aea7] hover:text-white transition font-medium">
                  Complete profile →
                </button>
              </div>
            </div>
          )}

          {/* Profile header */}
          <div className="relative border-b border-white/10 overflow-hidden">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute left-0 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-[#2a5c4f]/12 blur-3xl" />
            </div>
            <div className="max-w-4xl mx-auto px-6 py-12 relative">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-[#2a5c4f] to-[#94aea7] flex items-center justify-center text-2xl font-bold text-white flex-shrink-0 ring-4 ring-white/10">
                  {profile.avatar_url
                    ? <img src={profile.avatar_url} alt={profile.display_name} className="w-full h-full rounded-full object-cover" />
                    : initials}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-extrabold text-white">{profile.display_name}</h1>
                    {isAdmin && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20">Admin</span>
                    )}
                    {seller && seller.status !== 'expired' && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
                        ✓ {seller.seller_type} Seller
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                    <span className="text-xs text-gray-600">@{profile.username}</span>
                    {profile.city && (
                      <span className="text-sm text-gray-400 flex items-center gap-1">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/></svg>
                        {profile.city}
                      </span>
                    )}
                    <span className="text-sm text-gray-500">Member since {joinDate}</span>
                  </div>
                  {profile.bio && <p className="text-sm text-gray-400 mt-2 max-w-xl">{profile.bio}</p>}
                </div>

                <button
                  onClick={() => setEditOpen(true)}
                  className="flex-shrink-0 px-4 py-2 rounded-xl border border-white/10 text-sm text-gray-400 hover:text-white hover:border-white/20 transition"
                >
                  Edit Profile
                </button>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="max-w-4xl mx-auto px-6 mt-8 space-y-6">
            {isAdmin && <AdminSection />}
            {seller ? <SellerCard seller={seller} /> : <ClaimSellerSection />}
            <MyReviewsSection reviews={reviews} />
          </div>
        </main>

        <Footer />
      </div>

      {editOpen && (
        <EditProfileModal
          profile={profile}
          onClose={() => setEditOpen(false)}
          onSave={() => setEditOpen(false)}
        />
      )}
    </>
  );
}

// ── Server-side data fetching ──────────────────────────────────────────────
export async function getServerSideProps({ req, res }) {
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
  if (!user) {
    return { redirect: { destination: '/auth/login?next=/u/me', permanent: false } };
  }

  // Fetch or create profile
  let { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    const rawName = user.user_metadata?.full_name || user.user_metadata?.name || user.email.split('@')[0];
    let baseUsername = rawName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 30) || 'user';

    if (RESERVED_USERNAMES.includes(baseUsername)) baseUsername = `user-${baseUsername}`;

    const { data: existing } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('username', baseUsername)
      .maybeSingle();

    const username = existing
      ? `${baseUsername}-${Math.floor(1000 + Math.random() * 9000)}`
      : baseUsername;

    const { data: newProfile } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: user.id,
        username,
        display_name: rawName,
        city: user.user_metadata?.city || null,
      })
      .select()
      .single();

    profile = newProfile;
  }

  if (!profile) {
    return { redirect: { destination: '/auth/login', permanent: false } };
  }

  // Reviews (all statuses for this user)
  const { data: reviews } = await supabaseAdmin
    .from('reviews')
    .select('id, slug, fragrance_name, house, category, rating_overall, review_text, cover_image_url, status, reject_reason, published_at')
    .eq('author_id', user.id)
    .order('created_at', { ascending: false });

  // Seller record linked to this user
  const { data: seller } = await supabaseAdmin
    .from('sellers')
    .select('id, name, code, seller_type, status, subscription_expires_at, city, contact_whatsapp')
    .eq('user_id', user.id)
    .maybeSingle();

  const isAdmin = profile.role === 'admin';

  return {
    props: {
      profile,
      reviews: reviews || [],
      seller: seller || null,
      isAdmin,
    },
  };
}
