'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMemo, useRef, useEffect, useCallback } from 'react'

export default function Navbar({ onLinkClick }) {
  const pathname = usePathname()

  // Single source of truth (keep only real links—no placeholders)
  const ITEMS = useMemo(
    () => [
      { label: 'Home',  href: '/', external: false },
      { label: 'Forum', href: 'https://forum.pakfrag.com', external: true },
    ],
    []
  )

  // Roving tabindex for arrow-key navigation
  const linkRefs = useRef([])

  // Determine which item is active (simple exact match for `/`)
  const isActive = useCallback(
    (href) => {
      if (!href || href.startsWith('http')) return false
      // You can enhance this to startsWith for sections when you add more pages
      return pathname === href
    },
    [pathname]
  )

  const onKeyDown = (e, idx) => {
    const count = ITEMS.length
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return

    e.preventDefault()
    let nextIndex = idx

    if (e.key === 'ArrowRight') nextIndex = (idx + 1) % count
    if (e.key === 'ArrowLeft')  nextIndex = (idx - 1 + count) % count
    if (e.key === 'Home')       nextIndex = 0
    if (e.key === 'End')        nextIndex = count - 1

    linkRefs.current[nextIndex]?.focus()
  }

  useEffect(() => {
    // Ensure refs array length matches items
    linkRefs.current = linkRefs.current.slice(0, ITEMS.length)
  }, [ITEMS.length])

  return (
    <nav
      aria-label="Main Navigation"
      itemScope
      itemType="https://schema.org/SiteNavigationElement"
      role="navigation"
    >
      <ul
        className="flex items-center gap-6 text-sm uppercase tracking-wide"
        role="list"
      >
        {ITEMS.map((item, idx) => {
          const active = isActive(item.href)
          const commonClasses =
            [
              'relative inline-flex items-center',
              'px-1 py-2 text-gray-300 hover:text-white',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded-sm',
              // underline indicator (motion-safe)
              'transition-colors motion-safe:duration-200',
            ].join(' ')

          const indicator =
            <span
              aria-hidden="true"
              className={[
                'pointer-events-none absolute left-0 right-0 -bottom-0.5 h-[2px]',
                active ? 'bg-white/90' : 'bg-transparent',
                'motion-safe:transition-colors motion-safe:duration-200'
              ].join(' ')}
            />

          const commonProps = {
            ref: (el) => (linkRefs.current[idx] = el),
            onKeyDown: (e) => onKeyDown(e, idx),
            onClick: onLinkClick,
            className: commonClasses,
            // Roving tabindex: only active (or first) gets tabIndex=0; others -1
            tabIndex: active || idx === 0 ? 0 : -1,
            itemProp: 'url',
          }

          // External link (Forum)
          if (item.external) {
            return (
              <li key={item.href} role="listitem" itemScope itemType="https://schema.org/URL">
                <a
                  {...commonProps}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${item.label} (opens in new tab)`}
                  title={`${item.label} (opens in new tab)`}
                >
                  <span itemProp="name" className="flex items-center gap-1.5">
                    {item.label}
                    <ExternalIcon className="w-3.5 h-3.5 opacity-70" />
                  </span>
                  {indicator}
                </a>
              </li>
            )
          }

          // Internal link (Home)
          return (
            <li key={item.href} role="listitem" itemScope itemType="https://schema.org/URL">
              <Link
                {...commonProps}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                title={item.label}
              >
                <span itemProp="name">{item.label}</span>
                {indicator}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/* ===== Icons ===== */
function ExternalIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M11 3a1 1 0 100 2h2.586L9.293 9.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
      <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
    </svg>
  )
}
