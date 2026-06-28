import Head from 'next/head'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'

const CONTACT_ITEMS = [
  {
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.131.558 4.13 1.533 5.864L.057 23.993l6.264-1.645A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.001-1.373l-.36-.213-3.719.977.993-3.625-.235-.372A9.818 9.818 0 1112 21.818z"/>
      </svg>
    ),
    label: 'WhatsApp',
    description: 'Fastest way to reach us — for brand listings, partnerships, and general questions.',
    href: 'https://wa.me/923000772012',
    cta: 'Message on WhatsApp',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
      </svg>
    ),
    label: 'Email',
    description: 'For detailed inquiries, MBP partnership proposals, or media requests.',
    href: 'mailto:pakfrag@gmail.com',
    cta: 'pakfrag@gmail.com',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
      </svg>
    ),
    label: 'Instagram',
    description: 'Follow our community updates, featured fragrances, and new brand listings.',
    href: 'https://instagram.com/pakfragcom_mbp',
    cta: '@pakfragcom_mbp',
  },
]

export default function Contact() {
  return (
    <>
      <Head>
        <title>Contact | Pakistan Fragrance Community</title>
        <meta name="description" content="Get in touch with PFC — for MBP brand listings, partnerships, media, and general enquiries." />
        <meta name="robots" content="index,follow" />
      </Head>

      <div className="bg-black text-white font-sans">
        <Header />

        <main className="max-w-3xl mx-auto px-6 py-16 sm:py-24">

          {/* Hero */}
          <div className="mb-16 text-center">
            <p className="text-xs uppercase tracking-widest text-[#94aea7] mb-3">Get in Touch</p>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white mb-4">
              Contact PFC
            </h1>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              Whether you&apos;re a brand looking to list on MBP, a community member with a question, or a media partner — we&apos;re here.
            </p>
          </div>

          {/* Contact channels */}
          <div className="grid gap-4 sm:grid-cols-3">
            {CONTACT_ITEMS.map(item => (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col gap-4 rounded-2xl bg-white/[0.04] ring-1 ring-white/10 p-5 hover:bg-white/[0.07] hover:ring-white/20 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="text-[#94aea7] group-hover:text-white transition">
                    {item.icon}
                  </div>
                  <span className="font-semibold text-sm text-white">{item.label}</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed flex-1">{item.description}</p>
                <span className="text-xs text-[#94aea7] group-hover:text-white transition font-medium">
                  {item.cta} ↗
                </span>
              </a>
            ))}
          </div>

          <p className="mt-10 text-center text-sm text-gray-600">
            Response time is typically within a few hours during business hours (PKT).
          </p>

        </main>

        <Footer />
      </div>
    </>
  )
}
