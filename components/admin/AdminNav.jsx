import Link from 'next/link';
import { useRouter } from 'next/router';

function NavLink({ href, active, children }) {
  return (
    <Link
      href={href}
      className={active
        ? 'text-emerald-400 font-medium'
        : 'text-gray-400 hover:text-white transition'}
    >
      {children}
    </Link>
  );
}

export default function AdminNav({ currentPage, identity, onLogout }) {
  const p = identity?.permissions ?? {};

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
            <NavLink href="/pfc-mgmt/reviews" active={currentPage === 'reviews'}>Reviews</NavLink>
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
