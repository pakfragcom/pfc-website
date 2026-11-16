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
  const conc = v.concentration ? ` · ${v.concentration}` : '';
  return `${size} ${kind}${conc}`.trim();
}

export const BADGE_LABEL = {
  verified_authentic: 'Verified authentic',
  sealed_batch_checked: 'Sealed, batch code checked',
};
