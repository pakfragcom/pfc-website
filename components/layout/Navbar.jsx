'use client'
import Link from 'next/link'

const navLinks = [
  { name: 'Home', href: '/' },
  { name: 'Blog', href: '/blog' },
  { name: 'Reviews', href: '/reviews' },
]

export default function Navbar({ onLinkClick }) {
  return (
    <nav aria-label="Main Navigation">
      <ul className="flex items-center gap-6 text-sm uppercase tracking-wide">
        {navLinks.map((link) => (
          <li key={link.name}>
            <Link
              href={link.href}
              onClick={onLinkClick}
              className="text-gray-300 hover:text-white transition"
            >
              {link.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
