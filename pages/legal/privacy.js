import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import Link from 'next/link'

export default function Privacy() {
  return (
    <div className="bg-black text-white font-sans">
      <Header />

      <main className="mx-auto max-w-3xl px-6 py-24 lg:py-32">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8 text-sm text-gray-500">
          <Link href="/" className="hover:text-white transition">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-300">Privacy Policy</span>
        </nav>

        <h1 className="text-4xl font-bold tracking-tight text-[#F5F5F7] mb-3">
          Privacy Policy
        </h1>
        <p className="text-sm text-gray-500 mb-12">Last updated: April 2026</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-10 text-gray-300 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-[#F5F5F7] mb-3">1. Overview</h2>
            <p>
              Pakistan Fragrance Community ("PFC", "we", "our") operates{' '}
              <span className="text-white">pakfrag.com</span>. This Privacy Policy explains what
              information we collect, how we use it, and your rights regarding that information.
              By using the Site, you agree to the practices described here.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#F5F5F7] mb-3">2. Information We Collect</h2>

            <h3 className="text-base font-medium text-gray-200 mb-2 mt-4">Automatically Collected</h3>
            <p>
              When you visit the Site, we automatically collect certain usage data through
              Google Analytics (GA4), including:
            </p>
            <ul className="mt-2 list-disc list-inside space-y-1 text-gray-400">
              <li>Pages viewed and time spent on each page</li>
              <li>General geographic location (country/city level)</li>
              <li>Browser type, device type, and operating system</li>
              <li>Referring website (how you found us)</li>
            </ul>
            <p className="mt-3 text-gray-400 text-sm">
              This data is aggregated and anonymised. We do not collect your IP address in
              identifiable form.
            </p>

            <h3 className="text-base font-medium text-gray-200 mb-2 mt-6">Tools & Calculators</h3>
            <p>
              Our tools (Decant Calculator, Bottle Level Estimator, Indie Lab Toolkit) save your
              inputs locally in your browser using <span className="text-white">localStorage</span>.
              This data never leaves your device and is never transmitted to our servers.
            </p>

            <h3 className="text-base font-medium text-gray-200 mb-2 mt-6">Newsletter Subscription</h3>
            <p>
              If you subscribe to our newsletter, we collect your email address. This is stored
              securely with our email service provider and used only to send you community
              updates. You can unsubscribe at any time via the link in any email.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#F5F5F7] mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-1 text-gray-400">
              <li>To understand how visitors use the Site and improve it</li>
              <li>To send newsletter emails to subscribers (with consent)</li>
              <li>To maintain and improve the Site's performance and security</li>
            </ul>
            <p className="mt-3">
              We do not sell, rent, or share your personal information with third parties for
              marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#F5F5F7] mb-3">4. Cookies & Tracking</h2>
            <p>
              The Site uses cookies and similar tracking technologies for:
            </p>
            <ul className="mt-2 list-disc list-inside space-y-1 text-gray-400">
              <li>
                <span className="text-gray-300">Google Analytics</span> — measures site traffic
                and user behaviour (you can opt out via{' '}
                <a
                  href="https://tools.google.com/dlpage/gaoptout"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white underline underline-offset-2 hover:text-gray-300 transition"
                >
                  Google's opt-out tool
                </a>
                )
              </li>
              <li>
                <span className="text-gray-300">localStorage</span> — saves your tool preferences
                in your browser (no server involvement)
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#F5F5F7] mb-3">5. Third-Party Services</h2>
            <p>The Site integrates with the following third-party services, each with their own privacy policies:</p>
            <ul className="mt-3 list-disc list-inside space-y-1 text-gray-400">
              <li>Google Analytics (analytics)</li>
              <li>Vercel (hosting and infrastructure)</li>
              <li>Facebook (community group links — Facebook's policy applies when you visit their platform)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#F5F5F7] mb-3">6. Data Security</h2>
            <p>
              We take reasonable measures to protect your information, including HTTPS encryption
              for all data in transit, strict security headers (HSTS, CSP, X-Frame-Options), and
              minimal data collection. However, no system is 100% secure, and we cannot
              guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#F5F5F7] mb-3">7. Children's Privacy</h2>
            <p>
              The Site is not directed at children under 13. We do not knowingly collect
              personal information from children. If you believe a child has provided us with
              personal information, please contact us and we will promptly delete it.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#F5F5F7] mb-3">8. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="mt-2 list-disc list-inside space-y-1 text-gray-400">
              <li>Request access to any personal data we hold about you</li>
              <li>Request deletion of your personal data</li>
              <li>Unsubscribe from our newsletter at any time</li>
              <li>Clear your tool data at any time via your browser's storage settings</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, contact us through our{' '}
              <a
                href="https://www.facebook.com/groups/pkfragcom"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white underline underline-offset-2 hover:text-gray-300 transition"
              >
                Facebook community
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#F5F5F7] mb-3">9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. The "Last updated" date at
              the top reflects the most recent revision. Continued use of the Site after updates
              are posted constitutes acceptance of the revised policy.
            </p>
          </section>

        </div>

        {/* Bottom link */}
        <div className="mt-16 border-t border-white/10 pt-8 flex gap-6 text-sm text-gray-500">
          <Link href="/legal/terms" className="hover:text-white transition">
            Terms of Service
          </Link>
          <Link href="/" className="hover:text-white transition">
            Back to Home
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}
