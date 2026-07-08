import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable Vercel image optimization — images are served from Cloudflare R2 CDN
  // This avoids using Vercel's 1,000 free-tier image transformations per month
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'i.ibb.co',
      },
      {
        protocol: 'https',
        hostname: '*.r2.cloudflarestorage.com',
      },
      {
        protocol: 'https',
        hostname: '*.r2.dev',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },

  // Strip console.log() calls in production — reduces bundle size
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
      ? { exclude: ['error', 'warn'] }
      : false,
  },

  // CDN cache headers — prevents repeated serverless function invocations
  // s-maxage: served from Vercel Edge CDN for this duration (no function runs)
  // stale-while-revalidate: CDN revalidates in background, users never wait
  async headers() {
    return [
      // Home page — Edge CDN for 10 min, revalidates in background for 2 hrs
      {
        source: '/',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=600, stale-while-revalidate=7200',
          },
        ],
      },
      // Customize page — mostly static UI, CDN for 30 min
      {
        source: '/customize',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=1800, stale-while-revalidate=7200',
          },
        ],
      },
      // All public images served from /images/ — immutable for 1 year
      // (once uploaded to R2 these never change, so aggressive caching is safe)
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
