import Head from 'next/head'
import '../styles/main.css'
import ScrollToTop from '../components/ScrollToTop'

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        {/* Fonts */}
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />

        {/* Favicon */}
        <link
          rel="icon"
          href="/pfc-round.png"
          type="image/png"
        />

        {/* Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Pakistan Fragrance Community",
              url: "https://pakfrag.com",
              logo: "https://pakfrag.com/pfc-round.png",
            }),
          }}
        />
      </Head>

      <Component {...pageProps} />
      <ScrollToTop />
    </>
  )
}
