// components/SEO.jsx
import Head from 'next/head';
import { useRouter } from 'next/router';
import seoConfig from '../seoConfig';

const OG_IMAGE = 'https://pakfrag.com/pfc-round.png';

const SITE_URL = 'https://pakfrag.com';

export default function SEO({ title, description } = {}) {
  const router = useRouter();
  const path = router?.pathname || '/';
  // Canonical must be the page's own URL. pathname is the route pattern
  // ("/sellers/[slug]"), and a fixed fallback of the homepage told search
  // engines every dynamic page was a duplicate of "/". asPath is the real one.
  const asPath = (router?.asPath || '/').split('?')[0].split('#')[0];
  const selfUrl = SITE_URL + (asPath === '/' ? '' : asPath);

  const defaults = {
    title: 'Pakistan Fragrance Community - PFC',
    description:
      "Pakistan's first official perfume and fragrance community. Verify sellers, explore Pakistani fragrance houses, and use free fragrance tools.",
    url: selfUrl,
  };

  const meta = { ...defaults, ...(seoConfig[path] || {}), ...(title ? { title } : {}), ...(description ? { description } : {}) };

  return (
    <Head>
      {/* Basic */}
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />

      {/* Canonical */}
      {meta.url && <link rel="canonical" href={meta.url} key="canonical" />}

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={meta.title} />
      <meta property="og:description" content={meta.description} />
      {meta.url && <meta property="og:url" content={meta.url} key="og:url" />}
      <meta property="og:site_name" content="Pakistan Fragrance Community - PFC" />
      <meta property="og:image" content={OG_IMAGE} />
      <meta property="og:image:width" content="512" />
      <meta property="og:image:height" content="512" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@pakfragcom" />
      <meta name="twitter:title" content={meta.title} />
      <meta name="twitter:description" content={meta.description} />
      <meta name="twitter:image" content={OG_IMAGE} />
    </Head>
  );
}
