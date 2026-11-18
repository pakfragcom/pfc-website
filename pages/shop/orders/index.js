import Head from 'next/head';
import Link from 'next/link';
import Header from '../../../components/layout/Header';
import Footer from '../../../components/layout/Footer';
import OrderStatusPill from '../../../components/shop/OrderStatusPill';
import { formatPKR, amountDue } from '../../../lib/shop-format';
import { createApiSupabaseClient } from '../../../lib/server-supabase';
import { fetchOrdersForBuyer } from '../../../lib/shop';

export async function getServerSideProps({ req, res }) {
  const supabase = createApiSupabaseClient(req, res);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { redirect: { destination: '/auth/login?next=/shop/orders', permanent: false } };
  const orders = await fetchOrdersForBuyer(user.id);
  res.setHeader('Cache-Control', 'private, no-store');
  return { props: { orders } };
}

export default function MyOrders({ orders }) {
  return (
    <div className="bg-black text-white font-sans">
      <Head>
        <title>My orders | PFC shop</title>
        <meta name="robots" content="noindex" />
      </Head>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-20 sm:py-24">
        <h1 className="text-3xl font-semibold tracking-tight text-[#F5F5F7] sm:text-4xl">My orders</h1>
        {orders.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 px-6 py-12 text-center">
            <p className="text-sm text-gray-400">No orders yet.</p>
            <Link href="/shop" className="mt-4 inline-flex rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-black transition hover:bg-[#e6ebe9]">Browse the shop</Link>
          </div>
        ) : (
          <ul className="mt-8 divide-y divide-white/10 rounded-2xl bg-white/5 ring-1 ring-white/10">
            {orders.map((o) => {
              const qty = (o.items || []).reduce((n, i) => n + i.quantity, 0);
              return (
                <li key={o.order_number}>
                  <Link href={`/shop/orders/${o.order_number}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition hover:bg-white/[0.04]">
                    <div>
                      <p className="font-mono text-sm text-[#F5F5F7]">{o.order_number}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(o.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} · {qty} item{qty === 1 ? '' : 's'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <OrderStatusPill status={o.status} />
                      <span className="text-sm">{formatPKR(amountDue(o))}</span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
      <Footer />
    </div>
  );
}
