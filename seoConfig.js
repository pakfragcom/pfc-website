// seoConfig.js
const siteName = 'Pakistan Fragrance Community - PFC';
const siteUrl = 'https://pakfrag.com';
const defaultDescription =
  'Pakistan’s first official perfume and fragrance community. Reviews, discussions, marketplace, and more.';

const seoConfig = {
  '/': {
    title: siteName,
    description: defaultDescription,
    url: siteUrl,
  },
  '/tools/decant': {
    title: 'PFC Decant Calculator',
    description: 'Quickly calculate perfume decant sizes and remaining quantities for your bottles.',
    url: `${siteUrl}/tools/decant`,
  },
  '/tools/bottle-level': {
    title: 'PFC Bottle Level Estimator',
    description:
      'Estimate the remaining perfume in your bottle by calibrating top, bottom, and liquid level for accurate mL reading.',
    url: `${siteUrl}/tools/bottle-level`,
  },
  '/legal/terms': {
    title: 'Terms of Service — Pakistan Fragrance Community',
    description: 'Terms of Service for pakfrag.com — Pakistan Fragrance Community.',
    url: `${siteUrl}/legal/terms`,
  },
  '/legal/privacy': {
    title: 'Privacy Policy — Pakistan Fragrance Community',
    description: 'Privacy Policy for pakfrag.com — how we collect, use, and protect your information.',
    url: `${siteUrl}/legal/privacy`,
  },
};

export default seoConfig;
