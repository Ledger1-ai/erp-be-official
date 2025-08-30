import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Do not fail the build on ESLint errors
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Dangerously allow production builds to successfully complete even if there are type errors.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
