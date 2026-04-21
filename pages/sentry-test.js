import * as Sentry from '@sentry/nextjs';

export default function SentryTest() {
  function throwClient() {
    throw new Error('PFC Sentry client test — delete this page after confirming');
  }

  async function throwServer() {
    const res = await fetch('/api/sentry-test');
    const data = await res.json();
    alert(data.message);
  }

  return (
    <div style={{ padding: 40, fontFamily: 'sans-serif', background: '#0a0a0a', minHeight: '100vh', color: 'white' }}>
      <h1 style={{ marginBottom: 24 }}>Sentry Test — delete after confirming</h1>
      <div style={{ display: 'flex', gap: 16 }}>
        <button onClick={throwClient}
          style={{ padding: '12px 24px', background: '#c0392b', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>
          Throw Client Error
        </button>
        <button onClick={throwServer}
          style={{ padding: '12px 24px', background: '#2a5c4f', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>
          Throw Server Error
        </button>
      </div>
      <p style={{ marginTop: 24, color: '#666', fontSize: 13 }}>
        After clicking, check your Sentry dashboard for the error. Then ask Claude to delete this page.
      </p>
    </div>
  );
}
