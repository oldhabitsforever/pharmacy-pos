/** @type {import('next').NextConfig} */
const nextConfig = {};

if (process.env.NODE_ENV === 'development') {
  const { setupDevPlatform } = require('@cloudflare/next-on-pages/next-dev');
  setupDevPlatform().catch(console.error);
}

module.exports = nextConfig;
