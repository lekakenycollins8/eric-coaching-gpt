/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Disable React Strict Mode to prevent warnings from Swagger UI components
  swcMinify: true,
  experimental: {
    serverComponentsExternalPackages: ['swagger-ui-react'],
  },
};

export default nextConfig;
