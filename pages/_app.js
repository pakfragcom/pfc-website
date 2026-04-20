// pages/_app.js
import Head from 'next/head';
import Script from 'next/script';
import { useRouter } from 'next/router';
import { AnimatePresence, LazyMotion, domAnimation, m } from 'framer-motion';
import { AuthProvider } from '../lib/auth-context';
import '../styles/main.css';
import ScrollToTop from '../components/ScrollToTop';
import SEO from '../components/SEO';
import ErrorBoundary from '../components/ErrorBoundary';

export default function App({ Component, pageProps }) {
  const router = useRouter();

  return (
    <AuthProvider>
      <LazyMotion features={domAnimation}>
      <div>
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
          <AnimatePresence mode="wait" initial={false}>
            <m.div
              key={router.asPath}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.18, ease: 'easeIn' } }}
              transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <Component {...pageProps} />
            </m.div>
          </AnimatePresence>
        </ErrorBoundary>
        <ScrollToTop />
      </div>
      </LazyMotion>
    </AuthProvider>
  );
}
