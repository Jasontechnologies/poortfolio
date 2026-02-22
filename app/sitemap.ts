import type { MetadataRoute } from 'next';

function getSiteUrl() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return siteUrl.replace(/\/+$/, '');
}

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const routes = [
    '/',
    '/about',
    '/founder',
    '/products',
    '/blog',
    '/updates',
    '/status',
    '/security',
    '/contact',
    '/complaints',
    '/privacy',
    '/terms',
    '/acceptable-use',
    '/cookies',
    '/sign-in',
    '/rss.xml'
  ];

  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date()
  }));
}
