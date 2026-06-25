import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Serve the static marketing site from the root
      { source: "/", destination: "/site.html" },
    ];
  },
};

export default nextConfig;
