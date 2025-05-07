import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove static export to allow NextAuth.js to work properly
  // output: "export"
};

export default nextConfig;
