import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer
      style={{ ["--brand" as any]: "#10b981" }}
      className="relative isolate bg-black/90 text-white backdrop-blur"
    >
      {/* Soft gradient top border */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[2px]"
        style={{ background: "linear-gradient(90deg, var(--brand), transparent)" }}
      />

      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
        <div className="grid gap-12 md:grid-cols-5">
          {/* Logo & mission */}
          <div className="col-span-2 flex flex-col items-start">
            <Link href="/" className="mb-4 inline-block">
              <Image
                src="/logo.png"
                alt="PFC Logo"
                width={140}
                height={46}
                className="object-contain"
              />
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-white/70">
              Pakistan’s first fragrance community — connecting perfume lovers, collectors,
              and sellers in a trusted space.
            </p>
            <div className="mt-6 flex gap-4">
              <SocialIcon href="https://www.facebook.com/groups/pkfragcom" label="Facebook">
                <FacebookIcon />
              </SocialIcon>
              <SocialIcon href="https://www.instagram.com/pakfragcom" label="Instagram">
                <InstagramIcon />
              </SocialIcon>
            </div>
          </div>

          {/* Quick links */}
          <FooterLinks
            title="Services"
            links={[
              ["#", "Decanting Help"],
              ["#", "Buy/Sell Guidance"],
              ["#", "Perfume Reviews"],
              ["#", "Authenticity Checks"],
            ]}
          />
          <FooterLinks
            title="Company"
            links={[
              ["#", "About PFC"],
              ["#", "Our Team"],
              ["#", "Mission"],
            ]}
          />
          <FooterLinks
            title="Support"
            links={[
              ["#", "Contact"],
              ["#", "FAQs"],
              ["#", "Community Rules"],
            ]}
          />
        </div>

        {/* Newsletter */}
        <div className="mt-12 border-t border-white/10 pt-8">
          <h2 className="text-lg font-medium">Stay in the loop</h2>
          <p className="mt-1 text-sm text-white/60">
            Fragrance trends, reviews, and exclusive deals — straight to your inbox.
          </p>
          <form className="mt-4 sm:flex sm:items-center sm:gap-3">
            <label htmlFor="newsletter-email" className="sr-only">
              Email
            </label>
            <input
              id="newsletter-email"
              type="email"
              placeholder="you@example.com"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/40 outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] sm:max-w-xs"
            />
            <button
              type="submit"
              className="mt-3 inline-flex items-center justify-center rounded-lg bg-[var(--brand)] px-6 py-3 text-sm font-semibold text-black shadow-lg shadow-[var(--brand)]/20 transition hover:brightness-110 sm:mt-0"
            >
              Subscribe
            </button>
          </form>
        </div>

        {/* Bottom row */}
        <div className="mt-10 flex flex-col-reverse items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-white/50 sm:flex-row">
          <p>© {new Date().getFullYear()} Pakistan Fragrance Community. All rights reserved.</p>
          <ul className="flex gap-4">
            <li>
              <Link href="#" className="hover:text-white">
                Terms
              </Link>
            </li>
            <li>
              <Link href="#" className="hover:text-white">
                Privacy
              </Link>
            </li>
            <li>
              <Link href="#" className="hover:text-white">
                Cookies
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

function FooterLinks({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wider text-white/80">
        {title}
      </h3>
      <ul className="mt-4 space-y-3 text-sm">
        {links.map(([href, label], i) => (
          <li key={i}>
            <Link href={href} className="text-white/60 transition hover:text-white">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SocialIcon({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="rounded-full border border-white/10 bg-white/5 p-2 text-white/70 transition hover:border-[var(--brand)] hover:bg-[var(--brand)] hover:text-black"
    >
      {children}
    </a>
  );
}

/* SVG icons */
function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="M22 12.07C22 6.48 17.52 2 11.93 2S1.86 6.48 1.86 12.07c0 4.99 3.65 9.13 8.43 9.93v-7.03H7.9v-2.9h2.39v-2.21c0-2.36 1.4-3.66 3.54-3.66 1.03 0 2.11.18 2.11.18v2.32h-1.19c-1.17 0-1.53.73-1.53 1.48v1.89h2.6l-.42 2.9h-2.18V22c4.78-.8 8.43-4.94 8.43-9.93z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9a5.5 5.5 0 0 1-5.5 5.5h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2zm0 1.5A4 4 0 0 0 3.5 7.5v9A4 4 0 0 0 7.5 20.5h9a4 4 0 0 0 4-4v-9a4 4 0 0 0-4-4h-9zm9.25 1.75a1 1 0 1 1 0 2 1 1 0 0 1 0-2zM12 7.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9zm0 1.5a3 3 0 1 0 .001 6.001A3 3 0 0 0 12 9z" />
    </svg>
  );
}
