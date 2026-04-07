import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    domains: ['lh3.googleusercontent.com', 'googleusercontent.com'],
  },
  env: {
    // Public env vars (không secret)
    NEXT_PUBLIC_APP_NAME: 'PM3N Công Văn & Ký Số',
  },
};

export default nextConfig;
