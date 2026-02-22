import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'JasonWorldOfTech',
    short_name: 'JWOT',
    description: 'Founder-led AI software studio and multi-product portfolio.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#C7FF2E',
    theme_color: '#C7FF2E',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml'
      }
    ]
  };
}
