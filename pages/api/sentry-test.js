import * as Sentry from '@sentry/nextjs';

export default function handler(req, res) {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  const client = Sentry.getClient();

  if (!dsn) {
    return res.status(200).json({ ok: false, message: 'NEXT_PUBLIC_SENTRY_DSN is not set on the server' });
  }
  if (!client) {
    return res.status(200).json({ ok: false, message: `DSN is set (${dsn.slice(0, 30)}…) but Sentry server SDK is not initialised` });
  }

  const id = Sentry.captureException(new Error('PFC Sentry server test — delete this route after confirming'));
  res.status(200).json({ ok: true, message: `Captured — event ID: ${id?.slice(0, 8)}… — check Sentry Issues` });
}
