import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import Head from "next/head";
import { useUser } from "../../lib/auth-context";

function ModeratorSection() {
  const router = useRouter();
  const user = useUser();

  if (user) {
    return (
      <div className="bg-white/5 ring-1 ring-white/10 rounded-2xl p-6 text-center">
        <p className="text-sm text-gray-400 mb-1">Signed in as</p>
        <p className="font-medium text-white mb-4">{user.email}</p>
        <button
          onClick={() => router.push('/pfc-mgmt')}
          className="w-full bg-white/10 hover:bg-white/15 text-white text-sm font-medium rounded-xl py-2.5 transition"
        >
          Continue to Admin Panel
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white/5 ring-1 ring-white/10 rounded-2xl p-6 text-center">
      <p className="text-sm text-gray-400 mb-4">Moderator? Sign in with your PFC account.</p>
      <Link
        href="/auth/login?next=/pfc-mgmt"
        className="block w-full text-center bg-white/10 hover:bg-white/15 text-white text-sm font-medium rounded-xl py-2.5 transition"
      >
        Sign in with PFC Account
      </Link>
    </div>
  );
}

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/pfc-mgmt");
    } else {
      const { error } = await res.json();
      setError(error || "Invalid password");
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Admin Login | PFC</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center mb-8">
            <div className="text-2xl font-bold text-white">PFC Admin</div>
            <div className="text-sm text-gray-500 mt-1">Seller Management Portal</div>
          </div>

          <form onSubmit={handleSubmit} className="bg-white/5 ring-1 ring-white/10 rounded-2xl p-6 space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5" htmlFor="password">
                Admin Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/40 ring-1 ring-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 outline-none focus:ring-white/25 transition"
                placeholder="Enter password"
                autoFocus
                required
              />
            </div>

            {error && (
              <div className="text-sm text-red-400 bg-red-500/10 ring-1 ring-red-500/20 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium rounded-xl py-2.5 transition"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-gray-600">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <ModeratorSection />
        </div>
      </div>
    </>
  );
}

export async function getServerSideProps({ req, res }) {
  try {
    const { isAdminAuthenticated } = require("../../lib/admin-auth");
    if (isAdminAuthenticated(req)) {
      return { redirect: { destination: "/pfc-mgmt", permanent: false } };
    }
  } catch (e) {
    console.error('[pfc-mgmt/login] admin cookie check failed:', e?.message);
  }

  try {
    const { resolveIdentity } = require("../../lib/admin-guard");
    const identity = await resolveIdentity(req, res);
    if (identity) {
      return { redirect: { destination: "/pfc-mgmt", permanent: false } };
    }
  } catch (e) {
    console.error('[pfc-mgmt/login] identity check failed:', e?.message);
  }

  return { props: {} };
}
