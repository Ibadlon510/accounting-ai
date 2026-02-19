import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  reactCompiler: true,
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
