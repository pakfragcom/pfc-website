import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/router';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import CartLines from '../components/shop/CartLines';
import { useCart, useCartOffers } from '../lib/cart';
import { formatPKR } from '../lib/shop-format';
import { createApiSupabaseClient } from '../lib/server-supabase';
import { supabaseAdmin } from '../lib/supabase-admin';
import { isShopEnabled, getSetting } from '../lib/shop';

export async function getServerSideProps({ req, res }) {
  if (!(await isShopEnabled())) return { notFound: true };
  const supabase = createApiSupabaseClient(req, res);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { redirect: { destination: '/auth/login?next=/checkout', permanent: false } };

  const [{ data: addr }, fee] = await Promise.all([
    supabaseAdmin
      .from('customer_addresses')
      .select('full_name, phone, city, address')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    getSetting('shipping_fee_pkr'),
  ]);

  res.setHeader('Cache-Control', 'private, no-store');
  return {
    props: {
      email: user.email || '',
      saved: addr || null,
      shippingFee: Math.max(0, Number(fee) || 0),
    },
  };
}

const input = 'w-full rounded-xl bg-black/40 px-4 py-3 text-sm text-white outline-none ring-1 ring-white/10 placeholder:text-gray-600 focus:ring-white/30';

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-gray-300">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-gray-500">{hint}</span>}
    </label>
  );
}

export default function CheckoutPage({ email, saved, shippingFee }) {
  const router = useRouter();
  const { lines, clear } = useCart();
  const { items, loading, error: loadError, closed, needsQuote, subtotal } = useCartOffers(lines);
  const [form, setForm] = useState({
    name: saved?.full_name || '',
    phone: saved?.phone ? saved.phone.replace(/^\+92/, '0') : '',
    city: saved?.city || '',
    address: saved?.address || '',
    note: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const delivery = needsQuote ? 0 : shippingFee;
  const total = subtotal + delivery;

  async function submit(e) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const r = await fetch('/api/shop/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ...form, lines: items.map(({ id, qty }) => ({ id, qty })) }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.status === 401) { router.push('/auth/login?next=/checkout'); return; }
      if (!r.ok) {
        setError(j.error || 'Could not place the order. Please try again.');
        setSubmitting(false);
        return;
      }
      clear();
      router.replace(`/shop/orders/${j.order_number}?placed=1`);
    } catch {
      setError('Network problem. Check your connection and try again.');
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-black text-white font-sans">
      <Head>
        <title>Checkout | PFC shop</title>
        <meta name="robots" content="noindex" />
      </Head>
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-20 sm:py-24">
        <h1 className="text-3xl font-semibold tracking-tight text-[#F5F5F7] sm:text-4xl">
          {needsQuote ? 'Request a quote' : 'Checkout'}
        </h1>

        {loadError ? (
          <p className="mt-8 text-sm text-red-300">{loadError}</p>
        ) : loading ? (
          <p className="mt-8 text-sm text-gray-400">Loading…</p>
        ) : closed || items.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 px-6 py-12 text-center">
            <p className="text-sm text-gray-400">{closed ? 'The shop is closed right now.' : 'Your cart is empty.'}</p>
            <Link href="/shop" className="mt-4 inline-flex rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-black transition hover:bg-[#e6ebe9]">Browse the shop</Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-10 md:grid-cols-[1fr_380px]">
            <form onSubmit={submit} className="space-y-5" noValidate>
              <h2 className="text-base font-semibold text-[#F5F5F7]">Delivery details</h2>
              <Field label="Full name">
                <input className={input} value={form.name} onChange={set('name')} autoComplete="name" required maxLength={80} />
              </Field>
              <Field label="WhatsApp number" hint="We send your quote, bank details and tracking here.">
                <input className={input} value={form.phone} onChange={set('phone')} autoComplete="tel" inputMode="tel" placeholder="0300 1234567" required maxLength={20} />
              </Field>
              <Field label="City">
                <input className={input} value={form.city} onChange={set('city')} autoComplete="address-level2" required maxLength={60} />
              </Field>
              <Field label="Full address" hint="House number, street, area and a landmark if it helps the courier.">
                <textarea className={`${input} min-h-[96px]`} value={form.address} onChange={set('address')} autoComplete="street-address" required maxLength={300} />
              </Field>
              <Field label="Note (optional)">
                <textarea className={`${input} min-h-[72px]`} value={form.note} onChange={set('note')} maxLength={500} placeholder="Anything we should know" />
              </Field>
              {email && <p className="text-xs text-gray-500">Signed in as {email}.</p>}

              {error && <p role="alert" className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-300 ring-1 ring-red-500/20">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-black transition hover:bg-[#e6ebe9] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:opacity-60"
              >
                {submitting ? 'Placing order…' : needsQuote ? 'Send quote request' : `Place order for ${formatPKR(total)}`}
              </button>
              <p className="text-xs text-gray-500">
                {needsQuote
                  ? 'Nothing to pay yet. We confirm the final price and delivery with the seller and message you the quote and bank details.'
                  : 'After you place the order you will see our bank details. Transfer the amount and upload the receipt; we ship once it is verified.'}
              </p>
            </form>

            <aside className="h-fit rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
              <h2 className="text-base font-semibold text-[#F5F5F7]">Your order</h2>
              <CartLines items={items} />
              <dl className="mt-2 space-y-2 border-t border-white/10 pt-4 text-sm">
                <div className="flex justify-between"><dt className="text-gray-400">{needsQuote ? 'Estimated subtotal' : 'Subtotal'}</dt><dd>{formatPKR(subtotal)}</dd></div>
                <div className="flex justify-between">
                  <dt className="text-gray-400">Delivery</dt>
                  <dd>{needsQuote ? 'In your quote' : delivery ? formatPKR(delivery) : 'Free'}</dd>
                </div>
                <div className="flex justify-between border-t border-white/10 pt-2 text-base font-semibold">
                  <dt>{needsQuote ? 'Estimate' : 'Total'}</dt><dd>{formatPKR(total)}</dd>
                </div>
              </dl>
              <Link href="/cart" className="mt-4 inline-block text-xs text-gray-400 underline underline-offset-2 hover:text-white">Edit cart</Link>
            </aside>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
