/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'public.readdy.ai',
        port: '',
        pathname: '/ai/img_res/**',
      },
    ],
    domains: ['images.unsplash.com'],
  },
  reactStrictMode: true,
}

module.exports = nextConfig 