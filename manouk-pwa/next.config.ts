import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Configuration PWA sera ajoutée plus tard (next-pwa a des problèmes avec Turbopack)
  turbopack: {},
};

export default nextConfig;
