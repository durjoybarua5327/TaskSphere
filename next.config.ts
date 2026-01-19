import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },

  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-label'],
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },

  // React strict mode for better error handling
  reactStrictMode: true,
};

export default nextConfig;
