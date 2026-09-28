/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: [],
  },
  images: {
    unoptimized: true,
  },
};

if (process.env.NODE_ENV === "development") {
  const { setupDevPlatform } = require("@cloudflare/next-on-pages/next-dev");
  setupDevPlatform();
}

module.exports = nextConfig;
