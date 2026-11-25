import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  // These load .proto files from node_modules at runtime, so they must not be bundled.
  serverExternalPackages: ["@google-cloud/datastore", "@google-cloud/storage", "google-gax"],
  // Photos are up to 10MB each; the default body limit for proxied requests is 10MB total.
  experimental: { middlewareClientMaxBodySize: "15mb" },
};

export default nextConfig;
