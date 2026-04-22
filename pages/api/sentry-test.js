import * as Sentry from '@sentry/nextjs';

export default function handler(req, res) {
  const client = Sentry.getClient();
  if (!client) {
    return res.status(200).json({ ok: false, message: `Sentry server SDK not initialised — NEXT_RUNTIME=${process.env.NEXT_RUNTIME}, NODE_ENV=${process.env.NODE_ENV}` });
  }
  const id = Sentry.captureException(new Error('PFC Sentry server test — delete this route after confirming'));
  res.status(200).json({ ok: true, message: `Captured — event ID: ${id?.slice(0, 8)}… — check Sentry Issues` });
}
