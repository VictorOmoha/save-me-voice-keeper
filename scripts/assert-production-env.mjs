#!/usr/bin/env node
/**
 * Fail closed before a production Hosting build if required client env is missing.
 * Does not print values. Used by the deploy workflow.
 */
const required = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_APP_ID",
];

const missing = required.filter((name) => !process.env[name]?.trim());
if (missing.length > 0) {
  console.error(
    "Production client env is incomplete. Set these GitHub Actions secrets " +
      `(names only; do not commit values): ${missing.join(", ")}`
  );
  process.exit(1);
}

if (process.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
  console.error(
    "Leftover Supabase client env is set. SaveMe is Firebase-only; " +
      "remove those secrets instead of shipping a second backend."
  );
  process.exit(1);
}

console.log("Production client env names are present.");
