// Browser-safe shop display helpers. Keep this file free of any Supabase
// import: shop pages use these in their components, and anything imported
// there ships to the browser (importing lib/shop.js from a component pulled
// the service-role client into the bundle and crashed /shop on 2026-11-16).

export function formatPKR(n) {
  const v = Number(n) || 0;
  return 'Rs ' + v.toLocaleString('en-US');
}

export function variantLabel(v) {
  const size = v.size_ml ? `${v.size_ml} ml` : '';
  const kind = v.kind === 'decant' ? 'decant' : v.kind === 'tester' ? 'tester' : 'bottle';
  // "100 ml EDP bottle", "10 ml decant"
  return [size, v.concentration, kind].filter(Boolean).join(' ');
}

// What the customer sees for each order status.
export const ORDER_STATUS = {
  awaiting_quote:  { label: 'Checking availability', tone: 'amber', text: 'We are confirming stock and the final price with the seller. We will message you on WhatsApp and update this page with your quote.' },
  quoted:          { label: 'Quote ready', tone: 'amber', text: 'Your quote is ready. Pay the amount below by bank transfer to confirm the order.' },
  pending_payment: { label: 'Awaiting payment', tone: 'amber', text: 'Pay the amount below by bank transfer. We ship once the payment is verified.' },
  paid:            { label: 'Payment verified', tone: 'green', text: 'We received your payment and are preparing your order.' },
  sent_to_seller:  { label: 'Being prepared', tone: 'green', text: 'Your order is being packed.' },
  shipped:         { label: 'Shipped', tone: 'green', text: 'Your order is on its way.' },
  delivered:       { label: 'Delivered', tone: 'green', text: 'Delivered. Enjoy your fragrance.' },
  cancelled:       { label: 'Cancelled', tone: 'gray', text: 'This order was cancelled.' },
};

export function orderStatus(s) {
  return ORDER_STATUS[s] || { label: s, tone: 'gray', text: '' };
}

/** Amount the customer owes right now (quote overrides the cart total). */
export function amountDue(order) {
  return order.quoted_total_pkr || order.total_pkr;
}

export const BADGE_LABEL = {
  verified_authentic: 'Verified authentic',
  sealed_batch_checked: 'Sealed, batch code checked',
};
