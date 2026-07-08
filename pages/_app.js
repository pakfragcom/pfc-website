// pages/_app.js
import Head from 'next/head';
import Script from 'next/script';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { AnimatePresence, LazyMotion, domAnimation, m, MotionConfig } from 'framer-motion';
import { AuthProvider } from '../lib/auth-context';
import '../styles/main.css';
import ScrollToTop from '../components/ScrollToTop';
import SEO from '../components/SEO';
import ErrorBoundary from '../components/ErrorBoundary';

export default function App({ Component, pageProps }) {
  const router = useRouter();
  // Path only, no query string — shallow query-param updates (e.g. /fragrances
  // filter/sort clicks) shouldn't retrigger the page-transition animation,
  // but distinct pages under the same dynamic route still should.
  const routeKey = router.asPath.split('?')[0];

  useEffect(() => {
    // GA4's gtag('config', ...) in gtag-init.js only fires once on initial
    // load — a SPA needs an explicit page_view event on every client-side
    // route change or GA only ever sees the first page.
    const sendPageview = (url) => {
      if (typeof window.gtag === 'function') window.gtag('event', 'page_view', { page_path: url });
    };
    router.events.on('routeChangeComplete', sendPageview);
    return () => router.events.off('routeChangeComplete', sendPageview);
  }, []);

  return (
    <AuthProvider>
      <LazyMotion features={domAnimation}>
      <MotionConfig reducedMotion="user">
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

        {/* lazyOnload (not afterInteractive): gtag.js alone was costing ~600ms of
            main-thread blocking time in Lighthouse (two separate long tasks) —
            it isn't needed for anything the user sees or interacts with, so it
            can wait until the browser is idle instead of competing with
            hydration for the main thread. */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-57V72G57HN"
          strategy="lazyOnload"
        />
        <Script src="/gtag-init.js" strategy="lazyOnload" />

        <ErrorBoundary>
          <AnimatePresence mode="wait" initial={false}>
            <m.div
              key={routeKey}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.1, ease: 'easeIn' } }}
              transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <Component {...pageProps} />
            </m.div>
          </AnimatePresence>
        </ErrorBoundary>
        <ScrollToTop />
      </div>
      </MotionConfig>
      </LazyMotion>
    </AuthProvider>
  );
}
