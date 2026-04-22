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
  ],
});
