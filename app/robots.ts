import type { MetadataRoute } from 'next';

function getSiteUrl() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return siteUrl.replace(/\/+$/, '');
}

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/'],
        disallow: ['/admin', '/api/admin', '/account', '/support']
      }
    ],
    sitemap: `${siteUrl}/sitemap.xml`
  };
}
