import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

function NavLink({ href, active, badge, children }) {
  return (
    <Link
      href={href}
      className={active
        ? 'text-emerald-400 font-medium inline-flex items-center gap-1'
        : 'text-gray-400 hover:text-white transition inline-flex items-center gap-1'}
    >
      {children}
      {badge > 0 && (
        <span className="text-[10px] bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-500/30 rounded px-1 leading-4">
          {badge}
        </span>
      )}
    </Link>
  );
}

export default function AdminNav({ currentPage, identity, onLogout }) {
  const p = identity?.permissions ?? {};
  const [counts, setCounts] = useState({ reviews: 0, fragrances: 0, orders: 0 });

  useEffect(() => {
    fetch('/api/admin/pending-counts')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setCounts(d); })
      .catch(() => {});
  }, [currentPage]);

  return (
    <div className="border-b border-white/10 bg-black/40 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <span className="font-bold text-lg text-white">PFC Admin</span>
        <nav className="flex gap-4 text-sm">
          <NavLink href="/pfc-mgmt" active={currentPage === 'overview'}>Overview</NavLink>
          {(p.can_manage_sellers || p.is_admin) && (
            <NavLink href="/pfc-mgmt/sellers" active={currentPage === 'sellers'}>Sellers</NavLink>
          )}
          {(p.can_manage_houses || p.is_admin) && (
            <NavLink href="/pfc-mgmt/houses" active={currentPage === 'houses'}>Houses</NavLink>
          )}
          {(p.can_manage_reviews || p.is_admin) && (
            <NavLink href="/pfc-mgmt/reviews" active={currentPage === 'reviews'} badge={counts.reviews}>Reviews</NavLink>
          )}
          {(p.can_manage_reviews || p.is_admin) && (
            <NavLink href="/pfc-mgmt/fragrances" active={currentPage === 'fragrances'} badge={counts.fragrances}>Fragrances</NavLink>
          )}
          {p.is_admin && (
            <NavLink href="/pfc-mgmt/orders" active={currentPage === 'orders'} badge={counts.orders}>Orders</NavLink>
          )}
          {(p.can_manage_sellers || p.is_admin) && (
            <NavLink href="/pfc-mgmt/transactions" active={currentPage === 'transactions'}>Transactions</NavLink>
          )}
          {(p.can_manage_sellers || p.is_admin) && (
            <NavLink href="/pfc-mgmt/disputes" active={currentPage === 'disputes'}>Disputes</NavLink>
          )}
          {(p.can_manage_sellers || p.is_admin) && (
            <NavLink href="/pfc-mgmt/listings" active={currentPage === 'listings'}>Listings</NavLink>
          )}
          {p.is_admin && (
            <NavLink href="/pfc-mgmt/team" active={currentPage === 'team'}>Team</NavLink>
          )}
        </nav>
      </div>
      <div className="flex items-center gap-3">
        {identity?.type === 'moderator' && (
          <span className="text-xs text-gray-600 uppercase tracking-wide">Moderator</span>
        )}
        <button
          onClick={onLogout}
          className="text-sm text-gray-500 hover:text-white transition"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
