/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'autoplay=(self), microphone=(self), camera=(self)',
          },
        ],
      },
    ];
  },
  async rewrites() {
    const rawBackend =
      process.env.BACKEND_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'https://clinic-systems.onrender.com/api';
    const cleanBackend = rawBackend.replace(/\/+$/, '');
    return [
      {
        source: '/api/:path*',
        destination: `${cleanBackend}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
