// pages/_app.js
import Head from 'next/head';
import Script from 'next/script';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { AnimatePresence, LazyMotion, domAnimation, m, MotionConfig } from 'framer-motion';
import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import { AuthProvider } from '../lib/auth-context';
import '../styles/main.css';
import ScrollToTop from '../components/ScrollToTop';
import SEO from '../components/SEO';
import ErrorBoundary from '../components/ErrorBoundary';

if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: false,
    capture_pageleave: true,
  });
}

export default function App({ Component, pageProps }) {
  const router = useRouter();
  // Path only, no query string — shallow query-param updates (e.g. /fragrances
  // filter/sort clicks) shouldn't retrigger the page-transition animation,
  // but distinct pages under the same dynamic route still should.
  const routeKey = router.asPath.split('?')[0];

  useEffect(() => {
    // Track pageview on initial load
    posthog.capture('$pageview');
    const handleRouteComplete = () => posthog.capture('$pageview');
    router.events.on('routeChangeComplete', handleRouteComplete);
    return () => router.events.off('routeChangeComplete', handleRouteComplete);
  }, []);

  return (
    <PostHogProvider client={posthog}>
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

        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-57V72G57HN"
          strategy="afterInteractive"
        />
        <Script src="/gtag-init.js" strategy="afterInteractive" />

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
    </PostHogProvider>
  );
}
