// Picks a handful of active sellers for the homepage verify card. Pure so it
// can be tested; the homepage's getStaticProps (hourly ISR) feeds it rows, so
// the set changes about once an hour and costs one bounded query.

const TYPE_LABEL = { BNIB: 'BNIB Seller', DECANT: 'Decant Seller', BRAND: 'Brand' };

export function pickShowcaseSellers(rows, count = 8, random = Math.random) {
  const clean = (Array.isArray(rows) ? rows : [])
    .filter((r) => r && typeof r.name === 'string' && r.name.trim() && typeof r.code === 'string' && r.code.trim())
    .map((r) => ({
      name: r.name.trim().slice(0, 40),
      code: r.code.trim().slice(0, 16),
      type: TYPE_LABEL[r.seller_type] || 'Verified Seller',
    }));
  // Fisher-Yates shuffle, then take the first `count`.
  for (let i = clean.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [clean[i], clean[j]] = [clean[j], clean[i]];
  }
  return clean.slice(0, count);
}
