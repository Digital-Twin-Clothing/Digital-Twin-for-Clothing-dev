// Unit tests for the dev app. The app pipeline runs them on every pull request
// and on every merge into main (npm test).
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  esbuild: { jsx: "automatic" },
  test: {
    environment: "node",
    include: ["tests/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      include: [
        "src/app/api/auth/signup/route.ts",
        "src/lib/auth.ts",
        "src/lib/build-info.ts",
        "src/middleware.ts",
        "src/app/create-avatar/page.tsx",
        "src/components/landing/HelloWorldBanner.tsx",
      ],
      reporter: ["text", "html", "json-summary"],
      reportsDirectory: "coverage",
    },
  },
});
