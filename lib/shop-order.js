// Pure checkout logic (no I/O) so it can be unit-tested: input validation,
// server-side pricing and order numbers. The API route does the DB work.
import { randomInt } from 'node:crypto';

export const MAX_LINES = 20;
export const MAX_QTY = 10;
export const OPEN_ORDER_CAP = 5; // unpaid orders one customer may have at once
export const OPEN_STATUSES = ['awaiting_quote', 'quoted', 'pending_payment'];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function clean(s) {
  return typeof s === 'string' ? s.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() : '';
}

/** Pakistani mobile → "+923001234567", or null. Accepts 03xx…, 3xx…, 92…, +92…, with spaces/dashes. */
export function normalizePkPhone(raw) {
  if (typeof raw !== 'string') return null;
  let d = raw.replace(/[^\d]/g, '');
  if (d.startsWith('0092')) d = d.slice(4);
  else if (d.startsWith('92')) d = d.slice(2);
  else if (d.startsWith('0')) d = d.slice(1);
  return /^3\d{9}$/.test(d) ? `+92${d}` : null;
}

/**
 * Validates the checkout body. Returns { ok: true, value } or { ok: false, error }.
 * Prices in the body are ignored on purpose: the server prices every line.
 */
export function validateCheckout(body) {
  const b = body && typeof body === 'object' ? body : {};
  if (!Array.isArray(b.lines) || b.lines.length === 0) return { ok: false, error: 'Your cart is empty.' };
  if (b.lines.length > MAX_LINES) return { ok: false, error: `At most ${MAX_LINES} different items per order.` };

  const merged = new Map();
  for (const l of b.lines) {
    if (!l || !UUID_RE.test(String(l.id))) return { ok: false, error: 'Your cart has an invalid item. Remove it and try again.' };
    const qty = Math.floor(Number(l.qty));
    if (!Number.isFinite(qty) || qty < 1 || qty > MAX_QTY) return { ok: false, error: `Quantity must be between 1 and ${MAX_QTY}.` };
    merged.set(l.id, Math.min(MAX_QTY, (merged.get(l.id) || 0) + qty));
  }

  const name = clean(b.name);
  const city = clean(b.city);
  const address = clean(b.address);
  const note = clean(b.note);
  const phone = normalizePkPhone(b.phone);

  if (name.length < 2 || name.length > 80) return { ok: false, error: 'Enter your full name.' };
  if (!phone) return { ok: false, error: 'Enter a Pakistani mobile number, for example 0300 1234567.' };
  if (city.length < 2 || city.length > 60) return { ok: false, error: 'Enter your city.' };
  if (address.length < 10 || address.length > 300) return { ok: false, error: 'Enter your full delivery address (house, street, area).' };
  if (note.length > 500) return { ok: false, error: 'The note must be 500 characters or fewer.' };

  return {
    ok: true,
    value: {
      lines: Array.from(merged, ([id, qty]) => ({ id, qty })),
      name, phone, city, address, note: note || null,
    },
  };
}

/**
 * Prices the order from DB rows (never from the client).
 * products: rows with { id, price_pkr, availability, is_active, variant_id }.
 * Returns { ok: false, missing } if any line is gone or inactive.
 */
export function priceOrder(products, lines, shippingFeePkr = 0) {
  const byId = new Map(products.map((p) => [p.id, p]));
  const missing = lines.filter((l) => !byId.get(l.id)?.is_active).map((l) => l.id);
  if (missing.length) return { ok: false, missing };

  const priced = lines.map((l) => {
    const p = byId.get(l.id);
    return { ...l, product: p, unit: p.price_pkr, subtotal: p.price_pkr * l.qty };
  });
  const needsQuote = priced.some((l) => l.product.availability !== 'in_stock');
  const subtotal = priced.reduce((n, l) => n + l.subtotal, 0);
  const fee = Math.max(0, Math.floor(Number(shippingFeePkr) || 0));
  // Quote orders get their delivery charge in the quote itself.
  const shipping = needsQuote ? 0 : fee;
  return {
    ok: true,
    lines: priced,
    status: needsQuote ? 'awaiting_quote' : 'pending_payment',
    subtotal,
    shipping,
    total: subtotal + shipping,
  };
}

// No 0/O/1/I/L so it can be read out over the phone.
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
export function makeOrderNumber() {
  let s = '';
  for (let i = 0; i < 6; i++) s += ALPHABET[randomInt(ALPHABET.length)];
  return `PFC-${s}`;
}

export function isOrderNumber(s) {
  return typeof s === 'string' && /^PFC-[2-9A-HJKMNP-Z]{6}$/.test(s);
}
