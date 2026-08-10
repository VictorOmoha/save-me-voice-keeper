import path from "path";
import { defineConfig } from "vitest/config";

/**
 * SAVE-005 — Dedicated Vitest config for the Firebase emulator harness.
 *
 * Why this exists (Sentinel F-005-3 / F-005-5 remediation): the default
 * `vitest.config.ts` targets the React/DOM unit suite — it sets
 * `environment: "jsdom"` and loads `src/test/setup.ts`. The tenant-isolation
 * rules tests are Node-side: they talk to the Firestore emulator over the wire
 * via @firebase/rules-unit-testing and must NOT run under jsdom, must NOT pull
 * in the DOM test setup, and must NOT be collected by the default `npm test`
 * run (which has no live emulator). Splitting the emulator tests into their own
 * config keeps both suites green and independent.
 *
 * `test/emulator/run.mjs` invokes vitest with `--config vitest.emulator.config.ts`
 * so only this config governs the emulator tests.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    // Node environment — these tests exercise the Firestore emulator over the
    // network, not a browser DOM.
    environment: "node",
    // The emulator suites use Vitest lifecycle/test APIs as globals, matching
    // the repository's existing test convention, without loading DOM setup.
    globals: true,
    // Only the emulator rules tests live here.
    include: ["test/emulator/**/*.test.ts"],
    // No DOM setup file, no global jsdom bootstrap.
    setupFiles: [],
    // The emulator round-trip can exceed the 5s default on a cold start.
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
