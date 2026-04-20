import { useEffect, useState, useMemo } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSupabaseClient } from "../../lib/auth-context";
import AdminNav from "../../components/admin/AdminNav";

const STATUS_COLORS = {
  active: "text-emerald-400 bg-emerald-500/10 ring-emerald-500/20",
  grace: "text-yellow-400 bg-yellow-500/10 ring-yellow-500/20",
  expired: "text-red-400 bg-red-500/10 ring-red-500/20",
  pending: "text-blue-400 bg-blue-500/10 ring-blue-500/20",
};

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function DaysChip({ days }) {
  if (days === null) return <span className="text-gray-600">—</span>;
  if (days < 0) return <span className="text-red-400 text-xs">{Math.abs(days)}d ago</span>;
  if (days <= 7) return <span className="text-red-400 text-xs font-medium">{days}d left</span>;
  if (days <= 14) return <span className="text-orange-400 text-xs font-medium">{days}d left</span>;
  return <span className="text-gray-400 text-xs">{days}d left</span>;
}

// ── Mark Paid Modal ──────────────────────────────────────────────
function MarkPaidModal({ seller, onClose, onSuccess }) {
  const [form, setForm] = useState({
    amount_pkr: seller.seller_type === "BNIB" ? "10000" : "6000",
    duration_months: seller.seller_type === "BNIB" ? "4" : "3",
    payment_method: "bank_transfer",
    payment_reference: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/mark-paid", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seller_id: seller.id, ...form }),
    });
    if (res.ok) {
      onSuccess();
    } else {
      const d = await res.json();
      setError(d.error || "Failed");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="bg-[#111] ring-1 ring-white/10 rounded-2xl p-6 w-full max-w-md">
        <h3 className="font-semibold text-lg mb-1">Mark as Paid</h3>
        <p className="text-sm text-gray-400 mb-5">{seller.name} · {seller.code}</p>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Amount (PKR)</label>
              <input
                type="number"
                value={form.amount_pkr}
                onChange={(e) => setForm({ ...form, amount_pkr: e.target.value })}
                className="w-full bg-black/40 ring-1 ring-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-white/25"
                required
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Duration (months)</label>
              <select
                value={form.duration_months}
                onChange={(e) => setForm({ ...form, duration_months: e.target.value })}
                className="w-full bg-black/40 ring-1 ring-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-white/25"
              >
                <option value="1">1 month</option>
                <option value="2">2 months</option>
                <option value="3">3 months</option>
                <option value="4">4 months</option>
                <option value="6">6 months</option>
                <option value="12">12 months</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 block mb-1">Payment Method</label>
            <select
              value={form.payment_method}
              onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
              className="w-full bg-black/40 ring-1 ring-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-white/25"
            >
              <option value="bank_transfer">Bank Transfer</option>
              <option value="easypaisa">EasyPaisa</option>
              <option value="jazzcash">JazzCash</option>
              <option value="cash">Cash</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-500 block mb-1">Reference / TRN (optional)</label>
            <input
              type="text"
              value={form.payment_reference}
              onChange={(e) => setForm({ ...form, payment_reference: e.target.value })}
              className="w-full bg-black/40 ring-1 ring-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-white/25"
              placeholder="e.g. TRN12345"
            />
          </div>

          {error && <div className="text-sm text-red-400">{error}</div>}

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-xl transition"
            >
              {loading ? "Saving…" : "Confirm Payment"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 bg-white/10 hover:bg-white/15 text-white text-sm font-medium py-2.5 rounded-xl transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Add Seller Modal ─────────────────────────────────────────────
function AddSellerModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: "", code: "", seller_type: "BNIB", contact_whatsapp: "", city: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/sellers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      onSuccess();
    } else {
      const d = await res.json();
      setError(d.error || "Failed");
      setLoading(false);
    }
  }

  const f = (key) => ({ value: form[key], onChange: (e) => setForm({ ...form, [key]: e.target.value }) });
  const inputClass = "w-full bg-black/40 ring-1 ring-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-white/25";
  const labelClass = "text-xs text-gray-500 block mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="bg-[#111] ring-1 ring-white/10 rounded-2xl p-6 w-full max-w-md">
        <h3 className="font-semibold text-lg mb-5">Add New Seller</h3>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className={labelClass}>Full Name *</label>
            <input {...f("name")} className={inputClass} placeholder="e.g. Ahmed Khan" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Verification Code *</label>
              <input {...f("code")} className={inputClass} placeholder="e.g. AK-001" required />
            </div>
            <div>
              <label className={labelClass}>Type *</label>
              <select {...f("seller_type")} className={inputClass}>
                <option value="BNIB">BNIB</option>
                <option value="DECANT">DECANT</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>WhatsApp</label>
              <input {...f("contact_whatsapp")} className={inputClass} placeholder="+92 300 1234567" />
            </div>
            <div>
              <label className={labelClass}>City</label>
              <input {...f("city")} className={inputClass} placeholder="Lahore" />
            </div>
          </div>

          {error && <div className="text-sm text-red-400">{error}</div>}

          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={loading} className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-xl transition">
              {loading ? "Adding…" : "Add Seller"}
            </button>
            <button type="button" onClick={onClose} className="px-5 bg-white/10 hover:bg-white/15 text-white text-sm font-medium py-2.5 rounded-xl transition">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const ADMIN_IDENTITY = { type: 'admin', displayName: 'Admin', permissions: { is_admin: true, can_manage_sellers: true, can_manage_houses: true, can_manage_reviews: true } };

// ── Main Page ────────────────────────────────────────────────────
export default function AdminSellers({ identity = ADMIN_IDENTITY }) {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState(router.query.filter || "all");
  const [markPaidSeller, setMarkPaidSeller] = useState(null);
  const [showAdd, setShowAdd] = useState(router.query.modal === "add");
  const [actionLoading, setActionLoading] = useState(null);

  async function loadSellers() {
    const res = await fetch("/api/admin/sellers");
    if (res.status === 401) { router.push("/pfc-mgmt/login"); return; }
    const data = await res.json();
    setSellers(data);
    setLoading(false);
  }

  useEffect(() => { loadSellers(); }, []);

  async function handleLogout() {
    if (identity?.type === 'admin') await fetch("/api/admin/auth", { method: "DELETE" });
    else await supabase.auth.signOut();
    router.push("/pfc-mgmt/login");
  }

  async function changeStatus(seller, status) {
    setActionLoading(seller.id);
    await fetch("/api/admin/sellers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: seller.id, status }),
    });
    await loadSellers();
    setActionLoading(null);
  }

  async function deleteSeller(seller) {
    if (!confirm(`Delete ${seller.name}? This cannot be undone.`)) return;
    setActionLoading(seller.id);
    await fetch("/api/admin/sellers", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: seller.id }),
    });
    await loadSellers();
    setActionLoading(null);
  }

  const now = new Date();
  const in14 = new Date(); in14.setDate(in14.getDate() + 14);

  const filtered = useMemo(() => {
    let list = sellers;

    if (filter === "grace") list = list.filter((s) => s.status === "grace");
    else if (filter === "expired") list = list.filter((s) => s.status === "expired");
    else if (filter === "pending") list = list.filter((s) => s.status === "pending");
    else if (filter === "expiring") list = list.filter((s) => {
      if (!s.subscription_expires_at) return false;
      const exp = new Date(s.subscription_expires_at);
      return exp <= in14 && exp >= now && s.status === "active";
    });

    if (search) {
      const q = search.toLowerCase();
      list = list.filter((s) =>
        s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)
      );
    }

    return list;
  }, [sellers, filter, search]);

  const FILTERS = [
    { id: "all", label: `All (${sellers.length})` },
    { id: "active", label: `Active (${sellers.filter((s) => s.status === "active").length})` },
    { id: "grace", label: `Grace (${sellers.filter((s) => s.status === "grace").length})` },
    { id: "expired", label: `Expired (${sellers.filter((s) => s.status === "expired").length})` },
    { id: "pending", label: `Pending (${sellers.filter((s) => s.status === "pending").length})` },
    { id: "expiring", label: "Expiring Soon" },
  ];

  if (!identity.permissions.can_manage_sellers && !identity.permissions.is_admin) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <AdminNav currentPage="sellers" identity={identity} onLogout={handleLogout} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-1">Access restricted</p>
            <p className="text-gray-600 text-xs">You don&apos;t have permission to manage sellers.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Sellers | PFC Admin</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      {markPaidSeller && (
        <MarkPaidModal
          seller={markPaidSeller}
          onClose={() => setMarkPaidSeller(null)}
          onSuccess={() => { setMarkPaidSeller(null); loadSellers(); }}
        />
      )}

      {showAdd && (
        <AddSellerModal
          onClose={() => setShowAdd(false)}
          onSuccess={() => { setShowAdd(false); loadSellers(); }}
        />
      )}

      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <AdminNav currentPage="sellers" identity={identity} onLogout={handleLogout} />

        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Sellers</h1>
            <button
              onClick={() => setShowAdd(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-4 py-2 rounded-xl transition"
            >
              + Add Seller
            </button>
          </div>

          {/* Search + filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <input
              type="text"
              placeholder="Search by name or code…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-white/5 ring-1 ring-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-gray-600 outline-none focus:ring-white/20"
            />
            <div className="flex flex-wrap gap-2">
              {FILTERS.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setFilter(id)}
                  className={[
                    "text-xs px-3 py-1.5 rounded-lg font-medium transition",
                    filter === id
                      ? "bg-white text-black"
                      : "bg-white/5 ring-1 ring-white/10 text-gray-400 hover:text-white",
                  ].join(" ")}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-gray-500 text-sm py-10 text-center">Loading sellers…</div>
          ) : (
            <div className="ring-1 ring-white/10 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/3 text-gray-500 text-xs uppercase tracking-wider">
                      <th className="text-left px-4 py-3">Name</th>
                      <th className="text-left px-4 py-3">Code</th>
                      <th className="text-left px-4 py-3">Type</th>
                      <th className="text-left px-4 py-3">Status</th>
                      <th className="text-left px-4 py-3">Expires</th>
                      <th className="text-right px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center text-gray-600 py-10">
                          No sellers found
                        </td>
                      </tr>
                    ) : (
                      filtered.map((seller) => {
                        const days = daysUntil(seller.subscription_expires_at);
                        const isLoading = actionLoading === seller.id;
                        return (
                          <tr
                            key={seller.id}
                            className="border-b border-white/5 last:border-0 hover:bg-white/3 transition"
                          >
                            <td className="px-4 py-3 font-medium text-white">{seller.name}</td>
                            <td className="px-4 py-3 font-mono text-gray-300">{seller.code}</td>
                            <td className="px-4 py-3 text-gray-400">{seller.seller_type}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ring-1 ${STATUS_COLORS[seller.status] || "text-gray-400"}`}>
                                {seller.status}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-gray-400 text-xs">
                                  {seller.subscription_expires_at
                                    ? new Date(seller.subscription_expires_at).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })
                                    : "—"}
                                </span>
                                <DaysChip days={days} />
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-end gap-2">
                                {isLoading ? (
                                  <span className="text-gray-500 text-xs">…</span>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => setMarkPaidSeller(seller)}
                                      className="text-xs bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 px-2.5 py-1 rounded-lg transition"
                                    >
                                      Mark Paid
                                    </button>
                                    {seller.status !== "active" && (
                                      <button
                                        onClick={() => changeStatus(seller, "active")}
                                        className="text-xs bg-white/10 hover:bg-white/20 text-gray-200 px-2.5 py-1 rounded-lg transition"
                                      >
                                        Activate
                                      </button>
                                    )}
                                    {seller.status === "active" && (
                                      <button
                                        onClick={() => changeStatus(seller, "expired")}
                                        className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 px-2.5 py-1 rounded-lg transition"
                                      >
                                        Expire
                                      </button>
                                    )}
                                    <button
                                      onClick={() => deleteSeller(seller)}
                                      className="text-xs text-gray-600 hover:text-red-400 px-1.5 py-1 rounded-lg transition"
                                      title="Delete seller"
                                    >
                                      ✕
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="text-xs text-gray-600 mt-4 text-right">
            {filtered.length} of {sellers.length} sellers shown
          </div>
        </div>
      </div>
    </>
  );
}

export { getServerSideProps } from "../../lib/admin-guard";
