import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  reactCompiler: true,
  serverExternalPackages: ["puppeteer", "puppeteer-core", "@sparticuz/chromium", "postgres", "drizzle-orm"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
  turbopack: {
    resolveAlias: {
      // react-pdf requires canvas to be shimmed out in browser builds
      canvas: { browser: "./empty-module.js" },
    },
  },
  webpack: (config, { isServer }) => {
    // Shim canvas for react-pdf in production webpack builds
    if (!isServer) {
      config.resolve = config.resolve ?? {};
      config.resolve.alias = config.resolve.alias ?? {};
      (config.resolve.alias as Record<string, string>).canvas = path.resolve(
        __dirname,
        "empty-module.js"
      );
    }
    return config;
  },
};

export default nextConfig;
