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
    },
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
