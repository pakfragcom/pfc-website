import * as Sentry from '@sentry/nextjs';
import { useState, useEffect } from 'react';

export default function SentryTest() {
  const [clientStatus, setClientStatus] = useState('');
  const [serverStatus, setServerStatus] = useState('');
  const [debug, setDebug] = useState({});

  useEffect(() => {
    const client = Sentry.getClient();
    const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
    setDebug({
      dsnDefined: !!dsn,
      dsnPreview: dsn ? dsn.slice(0, 30) + '…' : 'undefined',
      sdkInitialised: !!client,
    });
  }, []);

  function captureClient() {
    const id = Sentry.captureException(new Error('PFC Sentry client test'));
    setClientStatus(id
      ? `✓ Captured — event ID: ${id.slice(0, 8)}… — check Sentry Issues`
      : '✗ captureException returned no ID — SDK not initialised');
  }

  async function captureServer() {
    setServerStatus('Sending…');
    const res = await fetch('/api/sentry-test');
    const data = await res.json();
    setServerStatus(data.ok ? `✓ ${data.message}` : `✗ ${data.message}`);
  }

  const row = (label, val) => (
    <div style={{ display: 'flex', gap: 12, marginBottom: 6, fontSize: 13 }}>
      <span style={{ color: '#666', width: 120, flexShrink: 0 }}>{label}</span>
      <span style={{ color: val === true ? '#94aea7' : val === false ? '#e74c3c' : '#ccc' }}>
        {String(val)}
      </span>
    </div>
  );

  return (
    <div style={{ padding: 40, fontFamily: 'monospace', background: '#0a0a0a', minHeight: '100vh', color: 'white' }}>
      <h1 style={{ marginBottom: 8, fontFamily: 'sans-serif' }}>Sentry Debug</h1>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 24, fontFamily: 'sans-serif' }}>Delete this page after confirming.</p>

      <div style={{ background: '#111', border: '1px solid #222', borderRadius: 8, padding: 20, marginBottom: 32 }}>
        <p style={{ color: '#666', fontSize: 11, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Client-side state</p>
        {row('DSN env var', debug.dsnDefined)}
        {row('DSN value', debug.dsnPreview || '…')}
        {row('SDK initialised', debug.sdkInitialised)}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 400 }}>
        <div>
          <button onClick={captureClient}
            style={{ padding: '12px 24px', background: '#c0392b', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, width: '100%', fontFamily: 'sans-serif' }}>
            Capture Client Error
          </button>
          {clientStatus && <p style={{ marginTop: 8, fontSize: 13, color: clientStatus.startsWith('✓') ? '#94aea7' : '#e74c3c', fontFamily: 'sans-serif' }}>{clientStatus}</p>}
        </div>
        <div>
          <button onClick={captureServer}
            style={{ padding: '12px 24px', background: '#2a5c4f', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, width: '100%', fontFamily: 'sans-serif' }}>
            Capture Server Error
          </button>
          {serverStatus && <p style={{ marginTop: 8, fontSize: 13, color: serverStatus.startsWith('✓') ? '#94aea7' : '#e74c3c', fontFamily: 'sans-serif' }}>{serverStatus}</p>}
        </div>
      </div>
    </div>
  );
}
