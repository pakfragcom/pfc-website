// components/SEO.jsx
import Head from 'next/head';
import { useRouter } from 'next/router';
import seoConfig from '../seoConfig';

export default function SEO() {
  const router = useRouter();
  const currentPath = router.pathname;

  // Fallback title/description if not defined in seoConfig
  const defaultTitle = 'Pakistan Fragrance Community - PFC';
  const defaultDescription =
    'Pakistan’s first official perfume and fragrance community. Reviews, discussions, marketplace, and more.';

  const { title, description } = seoConfig[currentPath] || {
    title: defaultTitle,
    description: defaultDescription,
  };

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
    </Head>
  );
}
