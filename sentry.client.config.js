import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: 'https://cefba76eb3b045f99343dbce1a6df37d@o4511260055830528.ingest.de.sentry.io/4511260061073488',
  tracesSampleRate: 0.1,
  enabled: process.env.NODE_ENV === 'production',
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
    /^Network request failed/,
    /^Failed to fetch/,
    /^Load failed/,
    // Instagram in-app browser Android (their own WebView JS, not our code)
    /Java object is gone/,
    /enableDidUserTypeOnKeyboardLogging/,
    // iOS Safari / WKWebView message handler (Google gtag.js, not our code)
    /webkit\.messageHandlers/,
    // CSP blocking eval() in third-party scripts — not our code
    /unsafe-eval/,
    // Facebook in-app browser extension (browser_declutter)
    /browser_declutter/,
    // Facebook Android in-app browser's own navigation-performance bridge
    /Error invoking postMessage/,
    // Instagram iOS in-app browser's own Private Click Measurement bridge
    /_pcmBridgeCallbackHandler/,
  ],
  denyUrls: [
    // Scripts injected by an in-app browser (Facebook/Instagram WebView
    // bridges) or a browser extension report as app:// / app:/// pseudo-URLs
    // rather than a real page URL — never our own bundled code, which is
    // always served from /_next/static/. Broader and more durable than
    // chasing each new injected-script message individually.
    /^app:\/\//,
  ],
});
