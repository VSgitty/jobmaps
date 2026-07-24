import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    // @ts-ignore
    turbopack: {
      root: '.',
    },
  },
};

export default nextConfig;
