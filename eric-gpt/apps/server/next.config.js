/** @type {import('next').NextConfig} */
const nextConfig = {
  // Match web app's minimal configuration
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Remove serverExternalPackages since swagger-ui-react is used client-side
  webpack: (config) => {
    // Handle swagger-ui-react's dependencies properly
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };
    return config;
  },
};

export default nextConfig;