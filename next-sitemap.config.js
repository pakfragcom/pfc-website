/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://pakfrag.com',
  generateRobotsTxt: true,
  robotsTxtOptions: {
    policies: [{ userAgent: '*', allow: '/' }],
    additionalSitemaps: ['https://forum.pakfrag.com/sitemap.xml'],
  },
  changefreq: 'weekly',
  priority: 0.7,
  sitemapSize: 7000,
}
