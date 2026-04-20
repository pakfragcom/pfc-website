'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useCallback, useState } from 'react'
import Reveal from '../ui/Reveal'

export default function Footer() {
  const year = new Date().getFullYear()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | success | error

  const handleNewsletterSubmit = useCallback(async (e) => {
    e.preventDefault()
    if (status === 'loading' || status === 'success') return
    setStatus('loading')
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        setStatus('success')
        setEmail('')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }, [email, status])

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
        <h2 id="site-footer-heading" className="sr-only">Site Footer</h2>

        <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
          {/* Brand */}
          <Reveal delay={0}>
            <Link
              href="/"
              className="inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded"
              aria-label="Pakistan Fragrance Community - Home"
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
              Pakistan Fragrance Community is the nation&apos;s first and most trusted platform for
              fragrance lovers, collectors, and reviewers.
            </p>
            <div className="mt-6">
              <a
                href="https://www.facebook.com/groups/pkfragcom"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-full bg-white px-5 py-2 text-sm font-medium text-black transition hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                aria-label="Join our Facebook Community (opens in new tab)"
              >
                Join Our Community
              </a>
            </div>
          </Reveal>

          {/* Navigation */}
          <Reveal delay={0.1}>
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
                    <Link href="/" className="hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded-sm px-1 py-0.5" itemProp="url">
                      <span itemProp="name">Home</span>
                    </Link>
                  </li>
                  <li>
                    <a
                      href="https://discord.gg/c7zAXTzxph"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded-sm px-1 py-0.5"
                      aria-label="Discord (opens in new tab)"
                      itemProp="url"
                    >
                      <span itemProp="name">Discord</span>
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
                    <Link href="/legal/terms" className="hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded-sm px-1 py-0.5">
                      Terms
                    </Link>
                  </li>
                  <li>
                    <Link href="/legal/privacy" className="hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded-sm px-1 py-0.5">
                      Privacy
                    </Link>
                  </li>
                </ul>
              </div>
            </nav>
          </Reveal>

          {/* Newsletter */}
          <Reveal delay={0.2} className="md:col-span-3 lg:col-span-1 md:order-last lg:order-none">
          <div>
            <form
              className="rounded-xl border border-white/10 bg-black/60 p-4 backdrop-blur"
              onSubmit={handleNewsletterSubmit}
              aria-labelledby="newsletter-heading"
            >
              <h3 id="newsletter-heading" className="text-sm font-semibold text-[#F5F5F7]">
                Stay in the loop
              </h3>
              <p className="mt-1 text-xs text-gray-400">
                News, reviews &amp; tools &mdash; no spam.
              </p>

              {status === 'success' ? (
                <p className="mt-3 text-sm text-green-400">
                  You&apos;re in! We&apos;ll be in touch.
                </p>
              ) : (
                <>
                  <label htmlFor="footer-email" className="sr-only">Email address</label>
                  <div className="mt-3 flex gap-2">
                    <input
                      id="footer-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-white/30"
                      autoComplete="email"
                      disabled={status === 'loading'}
                    />
                    <button
                      type="submit"
                      disabled={status === 'loading'}
                      className="whitespace-nowrap rounded-md bg-white px-3 py-2 text-sm font-medium text-black transition hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:opacity-60"
                    >
                      {status === 'loading' ? '...' : 'Subscribe'}
                    </button>
                  </div>
                  {status === 'error' && (
                    <p className="mt-2 text-xs text-red-400">
                      Something went wrong. Please try again.
                    </p>
                  )}
                </>
              )}
            </form>
          </div>
          </Reveal>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t border-white/10 pt-8">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <p className="text-xs text-gray-500">
              &copy; {year} Pakistan Fragrance Community. All rights reserved.
            </p>
            <div className="flex items-center gap-5">
              <SocialLink href="https://www.facebook.com/groups/pkfragcom" label="Facebook" title="Join our Facebook Group">
                <FacebookIcon className="h-5 w-5" />
              </SocialLink>
              <SocialLink href="https://www.instagram.com/pakfragcom/" label="Instagram" title="Follow us on Instagram">
                <InstagramIcon className="h-5 w-5" />
              </SocialLink>
              <button
                type="button"
                onClick={scrollToTop}
                className="group inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-300 transition hover:text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                aria-label="Back to top"
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
