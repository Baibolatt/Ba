import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Server Actions за прокси Codespaces: forwarded-хост не совпадает с origin.
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3012",
        "*.app.github.dev",
        "*.githubpreview.dev",
      ],
      // Прайс-листы до 25 МБ приходят в Server Action файлом.
      bodySizeLimit: "30mb",
    },
  },
  serverExternalPackages: ["xlsx"],
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
