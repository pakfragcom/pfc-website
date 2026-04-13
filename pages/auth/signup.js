import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient, useUser } from '../../lib/auth-context';

const PAKISTAN_CITIES = [
  'Karachi','Lahore','Islamabad','Rawalpindi','Faisalabad','Multan',
  'Peshawar','Quetta','Sialkot','Gujranwala','Hyderabad','Abbottabad',
  'Bahawalpur','Sargodha','Sukkur','Other',
];

export default function Signup() {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const user = useUser();

  const [form, setForm] = useState({ displayName: '', city: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  if (user) { router.replace('/'); return null; }

  const f = key => ({ value: form[key], onChange: e => setForm(p => ({ ...p, [key]: e.target.value })) });

  async function handleEmail(e) {
    e.preventDefault();
    setLoading(true); setError('');
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.displayName, city: form.city },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) { setError(error.message); setLoading(false); }
    else setDone(true);
  }

  async function handleOAuth(provider) {
    setOauthLoading(provider); setError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) { setError(error.message); setOauthLoading(''); }
  }

  if (done) return (
    <ConfirmScreen email={form.email} />
  );

  return (
    <>
      <Head>
        <title>Create Account | PFC</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 py-12">
        <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-[#2a5c4f]/15 blur-3xl" />
          <div className="absolute -bottom-40 right-0 h-80 w-80 rounded-full bg-[#94aea7]/10 blur-3xl" />
        </div>

        <div className="relative w-full max-w-sm">
          <div className="text-center mb-8">
            <Link href="/" className="inline-block text-xl font-bold text-white tracking-tight">PFC</Link>
            <p className="mt-1 text-sm text-gray-500">Join Pakistan&apos;s fragrance community</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur p-6 shadow-2xl">
            {/* OAuth */}
            <div className="space-y-3 mb-6">
              <OAuthButton onClick={() => handleOAuth('google')} loading={oauthLoading === 'google'} icon={<GoogleIcon />} label="Continue with Google" />
              <OAuthButton onClick={() => handleOAuth('facebook')} loading={oauthLoading === 'facebook'} icon={<FacebookIcon />} label="Continue with Facebook" />
            </div>

            <Divider label="or sign up with email" />

            <form onSubmit={handleEmail} className="space-y-4 mt-6">
              <Field label="Display Name" type="text" placeholder="How you'll appear on reviews" autoComplete="name" {...f('displayName')} required />

              {/* City dropdown */}
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">City</label>
                <select
                  value={form.city}
                  onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-[#557d72] focus:ring-1 focus:ring-[#557d72] transition"
                >
                  <option value="">Select your city</option>
                  {PAKISTAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <Field label="Email" type="email" placeholder="you@example.com" autoComplete="email" {...f('email')} required />
              <Field label="Password" type="password" placeholder="At least 8 characters" autoComplete="new-password" {...f('password')} required minLength={8} />

              {error && <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-[#2a5c4f] via-[#4a7a6e] to-[#94aea7] py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#2a5c4f]/20 transition hover:brightness-110 disabled:opacity-50"
              >
                {loading ? 'Creating account…' : 'Create Account'}
              </button>

              <p className="text-[11px] text-gray-600 text-center leading-relaxed">
                By creating an account you agree to our{' '}
                <Link href="/legal/terms" className="text-gray-400 hover:text-white">Terms</Link>
                {' '}and{' '}
                <Link href="/legal/privacy" className="text-gray-400 hover:text-white">Privacy Policy</Link>.
              </p>
            </form>
          </div>

          <p className="mt-5 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-[#94aea7] hover:text-white transition">Sign in</Link>
          </p>
        </div>
      </div>
    </>
  );
}

function ConfirmScreen({ email }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="relative w-full max-w-sm text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#2a5c4f]/20 border border-[#2a5c4f]/40 mb-6">
          <svg className="w-7 h-7 text-[#94aea7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Check your email</h1>
        <p className="text-sm text-gray-400 leading-relaxed">
          We sent a confirmation link to <span className="text-white">{email}</span>.<br />
          Click it to activate your PFC account.
        </p>
        <Link href="/" className="inline-block mt-8 text-sm text-[#94aea7] hover:text-white transition">
          ← Back to home
        </Link>
      </div>
    </div>
  );
}

/* ── Shared ── */
function OAuthButton({ onClick, loading, icon, label }) {
  return (
    <button type="button" onClick={onClick} disabled={!!loading}
      className="w-full flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-50">
      {loading ? <Spinner /> : icon}{label}
    </button>
  );
}

function Field({ label, type, placeholder, autoComplete, value, onChange, required, minLength }) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1.5">{label}</label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        autoComplete={autoComplete} required={required} minLength={minLength}
        className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-[#557d72] focus:ring-1 focus:ring-[#557d72] transition" />
    </div>
  );
}

function Divider({ label }) {
  return (
    <div className="relative flex items-center">
      <div className="flex-1 border-t border-white/10" />
      <span className="mx-3 text-[10px] text-gray-600 uppercase tracking-wider">{label}</span>
      <div className="flex-1 border-t border-white/10" />
    </div>
  );
}

function Spinner() {
  return <svg className="h-4 w-4 animate-spin text-white/60" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>;
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84z"/>
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg className="h-4 w-4 text-[#1877F2]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22.675 0H1.325A1.326 1.326 0 000 1.325v21.35C0 23.403.597 24 1.325 24h11.495v-9.294H9.691V11.06h3.129V8.414c0-3.1 1.893-4.788 4.66-4.788 1.325 0 2.463.099 2.794.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.646h-3.12V24h6.116A1.326 1.326 0 0024 22.675V1.325A1.326 1.326 0 0022.675 0z"/>
    </svg>
  );
}
