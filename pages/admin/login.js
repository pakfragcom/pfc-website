import { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

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
      router.push("/admin");
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
        <div className="w-full max-w-sm">
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
        </div>
      </div>
    </>
  );
}

export function getServerSideProps({ req }) {
  const { isAdminAuthenticated } = require("../../lib/admin-auth");
  if (isAdminAuthenticated(req)) {
    return { redirect: { destination: "/admin", permanent: false } };
  }
  return { props: {} };
}
