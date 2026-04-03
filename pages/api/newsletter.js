// pages/api/newsletter.js
// Sends a new subscriber email to Loops.so
// Env var required: LOOPS_API_KEY (see .env.example)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email } = req.body

  // Basic validation
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email is required' })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' })
  }

  if (!process.env.LOOPS_API_KEY) {
    // Newsletter not yet configured — silently succeed so UI doesn't break
    console.warn('[newsletter] LOOPS_API_KEY not set — skipping submission')
    return res.status(200).json({ ok: true })
  }

  try {
    const response = await fetch('https://app.loops.so/api/v1/contacts/create', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.LOOPS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        source: 'pakfrag.com footer',
        subscribed: true,
      }),
    })

    if (!response.ok) {
      const text = await response.text()
      console.error('[newsletter] Loops API error:', response.status, text)
      return res.status(502).json({ error: 'Subscription service unavailable' })
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('[newsletter] Fetch error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
