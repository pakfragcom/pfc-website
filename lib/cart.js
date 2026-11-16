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
