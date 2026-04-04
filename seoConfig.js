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
  '/tools/verify-seller': {
    title: 'Verify a Seller — PFC',
    description: 'Check if a fragrance seller is PFC-verified before you buy. Search by seller name or code.',
    url: `${siteUrl}/tools/verify-seller`,
  },
  '/local-houses': {
    title: 'Approved Houses | PFC-MFP',
    description: 'Explore the PFC-MFP curated directory of approved fragrance houses in Pakistan. Search by house name and discover Creative Directors.',
    url: `${siteUrl}/local-houses`,
  },
  '/tools/indie-lab': {
    title: 'PFC Indie Perfumers Toolkit',
    description: 'All-in-one toolkit for indie perfumers: costing, batching, composer, note pyramid, compliance, wear testing, and AI accord suggestions.',
    url: `${siteUrl}/tools/indie-lab`,
  },
};

export default seoConfig;
