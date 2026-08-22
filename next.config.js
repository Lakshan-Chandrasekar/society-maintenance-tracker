/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
  experimental: { serverActions: { bodySizeLimit: '8mb' } },
};
module.exports = nextConfig;
