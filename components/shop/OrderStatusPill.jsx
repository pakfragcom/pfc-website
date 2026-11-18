import { orderStatus } from '../../lib/shop-format';

const TONE = {
  amber: 'border-amber-500/25 bg-amber-500/10 text-amber-300',
  green: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300',
  gray: 'border-white/15 bg-white/5 text-gray-300',
};

export default function OrderStatusPill({ status }) {
  const s = orderStatus(status);
  return <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs ${TONE[s.tone]}`}>{s.label}</span>;
}
