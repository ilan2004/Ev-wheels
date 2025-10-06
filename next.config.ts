import type { NextConfig } from 'next';

// Define the Next.js configuration
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.slingacademy.com',
        port: ''
      }
    ]
  },
  transpilePackages: ['geist'],
  experimental: {
    optimizePackageImports: ['next/font'],
    turbo: {
      rules: {
        '*.css': {
          loaders: ['css-loader'],
          as: '*.css'
        }
      }
    }
  },
  async redirects() {
    return [
      // Legacy tickets routes to new job-cards routes
      {
        source: '/dashboard/tickets',
        destination: '/dashboard/job-cards',
        permanent: true
      },
      {
        source: '/dashboard/tickets/new',
        destination: '/dashboard/job-cards/new',
        permanent: true
      },
      {
        source: '/dashboard/tickets/:id',
        destination: '/dashboard/job-cards/:id',
        permanent: true
      }
    ];
  }
};

export default nextConfig;
