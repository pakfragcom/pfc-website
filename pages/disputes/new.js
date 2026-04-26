import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '../../lib/auth-context';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';

const CATEGORIES = [
  { id: 'not_received',           label: 'Item not received',          desc: 'You paid but never received the item' },
  { id: 'condition_misrepresented', label: 'Condition misrepresented',  desc: 'Item was not as described (e.g. claimed sealed, was used)' },
  { id: 'fake',                   label: 'Counterfeit / Fake',          desc: 'You suspect the item was not authentic' },
  { id: 'price_dispute',          label: 'Price dispute',               desc: 'Charged differently from what was agreed' },
  { id: 'other',                  label: 'Other',                       desc: 'Something else went wrong' },
];

export default function NewDisputePage() {
  const router = useRouter();
  const user = useUser();

  const { transaction_id } = router.query;

  const [txDetails, setTxDetails]   = useState(null);
  const [txLoading, setTxLoading]   = useState(false);
  const [txError, setTxError]       = useState('');
  const [manualTxId, setManualTxId] = useState('');

  const [category, setCategory]     = useState('');
  const [description, setDescription] = useState('');
  const [evidenceRaw, setEvidenceRaw] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');
  const [doneId, setDoneId]         = useState(null);

  // Redirect if not logged in
  useEffect(() => {
    if (user === null) router.replace('/auth/login?next=/disputes/new');
  }, [user]);

  // Auto-fetch transaction details if transaction_id in URL
  useEffect(() => {
    const id = transaction_id || manualTxId.trim();
    if (!id || id.length < 10) { setTxDetails(null); return; }
    let cancelled = false;
    setTxLoading(true);
    setTxError('');
    fetch(`/api/transactions/details?id=${id}`)
      .then(r => r.json())
      .then(d => {
        if (cancelled) return;
        if (d.error) { setTxError(d.error); setTxDetails(null); }
        else setTxDetails(d);
        setTxLoading(false);
      })
      .catch(() => { if (!cancelled) { setTxError('Failed to load transaction'); setTxLoading(false); } });
    return () => { cancelled = true; };
  }, [transaction_id, manualTxId]);

  async function submit(e) {
    e.preventDefault();
    if (!category) { setError('Please select a category.'); return; }
    if (description.trim().length < 10) { setError('Please describe the issue in at least 10 characters.'); return; }

    const txId = transaction_id || manualTxId.trim();
    if (!txId) { setError('Please enter your Transaction ID.'); return; }

    setSubmitting(true);
    setError('');

    const evidenceUrls = evidenceRaw
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.startsWith('http'));

    const res = await fetch('/api/disputes/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transaction_id: txId,
        category,
        description: description.trim(),
        evidence_urls: evidenceUrls,
      }),
    });

    const json = await res.json();
    if (!res.ok) { setError(json.error || 'Something went wrong.'); setSubmitting(false); return; }
    setDoneId(json.id);
  }

  if (!user) return null;

  const inputCls = 'w-full bg-black/40 ring-1 ring-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 outline-none focus:ring-white/25 text-sm';

  if (doneId) {
    return (
      <>
        <Head><title>Dispute Submitted | PakFrag</title></Head>
        <div className="bg-black min-h-screen text-white">
          <Header />
          <main className="mx-auto max-w-xl px-4 py-28 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30 text-2xl">
              ⚑
            </div>
            <h1 className="text-2xl font-bold mb-2">Dispute submitted</h1>
            <p className="text-sm text-gray-400 mb-1">
              Our team will review it and reach out to both parties via WhatsApp.
            </p>
            <p className="text-xs text-gray-600 mb-8">
              Resolution typically takes 2–5 business days.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {txDetails?.sellers?.slug && (
                <Link href={`/sellers/${txDetails.sellers.slug}`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-5 py-2.5 text-sm font-medium text-white transition">
                  View seller profile →
                </Link>
              )}
              <Link href="/"
                className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-5 py-2.5 text-sm font-medium text-gray-300 transition">
                Home
              </Link>
            </div>
          </main>
          <Footer />
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Report a Dispute | PakFrag</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div className="bg-black min-h-screen text-white">
        <Header />

        <main className="mx-auto max-w-xl px-4 py-20 sm:py-28">
          <nav className="mb-8 text-sm text-gray-500">
            <Link href="/" className="hover:text-white transition">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-300">Report a Dispute</span>
          </nav>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#F5F5F7] tracking-tight">Report a Dispute</h1>
            <p className="mt-3 text-sm text-gray-400 max-w-md">
              Something went wrong with a logged transaction? Tell us what happened and we'll reach out to both parties.
            </p>
          </div>

          <form onSubmit={submit} className="space-y-6">
            {/* Transaction ID */}
            {!transaction_id && (
              <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5 space-y-3">
                <h2 className="text-sm font-semibold text-white">Transaction ID</h2>
                <p className="text-xs text-gray-500">
                  Enter the transaction ID from your log-transaction confirmation. It looks like a long string of letters and numbers.
                </p>
                <input
                  type="text"
                  value={manualTxId}
                  onChange={e => setManualTxId(e.target.value)}
                  placeholder="e.g. 3f2e1a9b-…"
                  className={inputCls}
                />
                {txLoading && <p className="text-xs text-gray-500">Looking up transaction…</p>}
                {txError && <p className="text-xs text-red-400">{txError}</p>}
              </div>
            )}

            {/* Transaction preview */}
            {txDetails && (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-4 text-sm">
                <p className="text-xs text-emerald-500 uppercase tracking-wider mb-1">Transaction found</p>
                <p className="font-semibold text-white">{txDetails.fragrance_name || 'Multi-item transaction'}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Seller: {txDetails.sellers?.name}
                  {txDetails.price_pkr && ` · Rs ${txDetails.price_pkr.toLocaleString()}`}
                  {txDetails.city && ` · ${txDetails.city}`}
                </p>
              </div>
            )}

            {/* Category */}
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5 space-y-3">
              <h2 className="text-sm font-semibold text-white">What went wrong?</h2>
              <div className="space-y-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={[
                      'w-full text-left rounded-xl border px-4 py-3 transition',
                      category === cat.id
                        ? 'border-amber-500/40 bg-amber-500/10'
                        : 'border-white/8 bg-white/[0.01] hover:border-white/15',
                    ].join(' ')}
                  >
                    <p className={`text-sm font-medium ${category === cat.id ? 'text-amber-300' : 'text-white'}`}>
                      {cat.label}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{cat.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5 space-y-3">
              <h2 className="text-sm font-semibold text-white">Describe what happened</h2>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={5}
                placeholder="Explain the situation in detail — what you ordered, what you received (or didn't), and any steps you already took to resolve it with the seller."
                className={inputCls + ' resize-none'}
              />
              <p className="text-[10px] text-gray-600">{description.trim().length} / 10 characters minimum</p>
            </div>

            {/* Evidence URLs */}
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5 space-y-3">
              <h2 className="text-sm font-semibold text-white">Evidence links <span className="text-gray-500 font-normal">(optional)</span></h2>
              <p className="text-xs text-gray-500">
                Paste image or screenshot links (one per line) — Google Drive, Imgur, WhatsApp Web, etc.
              </p>
              <textarea
                value={evidenceRaw}
                onChange={e => setEvidenceRaw(e.target.value)}
                rows={3}
                placeholder={'https://imgur.com/abc123\nhttps://drive.google.com/...'}
                className={inputCls + ' resize-none font-mono text-xs'}
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-semibold py-3 transition text-sm"
            >
              {submitting ? 'Submitting…' : 'Submit Dispute'}
            </button>

            <p className="text-xs text-center text-gray-600">
              Disputes are reviewed manually. We may contact you via WhatsApp for follow-up.
            </p>
          </form>
        </main>

        <Footer />
      </div>
    </>
  );
}
