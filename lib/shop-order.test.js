import { describe, it, expect } from 'vitest';
import { normalizePkPhone, validateCheckout, priceOrder, makeOrderNumber, isOrderNumber } from './shop-order';

const A = '4b6f74b4-d6e1-41b2-ade7-706e2a3361af';
const B = '7ded8c6d-3506-4d37-82fb-21ec1becae54';
const base = { name: 'Ali Khan', phone: '0300 1234567', city: 'Lahore', address: 'House 12, Street 4, DHA Phase 5' };

describe('normalizePkPhone', () => {
  it.each([
    ['03001234567', '+923001234567'],
    ['0300-1234567', '+923001234567'],
    ['+92 300 1234567', '+923001234567'],
    ['923001234567', '+923001234567'],
    ['00923001234567', '+923001234567'],
    ['3001234567', '+923001234567'],
  ])('%s', (input, out) => expect(normalizePkPhone(input)).toBe(out));
  it.each(['', '12345', '04235761234', '+14155550123', null, 3001234567])('rejects %s', (v) => {
    expect(normalizePkPhone(v)).toBeNull();
  });
});

describe('validateCheckout', () => {
  it('accepts a normal order and merges duplicate lines', () => {
    const r = validateCheckout({ ...base, lines: [{ id: A, qty: 1 }, { id: A, qty: 2 }, { id: B, qty: 1 }] });
    expect(r.ok).toBe(true);
    expect(r.value.lines).toEqual([{ id: A, qty: 3 }, { id: B, qty: 1 }]);
    expect(r.value.phone).toBe('+923001234567');
  });
  it('ignores any client-sent price', () => {
    const r = validateCheckout({ ...base, lines: [{ id: A, qty: 1, price_pkr: 1 }] });
    expect(r.value.lines[0]).toEqual({ id: A, qty: 1 });
  });
  it('strips HTML from text fields', () => {
    const r = validateCheckout({ ...base, name: '<b>Ali</b> Khan', lines: [{ id: A, qty: 1 }] });
    expect(r.value.name).toBe('Ali Khan');
  });
  it.each([
    [{ lines: [] }, /empty/],
    [{ lines: [{ id: 'x', qty: 1 }] }, /invalid item/],
    [{ lines: [{ id: A, qty: 0 }] }, /Quantity/],
    [{ lines: [{ id: A, qty: 11 }] }, /Quantity/],
    [{ lines: [{ id: A, qty: 1 }], phone: '123' }, /mobile/],
    [{ lines: [{ id: A, qty: 1 }], address: 'short' }, /address/],
    [{ lines: Array.from({ length: 21 }, () => ({ id: A, qty: 1 })) }, /At most/],
  ])('rejects %#', (over, msg) => {
    const r = validateCheckout({ ...base, ...over });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(msg);
  });
});

describe('priceOrder', () => {
  const products = [
    { id: A, price_pkr: 6500, availability: 'in_stock', is_active: true },
    { id: B, price_pkr: 900, availability: 'on_request', is_active: true },
  ];
  it('in-stock only → pending_payment with delivery fee', () => {
    const r = priceOrder(products, [{ id: A, qty: 2 }], 250);
    expect(r).toMatchObject({ ok: true, status: 'pending_payment', subtotal: 13000, shipping: 250, total: 13250 });
  });
  it('any on-request line → awaiting_quote, no fee yet', () => {
    const r = priceOrder(products, [{ id: A, qty: 1 }, { id: B, qty: 1 }], 250);
    expect(r).toMatchObject({ ok: true, status: 'awaiting_quote', subtotal: 7400, shipping: 0, total: 7400 });
  });
  it('reports missing or inactive products', () => {
    const r = priceOrder([{ ...products[0], is_active: false }], [{ id: A, qty: 1 }, { id: B, qty: 1 }]);
    expect(r).toEqual({ ok: false, missing: [A, B] });
  });
});

describe('order numbers', () => {
  it('look like PFC-XXXXXX and validate', () => {
    for (let i = 0; i < 200; i++) {
      const n = makeOrderNumber();
      expect(isOrderNumber(n)).toBe(true);
    }
    expect(isOrderNumber('PFC-0OIL11')).toBe(false);
    expect(isOrderNumber("PFC-ABC'; --")).toBe(false);
  });
});
