import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TEST_ADMIN_PASSWORD } from '../vitest.setup.js';
import {
  verifyPassword,
  setAdminCookie,
  clearAdminCookie,
  isAdminAuthenticated,
  isRateLimited,
  recordFailedAttempt,
  clearAttempts,
} from './admin-auth.js';

function mockRes() {
  let header = '';
  return {
    setHeader: vi.fn((name, value) => { header = value; }),
    get header() { return header; },
  };
}

function cookieFromRes(res) {
  // Set-Cookie: pfc_admin_session=<token>; HttpOnly; ...
  const match = res.header.match(/pfc_admin_session=([^;]*)/);
  return match ? match[1] : '';
}

describe('verifyPassword', () => {
  it('accepts the correct password', () => {
    expect(verifyPassword(TEST_ADMIN_PASSWORD)).toBe(true);
  });

  it('rejects an incorrect password', () => {
    expect(verifyPassword('definitely-wrong')).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(verifyPassword('')).toBe(false);
  });
});

describe('setAdminCookie / clearAdminCookie', () => {
  it('sets an HttpOnly, Secure, SameSite=Strict cookie with an 8-hour Max-Age', () => {
    const res = mockRes();
    setAdminCookie(res);
    expect(res.header).toContain('HttpOnly');
    expect(res.header).toContain('Secure');
    expect(res.header).toContain('SameSite=Strict');
    expect(res.header).toContain(`Max-Age=${60 * 60 * 8}`);
  });

  it('clears the cookie with Max-Age=0', () => {
    const res = mockRes();
    clearAdminCookie(res);
    expect(res.header).toContain('pfc_admin_session=;');
    expect(res.header).toContain('Max-Age=0');
  });
});

describe('isAdminAuthenticated', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns false when there is no cookie', () => {
    expect(isAdminAuthenticated({ cookies: {} })).toBe(false);
  });

  it('returns false for a malformed token (no issuedAt.signature separator)', () => {
    expect(isAdminAuthenticated({ cookies: { pfc_admin_session: 'garbage' } })).toBe(false);
  });

  it('accepts a freshly issued token', () => {
    const res = mockRes();
    setAdminCookie(res);
    const token = cookieFromRes(res);
    expect(isAdminAuthenticated({ cookies: { pfc_admin_session: token } })).toBe(true);
  });

  it('rejects a token whose signature has been tampered with', () => {
    const res = mockRes();
    setAdminCookie(res);
    const token = cookieFromRes(res);
    const [issuedAt] = token.split('.');
    const tampered = `${issuedAt}.0000000000000000000000000000000000000000000000000000000000000000`;
    expect(isAdminAuthenticated({ cookies: { pfc_admin_session: tampered } })).toBe(false);
  });

  it('rejects a token older than the 8-hour session window', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));

    const res = mockRes();
    setAdminCookie(res);
    const token = cookieFromRes(res);

    // Just under 8 hours: still valid
    vi.setSystemTime(new Date('2026-01-01T07:59:00Z'));
    expect(isAdminAuthenticated({ cookies: { pfc_admin_session: token } })).toBe(true);

    // Just over 8 hours: expired
    vi.setSystemTime(new Date('2026-01-01T08:01:00Z'));
    expect(isAdminAuthenticated({ cookies: { pfc_admin_session: token } })).toBe(false);
  });
});

describe('brute-force throttling (isRateLimited / recordFailedAttempt / clearAttempts)', () => {
  const ip = '203.0.113.7';

  beforeEach(() => {
    clearAttempts(ip);
  });

  it('does not rate-limit an IP with no recorded attempts', () => {
    expect(isRateLimited(ip)).toBe(false);
  });

  it('does not rate-limit until the failure threshold is reached', () => {
    for (let i = 0; i < 7; i++) recordFailedAttempt(ip);
    expect(isRateLimited(ip)).toBe(false);
  });

  it('blocks once the failure threshold (8 attempts) is reached', () => {
    for (let i = 0; i < 8; i++) recordFailedAttempt(ip);
    expect(isRateLimited(ip)).toBe(true);
  });

  it('clearAttempts lifts the block', () => {
    for (let i = 0; i < 8; i++) recordFailedAttempt(ip);
    expect(isRateLimited(ip)).toBe(true);
    clearAttempts(ip);
    expect(isRateLimited(ip)).toBe(false);
  });
});
