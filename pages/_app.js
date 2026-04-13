// pages/_app.js
import Head from 'next/head';
import Script from 'next/script';
import { Space_Grotesk } from 'next/font/google';
import { AuthProvider } from '../lib/auth-context';
import '../styles/main.css';
import ScrollToTop from '../components/ScrollToTop';
import SEO from '../components/SEO';
import ErrorBoundary from '../components/ErrorBoundary';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-space-grotesk',
});

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <div className={spaceGrotesk.variable} style={{ fontFamily: 'var(--font-space-grotesk), sans-serif' }}>
        <SEO />

        <Head>
          <link rel="icon" href="/pfc-round.png" type="image/png" />
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

        <ErrorBoundary>
          <Component {...pageProps} />
        </ErrorBoundary>
        <ScrollToTop />
      </div>
    </AuthProvider>
  );
}
