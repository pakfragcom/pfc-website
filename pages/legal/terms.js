import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import Link from 'next/link'

export default function Terms() {
  return (
    <div className="bg-black text-white font-sans">
      <Header />

      <main className="mx-auto max-w-3xl px-6 py-24 lg:py-32">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8 text-sm text-gray-500">
          <Link href="/" className="hover:text-white transition">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-300">Terms of Service</span>
        </nav>

        <h1 className="text-4xl font-bold tracking-tight text-[#F5F5F7] mb-3">
          Terms of Service
        </h1>
        <p className="text-sm text-gray-500 mb-12">Last updated: April 2026</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-10 text-gray-300 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-[#F5F5F7] mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using the Pakistan Fragrance Community website at{' '}
              <span className="text-white">pakfrag.com</span> ("the Site"), you agree to be bound
              by these Terms of Service. If you do not agree, please do not use the Site.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#F5F5F7] mb-3">2. About PFC</h2>
            <p>
              Pakistan Fragrance Community (PFC) is an independent, community-run platform for
              fragrance enthusiasts in Pakistan. We provide tools, directories, and resources to
              help members discover, review, buy, sell, and decant fragrances. PFC is not a
              registered retailer and does not directly facilitate financial transactions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#F5F5F7] mb-3">3. Verified Seller Directory</h2>
            <p>
              Our verified seller list is a community-maintained directory of individuals who have
              been reviewed by PFC administrators. Verification indicates that a seller has met
              our community guidelines at the time of approval — it does not constitute an
              endorsement, guarantee, or warranty of any transaction.
            </p>
            <p className="mt-3">
              PFC is not a party to any transaction between buyers and sellers. All purchases,
              sales, decants, and swaps are conducted directly between community members at their
              own risk. PFC accepts no liability for disputes, losses, counterfeit products, or
              any harm arising from transactions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#F5F5F7] mb-3">4. Community Tools</h2>
            <p>
              The calculators, estimators, and lab tools on this site (Decant Calculator, Bottle
              Level Estimator, Indie Lab Toolkit, etc.) are provided for informational and
              educational purposes only. All calculations are estimates. PFC makes no warranty
              regarding their accuracy, completeness, or fitness for any particular purpose.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#F5F5F7] mb-3">5. Acceptable Use</h2>
            <p>You agree not to use the Site to:</p>
            <ul className="mt-3 list-disc list-inside space-y-1 text-gray-400">
              <li>Post false, misleading, or fraudulent information</li>
              <li>Impersonate another person or entity</li>
              <li>Scrape, harvest, or systematically extract data from the Site</li>
              <li>Attempt to interfere with the Site's operation or security</li>
              <li>Violate any applicable Pakistani or international law</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#F5F5F7] mb-3">6. Intellectual Property</h2>
            <p>
              All content on this Site — including text, graphics, logos, tool designs, and
              code — is owned by or licensed to Pakistan Fragrance Community. You may not
              reproduce, distribute, or create derivative works without prior written permission.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#F5F5F7] mb-3">7. Disclaimer of Warranties</h2>
            <p>
              The Site is provided "as is" and "as available" without warranties of any kind,
              express or implied. PFC does not warrant that the Site will be uninterrupted,
              error-free, or free of viruses or other harmful components.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#F5F5F7] mb-3">8. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, PFC shall not be liable for any indirect,
              incidental, special, or consequential damages arising from your use of the Site or
              any transactions conducted with community members.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#F5F5F7] mb-3">9. Changes to These Terms</h2>
            <p>
              PFC reserves the right to update these Terms at any time. Continued use of the
              Site after changes are posted constitutes acceptance of the updated Terms. The
              "Last updated" date at the top of this page reflects when changes were last made.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#F5F5F7] mb-3">10. Contact</h2>
            <p>
              For questions about these Terms, reach us via our{' '}
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
        </div>

        {/* Bottom link */}
        <div className="mt-16 border-t border-white/10 pt-8 flex gap-6 text-sm text-gray-500">
          <Link href="/legal/privacy" className="hover:text-white transition">
            Privacy Policy
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
