import disposableDomains from 'disposable-email-domains';

// Build a Set once at module load — O(1) lookups
const BLOCKED = new Set(disposableDomains);

// A few extras that slip through the list
const EXTRA_BLOCKED = new Set([
  'yopmail.com', 'yopmail.fr', 'cool.fr.nf', 'jetable.fr.nf',
  'nospam.ze.tc', 'nomail.xl.cx', 'mega.zik.dj', 'speed.1s.fr',
  'courriel.fr.nf', 'moncourrier.fr.nf', 'monemail.fr.nf',
  'monmail.fr.nf', 'dispostable.com', 'mailnull.com', 'spamgourmet.com',
]);

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body || {};
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email is required' });
  }

  const parts = email.trim().toLowerCase().split('@');
  if (parts.length !== 2 || !parts[1].includes('.')) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  const domain = parts[1];

  if (BLOCKED.has(domain) || EXTRA_BLOCKED.has(domain)) {
    return res.status(200).json({
      allowed: false,
      reason: 'Disposable email addresses are not allowed. Please use a permanent email.',
    });
  }

  return res.status(200).json({ allowed: true });
}
