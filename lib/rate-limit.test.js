import { describe, it, expect, afterEach, vi } from 'vitest';
import { getClientIp, isRateLimited } from './rate-limit.js';

describe('getClientIp', () => {
  it('uses the first entry of a comma-separated x-forwarded-for header', () => {
    const req = { headers: { 'x-forwarded-for': '203.0.113.9, 10.0.0.1' }, socket: {} };
    expect(getClientIp(req)).toBe('203.0.113.9');
  });

  it('trims whitespace around the forwarded IP', () => {
    const req = { headers: { 'x-forwarded-for': '  203.0.113.9  ' }, socket: {} };
    expect(getClientIp(req)).toBe('203.0.113.9');
  });

  it('falls back to socket.remoteAddress when there is no forwarded header', () => {
    const req = { headers: {}, socket: { remoteAddress: '198.51.100.4' } };
    expect(getClientIp(req)).toBe('198.51.100.4');
  });

  it('falls back to "unknown" when neither is available', () => {
    const req = { headers: {}, socket: {} };
    expect(getClientIp(req)).toBe('unknown');
  });
});

describe('isRateLimited', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows the first request for a fresh key', () => {
    expect(isRateLimited('test:fresh-key-1', { max: 5 })).toBe(false);
  });

  it('allows exactly `max` requests, then blocks the next one', () => {
    const key = 'test:max-boundary';
    for (let i = 0; i < 3; i++) {
      expect(isRateLimited(key, { max: 3 })).toBe(false);
    }
    // 4th call in the same window exceeds max=3
    expect(isRateLimited(key, { max: 3 })).toBe(true);
  });

  it('resets once the window elapses', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    const key = 'test:window-reset';

    for (let i = 0; i < 2; i++) isRateLimited(key, { windowMs: 60_000, max: 2 });
    expect(isRateLimited(key, { windowMs: 60_000, max: 2 })).toBe(true);

    vi.setSystemTime(new Date('2026-01-01T00:01:01Z')); // 61s later, window has passed
    expect(isRateLimited(key, { windowMs: 60_000, max: 2 })).toBe(false);
  });

  it('tracks separate keys independently', () => {
    const keyA = 'test:independent-a';
    const keyB = 'test:independent-b';
    for (let i = 0; i < 5; i++) isRateLimited(keyA, { max: 1 });
    expect(isRateLimited(keyA, { max: 1 })).toBe(true);
    expect(isRateLimited(keyB, { max: 1 })).toBe(false);
  });
});
