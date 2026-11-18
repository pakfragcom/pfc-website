import { describe, it, expect, vi } from 'vitest';

vi.mock('./supabase-admin', () => ({ supabaseAdmin: {} }));
const { toPosts } = await import('./instagram');

const img = (id, extra = {}) => ({
  id, media_type: 'IMAGE', media_url: `https://scontent.cdninstagram.com/${id}.jpg`,
  permalink: `https://www.instagram.com/p/${id}/`, caption: 'Hello  \n world', ...extra,
});

describe('toPosts', () => {
  it('maps images and carousels, uses the thumbnail for videos', () => {
    const out = toPosts([
      img('a'),
      img('b', { media_type: 'CAROUSEL_ALBUM' }),
      img('c', { media_type: 'VIDEO', media_url: 'https://x/video.mp4', thumbnail_url: 'https://x/thumb.jpg' }),
    ]);
    expect(out.map((p) => p.image)).toEqual([
      'https://scontent.cdninstagram.com/a.jpg',
      'https://scontent.cdninstagram.com/b.jpg',
      'https://x/thumb.jpg',
    ]);
    expect(out[0].caption).toBe('Hello world');
    expect(out[2].isVideo).toBe(true);
  });
  it('drops posts without a usable image or with a non-Instagram link', () => {
    const out = toPosts([
      img('a', { media_type: 'VIDEO', thumbnail_url: undefined }),
      img('b', { media_url: 'javascript:alert(1)' }),
      img('c', { permalink: 'https://evil.example/p/c' }),
      img('d'),
    ]);
    expect(out.map((p) => p.id)).toEqual(['d']);
  });
  it('caps at the limit and tolerates junk input', () => {
    expect(toPosts(Array.from({ length: 12 }, (_, i) => img(String(i))))).toHaveLength(6);
    expect(toPosts(null)).toEqual([]);
  });
});
