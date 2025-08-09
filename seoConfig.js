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
};

export default seoConfig;
