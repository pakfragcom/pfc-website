import { describe, it, expect } from 'vitest';
import {
  evaluateSellerRepeat,
  exceedsDailyCap,
  isUuid,
  stripHtml,
  SELLER_REPEAT_FLAG_AT,
  SELLER_REPEAT_REJECT_AT,
  DAILY_CAP,
} from './transaction-limits.js';

describe('evaluateSellerRepeat', () => {
  it('allows a first report, unflagged', () => {
    expect(evaluateSellerRepeat(0)).toEqual({ allowed: true, flagged: false });
  });

  it('allows but flags once the flag threshold is reached', () => {
    expect(evaluateSellerRepeat(SELLER_REPEAT_FLAG_AT)).toEqual({ allowed: true, flagged: true });
  });

  it('rejects once the reject threshold is reached', () => {
    expect(evaluateSellerRepeat(SELLER_REPEAT_REJECT_AT).allowed).toBe(false);
    expect(evaluateSellerRepeat(SELLER_REPEAT_REJECT_AT + 50).allowed).toBe(false);
  });

  it('treats null/undefined counts as zero', () => {
    expect(evaluateSellerRepeat(null)).toEqual({ allowed: true, flagged: false });
    expect(evaluateSellerRepeat(undefined)).toEqual({ allowed: true, flagged: false });
  });
});

describe('exceedsDailyCap', () => {
  it('is false just under the cap and true at the cap', () => {
    expect(exceedsDailyCap(DAILY_CAP - 1)).toBe(false);
    expect(exceedsDailyCap(DAILY_CAP)).toBe(true);
  });

  it('treats a missing count as zero', () => {
    expect(exceedsDailyCap(null)).toBe(false);
  });
});

describe('isUuid', () => {
  it('accepts a canonical uuid', () => {
    expect(isUuid('77a3a593-5db7-4580-aad6-1f4b43ca1e38')).toBe(true);
  });

  it('rejects non-uuid strings and non-strings', () => {
    expect(isUuid('not-a-uuid')).toBe(false);
    expect(isUuid("1 OR 1=1")).toBe(false);
    expect(isUuid(123)).toBe(false);
    expect(isUuid(null)).toBe(false);
  });
});

describe('stripHtml', () => {
  it('removes tags but keeps the surrounding text', () => {
    expect(stripHtml('Great <b>seller</b>, fast')).toBe('Great seller, fast');
  });

  it('removes a stored-XSS style payload entirely', () => {
    expect(stripHtml('<img src=x onerror="alert(document.domain)">')).toBe('');
  });

  it('trims whitespace and passes non-strings through untouched', () => {
    expect(stripHtml('  hello  ')).toBe('hello');
    expect(stripHtml(undefined)).toBe(undefined);
    expect(stripHtml(null)).toBe(null);
  });
});
