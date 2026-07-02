import withPWAI from 'next-pwa';

const withPWA = withPWAI({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'offlineCache',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 24 * 60 * 60 // 24 hours
        }
      }
    },
    {
      urlPattern: /\/api\/.*/,
      handler: 'NetworkOnly',
      options: {
        backgroundSync: {
          name: 'orbix-offline-queue',
          options: {
            maxRetentionTime: 24 * 60 // Retry for max 24 hours
          }
        }
      }
    }
  ]
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ─── Images ────────────────────────────────────────────────────────────────
  // Allow Next.js <Image> to load from Cloudinary and common avatar providers
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",  // Google profile pictures
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com", // GitHub avatars
        pathname: "/**",
      },
    ],
  },

  // ─── Environment Variables ─────────────────────────────────────────────────
  // These are already exposed via NEXT_PUBLIC_ prefix, but listing them here
  // documents what the app requires and makes them visible in Vercel's UI.
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_WS_URL:  process.env.NEXT_PUBLIC_WS_URL,
  },

  // ─── TypeScript & ESLint ───────────────────────────────────────────────────
  typescript: {
    // Still fails CI if you have errors — this just prevents Vercel from
    // blocking the build on warnings you haven't fixed yet.
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default withPWA(nextConfig);
