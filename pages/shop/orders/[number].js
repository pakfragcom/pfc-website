import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Header from '../../../components/layout/Header';
import Footer from '../../../components/layout/Footer';
import ProductFrame from '../../../components/shop/ProductFrame';
import OrderStatusPill from '../../../components/shop/OrderStatusPill';
import { formatPKR, variantLabel, orderStatus, amountDue } from '../../../lib/shop-format';
import { createApiSupabaseClient } from '../../../lib/server-supabase';
import { fetchOrderForBuyer, getSetting } from '../../../lib/shop';
import { isOrderNumber } from '../../../lib/shop-order';

const PAYABLE = ['quoted', 'pending_payment'];

export async function getServerSideProps({ req, res, params }) {
  const number = String(params.number || '').toUpperCase();
  if (!isOrderNumber(number)) return { notFound: true };

  const supabase = createApiSupabaseClient(req, res);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { redirect: { destination: `/auth/login?next=/shop/orders/${number}`, permanent: false } };

  // Scoped to the signed-in buyer: someone else's order number is a 404.
  const order = await fetchOrderForBuyer(number, user.id);
  if (!order) return { notFound: true };

  const [bank, whatsapp] = PAYABLE.includes(order.status)
    ? await Promise.all([getSetting('bank_details'), getSetting('order_contact_whatsapp')])
    : ['', await getSetting('order_contact_whatsapp')];

  res.setHeader('Cache-Control', 'private, no-store');
  return { props: { order, bank, whatsapp } };
}

function waLink(num, text) {
  const d = String(num || '').replace(/[^\d]/g, '');
  if (!d) return null;
  return `https://wa.me/${d}?text=${encodeURIComponent(text)}`;
}

export default function OrderPage({ order, bank, whatsapp }) {
  const router = useRouter();
  const placed = router.query.placed === '1';
  const s = orderStatus(order.status);
  const payable = PAYABLE.includes(order.status);
  const due = amountDue(order);
  const wa = waLink(whatsapp, `Hi PFC, about my order ${order.order_number}`);

  return (
    <div className="bg-black text-white font-sans">
      <Head>
        <title>{`Order ${order.order_number} | PFC shop`}</title>
        <meta name="robots" content="noindex" />
      </Head>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-20 sm:py-24">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-gray-400">
          <Link href="/shop/orders" className="underline underline-offset-2 decoration-white/30 hover:text-white">My orders</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-300">{order.order_number}</span>
        </nav>

        {placed && (
          <div className="mb-8 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-200">
            {order.status === 'awaiting_quote'
              ? 'Your quote request is in. We will get back to you on WhatsApp, usually within a day.'
              : 'Order placed. Pay by bank transfer using the details below.'}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-[#F5F5F7]">Order {order.order_number}</h1>
          <OrderStatusPill status={order.status} />
        </div>
        <p className="mt-3 max-w-xl text-sm text-gray-400">{s.text}</p>
        {order.status === 'cancelled' && order.cancel_reason && <p className="mt-2 text-sm text-gray-400">Reason: {order.cancel_reason}</p>}
        {order.tracking_ref && <p className="mt-2 text-sm text-gray-300">Tracking: <span className="font-mono">{order.tracking_ref}</span></p>}

        {payable && (
          <section className="mt-8 rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
            <div className="flex items-baseline justify-between">
              <h2 className="text-base font-semibold text-[#F5F5F7]">Amount to pay</h2>
              <span className="text-2xl font-semibold text-[#F5F5F7]">{formatPKR(due)}</span>
            </div>
            {order.quote_note && <p className="mt-3 text-sm text-gray-300">{order.quote_note}</p>}
            <div className="mt-4 border-t border-white/10 pt-4">
              <h3 className="text-xs font-medium text-gray-400">Bank details</h3>
              {bank
                ? <pre className="mt-2 whitespace-pre-wrap font-sans text-sm leading-relaxed text-[#F5F5F7]">{bank}</pre>
                : <p className="mt-2 text-sm text-gray-300">We will send our bank details to you on WhatsApp.</p>}
              <p className="mt-3 text-xs text-gray-500">Use <span className="font-mono text-gray-300">{order.order_number}</span> as the payment reference. Receipt upload on this page is coming next; until then send the receipt on WhatsApp.</p>
            </div>
          </section>
        )}

        <section className="mt-8">
          <h2 className="text-base font-semibold text-[#F5F5F7]">Items</h2>
          <ul className="mt-2 divide-y divide-white/10">
            {(order.items || []).map((it) => {
              const f = it.variant?.fragrance || {};
              return (
                <li key={it.id} className="flex gap-4 py-4">
                  <div className="w-16 shrink-0"><ProductFrame src={f.image_url} name={f.name} alt={f.name} /></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-400">{f.house}</p>
                    <p className="truncate text-sm font-semibold text-[#F5F5F7]">{f.name}</p>
                    <p className="text-xs text-gray-400">{it.variant ? variantLabel(it.variant) : ''}, qty {it.quantity}</p>
                  </div>
                  <p className="text-sm">{formatPKR(it.line_subtotal_pkr)}</p>
                </li>
              );
            })}
          </ul>
          <dl className="space-y-1.5 border-t border-white/10 pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-gray-400">Subtotal</dt><dd>{formatPKR(order.subtotal_pkr)}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-400">Delivery</dt><dd>{order.status === 'awaiting_quote' ? 'In your quote' : order.shipping_pkr ? formatPKR(order.shipping_pkr) : 'Free'}</dd></div>
            {order.quoted_total_pkr && <div className="flex justify-between"><dt className="text-gray-400">Quoted total</dt><dd>{formatPKR(order.quoted_total_pkr)}</dd></div>}
            <div className="flex justify-between pt-1 text-base font-semibold"><dt>{order.status === 'awaiting_quote' ? 'Estimate' : 'Total'}</dt><dd>{formatPKR(due)}</dd></div>
          </dl>
        </section>

        <section className="mt-8 rounded-2xl bg-white/5 p-5 text-sm ring-1 ring-white/10">
          <h2 className="text-base font-semibold text-[#F5F5F7]">Delivery to</h2>
          <p className="mt-2 text-[#F5F5F7]">{order.customer_name}</p>
          <p className="text-gray-300">{order.shipping_address}, {order.shipping_city}</p>
          <p className="text-gray-400">{order.contact_whatsapp}</p>
          {order.customer_note && <p className="mt-2 text-gray-400">Note: {order.customer_note}</p>}
        </section>

        {wa && (
          <a href={wa} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex rounded-full border border-white/15 px-5 py-2.5 text-sm text-gray-200 transition hover:border-white/40 hover:text-white">
            Message us on WhatsApp
          </a>
        )}
      </main>
      <Footer />
    </div>
  );
}
