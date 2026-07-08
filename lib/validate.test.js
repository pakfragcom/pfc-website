import { describe, it, expect } from 'vitest';
import { escHtml, firstTooLong } from './validate.js';

describe('escHtml', () => {
  it('escapes all five HTML-significant characters', () => {
    expect(escHtml(`<script>alert("xss")</script>&'`)).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;&amp;&#39;'
    );
  });

  it('leaves a plain string unchanged', () => {
    expect(escHtml('Zakir from Karachi')).toBe('Zakir from Karachi');
  });

  it('treats null/undefined as an empty string rather than throwing', () => {
    expect(escHtml(null)).toBe('');
    expect(escHtml(undefined)).toBe('');
  });

  it('coerces non-string input to a string', () => {
    expect(escHtml(12345)).toBe('12345');
  });
});

describe('firstTooLong', () => {
  it('returns null when every field is within its limit', () => {
    expect(firstTooLong([
      ['Name', 'Zakir', 100],
      ['City', 'Karachi', 100],
    ])).toBeNull();
  });

  it('returns null for an empty field list', () => {
    expect(firstTooLong([])).toBeNull();
  });

  it('flags a field that exceeds its max length', () => {
    const result = firstTooLong([['Bio', 'a'.repeat(1001), 1000]]);
    expect(result).toBe('Bio must be 1000 characters or fewer.');
  });

  it('reports only the first violation when multiple fields are too long', () => {
    const result = firstTooLong([
      ['Name', 'a'.repeat(200), 100],
      ['City', 'b'.repeat(200), 100],
    ]);
    expect(result).toBe('Name must be 100 characters or fewer.');
  });

  it('ignores non-string values (numbers, null, undefined) rather than flagging them', () => {
    expect(firstTooLong([
      ['Quantity', 999999, 2],
      ['Optional', null, 5],
      ['Missing', undefined, 5],
    ])).toBeNull();
  });

  it('treats a value exactly at the limit as valid (boundary check)', () => {
    expect(firstTooLong([['Code', 'a'.repeat(30), 30]])).toBeNull();
  });

  it('flags a value one character over the limit', () => {
    const result = firstTooLong([['Code', 'a'.repeat(31), 30]]);
    expect(result).toBe('Code must be 30 characters or fewer.');
  });
});
