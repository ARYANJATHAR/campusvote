import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'public.readdy.ai',
        port: '',
        pathname: '/ai/img_res/**',
      },
    ],
  },
};

export default nextConfig;
