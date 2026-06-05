import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.220.33", "*.local", "localhost"],

  experimental: {
    // Tree-shake icon and animation imports so only used components are bundled
    optimizePackageImports: ["lucide-react", "recharts", "framer-motion"],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
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
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: [
              // ── Base restrictions ────────────────────────────────────────
              "default-src 'self'",
              // Next.js requires 'unsafe-inline' for inline bootstrapping scripts
              // and 'unsafe-eval' for dev-mode HMR / source map features.
              // These can be removed if migrating to strict CSP with nonces
              // (see next.config.ts experimental.strictCSP).
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              // Google Fonts styles + inline styles (required by Framer Motion)
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              // Google Maps tiles/static images + data/blob for images
              "img-src 'self' data: blob: https://*.googleapis.com https://*.googleusercontent.com https://maps.gstatic.com",
              // Supabase realtime, Google APIs, Dodo Payments, Upstash Redis
              "connect-src 'self' https://*.supabase.co https://*.googleapis.com https://api.dodopayments.com https://*.upstash.io wss://*.supabase.co",
              // No frames or objects allowed
              "frame-src 'none'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              // Report violations (no report-uri endpoint configured yet;
              // set CSP_REPORT_URI env var to enable monitoring)
              ...(process.env.CSP_REPORT_URI
                ? [`report-uri ${process.env.CSP_REPORT_URI}`]
                : []),
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
