// Guards the 2026-11-16 /shop crash: a page imported display helpers from
// lib/shop.js, so webpack kept that module (and its service-role Supabase
// client) in the browser bundle, which threw "supabaseKey is required".
// Pages may only import server-side fetchers from lib/shop (they are dropped
// with getStaticProps); display helpers must come from lib/shop-format.js.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '..');
const SERVER_ONLY = new Set([
  'isShopEnabled', 'getSetting', 'fetchOffers', 'groupOffersByFragrance', 'fetchProductBySlug',
  'fetchOffersByIds', 'fetchOrderForBuyer', 'fetchOrdersForBuyer',
]);

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== 'api') walk(p, out); }
    else if (/\.(js|jsx)$/.test(e.name)) out.push(p);
  }
  return out;
}

const files = [...walk(path.join(ROOT, 'pages')), ...walk(path.join(ROOT, 'components'))];

describe('shop imports stay server-safe', () => {
  it('lib/shop-format.js has no Supabase import', () => {
    const src = fs.readFileSync(path.join(ROOT, 'lib/shop-format.js'), 'utf8');
    expect(src).not.toMatch(/from\s*['"][^'"]*supabase/);
  });

  for (const file of files) {
    const src = fs.readFileSync(file, 'utf8');
    const re = /import\s*\{([^}]*)\}\s*from\s*['"][./]*lib\/shop['"]/g;
    let m;
    while ((m = re.exec(src))) {
      const names = m[1].split(',').map((s) => s.trim().split(/\s+as\s+/)[0]).filter(Boolean);
      it(`${path.relative(ROOT, file)} imports only server fetchers from lib/shop`, () => {
        const bad = names.filter((n) => !SERVER_ONLY.has(n));
        expect(bad, 'import these from lib/shop-format instead').toEqual([]);
      });
    }
    it(`${path.relative(ROOT, file)} has no default/namespace import of lib/shop`, () => {
      expect(src).not.toMatch(/import\s+(\*\s+as\s+\w+|\w+)\s+from\s*['"][./]*lib\/shop['"]/);
    });
  }
});
