import Head from 'next/head';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient, useAuth } from '../../lib/auth-context';

// States: 'idle' | 'sending' | 'code_sent' | 'verifying' | 'error'

export default function Login() {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const { user } = useAuth();

  const [email, setEmail]           = useState('');
  const [code, setCode]             = useState(['', '', '', '', '', '']);
  const [stage, setStage]           = useState('idle');
  const [error, setError]           = useState('');
  const [oauthLoading, setOauthLoading] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef([]);
  const cooldownRef = useRef(null);

  useEffect(() => {
    if (user) router.replace(router.query.next || '/');
  }, [user]);

  useEffect(() => {
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); };
  }, []);

  function startCooldown() {
    setResendCooldown(30);
    cooldownRef.current = setInterval(() => {
      setResendCooldown(n => {
        if (n <= 1) { clearInterval(cooldownRef.current); return 0; }
        return n - 1;
      });
    }, 1000);
  }

  async function handleSendCode(e) {
    e?.preventDefault();
    if (!email.trim()) return;
    setStage('sending'); setError('');
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    });
    if (error) { setError(error.message); setStage('idle'); return; }
    setCode(['', '', '', '', '', '']);
    setStage('code_sent');
    startCooldown();
    setTimeout(() => inputRefs.current[0]?.focus(), 100);
  }

  async function handleVerify(e) {
    e?.preventDefault();
    const token = code.join('');
    if (token.length < 6) return;
    setStage('verifying'); setError('');
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token,
      type: 'email',
    });
    if (error) {
      setError('Invalid or expired code. Try again.');
      setStage('code_sent');
      setCode(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
      return;
    }
    router.replace(router.query.next || '/');
  }

  function handleCodeInput(i, val) {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...code];
    next[i] = digit;
    setCode(next);
    if (digit && i < 5) inputRefs.current[i + 1]?.focus();
    if (next.every(d => d !== '') && next.join('').length === 6) {
      // Auto-submit when all 6 digits entered
      setTimeout(() => {
        const token = next.join('');
        if (token.length === 6) handleVerifyDirect(token);
      }, 80);
    }
  }

  function handleCodeKey(i, e) {
    if (e.key === 'Backspace' && !code[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
  }

  function handleCodePaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = [...'000000'].map((_, i) => pasted[i] || '');
    setCode(next);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  }

  async function handleVerifyDirect(token) {
    setStage('verifying'); setError('');
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(), token, type: 'email',
    });
    if (error) {
      setError('Invalid or expired code. Try again.');
      setStage('code_sent');
      setCode(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } else {
      router.replace(router.query.next || '/');
    }
  }

  async function handleOAuth(provider) {
    setOauthLoading(provider); setError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${router.query.next || '/'}` },
    });
    if (error) { setError(error.message); setOauthLoading(''); }
  }

  const isVerifying = stage === 'verifying';

  return (
    <>
      <Head>
        <title>Sign In | PFC</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        {/* Background halos */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-[#2a5c4f]/15 blur-3xl" />
          <div className="absolute -bottom-40 right-0 h-80 w-80 rounded-full bg-[#94aea7]/10 blur-3xl" />
        </div>

        <div className="relative w-full max-w-sm">
          {/* Brand */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-block text-2xl font-bold text-white tracking-tight">PFC</Link>
            <p className="mt-1.5 text-sm text-gray-500">
              {stage === 'code_sent' || isVerifying
                ? 'Enter the code we sent you'
                : 'Sign in or create your account'}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur p-6 shadow-2xl">

            {/* ── Stage: idle / sending ── */}
            {(stage === 'idle' || stage === 'sending') && (
              <>
                {/* OAuth */}
                <div className="space-y-3 mb-6">
                  <OAuthBtn onClick={() => handleOAuth('google')} loading={oauthLoading === 'google'} icon={<GoogleIcon />} label="Continue with Google" />
                  <OAuthBtn onClick={() => handleOAuth('facebook')} loading={oauthLoading === 'facebook'} icon={<FacebookIcon />} label="Continue with Facebook" />
                </div>

                <Divider />

                {/* Email OTP */}
                <form onSubmit={handleSendCode} className="mt-5 space-y-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Email address</label>
                    <input
                      type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com" autoComplete="email" required
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-[#557d72] focus:ring-1 focus:ring-[#557d72] transition"
                    />
                  </div>

                  {error && <ErrorMsg>{error}</ErrorMsg>}

                  <button type="submit" disabled={stage === 'sending' || !email.trim()}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2a5c4f] via-[#4a7a6e] to-[#94aea7] py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#2a5c4f]/20 transition hover:brightness-110 disabled:opacity-50">
                    {stage === 'sending' ? <><Spinner /> Sending…</> : 'Send code →'}
                  </button>
                </form>

                <p className="mt-4 text-center text-xs text-gray-600">
                  We&apos;ll email you a 6-digit code. No password needed.
                </p>
              </>
            )}

            {/* ── Stage: code_sent / verifying ── */}
            {(stage === 'code_sent' || isVerifying) && (
              <>
                <p className="text-center text-xs text-gray-400 mb-5">
                  Code sent to <span className="text-white font-medium">{email}</span>
                </p>

                {/* 6-box OTP input */}
                <form onSubmit={handleVerify} className="space-y-5">
                  <div className="flex justify-center gap-2" onPaste={handleCodePaste}>
                    {code.map((d, i) => (
                      <input
                        key={i}
                        ref={el => inputRefs.current[i] = el}
                        type="text" inputMode="numeric" maxLength={1}
                        value={d}
                        onChange={e => handleCodeInput(i, e.target.value)}
                        onKeyDown={e => handleCodeKey(i, e)}
                        disabled={isVerifying}
                        className="w-11 h-14 rounded-xl border border-white/10 bg-black/40 text-center text-xl font-bold text-white outline-none focus:border-[#557d72] focus:ring-1 focus:ring-[#557d72] transition disabled:opacity-40 caret-transparent"
                      />
                    ))}
                  </div>

                  {error && <ErrorMsg>{error}</ErrorMsg>}

                  <button type="submit"
                    disabled={isVerifying || code.join('').length < 6}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2a5c4f] via-[#4a7a6e] to-[#94aea7] py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#2a5c4f]/20 transition hover:brightness-110 disabled:opacity-50">
                    {isVerifying ? <><Spinner /> Verifying…</> : 'Verify code'}
                  </button>
                </form>

                <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                  <button onClick={() => { setStage('idle'); setError(''); setCode(['','','','','','']); }}
                    className="hover:text-white transition">
                    ← Change email
                  </button>
                  {resendCooldown > 0 ? (
                    <span className="text-gray-600">Resend in {resendCooldown}s</span>
                  ) : (
                    <button onClick={handleSendCode} className="text-[#94aea7] hover:text-white transition">
                      Resend code
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          <p className="mt-5 text-center text-xs text-gray-600">
            By continuing you agree to our{' '}
            <Link href="/legal/terms" className="text-gray-500 hover:text-white transition">Terms</Link>
            {' '}and{' '}
            <Link href="/legal/privacy" className="text-gray-500 hover:text-white transition">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </>
  );
}

function OAuthBtn({ onClick, loading, icon, label }) {
  return (
    <button type="button" onClick={onClick} disabled={!!loading}
      className="w-full flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-50">
      {loading ? <Spinner /> : icon}
      {label}
    </button>
  );
}

function Divider() {
  return (
    <div className="relative flex items-center">
      <div className="flex-1 border-t border-white/10" />
      <span className="mx-3 text-xs text-gray-600 uppercase tracking-wider">or</span>
      <div className="flex-1 border-t border-white/10" />
    </div>
  );
}

function ErrorMsg({ children }) {
  return <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{children}</p>;
}

function Spinner() {
  return <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>;
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg className="h-4 w-4 text-[#1877F2]" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.675 0H1.325A1.326 1.326 0 000 1.325v21.35C0 23.403.597 24 1.325 24h11.495v-9.294H9.691V11.06h3.129V8.414c0-3.1 1.893-4.788 4.66-4.788 1.325 0 2.463.099 2.794.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.646h-3.12V24h6.116A1.326 1.326 0 0024 22.675V1.325A1.326 1.326 0 0022.675 0z"/>
    </svg>
  );
}
