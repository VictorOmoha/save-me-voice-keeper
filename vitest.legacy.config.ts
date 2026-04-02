import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    include: [
      "src/utils/tests/categoryMatcher.test.ts",
      "src/utils/nlp/tests/**/*.test.ts",
    ],
  },
});
