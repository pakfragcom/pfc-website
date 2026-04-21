// pages/_app.js
import Head from 'next/head';
import Script from 'next/script';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { AnimatePresence, LazyMotion, domAnimation, m } from 'framer-motion';
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
    </PostHogProvider>
  );
}
