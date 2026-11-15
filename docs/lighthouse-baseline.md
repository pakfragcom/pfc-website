# Lighthouse baseline — 2026-11-16

Reference numbers to measure every later phase against. Re-run the same way
after each phase and append a dated section; the brief's rule is that
performance and accessibility must not drop.

## Method

Lighthouse via local Chrome (headless), **mobile** emulation with Lighthouse's
default simulated throttling (mid-range Android class device, slow-4G network),
against the live site. Four representative pages: homepage, the highest-traffic
page, the largest ISR page, and a dynamic profile.

```bash
export CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
npx lighthouse https://pakfrag.com/tools/verify-seller --quiet \
  --chrome-flags="--headless=new --no-sandbox" \
  --only-categories=performance,accessibility,best-practices,seo \
  --output=json --output-path=./verify-seller.json
```

(The PageSpeed Insights API without a key hits its daily quota quickly — use
local Lighthouse.)

## Scores (mobile)

| Page | Perf | A11y | Best | SEO | LCP | TBT | CLS | Speed Index |
|---|---|---|---|---|---|---|---|---|
| `/` | 97 | 100 | 100 | 100 | 0.8 s | 190 ms | 0 | 2.5 s |
| `/tools/verify-seller` | 100 | 97 | 100 | 100 | 0.8 s | 90 ms | 0 | 1.1 s |
| `/mbp` | 100 | 97 | 100 | 100 | 0.8 s | 90 ms | 0 | 2.4 s |
| `/sellers/abdur-rehman` | 98 | 100 | 100 | 92 | 0.9 s | 80 ms | 0 | 3.6 s |

Taken on the Next 16 / React 19 / Webpack build (commit `9e0211f`), after
the homepage became fully static.

## Findings

- **Unused JavaScript, every page (~215–258 KiB).** The only recurring
  performance opportunity. Largest contributors are the shared bundle
  (Framer Motion, Sentry client, auth context). Address in Phase 6 by
  dynamic-importing the motion bundle so catalogue/cart/checkout/admin never
  load it, and by reviewing what `_app` pulls in for every route.
- **Seller profile SEO 92:** `rel=canonical` is not a valid absolute URL on
  `/sellers/[slug]`. Fix: emit `https://pakfrag.com/sellers/<slug>`.
- **verify-seller accessibility 97:** one link is distinguishable from
  surrounding text by colour only (needs an underline or similar).
- **MBP accessibility 97:** one text colour fails the contrast ratio against
  the dark background.
- CLS is 0 everywhere and LCP is under 1 s on all four pages — keep it that
  way; motion work in Phase 6 must not introduce layout shift.
