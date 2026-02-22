/** @type {import('next').NextConfig} */
const baseSecurityHeaders = [
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  }
];

const contentSecurityPolicy = [
  "default-src 'self'",
  "img-src 'self' data: https:",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "connect-src 'self' https: wss:",
  "frame-ancestors 'none'"
].join('; ');

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: baseSecurityHeaders
      },
      {
        source: '/((?!admin|api/admin).*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: contentSecurityPolicy
          }
        ]
      }
    ];
  }
};

export default nextConfig;
