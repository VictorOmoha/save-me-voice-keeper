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
    setupFiles: "./src/test/setup.ts",
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/functions/lib/**",
      "**/cypress/**",
      "**/.{idea,git,cache,output,temp}/**",
      "**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*",
      "**/src/utils/nlp/tests/**",
      "**/src/utils/tests/categoryMatcher.test.ts",
      // SAVE-005: the Firebase emulator rules tests run in their own Node
      // config (vitest.emulator.config.ts) via `npm run test:emulator`. They
      // require a live Firestore emulator and @firebase/rules-unit-testing, so
      // they must not be collected by the default `npm test` unit run.
      "**/test/emulator/**",
    ],
  },
});
