import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

// Programmatic scrapers — block these outright
const BLOCKED_UA_PATTERNS = [
  'python-requests', 'scrapy', 'wget/', 'go-http-client',
  'java/', 'libwww-perl', 'curl/', 'mechanize', 'aiohttp',
  'httpx', 'colly', 'guzzle', 'perl/', 'ruby',
];

// Legitimate crawlers we always allow (search engines, social previews, SEO tools)
const ALLOWED_BOT_PATTERNS = [
  'googlebot', 'bingbot', 'slurp', 'duckduckbot', 'yandexbot',
  'applebot', 'baiduspider', 'facebookexternalhit', 'twitterbot',
  'linkedinbot', 'whatsapp', 'telegrambot', 'discordbot',
  'semrushbot', 'ahrefsbot', 'mj12bot', 'dotbot',
];

function isBlockedBot(ua) {
  if (!ua) return false;
  const lower = ua.toLowerCase();

  // Allow known legitimate bots first
  if (ALLOWED_BOT_PATTERNS.some(p => lower.includes(p))) return false;

  // Block known scraper UAs
  return BLOCKED_UA_PATTERNS.some(p => lower.includes(p));
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const ua = request.headers.get('user-agent') || '';

  // Block scraper bots — but never block API routes called from our own pages
  if (isBlockedBot(ua)) {
    // API routes get 403
    if (pathname.startsWith('/api/')) {
      return new NextResponse('Forbidden', { status: 403 });
    }
    // Pages get a minimal 403 (no content worth scraping)
    return new NextResponse('Forbidden', { status: 403 });
  }

  // Protect public API routes from headless bulk scraping:
  // require either a browser-like Accept header or a valid Origin/Referer
  if (pathname.startsWith('/api/') &&
      !pathname.startsWith('/api/admin/') &&  // admin already has auth
      request.method === 'GET') {
    const accept = request.headers.get('accept') || '';
    const referer = request.headers.get('referer') || '';
    const origin = request.headers.get('origin') || '';

    const hasBrowserAccept = accept.includes('text/html') || accept.includes('application/json');
    const hasSiteReferer = referer.includes('pakfrag.com') || origin.includes('pakfrag.com');
    const isLocalDev = referer.includes('localhost') || origin.includes('localhost');

    if (!hasBrowserAccept && !hasSiteReferer && !isLocalDev) {
      return new NextResponse('Forbidden', { status: 403 });
    }
  }

  // Supabase session refresh (existing behaviour)
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  try {
    await supabase.auth.getUser();
  } catch {
    // Never block the request due to a session refresh failure
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
};
