import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";

function StatCard({ label, value, color = "white", sub }) {
  const colors = {
    white: "text-white",
    emerald: "text-emerald-400",
    yellow: "text-yellow-400",
    red: "text-red-400",
    orange: "text-orange-400",
    blue: "text-blue-400",
  };
  return (
    <div className="bg-white/5 ring-1 ring-white/10 rounded-2xl p-5">
      <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">{label}</div>
      <div className={`text-3xl font-bold ${colors[color]}`}>{value ?? "—"}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => {
        if (r.status === 401) { router.push("/pfc-mgmt/login"); return null; }
        return r.json();
      })
      .then((d) => { if (d) { setStats(d); setLoading(false); } });
  }, [router]);

  async function handleLogout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/pfc-mgmt/login");
  }

  return (
    <>
      <Head>
        <title>Admin Dashboard | PFC</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        {/* Top bar */}
        <div className="border-b border-white/10 bg-black/40 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-bold text-lg">PFC Admin</span>
            <nav className="flex gap-4 text-sm">
              <span className="text-emerald-400 font-medium">Overview</span>
              <Link href="/pfc-mgmt/sellers" className="text-gray-400 hover:text-white transition">Sellers</Link>
              <Link href="/pfc-mgmt/houses" className="text-gray-400 hover:text-white transition">Houses</Link>
              <Link href="/pfc-mgmt/reviews" className="text-gray-400 hover:text-white transition">Reviews</Link>
            </nav>
          </div>
          <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-white transition">
            Sign out
          </button>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-10">
          <h1 className="text-2xl font-bold mb-8">Overview</h1>

          {loading ? (
            <div className="text-gray-500 text-sm">Loading…</div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
                <StatCard label="Active" value={stats.active} color="emerald" />
                <StatCard label="Grace Period" value={stats.grace} color="yellow" sub="hidden from public soon" />
                <StatCard label="Expired" value={stats.expired} color="red" />
                <StatCard label="Pending" value={stats.pending} color="blue" sub="awaiting activation" />
                <StatCard label="Expiring (14d)" value={stats.expiringsoon} color="orange" sub="need renewal" />
                <StatCard
                  label="Revenue (Month)"
                  value={stats.revenue_this_month > 0 ? `PKR ${stats.revenue_this_month.toLocaleString()}` : "0"}
                  color="white"
                />
              </div>

              {stats.grace > 0 && (
                <div className="mb-4 rounded-xl bg-yellow-500/10 ring-1 ring-yellow-500/25 px-5 py-4 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-yellow-300">{stats.grace} seller{stats.grace > 1 ? "s" : ""} in grace period</span>
                    <span className="text-yellow-200/70 text-sm ml-2">— will be hidden from public when grace expires</span>
                  </div>
                  <Link href="/pfc-mgmt/sellers?filter=grace" className="text-sm text-yellow-300 hover:text-yellow-100 underline underline-offset-2">View</Link>
                </div>
              )}

              {stats.expiringsoon > 0 && (
                <div className="mb-4 rounded-xl bg-orange-500/10 ring-1 ring-orange-500/25 px-5 py-4 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-orange-300">{stats.expiringsoon} seller{stats.expiringsoon > 1 ? "s" : ""} expiring within 14 days</span>
                    <span className="text-orange-200/70 text-sm ml-2">— send renewal reminders</span>
                  </div>
                  <Link href="/pfc-mgmt/sellers?filter=expiring" className="text-sm text-orange-300 hover:text-orange-100 underline underline-offset-2">View</Link>
                </div>
              )}

              {stats.pending > 0 && (
                <div className="mb-4 rounded-xl bg-blue-500/10 ring-1 ring-blue-500/25 px-5 py-4 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-blue-300">{stats.pending} seller{stats.pending > 1 ? "s" : ""} pending activation</span>
                    <span className="text-blue-200/70 text-sm ml-2">— mark as paid to activate</span>
                  </div>
                  <Link href="/pfc-mgmt/sellers?filter=pending" className="text-sm text-blue-300 hover:text-blue-100 underline underline-offset-2">View</Link>
                </div>
              )}

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/pfc-mgmt/sellers" className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition">
                  Manage Sellers
                </Link>
                <Link href="/pfc-mgmt/sellers?modal=add" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition">
                  + Add New Seller
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export { getServerSideProps } from "../../lib/admin-guard";
