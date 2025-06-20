/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  output: 'standalone',
  distDir: 'api-build',
  pageExtensions: ['ts', 'tsx'], // Optional: ensure only TS pages are picked up
  webpack: (config, { isServer }) => {
    const originalEntry = config.entry;

    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };

    if (isServer) {
      config.entry = async () => {
        const entries = await originalEntry();
        const excludedPages = ['page.tsx', 'layout.tsx', 'error.tsx', 'not-found.tsx'];
        for (const key in entries) {
          if (excludedPages.some(p => key.includes(p))) {
            delete entries[key];
          }
        }
        return entries;
      };
    }

    return config;
  },
};

export default nextConfig;
