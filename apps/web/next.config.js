/** @type {import('next').NextConfig} */
const path = require('path');
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname, '../../'),
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'archive.org' },
      { protocol: 'https', hostname: 'image.tmdb.org' },
    ],
  },
  transpilePackages: ['@streampulse/shared'],
};

module.exports = nextConfig;
