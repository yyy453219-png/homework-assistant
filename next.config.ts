import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  // Faster page generation
  experimental: {
    optimizePackageImports: ['mammoth', 'pptx-preview'],
  },
  // Cache static assets aggressively
  headers: async () => [
    {
      source: '/:path*.(jpg|jpeg|png|gif|webp|svg|ico|css|js)',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
      ],
    },
  ],
};

export default nextConfig;
