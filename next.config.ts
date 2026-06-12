import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // REMOVED: output: "export" — we now need API routes for AI calls
  // For Cloudflare Pages, use @cloudflare/next-on-pages adapter
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
