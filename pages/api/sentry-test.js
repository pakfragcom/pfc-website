import * as Sentry from '@sentry/nextjs';

export default function handler(req, res) {
  try {
    throw new Error('PFC Sentry server test — delete this route after confirming');
  } catch (err) {
    Sentry.captureException(err);
    res.status(200).json({ ok: true, message: 'Server error captured and sent to Sentry.' });
  }
}
