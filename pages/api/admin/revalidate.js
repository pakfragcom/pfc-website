import { resolveApiAuth } from '../../../lib/api-auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const auth = await resolveApiAuth(req, res);
  if (!auth.ok) return;

  const { paths } = req.body;
  if (!Array.isArray(paths) || paths.length === 0) {
    return res.status(400).json({ error: 'paths array required' });
  }

  const results = await Promise.allSettled(
    paths.map(p => res.revalidate(p))
  );

  const summary = results.map((r, i) => ({
    path: paths[i],
    ok: r.status === 'fulfilled',
    error: r.status === 'rejected' ? r.reason?.message : null,
  }));

  return res.status(200).json({ revalidated: summary });
}
