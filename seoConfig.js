// seoConfig.js
const siteName = "PFC - Pakistan's Fragrance Community";
const siteUrl = "https://pakfrag.com";
const defaultDescription =
  "Pakistan's premier fragrance community. 100,000+ members. Verify a seller before you buy, check the public blacklist, explore Pakistani fragrance houses, and use free fragrance tools.";

const seoConfig = {
  "/": {
    title: siteName + " | Verified Sellers, Fragrance Houses & Tools",
    description: defaultDescription,
    url: siteUrl,
  },
  "/reviews": {
    title: "Fragrance Reviews Pakistan - Designer, Niche & Local Brands | PFC",
    description:
      "Read authentic fragrance reviews from Pakistan's fragrance community. Designer, Middle Eastern, niche, and local Pakistani brands reviewed by real members.",
    url: siteUrl + "/reviews",
  },
  "/mbp": {
    title: "Pakistani Fragrance Houses & Local Brands Directory | PFC",
    description:
      "Browse 125+ PFC-verified Pakistani fragrance houses. Read community reviews for each brand, discover Creative Directors, and find your next signature scent.",
    url: siteUrl + "/mbp",
  },
  "/tools/verify-seller": {
    title: "Verify a Fragrance Seller Pakistan - PFC Trusted Seller Check",
    description:
      "Check if a Pakistani fragrance seller is PFC-verified before you buy. 170+ verified sellers and a public blacklist. Search by name or code.",
    url: siteUrl + "/tools/verify-seller",
  },
  "/log-transaction": {
    title: "Log a Fragrance Transaction - Rate a Seller | PFC",
    description:
      "Bought from a PFC seller? Log the deal and rate delivery, accuracy and communication to help the community buy safely.",
    url: siteUrl + "/log-transaction",
  },
  "/sellers/apply": {
    title: "Become a PFC Verified Seller | Pakistan Fragrance Community",
    description:
      "Apply to sell fragrances as a PFC-verified seller. Get a verification code buyers can check, a public profile, and a trusted badge.",
    url: siteUrl + "/sellers/apply",
  },
  "/sell": {
    title: "List a Fragrance for Sale | PFC",
    description:
      "Verified PFC sellers can list sealed bottles, partials and decants for the Pakistan fragrance community.",
    url: siteUrl + "/sell",
  },
  "/tools/decant": {
    title: "Perfume Decant Calculator Pakistan | PFC",
    description:
      "Free decant calculator for Pakistani perfume enthusiasts. Calculate decant sizes and split costs in PKR instantly.",
    url: siteUrl + "/tools/decant",
  },
  "/tools/bottle-level": {
    title: "Perfume Bottle Level Estimator | PFC",
    description:
      "Accurately estimate how many mL remain in your perfume bottle. Free tool from Pakistan's fragrance community.",
    url: siteUrl + "/tools/bottle-level",
  },
  "/tools/indie-lab": {
    title: "Indie Perfumer Toolkit Pakistan - Costing, Notes & Compliance | PFC",
    description:
      "All-in-one toolkit for Pakistani indie perfumers: costing, batching, note pyramid, compliance, wear testing, and AI accord suggestions.",
    url: siteUrl + "/tools/indie-lab",
  },
  "/legal/terms": {
    title: "Terms of Service - Pakistan Fragrance Community | PFC",
    description: "Terms of Service for pakfrag.com - Pakistan Fragrance Community.",
    url: siteUrl + "/legal/terms",
  },
  "/legal/privacy": {
    title: "Privacy Policy - Pakistan Fragrance Community | PFC",
    description:
      "Privacy Policy for pakfrag.com - how we collect, use, and protect your information.",
    url: siteUrl + "/legal/privacy",
  },
};

export default seoConfig;
