/** @type {import('next').NextConfig} */
const ONE_YEAR = 60 * 60 * 24 * 365
const ONE_DAY = 60 * 60 * 24

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      // Allow forum assets (avatars, images) if you embed them
      { protocol: 'https', hostname: 'forum.pakfrag.com' },
      // Add CDNs here if you start using one (e.g., Cloudflare Images):
      // { protocol: 'https', hostname: 'imagedelivery.net' },
    ],
  },

  async headers() {
    return [
      // 1) Immutable build assets
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: `public, max-age=${ONE_YEAR}, immutable` },
        ],
      },
      // 2) Fonts & images served from /public/*
      {
        source: '/:all*(woff2|woff|ttf|otf|png|jpg|jpeg|gif|webp|avif|svg)',
        headers: [
          { key: 'Cache-Control', value: `public, s-maxage=${ONE_YEAR}, max-age=${ONE_YEAR}, immutable` },
        ],
      },
      // 3) HTML — short TTL at the edge, revalidate quickly
      {
        source: '/:path*',
        headers: [
          { key: 'Cache-Control', value: `public, s-maxage=${ONE_DAY}, max-age=0, must-revalidate` },
        ],
      },
      // 4) Security headers (baseline; we can tighten CSP later with nonces)
      {
        source: '/(.*)',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "img-src 'self' data: blob: https:",
              "media-src 'self' https: blob:",
              "font-src 'self' https: data:",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // GA snippet + GTM + your inline JSON-LD in _app.js
              "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com",
              "connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com https://forum.pakfrag.com",
              "frame-ancestors 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
