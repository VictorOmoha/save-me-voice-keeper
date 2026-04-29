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
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/functions/lib/**",
      "**/cypress/**",
      "**/.{idea,git,cache,output,temp}/**",
      "**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*",
      "**/src/utils/nlp/tests/**",
      "**/src/utils/tests/categoryMatcher.test.ts",
    ],
  },
});
