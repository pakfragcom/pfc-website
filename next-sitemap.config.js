/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://pakfrag.com',
  generateRobotsTxt: true,
  robotsTxtOptions: {
    policies: [
      { userAgent: '*', allow: '/', disallow: '/pfc-mgmt' },
    ],
    additionalSitemaps: ['https://forum.pakfrag.com/sitemap.xml'],
  },
  exclude: [
    '/pfc-mgmt',
    '/pfc-mgmt/*',
    '/u/me',
    '/auth/callback',
  ],
  changefreq: 'weekly',
  priority: 0.7,
  sitemapSize: 7000,
}
