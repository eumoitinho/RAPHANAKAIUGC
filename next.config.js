/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  api: {
    bodyParser: {
      sizeLimit: '500mb',
    },
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '500mb',
    },
  },
}

module.exports = nextConfig