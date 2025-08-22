'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useCallback } from 'react'

export default function Footer() {
  const year = new Date().getFullYear()

  const scrollToTop = useCallback(() => {
    if (typeof window === 'undefined') return
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  return (
    <footer
      className="relative border-t border-white/10 bg-black/80 text-gray-300"
      role="contentinfo"
      aria-labelledby="site-footer-heading"
    >
      <div className="mx-auto max-w-screen-xl px-6 py-12 lg:py-16">
        {/* Title for SR users */}
        <h2 id="site-footer-heading" className="sr-only">Site Footer</h2>

        {/* Top: Brand + Nav + Newsletter */}
        <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
          {/* Brand / About */}
          <div>
            <Link
              href="/"
              className="inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded"
              aria-label="Pakistan Fragrance Community — Home"
            >
              <Image
                src="/logo.png"
                alt="Pakistan Fragrance Community logo"
                width={180}
                height={50}
                className="h-auto w-auto"
                priority={false}
              />
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-gray-400">
              Pakistan Fragrance Community is the nation’s first and most trusted platform for fragrance lovers, collectors, and reviewers — enabling buying, selling, decanting and sharing scents.
            </p>

            <div className="mt-6">
              <a
                href="https://www.facebook.com/groups/pkfragcom"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-full bg-white px-5 py-2 text-sm font-medium text-black transition hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                aria-label="Join our Facebook Community (opens in new tab)"
                title="Join our Facebook Community"
              >
                Join Our Community
              </a>
            </div>
          </div>

          {/* Navigation columns */}
          <nav
            aria-label="Footer Navigation"
            className="grid grid-cols-2 gap-8 sm:grid-cols-3"
            itemScope
            itemType="https://schema.org/SiteNavigationElement"
          >
            <div>
              <h3 className="mb-4 font-semibold text-[#F5F5F7]">Explore</h3>
              <ul className="space-y-2 text-sm uppercase tracking-wide">
                <li>
                  <Link
                    href="/"
                    className="hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded-sm px-1 py-0.5"
                    title="Home"
                    itemProp="url"
                  >
                    <span itemProp="name">Home</span>
                  </Link>
                </li>
                <li>
                  <a
                    href="https://forum.pakfrag.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded-sm px-1 py-0.5"
                    aria-label="Forum (opens in new tab)"
                    title="Forum (opens in new tab)"
                    itemProp="url"
                  >
                    <span itemProp="name">Forum</span>
                    <span className="sr-only"> (opens in new tab)</span>
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 font-semibold text-[#F5F5F7]">Community</h3>
              <ul className="space-y-2 text-sm uppercase tracking-wide">
                <li>
                  <a
                    href="https://www.facebook.com/groups/pkfragcom"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded-sm px-1 py-0.5"
                    aria-label="Facebook Group (opens in new tab)"
                    title="Facebook Group"
                  >
                    Facebook Group
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.instagram.com/pakfragcom/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded-sm px-1 py-0.5"
                    aria-label="Instagram (opens in new tab)"
                    title="Instagram"
                  >
                    Instagram
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 font-semibold text-[#F5F5F7]">Legal</h3>
              <ul className="space-y-2 text-sm uppercase tracking-wide">
                <li>
                  <Link
                    href="/legal/terms"
                    className="hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded-sm px-1 py-0.5"
                    title="Terms"
                  >
                    Terms
                  </Link>
                </li>
                <li>
                  <Link
                    href="/legal/privacy"
                    className="hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded-sm px-1 py-0.5"
                    title="Privacy"
                  >
                    Privacy
                  </Link>
                </li>
              </ul>
            </div>
          </nav>

          {/* Newsletter (non-blocking stub; wire later) */}
          <div className="md:col-span-3 lg:col-span-1 md:order-last lg:order-none">
            <form
              className="rounded-xl border border-white/10 bg-black/60 p-4 backdrop-blur"
              onSubmit={(e) => {
                e.preventDefault()
                alert('Thanks! We’ll keep you posted. (Hook this to your ESP when ready.)')
              }}
              aria-labelledby="newsletter-heading"
            >
              <h3 id="newsletter-heading" className="text-sm font-semibold text-[#F5F5F7]">
                Stay in the loop
              </h3>
              <p className="mt-1 text-xs text-gray-400">
                News, reviews & tools — no spam.
              </p>
              <label htmlFor="email" className="sr-only">Email address</label>
              <div className="mt-3 flex gap-2">
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  className="w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-white/30"
                  autoComplete="email"
                />
                <button
                  type="submit"
                  className="whitespace-nowrap rounded-md bg-white px-3 py-2 text-sm font-medium text-black transition hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                >
                  Subscribe
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t border-white/10 pt-8">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <p className="text-xs text-gray-500">
              &copy; {year} Pakistan Fragrance Community. All rights reserved.
            </p>

            <div className="flex items-center gap-5">
              {/* Socials */}
              <SocialLink
                href="https://www.facebook.com/groups/pkfragcom"
                label="Facebook"
                title="Join our Facebook Group"
              >
                <FacebookIcon className="h-5 w-5" />
              </SocialLink>
              <SocialLink
                href="https://www.instagram.com/pakfragcom/"
                label="Instagram"
                title="Follow us on Instagram"
              >
                <InstagramIcon className="h-5 w-5" />
              </SocialLink>

              {/* Back to top */}
              <button
                type="button"
                onClick={scrollToTop}
                className="group inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-300 transition hover:text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                aria-label="Back to top"
                title="Back to top"
              >
                <ArrowUp className="h-4 w-4 motion-safe:transition-transform motion-safe:group-hover:-translate-y-0.5" />
                Top
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

/* ========= Reusable bits ========= */
function SocialLink({ href, label, title, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${label} (opens in new tab)`}
      title={title || label}
      className="text-gray-400 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded-md p-1 transition"
    >
      {children}
      <span className="sr-only">{label}</span>
    </a>
  )
}

function ArrowUp({ className = 'h-4 w-4' }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M10 3a1 1 0 01.7.29l5 5a1 1 0 11-1.4 1.42L11 6.41V16a1 1 0 11-2 0V6.41L5.7 9.71a1 1 0 11-1.4-1.42l5-5A1 1 0 0110 3z" />
    </svg>
  )
}

function FacebookIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22.675 0H1.325A1.326 1.326 0 000 1.325v21.35C0 23.403.597 24 1.325 24h11.495v-9.294H9.691V11.06h3.129V8.414c0-3.1 1.893-4.788 4.66-4.788 1.325 0 2.463.099 2.794.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.646h-3.12V24h6.116A1.326 1.326 0 0024 22.675V1.325A1.326 1.326 0 0022.675 0z" />
    </svg>
  )
}

function InstagramIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M7.5 2h9A5.5 5.5 0 0122 7.5v9A5.5 5.5 0 0116.5 22h-9A5.5 5.5 0 012 16.5v-9A5.5 5.5 0 017.5 2zm0 1.8A3.7 3.7 0 003.8 7.5v9a3.7 3.7 0 003.7 3.7h9a3.7 3.7 0 003.7-3.7v-9A3.7 3.7 0 0016.5 3.8h-9zm4.5 2.9a5.8 5.8 0 100 11.6 5.8 5.8 0 000-11.6zm0 1.8a4 4 0 110 8 4 4 0 010-8zm5-1.3a.95.95 0 100 1.9.95.95 0 000-1.9z" />
    </svg>
  )
}
