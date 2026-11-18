import Link from 'next/link';
import ProductFrame from './ProductFrame';
import { formatPKR, variantLabel } from '../../lib/shop-format';

// Cart rows. With onQty/onRemove it is editable (cart page); without, a
// read-only summary (checkout).
export default function CartLines({ items, onQty, onRemove }) {
  const editable = !!onQty;
  return (
    <ul className="divide-y divide-white/10">
      {items.map(({ id, qty, offer }) => (
        <li key={id} className="flex gap-4 py-4">
          <Link href={`/shop/${offer.fragrance.slug}`} className="w-20 shrink-0 sm:w-24">
            <ProductFrame src={offer.image} name={offer.fragrance.name} alt={offer.fragrance.name} />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-gray-400">{offer.fragrance.house}</p>
            <Link href={`/shop/${offer.fragrance.slug}`} className="block truncate text-sm font-semibold text-[#F5F5F7] hover:text-white">
              {offer.fragrance.name}
            </Link>
            <p className="mt-0.5 text-xs text-gray-400">{variantLabel(offer.variant)}</p>
            <p className="mt-1 text-[11px]">
              {offer.availability === 'in_stock'
                ? <span className="text-emerald-300">In stock</span>
                : <span className="text-amber-300">On request, price confirmed in your quote</span>}
            </p>
            {editable && (
              <div className="mt-2 flex items-center gap-3">
                <div className="inline-flex items-center rounded-full border border-white/15">
                  <button type="button" aria-label="Decrease quantity" disabled={qty <= 1} onClick={() => onQty(id, qty - 1)} className="h-8 w-8 text-gray-300 transition hover:text-white disabled:opacity-30">−</button>
                  <span className="w-6 text-center text-sm" aria-live="polite">{qty}</span>
                  <button type="button" aria-label="Increase quantity" disabled={qty >= 10} onClick={() => onQty(id, qty + 1)} className="h-8 w-8 text-gray-300 transition hover:text-white disabled:opacity-30">+</button>
                </div>
                <button type="button" onClick={() => onRemove(id)} className="text-xs text-gray-400 underline underline-offset-2 hover:text-white">Remove</button>
              </div>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-[#F5F5F7]">{formatPKR(offer.price_pkr * qty)}</p>
            {qty > 1 && <p className="text-[11px] text-gray-500">{qty} × {formatPKR(offer.price_pkr)}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}
