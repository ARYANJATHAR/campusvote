/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lgojtvkphvgcqspeaick.supabase.co',
        pathname: '/storage/v1/object/public/**',
      }
    ],
  },
  reactStrictMode: true,
  swcMinify: true,
}

export default nextConfig; 