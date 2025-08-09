import Head from 'next/head';
import Script from 'next/script';
import { useRouter } from 'next/router';
import '../styles/main.css';
import ScrollToTop from '../components/ScrollToTop';
import SEO from '../components/SEO';

export default function App({ Component, pageProps }) {
  const router = useRouter();

  return (
    <>
      {/* ✅ Automatic SEO Title & Description */}
      <SEO path={router.pathname} />

      <Head>
        {/* Fonts */}
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />

        {/* Favicon */}
        <link rel="icon" href="/pfc-round.png" type="image/png" />

        {/* Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Pakistan Fragrance Community',
              url: 'https://pakfrag.com',
              logo: 'https://pakfrag.com/pfc-round.png',
            }),
          }}
        />
      </Head>

      {/* Google Analytics */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-57V72G57HN"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-57V72G57HN');
        `}
      </Script>

      <Component {...pageProps} />
      <ScrollToTop />
    </>
  );
}
