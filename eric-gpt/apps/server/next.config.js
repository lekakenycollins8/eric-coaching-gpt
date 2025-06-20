/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Disable React Strict Mode to prevent warnings from Swagger UI components
  experimental: {
    missingSuspenseWithCSRBailout: false,
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