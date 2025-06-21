/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };
    return config;
  },
  // Ensure API routes are properly handled
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/api',
      },
      {
        source: '/:path*',
        destination: '/api/:path*',
        has: [
          {
            type: 'header',
            key: 'accept',
            value: '(.*application/json.*)',
          },
        ],
      },
    ];
  },
};

export default nextConfig;