import { describe, it, expect } from 'vitest';
import { pickShowcaseSellers } from './home-sellers';

const rows = Array.from({ length: 20 }, (_, i) => ({ name: `Seller ${i}`, code: `S-${i}`, seller_type: i % 2 ? 'DECANT' : 'BNIB' }));

describe('pickShowcaseSellers', () => {
  it('returns `count` distinct sellers with display labels', () => {
    const out = pickShowcaseSellers(rows, 8);
    expect(out).toHaveLength(8);
    expect(new Set(out.map((s) => s.code)).size).toBe(8);
    expect(out.every((s) => ['BNIB Seller', 'Decant Seller'].includes(s.type))).toBe(true);
  });
  it('drops rows without a name or code and never exposes other fields', () => {
    const out = pickShowcaseSellers([{ name: '', code: 'X' }, { name: 'A', code: null }, { name: ' Ali ', code: 'AK-1', seller_type: 'BNIB', phone: '0300' }], 8);
    expect(out).toEqual([{ name: 'Ali', code: 'AK-1', type: 'BNIB Seller' }]);
  });
  it('shuffles (different seeds, different order) and tolerates junk', () => {
    let s = 1; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const a = pickShowcaseSellers(rows, 20, rnd).map((x) => x.code).join();
    const b = pickShowcaseSellers(rows, 20, rnd).map((x) => x.code).join();
    expect(a).not.toBe(b);
    expect(pickShowcaseSellers(null)).toEqual([]);
  });
});
