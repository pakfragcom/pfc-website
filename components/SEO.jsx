// components/SEO.jsx
import Head from 'next/head';
import { useRouter } from 'next/router';
import seoConfig from '../seoConfig';

const OG_IMAGE = 'https://pakfrag.com/og-image.jpg';

export default function SEO({ title, description } = {}) {
  const router = useRouter();
  const path = router?.pathname || '/';

  const defaults = {
    title: 'Pakistan Fragrance Community - PFC',
    description:
      'Pakistan’s first official perfume and fragrance community. Reviews, discussions, marketplace, and more.',
    url: 'https://pakfrag.com',
  };

  const meta = { ...defaults, ...(seoConfig[path] || {}), ...(title ? { title } : {}), ...(description ? { description } : {}) };

  return (
    <Head>
      {/* Basic */}
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />

      {/* Canonical */}
      {meta.url && <link rel="canonical" href={meta.url} />}

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={meta.title} />
      <meta property="og:description" content={meta.description} />
      {meta.url && <meta property="og:url" content={meta.url} />}
      <meta property="og:site_name" content="Pakistan Fragrance Community - PFC" />
      <meta property="og:image" content={OG_IMAGE} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={meta.title} />
      <meta name="twitter:description" content={meta.description} />
      <meta name="twitter:image" content={OG_IMAGE} />
    </Head>
  );
}
