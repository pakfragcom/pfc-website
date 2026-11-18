// Browser-side cart: [{ id, qty }] in localStorage. No stock reservations;
// stock is checked by hand at quote/confirmation time.
import { useEffect, useState } from 'react';

const KEY = 'pfc_cart_v1';
const EVENT = 'pfc-cart-change';
const MAX_QTY = 10;
const MAX_LINES = 20;

export function readCart() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(raw)
      ? raw.filter((l) => l && typeof l.id === 'string').map((l) => ({ id: l.id, qty: clampQty(l.qty) }))
      : [];
  } catch {
    return [];
  }
}

function clampQty(q) {
  const n = Math.floor(Number(q) || 1);
  return Math.min(MAX_QTY, Math.max(1, n));
}

function writeCart(lines) {
  try {
    localStorage.setItem(KEY, JSON.stringify(lines.slice(0, MAX_LINES)));
    window.dispatchEvent(new Event(EVENT));
  } catch {}
}

export function addToCart(id, qty = 1) {
  const lines = readCart();
  const existing = lines.find((l) => l.id === id);
  if (existing) existing.qty = clampQty(existing.qty + qty);
  else lines.push({ id, qty: clampQty(qty) });
  writeCart(lines);
}

export function setCartQty(id, qty) {
  const lines = readCart().map((l) => (l.id === id ? { ...l, qty: clampQty(qty) } : l));
  writeCart(lines);
}

export function removeFromCart(id) {
  writeCart(readCart().filter((l) => l.id !== id));
}

export function clearCart() {
  writeCart([]);
}

/**
 * Loads public product details for the cart lines and drops lines whose
 * product is no longer on sale. Returns { items, loading, error, closed }.
 */
export function useCartOffers(lines) {
  const [state, setState] = useState({ offers: null, error: '', closed: false });
  const key = lines.map((l) => l.id).sort().join(',');
  useEffect(() => {
    if (!key) { setState({ offers: [], error: '', closed: false }); return; }
    let cancelled = false;
    fetch(`/api/shop/cart?ids=${encodeURIComponent(key)}`, { headers: { Accept: 'application/json' } })
      .then(async (r) => {
        if (r.status === 404) return { offers: [], closed: true };
        if (!r.ok) throw new Error('bad status');
        return r.json();
      })
      .then((j) => {
        if (cancelled) return;
        const offers = j.offers || [];
        if (!j.closed) {
          const live = new Set(offers.map((o) => o.id));
          const gone = key.split(',').filter((id) => !live.has(id));
          if (gone.length) writeCart(readCart().filter((l) => !gone.includes(l.id)));
        }
        setState({ offers, error: '', closed: !!j.closed });
      })
      .catch(() => { if (!cancelled) setState((s) => ({ ...s, error: 'Could not load your cart. Check your connection and refresh.' })); });
    return () => { cancelled = true; };
  }, [key]);

  const byId = new Map((state.offers || []).map((o) => [o.id, o]));
  const items = lines.filter((l) => byId.has(l.id)).map((l) => ({ ...l, offer: byId.get(l.id) }));
  const needsQuote = items.some((i) => i.offer.availability !== 'in_stock');
  const subtotal = items.reduce((n, i) => n + i.offer.price_pkr * i.qty, 0);
  return { items, loading: state.offers === null && !state.error, error: state.error, closed: state.closed, needsQuote, subtotal };
}

/** React hook: current cart lines, kept in sync across tabs and components. */
export function useCart() {
  const [lines, setLines] = useState([]);
  useEffect(() => {
    const sync = () => setLines(readCart());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);
  const count = lines.reduce((n, l) => n + l.qty, 0);
  return { lines, count, add: addToCart, setQty: setCartQty, remove: removeFromCart, clear: clearCart };
}
