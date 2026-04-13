import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const CATEGORY_LABELS = {
  designer: 'Designer', middle_eastern: 'Middle Eastern', niche: 'Niche', local: 'Local Brand',
};

const STATUS_COLORS = {
  pending:  'text-yellow-400 bg-yellow-500/10 ring-yellow-500/20',
  approved: 'text-emerald-400 bg-emerald-500/10 ring-emerald-500/20',
  rejected: 'text-red-400 bg-red-500/10 ring-red-500/20',
};

export default function AdminReviews() {
  const router = useRouter();
  const [reviews, setReviews]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('pending');
  const [expanded, setExpanded] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  async function load() {
    const res = await fetch('/api/admin/reviews');
    if (res.status === 401) { router.push('/pfc-mgmt/login'); return; }
    const data = await res.json();
    setReviews(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleLogout() {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    router.push('/pfc-mgmt/login');
  }

  async function action(reviewId, status, reason) {
    setActionLoading(reviewId);
    await fetch('/api/admin/reviews', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: reviewId, status, reject_reason: reason || null }),
    });
    await load();
    setExpanded(null);
    setRejectReason('');
    setActionLoading(null);
  }

  const filtered = reviews.filter(r => filter === 'all' || r.status === filter);

  const counts = {
    pending:  reviews.filter(r => r.status === 'pending').length,
    approved: reviews.filter(r => r.status === 'approved').length,
    rejected: reviews.filter(r => r.status === 'rejected').length,
  };

  const FILTERS = [
    { id: 'pending',  label: `Pending (${counts.pending})` },
    { id: 'approved', label: `Approved (${counts.approved})` },
    { id: 'rejected', label: `Rejected (${counts.rejected})` },
    { id: 'all',      label: `All (${reviews.length})` },
  ];

  return (
    <>
      <Head>
        <title>Reviews Queue | PFC Admin</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div className="min-h-screen bg-[#0a0a0a] text-white">
        {/* Top bar */}
        <div className="border-b border-white/10 bg-black/40 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-bold text-lg">PFC Admin</span>
            <nav className="flex gap-4 text-sm">
              <Link href="/pfc-mgmt" className="text-gray-400 hover:text-white transition">Overview</Link>
              <Link href="/pfc-mgmt/sellers" className="text-gray-400 hover:text-white transition">Sellers</Link>
              <span className="text-emerald-400 font-medium">Reviews</span>
            </nav>
          </div>
          <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-white transition">Sign out</button>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Review Queue</h1>
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
              <p className="text-gray-500 text-sm">No {filter !== 'all' ? filter : ''} reviews.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(review => (
                <div key={review.id} className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
                  {/* Row */}
                  <div className="flex items-start gap-4 p-5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3 flex-wrap">
                        <div>
                          <h3 className="font-semibold text-white">{review.fragrance_name}</h3>
                          <p className="text-xs text-gray-500 mt-0.5">{review.house} · {CATEGORY_LABELS[review.category]}</p>
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ring-1 ${STATUS_COLORS[review.status]}`}>
                          {review.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span>By {review.profiles?.display_name || 'Unknown'}</span>
                        {review.profiles?.city && <span>· {review.profiles.city}</span>}
                        <span>· {new Date(review.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}</span>
                        <span>· ⭐ {review.rating_overall}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => setExpanded(expanded === review.id ? null : review.id)}
                        className="text-xs bg-white/8 hover:bg-white/15 text-gray-200 px-3 py-1.5 rounded-lg transition">
                        {expanded === review.id ? 'Collapse' : 'Read'}
                      </button>
                      {review.status !== 'approved' && (
                        <button onClick={() => action(review.id, 'approved', null)}
                          disabled={actionLoading === review.id}
                          className="text-xs bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 px-3 py-1.5 rounded-lg transition disabled:opacity-50">
                          Approve
                        </button>
                      )}
                      {review.status !== 'rejected' && (
                        <button onClick={() => setExpanded(review.id === expanded ? null : `reject-${review.id}`)}
                          disabled={actionLoading === review.id}
                          className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg transition disabled:opacity-50">
                          Reject
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded review text */}
                  {expanded === review.id && (
                    <div className="px-5 pb-5 border-t border-white/8 pt-4">
                      <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{review.review_text}</p>
                      {review.reject_reason && (
                        <p className="mt-3 text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
                          Reject reason: {review.reject_reason}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Reject reason input */}
                  {expanded === `reject-${review.id}` && (
                    <div className="px-5 pb-5 border-t border-white/8 pt-4">
                      <label className="block text-xs text-gray-400 mb-2">Reason for rejection (shown to submitter)</label>
                      <textarea
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                        rows={3}
                        placeholder="e.g. Too short, insufficient detail. Please expand and resubmit."
                        className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-red-500/50 transition resize-none"
                      />
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => action(review.id, 'rejected', rejectReason)}
                          disabled={actionLoading === review.id}
                          className="text-xs bg-red-500/20 hover:bg-red-500/30 text-red-300 px-4 py-2 rounded-lg transition disabled:opacity-50">
                          Confirm Reject
                        </button>
                        <button onClick={() => { setExpanded(null); setRejectReason(''); }}
                          className="text-xs bg-white/8 hover:bg-white/15 text-gray-400 px-4 py-2 rounded-lg transition">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
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
