import type { NextConfig } from "next";

/**
 * Next.js configuration with SEO optimizations
 * Requirements: 6.3, 6.4
 * - Implements proper caching headers for static resources
 * - Configures image optimization with lazy loading
 */
const nextConfig: NextConfig = {
  // Image optimization configuration for lazy loading
  images: {
    // Enable lazy loading by default for all images
    // Next.js Image component uses lazy loading by default
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ["image/avif", "image/webp"],
    // Allow external image domains for video thumbnails
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.ytimg.com",
        pathname: "/vi/**",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
        pathname: "/vi/**",
      },
      {
        protocol: "https",
        hostname: "**.tiktokcdn.com",
      },
      {
        protocol: "https",
        hostname: "p16-sign-va.tiktokcdn.com",
      },
    ],
  },

  // HTTP headers configuration for caching
  async headers() {
    return [
      {
        // Cache static assets (images, fonts) for 1 year
        source: "/:all*(svg|jpg|jpeg|png|gif|ico|webp|avif|woff|woff2|ttf|eot)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Cache JavaScript and CSS bundles for 1 year (versioned by Next.js)
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Cache Next.js data files
        source: "/_next/data/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, stale-while-revalidate=60",
          },
        ],
      },
      {
        // HTML pages - short cache with revalidation
        source: "/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, stale-while-revalidate=60",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
      {
        // API routes - no cache
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-cache, no-store, must-revalidate",
          },
        ],
      },
      {
        // Sitemap - cache for 1 day
        source: "/sitemap.xml",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=3600",
          },
          {
            key: "Content-Type",
            value: "application/xml",
          },
        ],
      },
    ];
  },

  // Enable compression
  compress: true,

  // Strict mode for better development experience
  reactStrictMode: true,

  // Power by header removal for security
  poweredByHeader: false,
};

export default nextConfig;
