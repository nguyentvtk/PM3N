import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'drive.google.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'googleusercontent.com',
        pathname: '**',
      },
    ],
  },
  env: {
    // Public env vars (không secret)
    NEXT_PUBLIC_APP_NAME: 'PM3N Công Văn & Ký Số',
  },
};

export default nextConfig;
