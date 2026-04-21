import * as Sentry from '@sentry/nextjs';
import { useState } from 'react';

export default function SentryTest() {
  const [clientStatus, setClientStatus] = useState('');
  const [serverStatus, setServerStatus] = useState('');

  function captureClient() {
    try {
      Sentry.captureException(new Error('PFC Sentry client test — delete this page after confirming'));
      setClientStatus('✓ Sent to Sentry — check your dashboard');
    } catch {
      setClientStatus('✗ Failed — SDK may not be initialised');
    }
  }

  async function captureServer() {
    setServerStatus('Sending…');
    const res = await fetch('/api/sentry-test');
    const data = await res.json();
    setServerStatus(data.ok ? '✓ Sent to Sentry — check your dashboard' : '✗ ' + data.message);
  }

  return (
    <div style={{ padding: 40, fontFamily: 'sans-serif', background: '#0a0a0a', minHeight: '100vh', color: 'white' }}>
      <h1 style={{ marginBottom: 8 }}>Sentry Test</h1>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 32 }}>Delete this page after confirming both work.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 360 }}>
        <div>
          <button onClick={captureClient}
            style={{ padding: '12px 24px', background: '#c0392b', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, width: '100%' }}>
            Capture Client Error
          </button>
          {clientStatus && <p style={{ marginTop: 8, fontSize: 13, color: clientStatus.startsWith('✓') ? '#94aea7' : '#e74c3c' }}>{clientStatus}</p>}
        </div>
        <div>
          <button onClick={captureServer}
            style={{ padding: '12px 24px', background: '#2a5c4f', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, width: '100%' }}>
            Capture Server Error
          </button>
          {serverStatus && <p style={{ marginTop: 8, fontSize: 13, color: serverStatus.startsWith('✓') ? '#94aea7' : '#e74c3c' }}>{serverStatus}</p>}
        </div>
      </div>
    </div>
  );
}
